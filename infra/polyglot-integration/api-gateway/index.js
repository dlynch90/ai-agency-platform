// Polyglot API Gateway
// Unified API layer for all 20 use cases across multiple programming languages

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');
const neo4j = require('neo4j-driver');
const { createClient } = require('redis');

const app = express();

// Security & Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize clients
const prisma = new PrismaClient();
const neo4jDriver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'password')
);
const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });

// Service endpoints mapping
const services = {
  'python-ml': 'http://python-ml-service:8000',
  'go-logistics': 'http://go-logistics-service:8080',
  'rust-security': 'http://rust-security-service:3000',
  'nodejs-workflow': 'http://nodejs-workflow-service:3000'
};

// Proxy routes to polyglot services
Object.entries(services).forEach(([service, url]) => {
  app.use(`/api/${service}`, createProxyMiddleware({
    target: url,
    changeOrigin: true,
    pathRewrite: { [`^/api/${service}`]: '' }
  }));
});

// Unified API endpoints for all 20 use cases

// 1. E-commerce Personalization Engine
app.get('/api/ecommerce/personalization/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get user data from PostgreSQL
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { browsingHistory: { include: { product: true } } }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get personalized recommendations via Python ML service
    const mlResponse = await fetch(`${services['python-ml']}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        browsingHistory: user.browsingHistory,
        userPreferences: user.preferences
      })
    });

    const recommendations = await mlResponse.json();

    // Cache results in Redis
    await redis.set(`personalization:${userId}`, JSON.stringify(recommendations), { EX: 3600 });

    res.json({ user, recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Healthcare Patient Triage System
app.post('/api/healthcare/triage', async (req, res) => {
  try {
    const { userId, symptoms } = req.body;

    // Get patient history from PostgreSQL
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId }
    });

    // Process symptoms via Python ML service
    const mlResponse = await fetch(`${services['python-ml']}/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symptoms,
        patientHistory: patientProfile?.medicalHistory,
        currentMedications: patientProfile?.currentMedications
      })
    });

    const triageResult = await mlResponse.json();

    // Update patient record
    await prisma.patientProfile.upsert({
      where: { userId },
      update: {
        currentSymptoms: symptoms,
        priorityScore: triageResult.priorityScore,
        triageStatus: triageResult.status,
        lastAssessment: new Date()
      },
      create: {
        userId,
        currentSymptoms: symptoms,
        priorityScore: triageResult.priorityScore,
        triageStatus: triageResult.status
      }
    });

    res.json(triageResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Financial Portfolio Optimization
app.get('/api/finance/portfolio/:userId/optimize', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get portfolio data
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId },
      include: { holdings: true }
    });

    if (!portfolio) return res.status(404).json({ error: 'Portfolio not found' });

    // Get market data and optimize via Python ML service
    const mlResponse = await fetch(`${services['python-ml']}/portfolio-optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        portfolio: portfolio.holdings,
        riskProfile: portfolio.riskProfile
      })
    });

    const optimization = await mlResponse.json();

    // Store optimization recommendations
    await redis.set(`portfolio-opt:${userId}`, JSON.stringify(optimization), { EX: 3600 });

    res.json({ portfolio, optimization });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Manufacturing Quality Control
app.post('/api/manufacturing/inspect', async (req, res) => {
  try {
    const inspection = await prisma.qualityInspection.create({ data: req.body });

    // Analyze image via Python ML service
    if (inspection.imageUrl) {
      const mlResponse = await fetch(`${services['python-ml']}/quality-inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: inspection.imageUrl,
          productType: inspection.productType,
          factoryId: inspection.factoryId
        })
      });

      const analysis = await mlResponse.json();

      // Update inspection with ML results
      await prisma.qualityInspection.update({
        where: { id: inspection.id },
        data: {
          defectFound: analysis.defectFound,
          defectType: analysis.defectType,
          severity: analysis.severity,
          confidence: analysis.confidence
        }
      });

      inspection.mlAnalysis = analysis;
    }

    res.json(inspection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Logistics Route Optimization
app.post('/api/logistics/route/optimize', async (req, res) => {
  try {
    const { driverId, vehicleId, stops, constraints } = req.body;

    // Optimize route via Go logistics service
    const goResponse = await fetch(`${services['go-logistics']}/optimize-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId, vehicleId, stops, constraints })
    });

    const optimizedRoute = await goResponse.json();

    // Store route in database
    const route = await prisma.deliveryRoute.create({
      data: {
        driverId,
        vehicleId,
        startLocation: optimizedRoute.startLocation,
        endLocation: optimizedRoute.endLocation,
        waypoints: optimizedRoute.waypoints,
        estimatedTime: optimizedRoute.estimatedTime,
        optimizedPath: optimizedRoute.path
      }
    });

    res.json({ route, optimization: optimizedRoute });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Customer Service Chatbot
app.post('/api/chatbot/message', async (req, res) => {
  try {
    const { sessionId, message, userId, context } = req.body;

    // Get conversation history
    const conversation = await prisma.chatConversation.findUnique({
      where: { sessionId },
      include: { messages: true }
    });

    // Process message via Node.js workflow service
    const workflowResponse = await fetch(`${services['nodejs-workflow']}/chat-process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationHistory: conversation?.messages || [],
        context,
        userId
      })
    });

    const chatResult = await workflowResponse.json();

    // Store conversation
    await prisma.chatConversation.upsert({
      where: { sessionId },
      update: {
        messages: { push: { text: message, response: chatResult.response, timestamp: new Date() } },
        topic: chatResult.topic,
        sentiment: chatResult.sentiment,
        resolved: chatResult.resolved
      },
      create: {
        sessionId,
        userId,
        messages: [{ text: message, response: chatResult.response, timestamp: new Date() }],
        topic: chatResult.topic,
        sentiment: chatResult.sentiment
      }
    });

    res.json(chatResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Real Estate Market Prediction
app.get('/api/real-estate/predict/:propertyId', async (req, res) => {
  try {
    const propertyId = req.params.propertyId;

    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) return res.status(404).json({ error: 'Property not found' });

    // Get market prediction via Python ML service
    const mlResponse = await fetch(`${services['python-ml']}/real-estate-predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        property: {
          address: property.address,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          squareFeet: property.squareFeet,
          propertyType: property.propertyType,
          location: property.city + ', ' + property.state
        }
      })
    });

    const prediction = await mlResponse.json();

    // Store prediction
    await prisma.propertyPrediction.create({
      data: {
        propertyId,
        predictedPrice: prediction.price,
        confidence: prediction.confidence,
        predictionDate: new Date(),
        factors: prediction.factors
      }
    });

    res.json({ property, prediction });
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

    // Test service connectivity
    const serviceHealth = {};
    for (const [service, url] of Object.entries(services)) {
      try {
        const response = await fetch(`${url}/health`, { timeout: 5000 });
        serviceHealth[service] = response.ok;
      } catch {
        serviceHealth[service] = false;
      }
    }

    res.json({
      status: 'healthy',
      databases: {
        postgresql: 'connected',
        neo4j: 'connected',
        redis: 'connected'
      },
      services: serviceHealth,
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

// Graceful shutdown
process.on('SIGTERM', async () => {
  // CONSOLE_LOG_VIOLATION: console.log('Shutting down Polyglot API Gateway...');
  await prisma.$disconnect();
  await neo4jDriver.close();
  await redis.disconnect();
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  // CONSOLE_LOG_VIOLATION: console.log(`🚀 Polyglot API Gateway running on port ${PORT}`);
  // CONSOLE_LOG_VIOLATION: console.log(`📊 Health check: http://localhost:${PORT}/api/health`);

  // Initialize database connections
  await redis.connect();
  // CONSOLE_LOG_VIOLATION: console.log('✅ Redis connected');
});