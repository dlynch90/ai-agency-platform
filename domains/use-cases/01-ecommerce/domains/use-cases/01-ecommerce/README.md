# E-commerce Personalization Engine

**Domain:** E-commerce  
**Tech Stack:** Python, FastAPI, Neo4j, Redis, Prisma  
**AI/ML:** Collaborative Filtering, Graph Neural Networks

## Description
AI-powered product recommendations using collaborative filtering and graph analysis for personalized shopping experiences.

## Architecture
- **Frontend:** React + TypeScript + Apollo Client
- **Backend:** Python + FastAPI + GraphQL
- **Database:** PostgreSQL + Neo4j Graph DB
- **AI/ML:** Collaborative filtering algorithms
- **Deployment:** Docker + Kubernetes

## Quick Start
```bash
cd domains/use-cases/01-ecommerce
docker-compose up -d
curl http://localhost:8001/recommendations/user123
```

## API Endpoints
- `GET /` - Health check
- `GET /recommendations/{user_id}` - Get personalized recommendations
