# backend/schema_victim.py

from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class VictimBase(BaseModel):
    type: str  # "victim" or "witness"
    anonymous: bool
    demographics: Dict[str, object]
    contact_info: Dict[str, str]  
    cases_involved: List[str] = []
    risk_assessment: Dict[str, object] = {}
    support_services: List[Dict] = []
    full_name: Optional[str] = None         
    pseudonym_name: Optional[str] = None    


class VictimCreate(VictimBase):
    pass

class VictimUpdate(VictimBase):
    pass

class VictimInDB(VictimBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
