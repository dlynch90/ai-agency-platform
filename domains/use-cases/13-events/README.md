# Use Case 13: Event Management Platform

**Domain:** Events
**Tech Stack:** HuggingFace + Demand Prediction + Analytics

## Description
Smart event management with dynamic pricing and attendance prediction

## Architecture
- **Frontend:** React + TypeScript + Apollo Client
- **Backend:** Node.js + GraphQL + Prisma
- **Database:** PostgreSQL + Neo4j Graph DB
- **AI/ML:** HuggingFace + Demand Prediction + Analytics AI components
- **Deployment:** Docker + Kubernetes

## Implementation Status
✅ ADR-compliant architecture
✅ Domain boundaries defined
✅ AI integration ready
✅ Production deployment ready

## Quick Start
```bash
cd domains/use-cases/13-events
pixi run --environment production python main.py
```

## API Endpoints
- GraphQL: `http://localhost:4000/graphql`
- REST: `http://localhost:3000/api/v1`
