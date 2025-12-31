// Temporal Workflow: User Onboarding
// Handles complete user onboarding process with multi-step verification

import {
  proxyActivities,
  workflowInfo,
  defineQuery,
  defineSignal,
  setHandler,
  condition,
  sleep,
  ApplicationFailure,
} from '@temporalio/workflow';
import type * as activities from '../activities/user-onboarding-activities';

// Proxy activities with appropriate timeouts
const {
  createUserAccount,
  sendVerificationEmail,
  verifyEmail,
  setupUserProfile,
  createDefaultWorkspace,
  assignDefaultPermissions,
  setupNotificationPreferences,
  triggerWelcomeSequence,
  enrollInOnboardingTutorial,
  trackOnboardingAnalytics,
  syncToExternalSystems,
  validateCompliance,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
  retry: {
    initialInterval: '2s',
    backoffCoefficient: 2.0,
    maximumAttempts: 5,
    nonRetryableErrorTypes: ['EmailAlreadyExistsError', 'ComplianceViolationError'],
  },
});

// Input/output types
export interface UserOnboardingInput {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  authProvider: 'email' | 'google' | 'github' | 'sso';
  agencyId?: string;
  invitedBy?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  planType: 'free' | 'starter' | 'professional' | 'enterprise';
  locale: string;
  timezone: string;
  marketingConsent: boolean;
  referralSource?: string;
}

export interface UserOnboardingOutput {
  userId: string;
  status: 'completed' | 'failed' | 'pending_verification';
  accountCreated: boolean;
  emailVerified: boolean;
  profileSetup: boolean;
  workspaceCreated: boolean;
  permissionsAssigned: boolean;
  welcomeSequenceStarted: boolean;
  completedAt?: Date;
  failureReason?: string;
}

export interface OnboardingProgress {
  step: string;
  stepNumber: number;
  totalSteps: number;
  percentComplete: number;
  status: string;
  emailVerified: boolean;
}

// Signals
export const emailVerifiedSignal = defineSignal<[{ verificationCode: string }]>('emailVerified');
export const skipVerificationSignal = defineSignal('skipVerification');
export const updateProfileSignal = defineSignal<[Partial<UserOnboardingInput>]>('updateProfile');
export const cancelOnboardingSignal = defineSignal('cancelOnboarding');

// Queries
export const getOnboardingProgressQuery = defineQuery<OnboardingProgress>('getOnboardingProgress');
export const getOnboardingStatusQuery = defineQuery<string>('getOnboardingStatus');
export const getVerificationStatusQuery = defineQuery<boolean>('getVerificationStatus');

