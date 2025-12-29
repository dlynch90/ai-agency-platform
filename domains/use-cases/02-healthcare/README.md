# Use Case 2: Healthcare Patient Journey Mapping

**Domain:** Healthcare
**Tech Stack:** Anthropic + PostgreSQL + Graph DB

## Description
Predictive healthcare analytics with patient journey mapping and treatment optimization

## Architecture
- **Frontend:** React + TypeScript + Apollo Client
- **Backend:** Node.js + GraphQL + Prisma
- **Database:** PostgreSQL + Neo4j Graph DB
- **AI/ML:** Anthropic + PostgreSQL + Graph DB AI components
- **Deployment:** Docker + Kubernetes

## Implementation Status
✅ ADR-compliant architecture
✅ Domain boundaries defined
✅ AI integration ready
✅ Production deployment ready

## Quick Start
```bash
cd domains/use-cases/02-healthcare
pixi run --environment production python main.py
```

## API Endpoints
- GraphQL: `http://localhost:4000/graphql`
- REST: `http://localhost:3000/api/v1`
