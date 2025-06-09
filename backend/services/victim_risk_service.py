# backend/services/victim_risk_service.py

from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from backend.database import risk_collection





def add_risk_entry(victim_id: str, level: str):
    if level not in ["low", "medium", "high"]:
        raise HTTPException(status_code=400, detail="Invalid risk level")

    try:
        victim_obj_id = ObjectId(victim_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid victim ID format")

    entry = {
        "victim_id": victim_obj_id,
        "level": level,
        "timestamp": datetime.utcnow()
    }

    risk_collection.insert_one(entry)
    return {"message": "Risk entry added"}


def get_latest_risk(victim_id: str):
    try:
        victim_obj_id = ObjectId(victim_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid victim ID format")

    latest = risk_collection.find_one(
        {"victim_id": victim_obj_id},
        sort=[("timestamp", -1)]
    )

    if not latest:
        raise HTTPException(status_code=404, detail="No risk data found")

    return {
        "level": latest["level"],
        "timestamp": latest["timestamp"]
    }


def list_risk_history(victim_id: str):
    try:
        victim_obj_id = ObjectId(victim_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid victim ID format")

    history = risk_collection.find({"victim_id": victim_obj_id}).sort("timestamp", -1)

    result = []
    for entry in history:
        result.append({
            "level": entry["level"],
            "timestamp": entry["timestamp"]
        })

    return result
