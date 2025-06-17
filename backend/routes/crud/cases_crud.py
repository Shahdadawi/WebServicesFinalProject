# backend/routes/crud/cases_crud.py
from backend.database import cases_collection
from bson import ObjectId
from datetime import datetime

def case_helper(case) -> dict:
    return {
        "id": str(case["_id"]),
        "case_id": case["case_id"],
        "title": case["title"],
        "description": case["description"],
        "violation_types": case["violation_types"],
        "status": case["status"],
        "priority": case["priority"],
        "location": case["location"],
        "date_occurred": case["date_occurred"],
        "date_reported": case["date_reported"],
        "victims": case["victims"],
        "perpetrators": case["perpetrators"],
        "evidence": case["evidence"],
        "created_at": case["created_at"],
        "updated_at": case["updated_at"]
    }

def add_case(case_data: dict) -> dict:
    case_data["created_at"] = datetime.utcnow()
    case_data["updated_at"] = datetime.utcnow()
    result = cases_collection.insert_one(case_data)
    case = cases_collection.find_one({"_id": result.inserted_id})
    return case_helper(case)

def get_cases(filters: dict = {}) -> list:
    return [case_helper(case) for case in cases_collection.find(filters)]

def get_case(case_id: str) -> dict:
    case = cases_collection.find_one({"_id": ObjectId(case_id)})
    return case_helper(case) if case else None

def update_case_status(case_id: str, status: str) -> bool:
    result = cases_collection.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    return result.modified_count > 0

from backend.database import archived_cases_collection  # تأكدي إنك عرفتي الكولكشن بالأول

def archive_case(case_id: str) -> bool:
    case = cases_collection.find_one({"_id": ObjectId(case_id)})
    if not case:
        return False

    
    case["archived_at"] = datetime.utcnow()

    
    archived_cases_collection.insert_one(case)

    
    result = cases_collection.delete_one({"_id": ObjectId(case_id)})
    return result.deleted_count > 0

