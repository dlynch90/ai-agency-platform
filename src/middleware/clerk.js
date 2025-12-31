/**
 * AI Agency Platform - Clerk Authentication Middleware
 * Provides authentication, user management, and session handling
 */

const { ClerkExpressWithAuth, ClerkExpressRequireAuth, users } = require('@clerk/clerk-sdk-node');
const { config } = require('../config');

/**
 * Clerk client configuration
 */
const clerkConfig = {
  secretKey: config.clerk.secretKey,
  publishableKey: config.clerk.publishableKey,
  jwtKey: config.clerk.jwtKey,
};

/**
 * Validate Clerk configuration
 */
function validateClerkConfig() {
  if (!config.clerk.enabled) {
    console.warn('[Clerk] Authentication is not configured. Set CLERK_SECRET_KEY to enable.');
    return false;
  }

  if (!config.clerk.secretKey) {
    throw new Error('[Clerk] CLERK_SECRET_KEY is required');
  }

  return true;
}

/**
 * Optional authentication middleware
 * Adds user info to request if authenticated, but allows unauthenticated requests
 */
const optionalAuth = (options = {}) => {
  if (!validateClerkConfig()) {
    return (req, res, next) => {
      req.auth = { userId: null, sessionId: null };
      next();
    };
  }

  return ClerkExpressWithAuth({
    ...clerkConfig,
    ...options,
    onError: (error) => {
      console.error('[Clerk] Auth error:', error.message);
    },
  });
};

/**
 * Required authentication middleware
 * Rejects unauthenticated requests with 401
 */
const requireAuth = (options = {}) => {
  if (!validateClerkConfig()) {
    return (req, res, next) => {
      res.status(401).json({
        error: 'Authentication not configured',
        code: 'AUTH_NOT_CONFIGURED',
      });
    };
  }

  return ClerkExpressRequireAuth({
    ...clerkConfig,
    ...options,
    onError: (error) => {
      console.error('[Clerk] Auth required error:', error.message);
    },
  });
};

/**
 * Role-based access control middleware
 */
const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req, res, next) => {
    try {
      if (!req.auth?.userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const user = await getUserById(req.auth.userId);
      const userRole = user?.publicMetadata?.role || user?.privateMetadata?.role || 'user';

      if (!roles.includes(userRole) && !roles.includes('*')) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'FORBIDDEN',
          requiredRoles: roles,
          userRole,
        });
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      console.error('[Clerk] Role check error:', error);
      res.status(500).json({
        error: 'Failed to verify permissions',
        code: 'ROLE_CHECK_FAILED',
      });
    }
  };
};

/**
 * Permission-based access control middleware
 */
const requirePermission = (requiredPermissions) => {
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return async (req, res, next) => {
    try {
      if (!req.auth?.userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const user = await getUserById(req.auth.userId);
      const userPermissions = user?.publicMetadata?.permissions || user?.privateMetadata?.permissions || [];

      const hasAllPermissions = permissions.every(perm => userPermissions.includes(perm));

      if (!hasAllPermissions) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          code: 'FORBIDDEN',
          requiredPermissions: permissions,
          userPermissions,
        });
      }

      req.userPermissions = userPermissions;
      next();
    } catch (error) {
      console.error('[Clerk] Permission check error:', error);
      res.status(500).json({
        error: 'Failed to verify permissions',
        code: 'PERMISSION_CHECK_FAILED',
      });
    }
  };
};

/**
 * Organization membership middleware
 */
const requireOrganization = (options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.auth?.userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
        });
      }

      const orgId = req.auth.orgId || req.headers['x-organization-id'];

      if (!orgId) {
        return res.status(400).json({
          error: 'Organization ID required',
          code: 'ORG_REQUIRED',
        });
      }

      // Verify user is member of organization
      const memberships = await getOrganizationMemberships(req.auth.userId);
      const membership = memberships.find(m => m.organization.id === orgId);

      if (!membership) {
        return res.status(403).json({
          error: 'Not a member of this organization',
          code: 'NOT_ORG_MEMBER',
        });
      }

      // Check for required role within organization
      if (options.role && membership.role !== options.role) {
        return res.status(403).json({
          error: 'Insufficient organization role',
          code: 'INSUFFICIENT_ORG_ROLE',
          requiredRole: options.role,
          userRole: membership.role,
        });
      }

      req.organization = membership.organization;
      req.orgRole = membership.role;
      next();
    } catch (error) {
      console.error('[Clerk] Organization check error:', error);
      res.status(500).json({
        error: 'Failed to verify organization membership',
        code: 'ORG_CHECK_FAILED',
      });
    }
  };
};