export async function userOnboardingWorkflow(input: UserOnboardingInput): Promise<UserOnboardingOutput> {
  const { workflowId } = workflowInfo();
  const TOTAL_STEPS = 8;

  // State management
  let currentStep = 0;
  let status = 'initializing';
  let emailVerified = input.authProvider !== 'email'; // Skip verification for SSO
  let verificationCode: string | null = null;
  let isCancelled = false;
  let profileData = { ...input };

  const results = {
    accountCreated: false,
    profileSetup: false,
    workspaceCreated: false,
    permissionsAssigned: false,
    welcomeSequenceStarted: false,
  };

  // Signal handlers
  setHandler(emailVerifiedSignal, (data) => {
    verificationCode = data.verificationCode;
  });

  setHandler(skipVerificationSignal, () => {
    emailVerified = true;
  });

  setHandler(updateProfileSignal, (updates) => {
    profileData = { ...profileData, ...updates };
  });

  setHandler(cancelOnboardingSignal, () => {
    isCancelled = true;
    status = 'cancelled';
  });

  // Query handlers
  setHandler(getOnboardingProgressQuery, () => ({
    step: status,
    stepNumber: currentStep,
    totalSteps: TOTAL_STEPS,
    percentComplete: Math.round((currentStep / TOTAL_STEPS) * 100),
    status,
    emailVerified,
  }));

  setHandler(getOnboardingStatusQuery, () => status);
  setHandler(getVerificationStatusQuery, () => emailVerified);

  try {
    // Step 1: Compliance Validation
    currentStep = 1;
    status = 'validating_compliance';

    const complianceResult = await validateCompliance({
      email: input.email,
      locale: input.locale,
      marketingConsent: input.marketingConsent,
    });

    if (!complianceResult.isCompliant) {
      throw ApplicationFailure.create({
        type: 'ComplianceViolationError',
        message: `Compliance check failed: ${complianceResult.violations.join(', ')}`,
      });
    }

    // Step 2: Create User Account
    currentStep = 2;
    status = 'creating_account';

    await createUserAccount({
      userId: input.userId,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      authProvider: input.authProvider,
      passwordHash: input.password ? await hashPassword(input.password) : undefined,
    });
    results.accountCreated = true;

    // Track analytics
    await trackOnboardingAnalytics({
      userId: input.userId,
      event: 'account_created',
      properties: {
        authProvider: input.authProvider,
        planType: input.planType,
        referralSource: input.referralSource,
      },
    });

    // Step 3: Email Verification (for email auth)
    if (input.authProvider === 'email') {
      currentStep = 3;
      status = 'sending_verification';

      const verificationResult = await sendVerificationEmail({
        userId: input.userId,
        email: input.email,
        firstName: input.firstName,
        locale: input.locale,
      });

      // Wait for verification with timeout
      status = 'awaiting_verification';
      const verificationTimeout = 24 * 60 * 60 * 1000; // 24 hours
      const startTime = Date.now();

      while (!emailVerified && !isCancelled) {
        // Check for verification code
        if (verificationCode) {
          const isValid = await verifyEmail({
            userId: input.userId,
            code: verificationCode,
          });

          if (isValid) {
            emailVerified = true;
          } else {
            verificationCode = null; // Reset for retry
          }
        }

        // Check timeout
        if (Date.now() - startTime > verificationTimeout) {
          return {
            userId: input.userId,
            status: 'pending_verification',
            ...results,
            emailVerified: false,
            failureReason: 'Email verification timed out',
          };
        }

        // Wait before checking again
        await sleep('30 seconds');
      }
    }

    if (isCancelled) {
      return {
        userId: input.userId,
        status: 'failed',
        ...results,
        emailVerified,
        failureReason: 'Onboarding cancelled by user',
      };
    }

    // Step 4: Profile Setup
    currentStep = 4;
    status = 'setting_up_profile';

    await setupUserProfile({
      userId: input.userId,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      email: profileData.email,
      locale: profileData.locale,
      timezone: profileData.timezone,
      role: profileData.role,
    });
    results.profileSetup = true;

    // Step 5: Create Workspace
    currentStep = 5;
    status = 'creating_workspace';

    const workspaceId = await createDefaultWorkspace({
      userId: input.userId,
      agencyId: input.agencyId,
      planType: input.planType,
      workspaceName: `${input.firstName}'s Workspace`,
    });
    results.workspaceCreated = true;

    // Step 6: Assign Permissions
    currentStep = 6;
    status = 'assigning_permissions';

    await assignDefaultPermissions({
      userId: input.userId,
      agencyId: input.agencyId,
      workspaceId,
      role: input.role,
      planType: input.planType,
    });
    results.permissionsAssigned = true;

    // Step 7: Notification Preferences
    currentStep = 7;
    status = 'setting_up_notifications';

    await setupNotificationPreferences({
      userId: input.userId,
      email: input.email,
      marketingConsent: input.marketingConsent,
      locale: input.locale,
    });

    // Step 8: Welcome Sequence
    currentStep = 8;
    status = 'starting_welcome_sequence';

    await triggerWelcomeSequence({
      userId: input.userId,
      email: input.email,
      firstName: input.firstName,
      planType: input.planType,
      locale: input.locale,
    });
    results.welcomeSequenceStarted = true;

    // Enroll in tutorial
    await enrollInOnboardingTutorial({
      userId: input.userId,
      planType: input.planType,
    });

    // Sync to external systems (CRM, analytics, etc.)
    await syncToExternalSystems({
      userId: input.userId,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      planType: input.planType,
      referralSource: input.referralSource,
      marketingConsent: input.marketingConsent,
    });

    // Final analytics
    await trackOnboardingAnalytics({
      userId: input.userId,
      event: 'onboarding_completed',
      properties: {
        duration: Date.now() - Date.parse(workflowId.split('-').pop() || '0'),
        planType: input.planType,
        role: input.role,
      },
    });

    // Complete
    status = 'completed';

    return {
      userId: input.userId,
      status: 'completed',
      ...results,
      emailVerified,
      completedAt: new Date(),
    };

  } catch (error) {
    status = 'failed';

    // Track failure
    await trackOnboardingAnalytics({
      userId: input.userId,
      event: 'onboarding_failed',
      properties: {
        step: status,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return {
      userId: input.userId,
      status: 'failed',
      ...results,
      emailVerified,
      failureReason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper function (would be replaced with proper crypto in activities)
async function hashPassword(password: string): Promise<string> {
  // This is a placeholder - actual hashing happens in activities
  return `hashed_${password}`;
}
