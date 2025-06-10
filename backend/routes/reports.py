from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from uuid import uuid4
import os, shutil

from backend.database import incident_reports
from backend.schemas import IncidentReport, UpdateStatus
from backend.database import report_evidence_collection


router = APIRouter()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
def submit_report(report: IncidentReport):
    data = report.dict()
    data["status"] = "new"
    data["created_at"] = datetime.utcnow()
    result = incident_reports.insert_one(data)
    return {"message": "Report submitted", "id": str(result.inserted_id)}

@router.get("/")
def list_reports(reporter_type: str = None, report_id: str = None):
    query = {}
    if reporter_type: query["reporter_type"] = reporter_type
    if report_id: query["report_id"] = report_id
    reports = []
    for r in incident_reports.find(query):
        r["_id"] = str(r["_id"])
        reports.append(r)
    return {"reports": reports}

@router.get("/all")
def get_all_reports():
    reports = list(incident_reports.find({}))
    for r in reports:
        r["_id"] = str(r["_id"])
    return {"reports": reports}


@router.patch("/{report_id}")
def update_report_status(report_id: str, update: UpdateStatus):
    try:
        obj_id = ObjectId(report_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid report ID")
    existing = incident_reports.find_one({"_id": obj_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Report not found")
    current_status = existing.get("status", "")
    if current_status == update.status:
        return {"message": f"Status already '{current_status}'"}
    incident_reports.update_one({"_id": obj_id}, {"$set": {"status": update.status}})
    return {"message": f"Status updated to '{update.status}'"}

@router.get("/{report_id}")
def get_report_by_id(report_id: str):
    try:
        obj_id = ObjectId(report_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid report ID")
    report = incident_reports.find_one({"_id": obj_id})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report["_id"] = str(report["_id"])
    return report

@router.post("/with-file")
async def create_report_with_file(
    report_id: str = Form(...),
    reporter_type: str = Form(...),
    anonymous: bool = Form(...),
    email: str = Form(None),
    phone: str = Form(None),
    preferred_contact: str = Form(None),
    date: str = Form(...),
    country: str = Form(...),
    city: str = Form(...),
    lon: float = Form(...),
    lat: float = Form(...),
    description: str = Form(...),
    violation_type: str = Form(...),
    assigned_to: str = Form(None),
    file: UploadFile = File(None)
):
    file_url = None
    if file:
        filename = f"{uuid4().hex}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_url = f"/{UPLOAD_DIR}/{filename}"

    report = {
        "report_id": report_id,
        "reporter_type": reporter_type,
        "anonymous": anonymous,
        "contact_info": {
            "email": email,
            "phone": phone,
            "preferred_contact": preferred_contact
        },
        "incident_details": {
            "date": date,
            "location": {
                "country": country,
                "city": city,
                "coordinates": {
                    "type": "Point",
                    "coordinates": [lon, lat]
                }
            },
            "description": description,
            "violation_types": [violation_type]
        },
        "evidence": [],
        "assigned_to": assigned_to,
        "status": "new",
        "created_at": datetime.utcnow()
    }

    if file_url:
        report["evidence"].append({
            "type": file.content_type.split("/")[0],
            "url": file_url,
            "description": file.filename
        })

    result = incident_reports.insert_one(report)

    
    new_report_id = str(result.inserted_id)
    for item in report.get("evidence", []):
        item["report_id"] = new_report_id
        item["timestamp"] = datetime.utcnow()
        report_evidence_collection.insert_one(item)

    return {"message": "Report with file submitted", "id": new_report_id}





