import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.database import engine, Base

# Direct imports from specific route files
from app.routes.patients import router as patients_router
from app.routes.doctors import router as doctors_router
from app.routes.appointments import router as appointments_router
from app.routes.billing import router as billing_router
from app.routes.analytics import router as analytics_router
from app.routes.medical_records import router as records_router
from app.routes.pharmacy import router as pharmacy_router  
from app.routes.beds import router as beds_router          
from app.routes.laboratory import router as lab_router

# Create tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Medicare HMS Core",
    description="Advanced Hospital Management System API",
    version="1.0.0"
)

# --- MIDDLEWARE FOR PERFORMANCE ---
@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# --- SECURITY & CORS ---
origins = [
    "http://localhost:5173",  
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTER REGISTRATION ---
app.include_router(patients_router)
app.include_router(doctors_router)
app.include_router(appointments_router)
app.include_router(billing_router)
app.include_router(analytics_router)
app.include_router(records_router)
app.include_router(pharmacy_router) 
app.include_router(beds_router)     
app.include_router(lab_router)

@app.get("/")
async def root():
    return {
        "status": "Medicare System Online",
        "version": "1.0.0",
        "documentation": "/docs"
    }