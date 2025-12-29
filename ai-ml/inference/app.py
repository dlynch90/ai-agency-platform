# Python ML Service for AI Agency
# Handles ML/AI workloads for all 20 use cases

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import numpy as np
import tensorflow as tf
import redis
import requests
import json
from datetime import datetime

app = FastAPI(title="AI Agency Python ML Service", version="1.0.0")

# Redis client for caching
redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)

# Ollama client
OLLAMA_BASE_URL = "http://ollama:11434"

class HealthResponse(BaseModel):
    status: str
    services: Dict[str, bool]
    timestamp: str

class RecommendationRequest(BaseModel):
    userId: str
    browsingHistory: List[Dict[str, Any]]
    userPreferences: Optional[Dict[str, Any]] = None

class TriageRequest(BaseModel):
    symptoms: str
    patientHistory: Optional[str] = None
    currentMedications: Optional[str] = None

class PortfolioOptimizationRequest(BaseModel):
    portfolio: List[Dict[str, Any]]
    riskProfile: str

class QualityInspectionRequest(BaseModel):
    imageUrl: str
    productType: str
    factoryId: str

class RealEstatePredictionRequest(BaseModel):
    property: Dict[str, Any]

# Health check
@app.get("/health", response_model=HealthResponse)
async def health_check():
    services = {
        "redis": redis_client.ping(),
        "ollama": False,
        "tensorflow": True  # TensorFlow is available
    }

    # Test Ollama
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        services["ollama"] = response.status_code == 200
    except:
        pass

    return HealthResponse(
        status="healthy" if all(services.values()) else "degraded",
        services=services,
        timestamp=datetime.now().isoformat()
    )