/**
 * API key authentication middleware
 */
const requireApiKey = (options = {}) => {
  const headerName = options.headerName || 'X-API-Key';
  const queryParam = options.queryParam || 'api_key';

  return async (req, res, next) => {
    const apiKey = req.headers[headerName.toLowerCase()] || req.query[queryParam];

    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        code: 'API_KEY_REQUIRED',
      });
    }

    try {
      // Verify API key against Clerk or custom store
      const isValid = await verifyApiKey(apiKey);

      if (!isValid) {
        return res.status(401).json({
          error: 'Invalid API key',
          code: 'INVALID_API_KEY',
        });
      }

      req.apiKey = apiKey;
      next();
    } catch (error) {
      console.error('[Clerk] API key verification error:', error);
      res.status(500).json({
        error: 'Failed to verify API key',
        code: 'API_KEY_VERIFICATION_FAILED',
      });
    }
  };
};

/**
 * Webhook verification middleware
 */
const verifyWebhook = (options = {}) => {
  const webhookSecret = options.secret || config.clerk.webhookSecret;

  return async (req, res, next) => {
    if (!webhookSecret) {
      console.error('[Clerk] Webhook secret not configured');
      return res.status(500).json({
        error: 'Webhook verification not configured',
        code: 'WEBHOOK_NOT_CONFIGURED',
      });
    }

    const svix_id = req.headers['svix-id'];
    const svix_timestamp = req.headers['svix-timestamp'];
    const svix_signature = req.headers['svix-signature'];

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({
        error: 'Missing webhook headers',
        code: 'WEBHOOK_HEADERS_MISSING',
      });
    }

    try {
      const Svix = require('svix');
      const wh = new Svix.Webhook(webhookSecret);

      const payload = JSON.stringify(req.body);
      const headers = {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      };

      const event = wh.verify(payload, headers);
      req.webhookEvent = event;
      next();
    } catch (error) {
      console.error('[Clerk] Webhook verification failed:', error);
      return res.status(400).json({
        error: 'Invalid webhook signature',
        code: 'WEBHOOK_INVALID_SIGNATURE',
      });
    }
  };
};

// ============================================================================
// USER MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get user by ID
 */
async function getUserById(userId) {
  if (!validateClerkConfig()) return null;

  try {
    return await users.getUser(userId);
  } catch (error) {
    console.error('[Clerk] Get user error:', error);
    return null;
  }
}

/**
 * Get user by email
 */
async function getUserByEmail(email) {
  if (!validateClerkConfig()) return null;

  try {
    const userList = await users.getUserList({ emailAddress: [email] });
    return userList.length > 0 ? userList[0] : null;
  } catch (error) {
    console.error('[Clerk] Get user by email error:', error);
    return null;
  }
}

/**
 * Get users list
 */
async function getUsers(options = {}) {
  if (!validateClerkConfig()) return [];

  try {
    return await users.getUserList({
      limit: options.limit || 10,
      offset: options.offset || 0,
      orderBy: options.orderBy || '-created_at',
      ...options.filters,
    });
  } catch (error) {
    console.error('[Clerk] Get users error:', error);
    return [];
  }
}

/**
 * Create user
 */
async function createUser(userData) {
  if (!validateClerkConfig()) {
    throw new Error('Clerk not configured');
  }

  try {
    return await users.createUser({
      emailAddress: userData.email ? [userData.email] : undefined,
      firstName: userData.firstName,
      lastName: userData.lastName,
      password: userData.password,
      publicMetadata: userData.publicMetadata || {},
      privateMetadata: userData.privateMetadata || {},
      unsafeMetadata: userData.unsafeMetadata || {},
    });
  } catch (error) {
    console.error('[Clerk] Create user error:', error);
    throw error;
  }
}

/**
 * Update user
 */
async function updateUser(userId, userData) {
  if (!validateClerkConfig()) {
    throw new Error('Clerk not configured');
  }

  try {
    return await users.updateUser(userId, {
      firstName: userData.firstName,
      lastName: userData.lastName,
      publicMetadata: userData.publicMetadata,
      privateMetadata: userData.privateMetadata,
      unsafeMetadata: userData.unsafeMetadata,
    });
  } catch (error) {
    console.error('[Clerk] Update user error:', error);
    throw error;
  }
}

/**
 * Delete user
 */
async function deleteUser(userId) {
  if (!validateClerkConfig()) {
    throw new Error('Clerk not configured');
  }

  try {
    await users.deleteUser(userId);
    return true;
  } catch (error) {
    console.error('[Clerk] Delete user error:', error);
    throw error;
  }
}

