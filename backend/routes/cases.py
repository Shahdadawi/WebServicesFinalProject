# backend/routes/cases.py
from fastapi import APIRouter, HTTPException  , Body
from backend.schemas_case import CaseCreate, CaseUpdate
from datetime import datetime
from bson import ObjectId
from backend.database import cases_collection
from datetime import datetime
from backend.database import case_status_history_collection

from backend.routes.crud.cases_crud import (
    add_case, get_cases, get_case,
    update_case_status, archive_case
)

router = APIRouter()

#  POST /cases/
@router.post("/")
def create_case(case: CaseCreate):
    new_case = add_case(case.dict())
    return new_case

#  GET /cases/{case_id}
@router.get("/{case_id}")
def read_case(case_id: str):
    case = get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

# GET /cases/
@router.get("/")
def list_cases(status: str = None, city: str = None, violation_type: str = None):
    filters = {}
    if status:
        filters["status"] = status
    if city:
        filters["location.city"] = city
    if violation_type:
        filters["violation_types"] = violation_type
    return get_cases(filters)

@router.patch("/{case_id}")
def update_status(
    case_id: str,
    status_update: CaseUpdate,
    requester_email: str = Body(...)
):
    # تحديث الحالة في الكولكشن الرئيسي
    success = cases_collection.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {"status": status_update.status, "updated_at": datetime.utcnow()}}
    )

    # إضافة السجل إلى history
    history_entry = {
        "case_id": case_id,
        "new_status": status_update.status,
        "updated_by": requester_email,
        "timestamp": datetime.utcnow()
    }
    case_status_history_collection.insert_one(history_entry)

    if success.modified_count == 0:
        raise HTTPException(status_code=404, detail="Case not found or update failed")

    return {"message": "Status updated successfully."}

#  DELETE /cases/{case_id}
@router.delete("/{case_id}")
def delete_case(case_id: str):
    success = archive_case(case_id)
    if not success:
        raise HTTPException(status_code=404, detail="Case not found or deletion failed")
    return {"message": "Case archived (deleted) successfully."}


from backend.database import incident_reports  

@router.post("/from-report/{report_id}")
def convert_report_to_case(report_id: str):
    try:
        obj_id = ObjectId(report_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid report ID")

    report = incident_reports.find_one({"_id": obj_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    
    now = datetime.utcnow()
    case_data = {
        "case_id": f"HRM-{now.year}-{now.strftime('%m%d%H%M')}",
        "title": f"Case from Report {report_id}",
        "description": report["incident_details"]["description"],
        "violation_types": report["incident_details"]["violation_types"],
        "status": "under_investigation",
        "priority": "medium",
        "location": report["incident_details"]["location"],
        "date_occurred": datetime.strptime(report["incident_details"]["date"], "%Y-%m-%d"),
        "date_reported": now,
        "victims": [str(obj_id)],  
        "perpetrators": [],
        "evidence": report.get("evidence", []),
        "created_at": now,
        "updated_at": now
    }

    result = cases_collection.insert_one(case_data)
    return {"message": "Report converted to case", "id": str(result.inserted_id)}
