from fastapi import FastAPI
from backend.routes.reports import router as reports_router
from backend.routes.cases import router as cases_router
from backend.routes import auth

from backend.routes.analytics import router as analytics_router
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.victims import router as victims_router



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(reports_router, prefix="/reports")
app.include_router(analytics_router, prefix="/analytics")
app.include_router(cases_router, prefix="/cases")
app.include_router(auth.router)
app.include_router(victims_router, prefix="/victims")






