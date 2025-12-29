// Temporal Workflow: Billing Cycle
// Manages monthly billing cycles with payment processing and invoice generation

import {
  proxyActivities,
  workflowInfo,
  defineQuery,
  defineSignal,
  setHandler,
  condition,
  sleep,
  ApplicationFailure,
  scheduleActivity,
} from '@temporalio/workflow';
import type * as activities from '../activities/billing-activities';

// Proxy activities with appropriate timeouts for payment processing
const {
  fetchBillingAccounts,
  calculateUsageCharges,
  applyDiscountsAndCredits,
  generateInvoice,
  processPayment,
  handlePaymentFailure,
  sendInvoiceEmail,
  updateSubscriptionStatus,
  recordTransaction,
  syncToAccountingSystem,
  handleDunning,
  processRefund,
  sendPaymentReminder,
  archiveInvoice,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: {
    initialInterval: '5s',
    backoffCoefficient: 2.0,
    maximumAttempts: 5,
    nonRetryableErrorTypes: ['InvalidPaymentMethodError', 'AccountSuspendedError'],
  },
});

// Input/output types
export interface BillingCycleInput {
  cycleId: string;
  billingPeriod: {
    startDate: Date;
    endDate: Date;
  };
  agencyIds?: string[]; // Optional: process specific agencies only
  dryRun?: boolean; // Preview mode without actual charges
  retryFailedOnly?: boolean; // Only retry previously failed invoices
}

export interface BillingCycleOutput {
  cycleId: string;
  status: 'completed' | 'partial_failure' | 'failed';
  summary: {
    totalAccounts: number;
    successfulCharges: number;
    failedCharges: number;
    totalRevenue: number;
    totalCreditsApplied: number;
  };
  invoices: InvoiceSummary[];
  failedAccounts: FailedAccount[];
  completedAt: Date;
}

export interface InvoiceSummary {
  invoiceId: string;
  agencyId: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
}

export interface FailedAccount {
  agencyId: string;
  reason: string;
  retryable: boolean;
  lastAttempt: Date;
}

export interface BillingProgress {
  phase: string;
  processedAccounts: number;
  totalAccounts: number;
  currentAgencyId?: string;
  errors: number;
}

// Signals
export const pauseBillingSignal = defineSignal('pauseBilling');
export const resumeBillingSignal = defineSignal('resumeBilling');
export const skipAccountSignal = defineSignal<[{ agencyId: string }]>('skipAccount');
export const retryAccountSignal = defineSignal<[{ agencyId: string }]>('retryAccount');
export const cancelCycleSignal = defineSignal('cancelCycle');

// Queries
export const getBillingProgressQuery = defineQuery<BillingProgress>('getBillingProgress');
export const getBillingStatusQuery = defineQuery<string>('getBillingStatus');
export const getInvoiceSummaryQuery = defineQuery<InvoiceSummary[]>('getInvoiceSummary');
export const getFailedAccountsQuery = defineQuery<FailedAccount[]>('getFailedAccounts');

