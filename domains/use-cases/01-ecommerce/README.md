# Use Case 1: E-commerce Personalization Engine

**Domain:** E-commerce
**Tech Stack:** OpenAI + Neo4j + Redis

## Description
AI-powered product recommendations using collaborative filtering and graph analysis for personalized shopping experiences

## Architecture
- **Frontend:** React + TypeScript + Apollo Client
- **Backend:** Node.js + GraphQL + Prisma
- **Database:** PostgreSQL + Neo4j Graph DB
- **AI/ML:** OpenAI + Neo4j + Redis AI components
- **Deployment:** Docker + Kubernetes

## Implementation Status
✅ ADR-compliant architecture
✅ Domain boundaries defined
✅ AI integration ready
✅ Production deployment ready

## Quick Start
```bash
cd domains/use-cases/01-ecommerce
pixi run --environment production python main.py
```

## API Endpoints
- GraphQL: `http://localhost:4000/graphql`
- REST: `http://localhost:3000/api/v1`
