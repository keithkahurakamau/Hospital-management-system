import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config.database import engine, Base

# =======================================================================
# --- CRITICAL: MODEL REGISTRATION ---
# =======================================================================
from app.models.user import User
from app.models.patient import Patient
from app.models.appointment import Appointment
from app.models.queue import PatientQueue
from app.models.medical_record import MedicalRecord
from app.models.pharmacy import DrugInventory, DispenseLog
from app.models.bed import Bed
from app.models.doctor import Doctor
from app.models.laboratory import LabTest, LabTestCatalog, LabTestRequiredItem
from app.models.inventory import Location, InventoryItem, StockBatch, InventoryUsageLog
from app.models.billing import Billing, InvoiceItem
# =======================================================================

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
from app.routes.users import router as users_router
from app.routes.admin import router as admin_router

# --- CORE UTILS ---
from app.core.websocket import manager

# --- DATABASE INITIALIZATION ---
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
# Explicit exact matches
origins = [
    "http://localhost:5173",  
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://hospital-management-system-7e9s.vercel.app" # REMOVED the trailing slash!
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # This regex automatically allows ALL Vercel preview branches for your specific app!
    allow_origin_regex=r"https://hospital-management-system-.*\.vercel\.app",
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
            await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# --- ROUTER REGISTRATION ---
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(patients_router)
app.include_router(appointments_router) 
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
app.include_router(admin_router)

@app.get("/")
async def root():
    return {
        "status": "Medicare System Online",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "version": "1.0.0"
    }