import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { CodebaseHealthAnalyzer } from '../index.js';

const app = new Hono();
const analyzer = new CodebaseHealthAnalyzer();

const DEFAULT_PATH = process.env.ANALYZE_PATH || process.cwd();

app.get('/health', (c) =>
  c.json({ status: 'ok', service: 'codebase-health-analyzer' })
);

app.get('/api/v1/analyze', async (c) => {
  const basePath = c.req.query('path') || DEFAULT_PATH;
  const report = await analyzer.analyze(basePath);
  return c.json(report);
});

app.get('/api/v1/analyze/vendors', async (c) => {
  const basePath = c.req.query('path') || DEFAULT_PATH;
  const report = await analyzer.analyze(basePath, {
    includeVendorTemplates: true,
    includeApiAnalysis: false,
    includeDatabaseAnalysis: false,
    includeInfrastructureAnalysis: false,
    includeCodeSmellDetection: false,
  });
  return c.json({ vendors: report.vendors, score: report.vendors.score });
});

app.get('/api/v1/analyze/apis', async (c) => {
  const basePath = c.req.query('path') || DEFAULT_PATH;
  const report = await analyzer.analyze(basePath, {
    includeVendorTemplates: false,
    includeApiAnalysis: true,
    includeDatabaseAnalysis: false,
    includeInfrastructureAnalysis: false,
    includeCodeSmellDetection: false,
  });
  return c.json({ apis: report.apis, score: report.apis.score });
});

app.get('/api/v1/analyze/databases', async (c) => {
  const basePath = c.req.query('path') || DEFAULT_PATH;
  const report = await analyzer.analyze(basePath, {
    includeVendorTemplates: false,
    includeApiAnalysis: false,
    includeDatabaseAnalysis: true,
    includeInfrastructureAnalysis: false,
    includeCodeSmellDetection: false,
  });
  return c.json({ databases: report.databases, score: report.databases.score });
});

app.get('/api/v1/analyze/infrastructure', async (c) => {
  const basePath = c.req.query('path') || DEFAULT_PATH;
  const report = await analyzer.analyze(basePath, {
    includeVendorTemplates: false,
    includeApiAnalysis: false,
    includeDatabaseAnalysis: false,
    includeInfrastructureAnalysis: true,
    includeCodeSmellDetection: false,
  });
  return c.json({
    infrastructure: report.infrastructure,
    score: report.infrastructure.score,
  });
});

app.get('/api/v1/analyze/codesmells', async (c) => {
  const basePath = c.req.query('path') || DEFAULT_PATH;
  const report = await analyzer.analyze(basePath, {
    includeVendorTemplates: false,
    includeApiAnalysis: false,
    includeDatabaseAnalysis: false,
    includeInfrastructureAnalysis: false,
    includeCodeSmellDetection: true,
  });
  return c.json({
    codeSmells: report.codeSmells,
    score: report.codeSmells.score,
  });
});

app.get('/api/v1/score', async (c) => {
  const basePath = c.req.query('path') || DEFAULT_PATH;
  const report = await analyzer.analyze(basePath);
  return c.json({ score: report.score });
});

app.get('/api/v1/recommendations', async (c) => {
  const basePath = c.req.query('path') || DEFAULT_PATH;
  const priority = c.req.query('priority');
  const report = await analyzer.analyze(basePath);

  let recommendations = report.recommendations;
  if (priority) {
    recommendations = recommendations.filter((r) => r.priority === priority);
  }

  return c.json({ recommendations, total: recommendations.length });
});

const PORT = parseInt(process.env.PORT || '3100');

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  () => {
    console.log(`🏥 Codebase Health API running on http://localhost:${PORT}`);
    console.log(`📍 Default analysis path: ${DEFAULT_PATH}`);
    console.log('\nEndpoints:');
    console.log('  GET /health - Health check');
    console.log('  GET /api/v1/analyze - Full analysis');
    console.log('  GET /api/v1/analyze/vendors - Vendor analysis only');
    console.log('  GET /api/v1/analyze/apis - API analysis only');
    console.log('  GET /api/v1/analyze/databases - Database analysis only');
    console.log(
      '  GET /api/v1/analyze/infrastructure - Infrastructure analysis only'
    );
    console.log('  GET /api/v1/analyze/codesmells - Code smell analysis only');
    console.log('  GET /api/v1/score - Score summary');
    console.log('  GET /api/v1/recommendations - Recommendations');
  }
);

export { app };
