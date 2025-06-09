from pymongo import MongoClient


client = MongoClient("mongodb://localhost:27017/")


db = client["human_rights_db"]


incident_reports = db["incident_reports"]
cases_collection = db["cases"]  
users_collection = db["users"]
victims_collection = db["victims"]
risk_collection = db["victim_risk_assessments"]


