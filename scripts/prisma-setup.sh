#!/bin/bash
# Prisma + PostgreSQL Integration

echo "🔗 Setting up Prisma integration..."

# Install Prisma CLI
npm install -g prisma

# Initialize Prisma in project
mkdir -p ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/prisma-project
cd ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/prisma-project

# Create schema.prisma
cat > schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