# 1. E-commerce Personalization Engine
@app.post("/recommend")
async def get_recommendations(request: RecommendationRequest):
    """Generate personalized product recommendations"""
    try:
        # Simple collaborative filtering simulation
        # In production, this would use trained ML models

        user_history = request.browsingHistory
        preferences = request.userPreferences or {}

        # Extract product categories from history
        categories = {}
        for view in user_history[-50:]:  # Last 50 views
            category = view.get('product', {}).get('category', 'unknown')
            categories[category] = categories.get(category, 0) + 1

        # Generate recommendations based on category preferences
        top_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)[:3]

        recommendations = []
        for category, score in top_categories:
            recommendations.append({
                "category": category,
                "confidence": min(score / 10, 1.0),  # Normalize confidence
                "reason": f"Based on {score} views in {category}"
            })

        # Cache results
        cache_key = f"recommendations:{request.userId}"
        redis_client.setex(cache_key, 3600, json.dumps(recommendations))

        return {
            "userId": request.userId,
            "recommendations": recommendations,
            "generatedAt": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 2. Healthcare Patient Triage System
@app.post("/triage")
async def patient_triage(request: TriageRequest):
    """AI-powered patient triage and priority scoring"""
    try:
        symptoms = request.symptoms.lower()

        # Simple rule-based triage (in production, use trained ML model)
        priority_keywords = {
            "emergency": ["chest pain", "difficulty breathing", "unconscious", "severe bleeding"],
            "urgent": ["high fever", "severe pain", "confusion", "rapid heartbeat"],
            "soon": ["moderate pain", "nausea", "dizziness", "rash"],
            "routine": ["mild cold", "sore throat", "minor cut"]
        }

        priority_score = 1  # Default low priority
        matched_keywords = []

        for level, keywords in priority_keywords.items():
            for keyword in keywords:
                if keyword in symptoms:
                    matched_keywords.append(keyword)
                    if level == "emergency":
                        priority_score = 4
                    elif level == "urgent" and priority_score < 4:
                        priority_score = 3
                    elif level == "soon" and priority_score < 3:
                        priority_score = 2

        # Consider patient history
        risk_factors = 0
        if request.patientHistory:
            history = request.patientHistory.lower()
            if "heart disease" in history or "diabetes" in history:
                risk_factors += 1

        final_score = min(priority_score + risk_factors, 4)

        priority_map = {1: "low", 2: "medium", 3: "high", 4: "emergency"}

        return {
            "priorityScore": final_score,
            "status": priority_map[final_score],
            "matchedSymptoms": matched_keywords,
            "riskFactors": risk_factors,
            "recommendations": generate_triage_recommendations(final_score),
            "assessedAt": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_triage_recommendations(priority_score: int) -> List[str]:
    """Generate triage recommendations based on priority"""
    recommendations = []

    if priority_score >= 4:
        recommendations.extend([
            "Seek immediate emergency medical attention",
            "Call emergency services (911)",
            "Do not drive yourself to hospital"
        ])
    elif priority_score >= 3:
        recommendations.extend([
            "Contact healthcare provider within 1 hour",
            "Go to nearest urgent care or ER",
            "Do not delay seeking medical attention"
        ])
    elif priority_score >= 2:
        recommendations.extend([
            "Schedule appointment with healthcare provider today",
            "Monitor symptoms closely",
            "Contact provider if symptoms worsen"
        ])
    else:
        recommendations.extend([
            "Schedule routine appointment within 1-2 weeks",
            "Use over-the-counter remedies as appropriate",
            "Monitor symptoms and contact provider if they persist"
        ])

    return recommendations

# 3. Financial Portfolio Optimization
@app.post("/portfolio-optimize")
async def optimize_portfolio(request: PortfolioOptimizationRequest):
    """Optimize investment portfolio using AI"""
    try:
        portfolio = request.portfolio
        risk_profile = request.riskProfile.lower()

        # Calculate current allocation
        total_value = sum(holding.get('value', 0) for holding in portfolio)

        # Risk-based allocation recommendations
        risk_allocations = {
            "conservative": {"stocks": 0.4, "bonds": 0.5, "cash": 0.1},
            "moderate": {"stocks": 0.6, "bonds": 0.3, "cash": 0.1},
            "aggressive": {"stocks": 0.8, "bonds": 0.15, "cash": 0.05}
        }

        target_allocation = risk_allocations.get(risk_profile, risk_allocations["moderate"])

        # Generate rebalancing recommendations
        recommendations = []
        for holding in portfolio:
            current_value = holding.get('value', 0)
            symbol = holding.get('symbol', '')
            asset_type = holding.get('type', 'stock').lower()

            if asset_type in target_allocation:
                target_value = total_value * target_allocation[asset_type]
                current_pct = current_value / total_value if total_value > 0 else 0
                target_pct = target_allocation[asset_type]

                if abs(current_pct - target_pct) > 0.05:  # 5% deviation threshold
                    action = "buy" if current_pct < target_pct else "sell"
                    amount = abs(target_value - current_value)

                    recommendations.append({
                        "symbol": symbol,
                        "action": action,
                        "amount": round(amount, 2),
                        "reason": f"Rebalance from {current_pct:.1%} to {target_pct:.1%}"
                    })

        return {
            "portfolioValue": total_value,
            "riskProfile": risk_profile,
            "targetAllocation": target_allocation,
            "recommendations": recommendations,
            "expectedReturn": calculate_expected_return(target_allocation, risk_profile),
            "optimizedAt": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def calculate_expected_return(allocation: Dict[str, float], risk_profile: str) -> float:
    """Calculate expected annual return based on allocation"""
    # Simplified expected returns (in production, use historical data)
    expected_returns = {
        "stocks": 0.08,  # 8% expected return
        "bonds": 0.03,   # 3% expected return
        "cash": 0.01     # 1% expected return
    }

    total_return = 0
    for asset_type, weight in allocation.items():
        total_return += expected_returns.get(asset_type, 0.01) * weight

    # Adjust for risk profile
    risk_adjustments = {"conservative": -0.01, "moderate": 0, "aggressive": 0.02}
    total_return += risk_adjustments.get(risk_profile, 0)

    return round(total_return, 4)

# 4. Manufacturing Quality Control
@app.post("/quality-inspect")
async def quality_inspection(request: QualityInspectionRequest):
    """AI-powered quality inspection using computer vision"""
    try:
        # In production, this would download and analyze the image
        # For demo, simulate defect detection

        image_url = request.imageUrl
        product_type = request.productType
        factory_id = request.factoryId

        # Simulate ML model analysis
        # Random defect detection for demo (0-15% defect rate)
        defect_found = np.random.random() < 0.15

        result = {
            "defectFound": defect_found,
            "productType": product_type,
            "factoryId": factory_id,
            "inspectionId": f"inspect_{int(datetime.now().timestamp())}",
            "analyzedAt": datetime.now().isoformat()
        }

        if defect_found:
            defect_types = ["crack", "stain", "misalignment", "surface_defect", "dimension_error"]
            severities = ["minor", "moderate", "major", "critical"]

            result.update({
                "defectType": np.random.choice(defect_types),
                "severity": np.random.choice(severities, p=[0.5, 0.3, 0.15, 0.05]),
                "confidence": round(np.random.uniform(0.7, 0.95), 3),
                "location": {
                    "x": np.random.randint(0, 100),
                    "y": np.random.randint(0, 100),
                    "width": np.random.randint(10, 50),
                    "height": np.random.randint(10, 50)
                },
                "recommendations": ["Reject product", "Inspect similar items", "Calibrate equipment"]
            })
        else:
            result.update({
                "confidence": round(np.random.uniform(0.85, 0.98), 3),
                "quality": "excellent"
            })

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 7. Real Estate Market Prediction
@app.post("/real-estate-predict")
async def real_estate_prediction(request: RealEstatePredictionRequest):
    """Predict real estate property values using ML"""
    try:
        property_data = request.property

        # Extract features
        bedrooms = property_data.get('bedrooms', 3)
        bathrooms = property_data.get('bathrooms', 2)
        square_feet = property_data.get('squareFeet', 2000)
        property_type = property_data.get('propertyType', 'house')

        # Simple linear model simulation (in production, use trained model)
        base_price = 300000  # Base price for average property

        # Adjustments
        bedroom_adjustment = (bedrooms - 3) * 25000
        bathroom_adjustment = (bathrooms - 2) * 15000
        size_adjustment = (square_feet - 2000) * 150  # $150 per sq ft above average

        # Property type multipliers
        type_multipliers = {
            "house": 1.0,
            "condo": 0.8,
            "townhouse": 0.9
        }
        type_multiplier = type_multipliers.get(property_type, 1.0)

        predicted_price = (base_price + bedroom_adjustment + bathroom_adjustment + size_adjustment) * type_multiplier

        # Market factors (simulated)
        market_trend = np.random.uniform(0.95, 1.05)  # +/- 5% market fluctuation
        location_factor = np.random.uniform(0.9, 1.2)  # Location desirability

        final_price = predicted_price * market_trend * location_factor

        # Confidence based on data completeness
        confidence = 0.85  # High confidence for demo

        factors = [
            f"Bedrooms: {bedrooms} (+${bedroom_adjustment:,.0f})",
            f"Bathrooms: {bathrooms} (+${bathroom_adjustment:,.0f})",
            f"Size: {square_feet} sq ft (+${size_adjustment:,.0f})",
            f"Property Type: {property_type} ({type_multiplier:.1f}x multiplier)",
            f"Market Trend: {market_trend:.1%}",
            f"Location Factor: {location_factor:.1%}"
        ]

        return {
            "property": property_data,
            "predictedPrice": round(final_price, 2),
            "confidence": confidence,
            "priceRange": {
                "low": round(final_price * 0.9, 2),
                "high": round(final_price * 1.1, 2)
            },
            "factors": factors,
            "predictedAt": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)