// Simple GraphQL server for federation
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type Query {
    health: String
    useCases: [UseCase]
  }
  
  type UseCase {
    id: String
    name: String
    status: String
  }
`);

const root = {
  health: () => 'GraphQL Gateway is healthy',
  useCases: () => [
    { id: '01', name: 'E-commerce', status: 'operational' },
    { id: '02', name: 'Healthcare', status: 'operational' }
  ]
};

const app = express();
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'graphql-gateway' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 GraphQL Gateway running on port ${PORT}`);
});
