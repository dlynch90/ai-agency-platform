import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { buildSubgraphSchema } from '@apollo/federation';
import gql from 'graphql-tag';
import pino from 'pino';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

// Admin authentication middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (process.env.ADMIN_MODE === 'true') {
    logger.info('🔐 Admin mode enabled - requiring authentication');
    return ClerkExpressRequireAuth()(req, res, next);
  }
  next();
};

const typeDefs = gql`
  type Query {
    hello: String
    health: String
    adminStatus: String
  }

  type Mutation {
    adminAction(input: String): String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello from API service!',
    health: () => 'API service is healthy',
    adminStatus: () => {
      const isAdminMode = process.env.ADMIN_MODE === 'true';
      logger.info(`🔍 Admin status check: ${isAdminMode ? 'ADMIN MODE' : 'NORMAL MODE'}`);
      return isAdminMode ? 'Admin mode active' : 'Normal mode';
    }
  },
  Mutation: {
    adminAction: (_: any, { input }: { input: string }) => {
      logger.info(`⚡ Admin action executed: ${input}`);
      return `Admin action completed: ${input}`;
    }
  }
};

async function createApolloServer(httpServer: any) {
  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();
  return server;
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const apolloServer = await createApolloServer(httpServer);

  // Middleware
  app.use(helmet());
  app.use(compression());
  app.use(cors());
  app.use(morgan('combined'));
  app.use(express.json());

  // Admin middleware
  app.use('/admin', requireAdmin);

  // Health check
  app.get('/health', (req, res) => {
    logger.info('🏥 Health check requested');
    res.json({
      status: 'healthy',
      service: 'api',
      timestamp: new Date().toISOString(),
      adminMode: process.env.ADMIN_MODE === 'true'
    });
  });

  // Admin endpoint
  app.get('/admin/status', (req, res) => {
    logger.info('🔐 Admin status endpoint accessed');
    res.json({
      adminMode: true,
      user: req.auth?.userId || 'anonymous',
      timestamp: new Date().toISOString()
    });
  });

  // GraphQL endpoint
  app.use('/graphql', expressMiddleware(apolloServer, {
    context: async ({ req }) => ({
      user: req.auth?.userId,
      adminMode: process.env.ADMIN_MODE === 'true'
    })
  }));

  const PORT = process.env.PORT || 4000;

  httpServer.listen(PORT, () => {
    logger.info(`🚀 API service running on port ${PORT}`);
    logger.info(`🔗 GraphQL endpoint: http://localhost:${PORT}/graphql`);
    logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
    if (process.env.ADMIN_MODE === 'true') {
      logger.info(`🔐 Admin mode active - Admin endpoint: http://localhost:${PORT}/admin/status`);
    }
  });
}

startServer().catch(error => {
  logger.error('❌ Failed to start API server:', error);
  process.exit(1);
});