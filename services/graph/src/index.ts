import { ApolloServer } from '@apollo/server';
import { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import { startStandaloneServer } from '@apollo/server/standalone';
import pino from 'pino';
import { config } from '@ai-agency/config';

const log = pino({ level: config.env.LOG_LEVEL });

interface TenantContext {
  tenantId: string;
  userId?: string;
  roles: string[];
}

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: { request: any; context: TenantContext }) {
    if (context.tenantId) {
      request.http.headers.set('x-tenant-id', context.tenantId);
    }
    if (context.userId) {
      request.http.headers.set('x-user-id', context.userId);
    }
    if (context.roles) {
      request.http.headers.set('x-user-roles', context.roles.join(','));
    }
  }
}

const SUBGRAPH_CONFIG = {
  USERS: { name: 'users', url: process.env.USERS_SUBGRAPH_URL || 'http://localhost:4001/graphql' },
  PRODUCTS: { name: 'products', url: process.env.PRODUCTS_SUBGRAPH_URL || 'http://localhost:4002/graphql' },
  ORDERS: { name: 'orders', url: process.env.ORDERS_SUBGRAPH_URL || 'http://localhost:4003/graphql' },
  CAMPAIGNS: { name: 'campaigns', url: process.env.CAMPAIGNS_SUBGRAPH_URL || 'http://localhost:4004/graphql' },
  ANALYTICS: { name: 'analytics', url: process.env.ANALYTICS_SUBGRAPH_URL || 'http://localhost:4005/graphql' },
  TICKETS: { name: 'tickets', url: process.env.TICKETS_SUBGRAPH_URL || 'http://localhost:4006/graphql' },
  KNOWLEDGE: { name: 'knowledge', url: process.env.KNOWLEDGE_SUBGRAPH_URL || 'http://localhost:4007/graphql' },
};

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: Object.values(SUBGRAPH_CONFIG),
  }),
  buildService({ url }) {
    return new AuthenticatedDataSource({ url });
  },
});

async function startGateway() {
  const server = new ApolloServer({
    gateway,
    introspection: config.isDevelopment,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: parseInt(process.env.GATEWAY_PORT || '4000', 10) },
    context: async ({ req }): Promise<TenantContext> => {
      const tenantId = req.headers['x-tenant-id'] as string || '';
      const userId = req.headers['x-user-id'] as string;
      const roles = (req.headers['x-user-roles'] as string || '').split(',').filter(Boolean);

      return { tenantId, userId, roles };
    },
  });

  log.info({ url }, 'GraphQL Federation Gateway started');
  return { server, url };
}

startGateway().catch((error) => {
  log.error({ error }, 'Failed to start GraphQL Gateway');
  process.exit(1);
});

export { startGateway, SUBGRAPH_CONFIG };
