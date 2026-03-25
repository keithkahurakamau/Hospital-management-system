import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config.database import engine, Base

# --- CRITICAL: MODEL REGISTRATION ---
# We must import all models here so SQLAlchemy registers them 
# before calling Base.metadata.create_all(bind=engine)
from app.models.user import User
from app.models.patient import Patient
from app.models.appointment import Appointment  # Added to fix relationship visibility
from app.models.queue import PatientQueue
from app.models.medical_record import MedicalRecord
from app.models.pharmacy import DrugInventory, DispenseLog 

# --- ROUTER IMPORTS ---
from app.routes.patients import router as patients_router
from app.routes.doctors import router as doctors_router
from app.routes.appointments import router as appointments_router
from app.routes.billing import router as billing_router
from app.routes.analytics import router as analytics_router
from app.routes.medical_records import router as records_router
from app.routes.pharmacy import router as pharmacy_router  
from app.routes.beds import router as beds_router          
from app.routes.laboratory import router as lab_router
from app.routes.websockets import router as websocket_router
from app.routes.queue import router as queue_router
from app.routes.auth import router as auth_router
from app.routes.clinical import router as clinical_router
from app.routes import users

# --- CORE UTILS ---
from app.core.websocket import manager

# --- DATABASE INITIALIZATION ---
# This physically builds the tables and foreign key relationships in Postgres
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Medicare ERP Core",
    description="Enterprise Hospital Management System",
    version="1.0.0"
)

# --- MIDDLEWARE ---
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

# --- WEBSOCKET ENDPOINT (LIVE SYNC) ---
@app.websocket("/ws/notifications/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(user_id, websocket)
    try:
        while True:
            # Keep the tunnel open
            await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# --- ROUTER REGISTRATION ---
app.include_router(auth_router)
app.include_router(users.router)
app.include_router(patients_router)
app.include_router(appointments_router) # /api/appointments
app.include_router(doctors_router)
app.include_router(billing_router)
app.include_router(analytics_router)
app.include_router(records_router)
app.include_router(pharmacy_router) 
app.include_router(beds_router)     
app.include_router(lab_router)
app.include_router(websocket_router) 
app.include_router(queue_router) 
app.include_router(clinical_router) 

@app.get("/")
async def root():
    return {
        "status": "Medicare System Online",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "version": "1.0.0"
    }