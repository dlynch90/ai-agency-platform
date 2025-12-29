// E-commerce Knowledge Graph Schema

// Create constraints
CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE;
CREATE CONSTRAINT product_id_unique IF NOT EXISTS FOR (p:Product) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT category_name_unique IF NOT EXISTS FOR (c:Category) REQUIRE c.name IS UNIQUE;

// Create indexes
CREATE INDEX user_email_idx IF NOT EXISTS FOR (u:User) ON (u.email);
CREATE INDEX product_category_idx IF NOT EXISTS FOR (p:Product) ON (p.category);
CREATE INDEX interaction_timestamp_idx IF NOT EXISTS FOR (i:Interaction) ON (i.timestamp);

// Initial categories
MERGE (cat1:Category {name: "Electronics", description: "Electronic devices and gadgets"})
MERGE (cat2:Category {name: "Clothing", description: "Fashion and apparel"})
MERGE (cat3:Category {name: "Home & Garden", description: "Home improvement and gardening"})
MERGE (cat4:Category {name: "Sports", description: "Sports equipment and apparel"})
MERGE (cat5:Category {name: "Books", description: "Books and publications"})

// Product relationships to categories
MATCH (p:Product)
OPTIONAL MATCH (c:Category {name: p.category})
MERGE (p)-[:BELONGS_TO]->(c);

// User preference relationships
MATCH (u:User)
FOREACH (pref IN u.preferences |
  MERGE (c:Category {name: pref.category})
  MERGE (u)-[:INTERESTED_IN {weight: pref.weight}]->(c)
);

// Interaction relationships
MATCH (i:Interaction)
MATCH (u:User {id: i.userId})
MATCH (p:Product {id: i.productId})
MERGE (u)-[r:INTERACTED_WITH {type: i.type, timestamp: i.timestamp}]->(p)
SET r.weight = CASE
  WHEN i.type = 'purchase' THEN 5.0
  WHEN i.type = 'cart_add' THEN 3.0
  WHEN i.type = 'click' THEN 1.0
  ELSE 0.5
END;
