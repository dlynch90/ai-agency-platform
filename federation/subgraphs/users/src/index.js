/**
 * Users Subgraph - Apollo Federation 2.0
 * Handles user management, authentication, profiles, and preferences
 */

const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { gql } = require('graphql-tag');
const { PubSub } = require('graphql-subscriptions');
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const DataLoader = require('dataloader');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const PORT = process.env.USERS_PORT || 4001;

// PubSub for subscriptions
const pubsub = new PubSub();

// Events
const USER_CREATED = 'USER_CREATED';
const USER_UPDATED = 'USER_UPDATED';
const USER_ACTIVITY = 'USER_ACTIVITY';

// In-memory data store (replace with actual database in production)
const users = new Map();
const preferences = new Map();
const sessions = new Map();
const activities = new Map();

// Seed data
const seedUsers = () => {
  const sampleUsers = [
    { id: 'user-1', email: 'john@example.com', name: 'John Doe', role: 'ADMIN', createdAt: new Date().toISOString() },
    { id: 'user-2', email: 'jane@example.com', name: 'Jane Smith', role: 'USER', createdAt: new Date().toISOString() },
    { id: 'user-3', email: 'bob@example.com', name: 'Bob Wilson', role: 'USER', createdAt: new Date().toISOString() }
  ];

  sampleUsers.forEach(user => {
    users.set(user.id, user);
    preferences.set(user.id, {
      userId: user.id,
      theme: 'light',
      language: 'en',
      notifications: true,
      emailDigest: 'weekly'
    });
  });
};
seedUsers();

// Federation Schema with directives
const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable", "@external", "@provides", "@requires"])

  type Query {
    """Get user by ID"""
    user(id: ID!): User

    """Get all users with optional filters"""
    users(filter: UserFilter, limit: Int, offset: Int): UserConnection!

    """Get current authenticated user"""
    me: User

    """Search users by name or email"""
    searchUsers(query: String!, limit: Int): [User!]!

    """Get user preferences"""
    userPreferences(userId: ID!): UserPreferences

    """Get user activity log"""
    userActivities(userId: ID!, limit: Int): [UserActivity!]!
  }

  type Mutation {
    """Create a new user"""
    createUser(input: CreateUserInput!): CreateUserPayload!

    """Update user profile"""
    updateUser(id: ID!, input: UpdateUserInput!): UpdateUserPayload!

    """Delete a user"""
    deleteUser(id: ID!): DeleteUserPayload!

    """Update user preferences"""
    updatePreferences(userId: ID!, input: PreferencesInput!): UserPreferences!

    """Record user activity"""
    recordActivity(userId: ID!, type: ActivityType!, metadata: JSON): UserActivity!

    """Authenticate user"""
    login(email: String!, password: String!): AuthPayload!

    """Refresh authentication token"""
    refreshToken(token: String!): AuthPayload!

    """Logout user"""
    logout(userId: ID!): Boolean!
  }

  type Subscription {
    """Subscribe to user creation events"""
    userCreated: User!

    """Subscribe to user update events"""
    userUpdated(userId: ID): User!

    """Subscribe to user activity events"""
    userActivity(userId: ID!): UserActivity!
  }

  """User entity - federated type"""
  type User @key(fields: "id") {
    id: ID!
    email: String!
    name: String!
    role: UserRole!
    avatar: String
    bio: String
    location: String
    website: String
    preferences: UserPreferences
    createdAt: String!
    updatedAt: String
    lastLoginAt: String
    isActive: Boolean!

    # Extended fields from other subgraphs
    campaigns: [Campaign!] @external
    analyticsProfile: AnalyticsProfile @external
  }

  """User roles"""
  enum UserRole {
    ADMIN
    USER
    MODERATOR
    ANALYST
  }

  """User preferences"""
  type UserPreferences {
    userId: ID!
    theme: String!
    language: String!
    notifications: Boolean!
    emailDigest: EmailDigestFrequency!
    timezone: String
    dashboardLayout: JSON
  }

  """Email digest frequency"""
  enum EmailDigestFrequency {
    DAILY
    WEEKLY
    MONTHLY
    NEVER
  }

  """User activity tracking"""
  type UserActivity {
    id: ID!
    userId: ID!
    type: ActivityType!
    metadata: JSON
    timestamp: String!
    ipAddress: String
    userAgent: String
  }

  """Activity types"""
  enum ActivityType {
    LOGIN
    LOGOUT
    PAGE_VIEW
    ACTION
    SEARCH
    PURCHASE
    CAMPAIGN_VIEW
    SETTINGS_CHANGE
  }

  """User filter input"""
  input UserFilter {
    role: UserRole
    isActive: Boolean
    createdAfter: String
    createdBefore: String
  }

  """Create user input"""
  input CreateUserInput {
    email: String!
    name: String!
    role: UserRole
    password: String!
  }

  """Update user input"""
  input UpdateUserInput {
    name: String
    avatar: String
    bio: String
    location: String
    website: String
  }

  """Preferences input"""
  input PreferencesInput {
    theme: String
    language: String
    notifications: Boolean
    emailDigest: EmailDigestFrequency
    timezone: String
    dashboardLayout: JSON
  }

  """User connection for pagination"""
  type UserConnection {
    nodes: [User!]!
    totalCount: Int!
    pageInfo: PageInfo!
  }

  """Pagination info"""
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  """Create user payload"""
  type CreateUserPayload {
    user: User
    success: Boolean!
    message: String
  }

  """Update user payload"""
  type UpdateUserPayload {
    user: User
    success: Boolean!
    message: String
  }

  """Delete user payload"""
  type DeleteUserPayload {
    success: Boolean!
    message: String
  }

  """Authentication payload"""
  type AuthPayload {
    token: String!
    refreshToken: String!
    user: User!
    expiresAt: String!
  }

  """Extended types from other subgraphs"""
  type Campaign @key(fields: "id", resolvable: false) {
    id: ID!
  }

  type AnalyticsProfile @key(fields: "userId", resolvable: false) {
    userId: ID!
  }

  """JSON scalar for flexible data"""
  scalar JSON
