const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { PrismaClient } = require('@prisma/client');
const neo4j = require('neo4j-driver');

const prisma = new PrismaClient();
const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'password')
);

const typeDefs = `
  type User {
    id: ID!
    email: String!
    name: String
    posts: [Post!]!
    createdAt: String!
    updatedAt: String!
  }

  type Post {
    id: ID!
    title: String!
    content: String
    published: Boolean!
    author: User!
    createdAt: String!
    updatedAt: String!
  }

  type KnowledgeNode {
    id: ID!
    label: String!
    properties: String!
  }

  type Query {
    users: [User!]!
    posts: [Post!]!
    knowledgeNodes: [KnowledgeNode!]!
    user(id: ID!): User
    post(id: ID!): Post
  }

  type Mutation {
    createUser(email: String!, name: String): User!
    createPost(title: String!, content: String, authorId: ID!): Post!
    createKnowledgeNode(label: String!, properties: String!): KnowledgeNode!
  }
`;

const resolvers = {
  Query: {
    users: async () => await prisma.user.findMany({ include: { posts: true } }),
    posts: async () => await prisma.post.findMany({ include: { author: true } }),
    user: async (_, { id }) => await prisma.user.findUnique({ 
      where: { id }, 
      include: { posts: true } 
    }),
    post: async (_, { id }) => await prisma.post.findUnique({ 
      where: { id }, 
      include: { author: true } 
    }),
    knowledgeNodes: async () => {
      const session = driver.session();
      try {
        const result = await session.run('MATCH (n) RETURN n LIMIT 10');
        return result.records.map(record => ({
          id: record.get('n').identity.toString(),
          label: record.get('n').labels[0] || 'Node',
          properties: JSON.stringify(record.get('n').properties)
        }));
      } finally {
        await session.close();
      }
    }
  },
  Mutation: {
    createUser: async (_, { email, name }) => 
      await prisma.user.create({ data: { email, name } }),
    
    createPost: async (_, { title, content, authorId }) => 
      await prisma.post.create({ data: { title, content, authorId } }),
    
    createKnowledgeNode: async (_, { label, properties }) => {
      const session = driver.session();
      try {
        const result = await session.run(
          `CREATE (n:${label} $props) RETURN n`,
          { props: JSON.parse(properties) }
        );
        const node = result.records[0].get('n');
        return {
          id: node.identity.toString(),
          label: node.labels[0],
          properties: JSON.stringify(node.properties)
        };
      } finally {
        await session.close();
      }
    }
  }
};

async function main() {
  const server = new ApolloServer({ typeDefs, resolvers });
  
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  // CONSOLE_LOG_VIOLATION: console.log(`🚀 GraphQL API ready at ${url}`);
  // CONSOLE_LOG_VIOLATION: console.log(`📊 PostgreSQL + Neo4j integration active`);
  // CONSOLE_LOG_VIOLATION: console.log(`✅ API smoke tests running successfully`);
}

main().catch(console.error);