export async function billingCycleWorkflow(input: BillingCycleInput): Promise<BillingCycleOutput> {
  const { workflowId } = workflowInfo();

  // State management
  let status = 'initializing';
  let isPaused = false;
  let isCancelled = false;
  let processedAccounts = 0;
  let totalAccounts = 0;
  let currentAgencyId: string | undefined;
  const invoices: InvoiceSummary[] = [];
  const failedAccounts: FailedAccount[] = [];
  const skippedAgencies: Set<string> = new Set();
  const retryAgencies: Set<string> = new Set();
  let totalRevenue = 0;
  let totalCreditsApplied = 0;

  // Signal handlers
  setHandler(pauseBillingSignal, () => {
    isPaused = true;
    status = 'paused';
  });

  setHandler(resumeBillingSignal, () => {
    isPaused = false;
    status = 'processing';
  });

  setHandler(skipAccountSignal, ({ agencyId }) => {
    skippedAgencies.add(agencyId);
  });

  setHandler(retryAccountSignal, ({ agencyId }) => {
    retryAgencies.add(agencyId);
  });

  setHandler(cancelCycleSignal, () => {
    isCancelled = true;
    status = 'cancelling';
  });

  // Query handlers
  setHandler(getBillingProgressQuery, () => ({
    phase: status,
    processedAccounts,
    totalAccounts,
    currentAgencyId,
    errors: failedAccounts.length,
  }));

  setHandler(getBillingStatusQuery, () => status);
  setHandler(getInvoiceSummaryQuery, () => invoices);
  setHandler(getFailedAccountsQuery, () => failedAccounts);

  try {
    // Phase 1: Fetch billing accounts
    status = 'fetching_accounts';
    const accounts = await fetchBillingAccounts({
      billingPeriod: input.billingPeriod,
      agencyIds: input.agencyIds,
      retryFailedOnly: input.retryFailedOnly,
    });
    totalAccounts = accounts.length;

    if (totalAccounts === 0) {
      return {
        cycleId: input.cycleId,
        status: 'completed',
        summary: {
          totalAccounts: 0,
          successfulCharges: 0,
          failedCharges: 0,
          totalRevenue: 0,
          totalCreditsApplied: 0,
        },
        invoices: [],
        failedAccounts: [],
        completedAt: new Date(),
      };
    }

    // Phase 2: Process each account
    status = 'processing';

    for (const account of accounts) {
      // Check for cancellation
      if (isCancelled) {
        break;
      }

      // Handle pause
      while (isPaused) {
        await sleep('1 minute');
        if (isCancelled) break;
      }

      // Check if account should be skipped
      if (skippedAgencies.has(account.agencyId)) {
        processedAccounts++;
        continue;
      }

      currentAgencyId = account.agencyId;

      try {
        // Calculate usage charges
        const usageCharges = await calculateUsageCharges({
          agencyId: account.agencyId,
          billingPeriod: input.billingPeriod,
          planType: account.planType,
          subscriptionId: account.subscriptionId,
        });

        // Apply discounts and credits
        const { finalAmount, creditsApplied, discountsApplied } = await applyDiscountsAndCredits({
          agencyId: account.agencyId,
          baseAmount: usageCharges.total,
          planType: account.planType,
        });

        totalCreditsApplied += creditsApplied;

        // Skip if no charge
        if (finalAmount <= 0) {
          invoices.push({
            invoiceId: `inv-${account.agencyId}-${input.cycleId}-zero`,
            agencyId: account.agencyId,
            amount: 0,
            status: 'paid',
            paymentMethod: 'none',
          });
          processedAccounts++;
          continue;
        }

        // Generate invoice
        const invoice = await generateInvoice({
          agencyId: account.agencyId,
          billingPeriod: input.billingPeriod,
          lineItems: usageCharges.lineItems,
          discounts: discountsApplied,
          credits: creditsApplied,
          finalAmount,
          dryRun: input.dryRun,
        });

        // Process payment (skip if dry run)
        let paymentResult;
        if (!input.dryRun) {
          paymentResult = await processPayment({
            invoiceId: invoice.invoiceId,
            agencyId: account.agencyId,
            amount: finalAmount,
            paymentMethodId: account.paymentMethodId,
            currency: account.currency,
          });

          if (paymentResult.success) {
            totalRevenue += finalAmount;

            // Record transaction
            await recordTransaction({
              invoiceId: invoice.invoiceId,
              agencyId: account.agencyId,
              amount: finalAmount,
              transactionId: paymentResult.transactionId,
              paymentMethod: account.paymentMethodType,
            });

            // Send invoice email
            await sendInvoiceEmail({
              invoiceId: invoice.invoiceId,
              agencyId: account.agencyId,
              recipientEmail: account.billingEmail,
              amount: finalAmount,
              billingPeriod: input.billingPeriod,
            });

            invoices.push({
              invoiceId: invoice.invoiceId,
              agencyId: account.agencyId,
              amount: finalAmount,
              status: 'paid',
              paymentMethod: account.paymentMethodType,
            });
          } else {
            // Handle payment failure
            await handlePaymentFailure({
              invoiceId: invoice.invoiceId,
              agencyId: account.agencyId,
              error: paymentResult.error,
              failureCode: paymentResult.failureCode,
            });

            // Start dunning process
            await handleDunning({
              agencyId: account.agencyId,
              invoiceId: invoice.invoiceId,
              attemptNumber: 1,
              maxAttempts: 3,
            });

            failedAccounts.push({
              agencyId: account.agencyId,
              reason: paymentResult.error || 'Payment failed',
              retryable: paymentResult.retryable,
              lastAttempt: new Date(),
            });

            invoices.push({
              invoiceId: invoice.invoiceId,
              agencyId: account.agencyId,
              amount: finalAmount,
              status: 'failed',
              paymentMethod: account.paymentMethodType,
            });
          }
        } else {
          // Dry run - just record the invoice
          invoices.push({
            invoiceId: invoice.invoiceId,
            agencyId: account.agencyId,
            amount: finalAmount,
            status: 'pending',
            paymentMethod: account.paymentMethodType,
          });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        failedAccounts.push({
          agencyId: account.agencyId,
          reason: errorMessage,
          retryable: !errorMessage.includes('Invalid') && !errorMessage.includes('Suspended'),
          lastAttempt: new Date(),
        });
      }

      processedAccounts++;
    }

    // Phase 3: Handle retries
    if (retryAgencies.size > 0) {
      status = 'retrying_failed';
      for (const agencyId of retryAgencies) {
        const failedAccount = failedAccounts.find(a => a.agencyId === agencyId && a.retryable);
        if (failedAccount) {
          // Retry logic would go here
          // For now, just remove from failed list if successful
        }
      }
    }

    // Phase 4: Sync to accounting system
    status = 'syncing';
    if (!input.dryRun) {
      await syncToAccountingSystem({
        cycleId: input.cycleId,
        invoices,
        billingPeriod: input.billingPeriod,
        totalRevenue,
      });
    }

    // Phase 5: Archive invoices
    status = 'archiving';
    for (const invoice of invoices.filter(i => i.status === 'paid')) {
      await archiveInvoice({
        invoiceId: invoice.invoiceId,
        agencyId: invoice.agencyId,
        billingPeriod: input.billingPeriod,
      });
    }

    // Determine final status
    const successfulCharges = invoices.filter(i => i.status === 'paid').length;
    const failedCharges = failedAccounts.length;

    let finalStatus: 'completed' | 'partial_failure' | 'failed';
    if (failedCharges === 0) {
      finalStatus = 'completed';
    } else if (successfulCharges > 0) {
      finalStatus = 'partial_failure';
    } else {
      finalStatus = 'failed';
    }

    status = finalStatus;

    return {
      cycleId: input.cycleId,
      status: finalStatus,
      summary: {
        totalAccounts,
        successfulCharges,
        failedCharges,
        totalRevenue,
        totalCreditsApplied,
      },
      invoices,
      failedAccounts,
      completedAt: new Date(),
    };

  } catch (error) {
    status = 'failed';
    throw error;
  }
}

// Child workflow for dunning process
export async function dunningWorkflow(input: {
  agencyId: string;
  invoiceId: string;
  amount: number;
  maxAttempts: number;
}): Promise<{ recovered: boolean; attempts: number }> {
  const intervals = ['3 days', '7 days', '14 days'];

  for (let attempt = 1; attempt <= input.maxAttempts; attempt++) {
    // Wait before retry
    if (attempt > 1) {
      await sleep(intervals[Math.min(attempt - 2, intervals.length - 1)]);
    }

    // Send payment reminder
    await sendPaymentReminder({
      agencyId: input.agencyId,
      invoiceId: input.invoiceId,
      attemptNumber: attempt,
      daysOverdue: attempt * 3,
    });

    // Wait for potential payment (1 day)
    await sleep('1 day');

    // Check if payment was made
    // This would check the invoice status
    // For now, simulating with a condition

    // If payment made, return success
    // If not, continue to next attempt
  }

  // After max attempts, update subscription status
  await updateSubscriptionStatus({
    agencyId: input.agencyId,
    status: 'past_due',
    reason: `Invoice ${input.invoiceId} unpaid after ${input.maxAttempts} attempts`,
  });

  return {
    recovered: false,
    attempts: input.maxAttempts,
  };
}
