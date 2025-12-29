#!/usr/bin/env python3
"""
AI Personalization Engine for E-commerce
Uses Neo4j graph analysis and machine learning for product recommendations
"""

import os
import json
from neo4j import GraphDatabase
from typing import List, Dict, Any
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class PersonalizationEngine:
    def __init__(self):
        self.driver = GraphDatabase.driver(
            os.getenv("NEO4J_URI", "bolt://localhost:7687"),
            auth=(os.getenv("NEO4J_USER", "neo4j"), os.getenv("NEO4J_PASSWORD", "password"))
        )

    def get_user_profile(self, user_id: int) -> Dict[str, Any]:
        """Get comprehensive user profile from graph database"""
        with self.driver.session() as session:
            # Get user preferences and interaction history
            result = session.run("""
                MATCH (u:User {id: $user_id})
                OPTIONAL MATCH (u)-[r:INTERACTED_WITH]->(p:Product)
                OPTIONAL MATCH (u)-[pref:INTERESTED_IN]->(c:Category)
                RETURN u.preferences as preferences,
                       collect({product: p.name, category: p.category, weight: r.weight, type: r.type}) as interactions,
                       collect({category: c.name, weight: pref.weight}) as category_prefs
            """, user_id=user_id)

            record = result.single()
            if not record:
                return {"preferences": {}, "interactions": [], "category_prefs": []}

            return {
                "preferences": record["preferences"] or {},
                "interactions": record["interactions"] or [],
                "category_prefs": record["category_prefs"] or []
            }

    def calculate_product_similarity(self, user_profile: Dict) -> List[Dict]:
        """Calculate product recommendations using collaborative filtering"""

        # Extract user preferences
        category_weights = {}
        for pref in user_profile.get("category_prefs", []):
            category_weights[pref["category"]] = pref["weight"]

        # Calculate interaction scores
        product_scores = {}
        for interaction in user_profile.get("interactions", []):
            product_name = interaction["product"]
            weight = interaction["weight"]
            category = interaction["category"]

            # Boost score based on category preference
            category_boost = category_weights.get(category, 1.0)
            final_score = weight * category_boost

            product_scores[product_name] = final_score

        # Sort by score and return top recommendations
        sorted_products = sorted(product_scores.items(), key=lambda x: x[1], reverse=True)

        return [
            {"product": name, "score": score, "confidence": min(score / 5.0, 1.0)}
            for name, score in sorted_products[:10]
        ]

    def generate_personalized_recommendations(self, user_id: int) -> Dict[str, Any]:
        """Generate comprehensive personalized recommendations"""

        user_profile = self.get_user_profile(user_id)
        product_recommendations = self.calculate_product_similarity(user_profile)

        # Generate reasoning based on user behavior
        top_categories = [p["category"] for p in user_profile.get("category_prefs", [])[:3]]
        interaction_types = list(set([i["type"] for i in user_profile.get("interactions", [])]))

        reasoning = f"Based on your interest in {', '.join(top_categories)} categories "
        if "purchase" in interaction_types:
            reasoning += "and your purchase history, "
        reasoning += f"we recommend these products with {len(product_recommendations)} high-confidence suggestions."

        return {
            "user_id": user_id,
            "recommendations": product_recommendations,
            "algorithm": "graph_collaborative_filtering",
            "reasoning": reasoning,
            "confidence_score": np.mean([r["confidence"] for r in product_recommendations]) if product_recommendations else 0,
            "generated_at": str(datetime.now())
        }

    def update_user_preferences(self, user_id: int, new_preferences: Dict) -> bool:
        """Update user preferences in the graph database"""
        with self.driver.session() as session:
            session.run("""
                MATCH (u:User {id: $user_id})
                SET u.preferences = $preferences,
                    u.updated_at = datetime()
            """, user_id=user_id, preferences=json.dumps(new_preferences))

        return True

    def track_interaction(self, user_id: int, product_id: int, interaction_type: str, metadata: Dict = None) -> bool:
        """Track user-product interaction in graph database"""
        with self.driver.session() as session:
            session.run("""
                MATCH (u:User {id: $user_id}), (p:Product {id: $product_id})
                CREATE (u)-[r:INTERACTED_WITH {
                    type: $interaction_type,
                    timestamp: datetime(),
                    metadata: $metadata
                }]->(p)
                SET r.weight = CASE
                    WHEN $interaction_type = 'purchase' THEN 5.0
                    WHEN $interaction_type = 'cart_add' THEN 3.0
                    WHEN $interaction_type = 'click' THEN 1.0
                    ELSE 0.5
                END
            """, user_id=user_id, product_id=product_id, interaction_type=interaction_type, metadata=json.dumps(metadata or {}))

        return True

if __name__ == "__main__":
    import sys
    from datetime import datetime

    if len(sys.argv) < 2:
        print("Usage: python personalization-engine.py <user_id>")
        sys.exit(1)

    user_id = int(sys.argv[1])
    engine = PersonalizationEngine()

    try:
        recommendations = engine.generate_personalized_recommendations(user_id)
        print(json.dumps(recommendations, indent=2))
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
