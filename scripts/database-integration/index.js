// AI Agency Database Integration Server
// Connects PostgreSQL + Prisma + Neo4j + Redis for all 20 use cases

const { PrismaClient } = require('@prisma/client');
const neo4j = require('neo4j-driver');
const { createClient } = require('redis');
const express = require('express');
const { config } = require('./config.ts');

const app = express();
app.use(express.json());

// Initialize database connections
const prisma = new PrismaClient();
const neo4jDriver = neo4j.driver(
  config.database.neo4j.uri,
  neo4j.auth.basic(config.database.neo4j.user, config.database.neo4j.password)
);
const redis = createClient({ url: config.database.redis.url });

async function initializeDatabases() {
  try {
    // Test PostgreSQL + Prisma
    await prisma.$connect();
    // CONSOLE_LOG_VIOLATION: console.log('✓ PostgreSQL + Prisma connected');

    // Test Neo4j
    await neo4jDriver.getServerInfo();
    // CONSOLE_LOG_VIOLATION: console.log('✓ Neo4j connected');

    // Test Redis
    await redis.connect();
    // CONSOLE_LOG_VIOLATION: console.log('✓ Redis connected');

  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

// API Endpoints for Use Cases

// 1. E-commerce Personalization Engine
app.get('/api/personalization/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { browsingHistory: { include: { product: true } } }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Healthcare Patient Triage System
app.post('/api/healthcare/triage', async (req, res) => {
  try {
    const { userId, symptoms } = req.body;
    const session = neo4jDriver.session();

    // Store in Neo4j for graph analysis
    const result = await session.run(
      'CREATE (p:Patient {id: $userId, symptoms: $symptoms, timestamp: $timestamp}) RETURN p',
      { userId, symptoms, timestamp: new Date().toISOString() }
    );

    await session.close();
    res.json({ success: true, patientId: userId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Financial Portfolio Optimization
app.get('/api/finance/portfolio/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId },
      include: { holdings: true }
    });

    // Cache in Redis
    await redis.set(`portfolio:${userId}`, JSON.stringify(portfolio), { EX: 3600 });

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Manufacturing Quality Control
app.post('/api/manufacturing/inspect', async (req, res) => {
  try {
    const inspection = await prisma.qualityInspection.create({
      data: req.body
    });

    // Store defect patterns in Neo4j for ML training
    if (inspection.defectFound) {
      const session = neo4jDriver.session();
      await session.run(
        'CREATE (d:Defect {id: $id, type: $type, severity: $severity, productId: $productId})',
        {
          id: inspection.id,
          type: inspection.defectType,
          severity: inspection.severity,
          productId: inspection.productId
        }
      );
      await session.close();
    }

    res.json(inspection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Logistics Route Optimization
app.post('/api/logistics/route', async (req, res) => {
  try {
    const route = await prisma.deliveryRoute.create({ data: req.body });

    // Cache route in Redis for real-time tracking
    await redis.set(`route:${route.id}`, JSON.stringify(route), { EX: 86400 });

    res.json(route);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Customer Service Chatbot
app.post('/api/chatbot/message', async (req, res) => {
  try {
    const { sessionId, message, userId } = req.body;

    // Store conversation in PostgreSQL
    const conversation = await prisma.chatConversation.upsert({
      where: { sessionId },
      update: {
        messages: { push: { text: message, timestamp: new Date() } },
        updatedAt: new Date()
      },
      create: {
        sessionId,
        userId,
        messages: [{ text: message, timestamp: new Date() }]
      }
    });

    // Store in Neo4j for conversation graph analysis
    const session = neo4jDriver.session();
    await session.run(
      'MERGE (c:Conversation {sessionId: $sessionId}) ON CREATE SET c.createdAt = $timestamp ON MATCH SET c.lastMessage = $timestamp',
      { sessionId, timestamp: new Date().toISOString() }
    );
    await session.close();

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Real Estate Market Prediction
app.get('/api/real-estate/predictions', async (req, res) => {
  try {
    const predictions = await prisma.propertyPrediction.findMany({
      include: { property: true },
      orderBy: { predictionDate: 'desc' },
      take: 50
    });
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Education Adaptive Learning
app.get('/api/education/path/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const learningPath = await prisma.learningPath.findUnique({
      where: { userId },
      include: { assessments: true }
    });
    res.json(learningPath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Agriculture Crop Optimization
app.get('/api/agriculture/sensors', async (req, res) => {
  try {
    const sensors = await prisma.cropSensor.findMany({
      orderBy: { timestamp: 'desc' },
      take: 1000
    });
    res.json(sensors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Hospitality Dynamic Pricing
app.get('/api/hospitality/availability', async (req, res) => {
  try {
    const bookings = await prisma.roomBooking.findMany({
      where: {
        checkIn: { gte: new Date() }
      },
      include: { room: true }
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test all database connections
    await prisma.$queryRaw`SELECT 1`;
    await neo4jDriver.getServerInfo();
    await redis.ping();

    res.json({
      status: 'healthy',
      databases: {
        postgresql: 'connected',
        neo4j: 'connected',
        redis: 'connected'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  // CONSOLE_LOG_VIOLATION: console.log(`🚀 AI Agency Database Integration Server running on port ${PORT}`);
  await initializeDatabases();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  // CONSOLE_LOG_VIOLATION: console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  await neo4jDriver.close();
  await redis.disconnect();
  process.exit(0);
});

module.exports = app;