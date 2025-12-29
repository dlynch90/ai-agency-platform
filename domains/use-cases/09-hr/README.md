# Use Case 9: Talent Acquisition Platform

**Domain:** HR
**Tech Stack:** HuggingFace + Resume Parsing + Matching

## Description
AI-powered recruitment with automated resume screening and candidate-job matching

## Architecture
- **Frontend:** React + TypeScript + Apollo Client
- **Backend:** Node.js + GraphQL + Prisma
- **Database:** PostgreSQL + Neo4j Graph DB
- **AI/ML:** HuggingFace + Resume Parsing + Matching AI components
- **Deployment:** Docker + Kubernetes

## Implementation Status
✅ ADR-compliant architecture
✅ Domain boundaries defined
✅ AI integration ready
✅ Production deployment ready

## Quick Start
```bash
cd domains/use-cases/09-hr
pixi run --environment production python main.py
```

## API Endpoints
- GraphQL: `http://localhost:4000/graphql`
- REST: `http://localhost:3000/api/v1`