`;

// DataLoaders for batching
const createLoaders = () => ({
  userLoader: new DataLoader(async (ids) => {
    return ids.map(id => users.get(id) || null);
  }),
  preferencesLoader: new DataLoader(async (userIds) => {
    return userIds.map(id => preferences.get(id) || null);
  })
});

// Resolvers
const resolvers = {
  Query: {
    user: (_, { id }, { loaders }) => loaders.userLoader.load(id),

    users: (_, { filter, limit = 10, offset = 0 }) => {
      let result = Array.from(users.values());

      if (filter) {
        if (filter.role) result = result.filter(u => u.role === filter.role);
        if (filter.isActive !== undefined) result = result.filter(u => u.isActive === filter.isActive);
        if (filter.createdAfter) result = result.filter(u => new Date(u.createdAt) > new Date(filter.createdAfter));
        if (filter.createdBefore) result = result.filter(u => new Date(u.createdAt) < new Date(filter.createdBefore));
      }

      const totalCount = result.length;
      const nodes = result.slice(offset, offset + limit);

      return {
        nodes,
        totalCount,
        pageInfo: {
          hasNextPage: offset + limit < totalCount,
          hasPreviousPage: offset > 0,
          startCursor: nodes[0]?.id,
          endCursor: nodes[nodes.length - 1]?.id
        }
      };
    },

    me: (_, __, { userId }) => users.get(userId),

    searchUsers: (_, { query, limit = 10 }) => {
      const lowerQuery = query.toLowerCase();
      return Array.from(users.values())
        .filter(u =>
          u.name.toLowerCase().includes(lowerQuery) ||
          u.email.toLowerCase().includes(lowerQuery)
        )
        .slice(0, limit);
    },

    userPreferences: (_, { userId }, { loaders }) => loaders.preferencesLoader.load(userId),

    userActivities: (_, { userId, limit = 50 }) => {
      const userActivities = Array.from(activities.values())
        .filter(a => a.userId === userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
      return userActivities;
    }
  },

  Mutation: {
    createUser: async (_, { input }) => {
      const id = uuidv4();
      const user = {
        id,
        email: input.email,
        name: input.name,
        role: input.role || 'USER',
        isActive: true,
        createdAt: new Date().toISOString()
      };

      users.set(id, user);
      preferences.set(id, {
        userId: id,
        theme: 'light',
        language: 'en',
        notifications: true,
        emailDigest: 'weekly'
      });

      pubsub.publish(USER_CREATED, { userCreated: user });

      return { user, success: true, message: 'User created successfully' };
    },

    updateUser: async (_, { id, input }) => {
      const user = users.get(id);
      if (!user) {
        return { user: null, success: false, message: 'User not found' };
      }

      const updatedUser = {
        ...user,
        ...input,
        updatedAt: new Date().toISOString()
      };
      users.set(id, updatedUser);

      pubsub.publish(USER_UPDATED, { userUpdated: updatedUser });

      return { user: updatedUser, success: true, message: 'User updated successfully' };
    },

    deleteUser: async (_, { id }) => {
      if (!users.has(id)) {
        return { success: false, message: 'User not found' };
      }

      users.delete(id);
      preferences.delete(id);

      return { success: true, message: 'User deleted successfully' };
    },

    updatePreferences: async (_, { userId, input }) => {
      const existing = preferences.get(userId) || {
        userId,
        theme: 'light',
        language: 'en',
        notifications: true,
        emailDigest: 'weekly'
      };

      const updated = { ...existing, ...input };
      preferences.set(userId, updated);

      return updated;
    },

    recordActivity: async (_, { userId, type, metadata }, { headers }) => {
      const activity = {
        id: uuidv4(),
        userId,
        type,
        metadata,
        timestamp: new Date().toISOString(),
        ipAddress: headers?.['x-forwarded-for'] || 'unknown',
        userAgent: headers?.['user-agent'] || 'unknown'
      };

      activities.set(activity.id, activity);
      pubsub.publish(USER_ACTIVITY, { userActivity: activity, userId });

      return activity;
    },

    login: async (_, { email }) => {
      const user = Array.from(users.values()).find(u => u.email === email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const token = `token-${uuidv4()}`;
      const refreshToken = `refresh-${uuidv4()}`;
      const expiresAt = new Date(Date.now() + 3600000).toISOString();

      sessions.set(token, { userId: user.id, expiresAt });

      users.set(user.id, { ...user, lastLoginAt: new Date().toISOString() });

      return { token, refreshToken, user, expiresAt };
    },

    refreshToken: async (_, { token }) => {
      // Simplified token refresh
      const newToken = `token-${uuidv4()}`;
      const refreshToken = `refresh-${uuidv4()}`;
      const expiresAt = new Date(Date.now() + 3600000).toISOString();
      const user = Array.from(users.values())[0];

      return { token: newToken, refreshToken, user, expiresAt };
    },

    logout: async (_, { userId }) => {
      for (const [token, session] of sessions.entries()) {
        if (session.userId === userId) {
          sessions.delete(token);
        }
      }
      return true;
    }
  },

  Subscription: {
    userCreated: {
      subscribe: () => pubsub.asyncIterator([USER_CREATED])
    },
    userUpdated: {
      subscribe: (_, { userId }) => {
        return pubsub.asyncIterator([USER_UPDATED]);
      },
      resolve: (payload, { userId }) => {
        if (userId && payload.userUpdated.id !== userId) return null;
        return payload.userUpdated;
      }
    },
    userActivity: {
      subscribe: (_, { userId }) => pubsub.asyncIterator([USER_ACTIVITY]),
      resolve: (payload, { userId }) => {
        if (payload.userId !== userId) return null;
        return payload.userActivity;
      }
    }
  },

  User: {
    __resolveReference: (user, { loaders }) => loaders.userLoader.load(user.id),
    preferences: (user, _, { loaders }) => loaders.preferencesLoader.load(user.id),
    isActive: (user) => user.isActive !== false
  }
};

// Build schema
const schema = buildSubgraphSchema([{ typeDefs, resolvers }]);

// Start server
async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  const server = new ApolloServer({
    schema,
    plugins: [{
      async serverWillStart() {
        return {
          async drainServer() {
            // Cleanup on shutdown
          }
        };
      }
    }]
  });

  await server.start();

  // WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
  });

  useServer({ schema }, wsServer);

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'users',
      timestamp: new Date().toISOString(),
      userCount: users.size
    });
  });

  // GraphQL endpoint
  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => ({
      userId: req.headers['x-user-id'],
      authToken: req.headers.authorization,
      headers: req.headers,
      loaders: createLoaders()
    })
  }));

  httpServer.listen(PORT, () => {
    console.log(`Users Subgraph ready at http://localhost:${PORT}/graphql`);
    console.log(`Subscriptions ready at ws://localhost:${PORT}/graphql`);
  });
}

startServer().catch(console.error);
