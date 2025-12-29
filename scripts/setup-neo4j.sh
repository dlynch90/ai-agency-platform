#!/bin/bash
# Neo4j Setup for Graph Database Operations

echo "🕸️ Setting up Neo4j..."

# Install Neo4j if not present
if ! command -v neo4j >/dev/null 2>&1; then
    brew install neo4j
fi

# Start Neo4j service
brew services start neo4j

# Wait for Neo4j to start
sleep 10

# Create initial graph structure for AI agency use cases
cat > ${DEVELOPER_DIR:-${DEVELOPER_DIR:-$HOME/Developer}}/neo4j-init.cypher << 'EOF'
// AI Agency Knowledge Graph Structure

// Create constraints
CREATE CONSTRAINT user_email_unique IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE;
CREATE CONSTRAINT client_name_unique IF NOT EXISTS FOR (c:Client) REQUIRE c.name IS UNIQUE;

// Create indexes
CREATE INDEX user_name_idx IF NOT EXISTS FOR (u:User) ON (u.name);
CREATE INDEX project_status_idx IF NOT EXISTS FOR (p:Project) ON (p.status);

// Initial data structure
MERGE (agency:Agency {name: "AI Development Agency", founded: 2024})
MERGE (tech1:Technology {name: "React", category: "Frontend"})
MERGE (tech2:Technology {name: "Node.js", category: "Backend"})
MERGE (tech3:Technology {name: "PostgreSQL", category: "Database"})
MERGE (tech4:Technology {name: "Neo4j", category: "Graph Database"})
MERGE (tech5:Technology {name: "Ollama", category: "AI"})
MERGE (tech6:Technology {name: "Cursor", category: "IDE"})

// Connect technologies to agency
MERGE (agency)-[:USES]->(tech1)
MERGE (agency)-[:USES]->(tech2)
MERGE (agency)-[:USES]->(tech3)
MERGE (agency)-[:USES]->(tech4)
MERGE (agency)-[:USES]->(tech5)
MERGE (agency)-[:USES]->(tech6)

// Create competency levels
MERGE (expert:Competency {level: "Expert", description: "Deep expertise and leadership"})
MERGE (advanced:Competency {level: "Advanced", description: "Strong proficiency"})
MERGE (intermediate:Competency {level: "Intermediate", description: "Working knowledge"})
MERGE (beginner:Competency {level: "Beginner", description: "Basic familiarity"})

// Connect technologies to competencies
MERGE (tech1)-[:REQUIRES]->(advanced)
MERGE (tech2)-[:REQUIRES]->(expert)
MERGE (tech3)-[:REQUIRES]->(intermediate)
MERGE (tech4)-[:REQUIRES]->(advanced)
MERGE (tech5)-[:REQUIRES]->(intermediate)
MERGE (tech6)-[:REQUIRES]->(beginner);
