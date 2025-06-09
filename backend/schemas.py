from pydantic import BaseModel
from typing import Optional, List, Literal

class Coordinates(BaseModel):
    type: Literal["Point"]
    coordinates: List[float]

class Location(BaseModel):
    country: str
    city: str
    coordinates: Coordinates

class ContactInfo(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    preferred_contact: Optional[str] = None

class EvidenceItem(BaseModel):
    type: str
    url: str
    description: Optional[str] = None

class IncidentDetails(BaseModel):
    date: str
    location: Location
    description: str
    violation_types: List[str]

class IncidentReport(BaseModel):
    report_id: str
    reporter_type: str
    anonymous: bool = False
    contact_info: Optional[ContactInfo] = None
    incident_details: IncidentDetails
    evidence: Optional[List[EvidenceItem]] = []
    assigned_to: Optional[str] = None

class UpdateStatus(BaseModel):
    status: str
