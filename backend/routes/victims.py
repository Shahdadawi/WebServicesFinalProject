# backend/routes/victims.py

from fastapi import APIRouter, HTTPException, Body , Query
from backend.database import db 
from backend.schema_victim import VictimCreate, VictimUpdate, VictimInDB
from bson import ObjectId
from backend.database import victims_collection
from datetime import datetime
from backend.utils.role_checker import check_role
from backend.services.victim_risk_service import add_risk_entry, get_latest_risk, list_risk_history

router = APIRouter()





@router.post("/")
def create_victim(victim: VictimCreate):
    victim_data = victim.dict()
    victim_data["created_at"] = datetime.utcnow()
    victim_data["updated_at"] = datetime.utcnow()
    
    if victim_data.get("anonymous", False):
        victim_data["full_name"] = None

    result = victims_collection.insert_one(victim_data)
    return {"message": "Victim/Witness added", "id": str(result.inserted_id)}



@router.get("/")
def list_victims(type: str = None , requester_email: str = Query(...)):
    check_role(requester_email, allowed_roles=["admin"])
    query = {}
    if type:
        query["type"] = type

    victims = victims_collection.find(query)
    result = []
    for v in victims:
        v["id"] = str(v["_id"])
        del v["_id"]

        if v.get("anonymous", False):
            v["display_name"] = v.get("pseudonym_name", "Anonymous")
            v.pop("full_name", None)
            v.pop("contact_info", None)
        else:
            v["display_name"] = v.get("full_name", "Unknown")

        result.append(v)  
    return result




@router.get("/{victim_id}")
def get_victim(victim_id: str, requester_email: str = Query(...)):
    check_role(requester_email, allowed_roles=["admin"])
    try:
        obj_id = ObjectId(victim_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    victim = victims_collection.find_one({"_id": obj_id})
    if not victim:
        raise HTTPException(status_code=404, detail="Victim not found")

    victim["id"] = str(victim["_id"])
    del victim["_id"]

    
    if victim.get("anonymous", False):
        victim["display_name"] = victim.get("pseudonym_name", "Anonymous")
        victim.pop("full_name", None)
        victim.pop("contact_info", None)
    else:
        victim["display_name"] = victim.get("full_name", "Unknown")

    return victim





@router.put("/{victim_id}")
def update_victim(victim_id: str, updated_data: VictimUpdate):
    try:
        obj_id = ObjectId(victim_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    if not victims_collection.find_one({"_id": obj_id}):
        raise HTTPException(status_code=404, detail="Victim not found")

    data = updated_data.dict()
    data["updated_at"] = datetime.utcnow()

    victims_collection.update_one({"_id": obj_id}, {"$set": data})
    return {"message": "Victim updated successfully"}



@router.delete("/{victim_id}")
def delete_victim(victim_id: str):
    try:
        obj_id = ObjectId(victim_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    result = victims_collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Victim not found")

    return {"message": "Victim deleted successfully"}


@router.patch("/{victim_id}/risk-level")
def update_risk_level(
    victim_id: str,
    level: str = Body(...),
    requester_email: str = Body(...)
):
    check_role(requester_email, allowed_roles=["admin"])
    return add_risk_entry(victim_id, level)


@router.get("/{victim_id}/risk-history")
def risk_history(victim_id: str, requester_email: str = Query(...)):
    check_role(requester_email, allowed_roles=["admin"])
    return list_risk_history(victim_id)


@router.get("/{victim_id}/risk-latest")
def latest_risk(victim_id: str, requester_email: str = Query(...)):
    check_role(requester_email, allowed_roles=["admin"])
    return get_latest_risk(victim_id)



@router.get("/case/{case_id}")
def get_victims_by_case(case_id: str, requester_email: str = Query(...)):
    check_role(requester_email, allowed_roles=["admin"])
    victims = victims_collection.find({"cases_involved": case_id})
    result = []
    for v in victims:
        v["id"] = str(v["_id"])
        del v["_id"]

        if v.get("anonymous", False):
            v["display_name"] = v.get("pseudonym_name", "Anonymous")
            v.pop("full_name", None)
            v.pop("contact_info", None)
        else:
            v["display_name"] = v.get("full_name", "Unknown")

        result.append(v)
    return result


@router.get("/{victim_id}/cases")
def get_cases_for_victim(victim_id: str, requester_email: str = Query(...)):
    check_role(requester_email, allowed_roles=["admin"])
    
    try:
        obj_id = ObjectId(victim_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    victim = victims_collection.find_one({"_id": obj_id})
    if not victim:
        raise HTTPException(status_code=404, detail="Victim not found")

    return {"cases_involved": victim.get("cases_involved", [])}

