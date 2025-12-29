// GraphQL Federation Gateway
// Apollo Gateway for schema composition

const { ApolloGateway, RemoteGraphQLDataSource } = require('@apollo/gateway');
const { ApolloServer } = require('apollo-server');
const { readFileSync } = require('fs');

// Federation services configuration
const services = [
    {
        name: 'users',
        url: 'http://localhost:4001/graphql'
    },
    {
        name: 'campaigns',
        url: 'http://localhost:4002/graphql'
    },
    {
        name: 'analytics',
        url: 'http://localhost:4003/graphql'
    }
];

// Custom data source for authentication
class AuthenticatedDataSource extends RemoteGraphQLDataSource {
    willSendRequest({ request, context }) {
        // Add authentication headers
        if (context.authToken) {
            request.http.headers.set('authorization', context.authToken);
        }

        // Add tenant context
        if (context.tenantId) {
            request.http.headers.set('x-tenant-id', context.tenantId);
        }
    }
}

// Create gateway
const gateway = new ApolloGateway({
    serviceList: services,
    buildService({ name, url }) {
        return new AuthenticatedDataSource({ url });
    }
});

// Authentication context
const context = ({ req }) => {
    const token = req.headers.authorization || '';
    const tenantId = req.headers['x-tenant-id'] || '';

    return {
        authToken: token,
        tenantId: tenantId
    };
};

// Create Apollo Server
const server = new ApolloServer({
    gateway,
    context,
    subscriptions: false,
    introspection: true,
    playground: true
});

// Start server
server.listen({ port: 4000 }).then(({ url }) => {
    // CONSOLE_LOG_VIOLATION: console.log(`🚀 Federation Gateway ready at ${url}`);
}).catch(console.error);