/**
 * Update user metadata
 */
async function updateUserMetadata(userId, metadata) {
  if (!validateClerkConfig()) {
    throw new Error('Clerk not configured');
  }

  try {
    return await users.updateUserMetadata(userId, {
      publicMetadata: metadata.public,
      privateMetadata: metadata.private,
      unsafeMetadata: metadata.unsafe,
    });
  } catch (error) {
    console.error('[Clerk] Update user metadata error:', error);
    throw error;
  }
}

/**
 * Ban user
 */
async function banUser(userId) {
  if (!validateClerkConfig()) {
    throw new Error('Clerk not configured');
  }

  try {
    return await users.banUser(userId);
  } catch (error) {
    console.error('[Clerk] Ban user error:', error);
    throw error;
  }
}

/**
 * Unban user
 */
async function unbanUser(userId) {
  if (!validateClerkConfig()) {
    throw new Error('Clerk not configured');
  }

  try {
    return await users.unbanUser(userId);
  } catch (error) {
    console.error('[Clerk] Unban user error:', error);
    throw error;
  }
}

/**
 * Get user's organization memberships
 */
async function getOrganizationMemberships(userId) {
  if (!validateClerkConfig()) return [];

  try {
    const user = await users.getUser(userId);
    return user.organizationMemberships || [];
  } catch (error) {
    console.error('[Clerk] Get org memberships error:', error);
    return [];
  }
}

/**
 * Verify API key (placeholder - implement with your storage)
 */
async function verifyApiKey(apiKey) {
  // TODO: Implement API key verification against your database
  // This is a placeholder that always returns false
  // Replace with actual verification logic

  if (!apiKey || apiKey.length < 32) {
    return false;
  }

  // Example: Check against database or Clerk backend
  // const keyRecord = await db.apiKeys.findOne({ key: apiKey, active: true });
  // return !!keyRecord;

  return true; // Remove this and implement proper verification
}

/**
 * Extract user from request
 */
function extractUser(req) {
  return {
    userId: req.auth?.userId || null,
    sessionId: req.auth?.sessionId || null,
    orgId: req.auth?.orgId || null,
    role: req.userRole || null,
    permissions: req.userPermissions || [],
  };
}

/**
 * Create session token
 */
async function createSessionToken(userId, options = {}) {
  // This would typically be handled by Clerk's frontend SDK
  // Backend can only verify tokens, not create them
  console.warn('[Clerk] Session tokens should be created client-side');
  return null;
}

/**
 * Verify session token
 */
async function verifySessionToken(token) {
  if (!validateClerkConfig()) {
    return { valid: false, error: 'Clerk not configured' };
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, config.clerk.jwtKey, {
      algorithms: ['RS256'],
    });

    return {
      valid: true,
      userId: decoded.sub,
      sessionId: decoded.sid,
      orgId: decoded.org_id,
      claims: decoded,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
}

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

/**
 * Handle Clerk webhook events
 */
async function handleWebhookEvent(event) {
  const { type, data } = event;

  switch (type) {
    case 'user.created':
      console.log('[Clerk Webhook] User created:', data.id);
      // Trigger onboarding, sync to database, etc.
      break;

    case 'user.updated':
      console.log('[Clerk Webhook] User updated:', data.id);
      // Sync updates to database
      break;

    case 'user.deleted':
      console.log('[Clerk Webhook] User deleted:', data.id);
      // Clean up user data
      break;

    case 'session.created':
      console.log('[Clerk Webhook] Session created:', data.id);
      // Track login, update last active
      break;

    case 'session.ended':
      console.log('[Clerk Webhook] Session ended:', data.id);
      // Track logout
      break;

    case 'organization.created':
      console.log('[Clerk Webhook] Organization created:', data.id);
      // Set up organization resources
      break;

    case 'organizationMembership.created':
      console.log('[Clerk Webhook] Org membership created:', data.id);
      // Grant access to org resources
      break;

    default:
      console.log('[Clerk Webhook] Unhandled event type:', type);
  }

  return { processed: true, type };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Middleware
  optionalAuth,
  requireAuth,
  requireRole,
  requirePermission,
  requireOrganization,
  requireApiKey,
  verifyWebhook,

  // User management
  getUserById,
  getUserByEmail,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserMetadata,
  banUser,
  unbanUser,
  getOrganizationMemberships,

  // Utilities
  extractUser,
  verifySessionToken,
  verifyApiKey,
  validateClerkConfig,

  // Webhook handling
  handleWebhookEvent,
};
