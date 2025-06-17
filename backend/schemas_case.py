from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class Coordinates(BaseModel):
    type: str
    coordinates: List[float]

class Location(BaseModel):
    country: str
    region: str
    city: str  
    coordinates: Coordinates


class Evidence(BaseModel):
    type: str
    url: str
    description: Optional[str] = None
    date_captured: Optional[datetime]

class Perpetrator(BaseModel):
    name: str
    type: str

class CaseCreate(BaseModel):
    case_id: str
    title: str
    description: str
    violation_types: List[str]
    status: str
    priority: str
    location: Location
    date_occurred: datetime
    date_reported: datetime
    victims: List[str]
    perpetrators: List[Perpetrator]
    evidence: List[Evidence]

class CaseUpdate(BaseModel):
    status: str
