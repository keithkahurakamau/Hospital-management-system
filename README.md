# Medicare ERP — Hospital Management System  
  
A full-stack, enterprise-grade Hospital Management System (HMS) built with a decoupled client-server architecture. The backend uses FastAPI for high-performance asynchronous REST API delivery. The frontend uses React for stateful, component-driven UI rendering. PostgreSQL serves as the relational data store.  
  
> **Version:** 1.0.0    
> **Author:** Eng. Kamau Keith Kahura    
> **License:** Proprietary — All Rights Reserved  
  
---  
  
## Table of Contents  
  
- [Features](#features)  
- [Tech Stack](#tech-stack)  
- [Project Structure](#project-structure)  
- [Getting Started](#getting-started)  
  - [Prerequisites](#prerequisites)  
  - [Backend Setup](#backend-setup)  
  - [Frontend Setup](#frontend-setup)  
  - [Database Seeding](#database-seeding)  
- [Environment Variables](#environment-variables)  
- [API Modules](#api-modules)  
- [Frontend Pages](#frontend-pages)  
- [Data Models](#data-models)  
- [Deployment](#deployment)  
- [Roadmap](#roadmap)  
  
---  
  
## Features  
  
- **Authentication & RBAC** — JWT-based login with secure session handling and rate-limited login attempts. Role-based access control supports Admin, Doctor, Receptionist, Lab Technician, and Pharmacist roles.  
- **Patient Management** — Full patient registration with demographics, ID documents, next-of-kin details, and outpatient numbering.  
- **Appointment Scheduling** — Book, view, and manage patient appointments with doctors.  
- **Queue Management** — Real-time department queues with acuity-level triage (priority-based ordering).  
- **Clinical Desk** — Nurses record vitals (blood pressure, temperature, weight). Doctors conduct consultations, write diagnoses (ICD-coded), treatment plans, and prescription notes.  
- **Laboratory** — Catalog-driven lab test ordering. Tests are linked to inventory items consumed during processing. Lab technicians enter results and the system tracks turnaround times.  
- **Pharmacy (POS)** — Drug inventory management with stock tracking. Point-of-sale dispensing with prescription enforcement.  
- **Billing & Invoicing** — Unified invoicing that pulls charges from consultations, lab tests, and pharmacy into a single bill. Line items use universal linkers decoupled from specific modules. Supports eTIMS tax classification (Exempt, 16% VAT, Zero Rated, Non-Taxable).  
- **M-PESA Integration** — Mobile money payment collection via the Safaricom Daraja API.  
- **Bed Management** — Ward and bed tracking for inpatient admissions (ICU, General, Maternity, Pediatrics).  
- **Inventory Management** — Multi-location inventory with batch-level stock tracking, expiry dates, and usage logging.  
- **Analytics & Reports** — Admin dashboards and reporting for hospital performance monitoring.  
- **Real-Time Notifications** — WebSocket-based live sync across departments. When a lab result is completed or a patient moves in the queue, relevant staff are notified instantly.  
- **Dynamic Permissions** — The worker dashboard fetches permissions from the database and renders only the modules each staff member is authorized to access.  
  
---  
  
## Tech Stack  
  
| Layer | Technology |  
|---|---|  
| Backend | Python 3 / FastAPI |  
| Frontend | React 19 / Vite 8 |  
| Styling | Tailwind CSS 4 |  
| Database | PostgreSQL / SQLAlchemy 2.0 |  
| Auth | PyJWT / bcrypt / HTTP-only cookies |  
| Real-Time | WebSockets (native FastAPI) |  
| Payments | Safaricom M-PESA Daraja API |  
| Rate Limiting | SlowAPI |  
| Charts | Chart.js / Recharts |  
| Animations | Framer Motion |  
| Icons | Lucide React |  
| HTTP Client | Axios |  
| Deployment | Render (backend) / Vercel (frontend) |  
  
---  
  
## Project Structure  
Hospital-management-system/  
├── backend/  
│   ├── app/  
│   │   ├── config/ # Database connection & configuration  
│   │   ├── core/ # Security, rate limiter, WebSocket manager, dependencies  
│   │   ├── models/ # SQLAlchemy ORM models (13 files)  
│   │   ├── routes/ # API route handlers (16 modules)  
│   │   ├── schemas/ # Pydantic request/response schemas  
│   │   ├── services/ # Business logic (M-PESA payment service)  
│   │   ├── utils/ # Utility functions  
│   │   └── main.py # FastAPI application entrypoint  
│   ├── seed_master.py # Master database seeder (full demo data)  
│   ├── seed_admin.py # Seed admin account only  
│   ├── seed_beds.py # Seed hospital beds/wards  
│   ├── seed_patients.py # Seed patient records  
│   ├── seed_pharmacy.py # Seed pharmacy drug inventory  
│   ├── seed_users.py # Seed staff accounts  
│   ├── seed_reset.py # Reset and reseed  
│   ├── reset_schema.py # Drop and rebuild database schema  
│   ├── clear_db.py # Clear all data  
│   ├── fix_db.py # Database repair utility  
│   └── requirements.txt # Python dependencies  
├── frontend/  
│   ├── public/  
│   ├── src/  
│   │   ├── api/ # HTTP client configuration  
│   │   ├── assets/ # Static assets  
│   │   ├── components/ # Shared UI components (Layout)  
│   │   ├── pages/ # Page-level components (16 pages)  
│   │   ├── styles/ # Global styles  
│   │   ├── App.jsx # Root component with routing  
│   │   └── main.jsx # React entry point  
│   ├── package.json  
│   ├── vite.config.js  
│   ├── tailwind.config.js  
│   └── vercel.json # Vercel SPA rewrite rules  
├── issues/ # Planned epics (roadmap)  
├── LICENSE  
├── README.md  
└── TODO.md  
  
  
---  
  
## Getting Started  
  
### Prerequisites  
  
- Python 3.10+  
- Node.js 18+  
- PostgreSQL 14+  
  
### Backend Setup  
  
```bash  
# Navigate to the backend directory  
cd backend  
  
# Create and activate a virtual environment  
python -m venv venv  
source venv/bin/activate        # Linux/macOS  
venv\\Scripts\\activate           # Windows  
  
# Install dependencies  
pip install -r requirements.txt  
  
# Set up environment variables (see Environment Variables section below)  
cp .env.example .env            # Create from template, then edit  
  
# Start the development server  
uvicorn app.main:app --reload --port 8000  
```  
The API will be available at http://localhost:8000. Interactive docs are at http://localhost:8000/docs.  

### Frontend Setup  
  
```bash  
# Navigate to the frontend directory  
cd frontend  
  
# Install dependencies  
npm install  
  
# Start the development server  
npm run dev  
```  
The frontend will be available at http://localhost:5173.  

### Database Seeding  
The master seeder populates the database with demo data including staff accounts, patients, doctors, beds, pharmacy inventory, lab test catalogs, medical records, lab results, and active queues.  
  
```bash  
cd backend  
python seed_master.py  
```  
**Default login credentials after seeding:**  
  
| Role | Email | Password |  
|------|-------|----------|  
| Admin | admin@medicare.io | password |  
| Doctor | doctor@medicare.io | password |  
| Receptionist | desk@medicare.io | password |  
| Lab Technician | lab@medicare.io | password |  
| Pharmacist | pharmacy@medicare.io | password |  
  
Individual seeders are also available if you only need specific data:  
  
```bash  
python seed_admin.py        # Admin account only  
python seed_users.py        # All staff accounts  
python seed_patients.py     # Patient records  
python seed_beds.py         # Hospital beds and wards  
python seed_pharmacy.py     # Drug inventory  
```  
  
**To reset the database completely:**  
  
```bash  
python reset_schema.py      # Drops and rebuilds the schema  
```  
  
## Environment Variables  
  
Create a `.env` file in the `backend/` directory with the following variables:  
  
```env  
# Database (option 1: full URL — used by cloud providers like Render)  
DATABASE_URL=postgresql://user:password@host:5432/medicare_db  
  
# Database (option 2: individual variables — used for local development)  
DB_USER=postgres  
DB_PASSWORD=your_password  
DB_HOST=localhost  
DB_PORT=5432  
DB_NAME=medicare_db  
  
# JWT Authentication  
SECRET_KEY=your_secret_key  
ALGORITHM=HS256  
  
# M-PESA Daraja API (for mobile money payments)  
MPESA_CONSUMER_KEY=your_consumer_key  
MPESA_CONSUMER_SECRET=your_consumer_secret  
MPESA_SHORTCODE=your_shortcode  
MPESA_PASSKEY=your_passkey  
MPESA_CALLBACK_URL=your_callback_url  
```  
  
## API Modules  
  
The backend exposes 16 route modules, all prefixed under `/api/`:  
  
| Module | File | Description |  
|--------|------|-------------|  
| Auth | routes/auth.py | Login, token issuance, session management |  
| Users | routes/users.py | Staff CRUD, role assignment, permissions |  
| Patients | routes/patients.py | Patient registration and lookup |  
| Appointments | routes/appointments.py | Scheduling and management |  
| Doctors | routes/doctors.py | Doctor directory and profiles |  
| Billing | routes/billing.py | Invoice generation, line items, payments |  
| Analytics | routes/analytics.py | Hospital performance metrics |  
| Medical Records | routes/medical_records.py | Clinical notes, diagnoses, prescriptions |  
| Pharmacy | routes/pharmacy.py | Drug inventory and POS dispensing |  
| Beds | routes/beds.py | Ward and bed management |  
| Laboratory | routes/laboratory.py | Lab test ordering, results, catalog |  
| WebSockets | routes/websockets.py | Real-time notification channels |  
| Queue | routes/queue.py | Department queue management |  
| Clinical | routes/clinical.py | Triage and consultation workflows |  
| Admin | routes/admin.py | Administrative operations |  
| Dashboard | routes/dashboard.py | Worker agenda and dashboard data |  
  
## Frontend Pages  
  
| Page | Route | Description |  
|------|-------|-------------|  
| Login | /login | Staff authentication |  
| Dashboard | / | Role-based worker dashboard with live clock and daily agenda |  
| Patients | /patients | Patient registry with search and registration |  
| Patient Profile | /patients/:id | Individual patient details and history |  
| Appointments | /appointments | Appointment scheduling |  
| Clinical Desk | /records | Triage vitals entry and doctor consultations |  
| Laboratory | /lab | Lab test ordering and result entry |  
| Pharmacy | /pharmacy | Drug dispensing POS |  
| Billing | /billing | Invoice management and M-PESA payment |  
| Beds | /beds | Bed availability and assignment |  
| Inventory | /inventory | General inventory management |  
| Reports | /reports | Hospital reports and analytics |  
| User Management | /users | Staff account administration |  
| Admin Pricing | /admin/pricing | Lab test catalog and pricing configuration |  
  
## Data Models  
  
| Model | Table | Description |  
|-------|-------|-------------|  
| User | users | Staff accounts with hashed passwords and RBAC roles |  
| Patient | patients | Patient demographics, ID, next-of-kin |  
| Doctor | doctors | Doctor profiles with specialization and availability |  
| Appointment | appointments | Scheduled patient-doctor visits |  
| PatientQueue | patient_queue | Department queues with acuity levels |  
| MedicalRecord | medical_records | Consultation notes, vitals, diagnoses, prescriptions |  
| Bed | beds | Hospital beds organized by ward |  
| DrugInventory | drug_inventory | Pharmacy stock with pricing |  
| DispenseLog | dispense_log | Pharmacy dispensing audit trail |  
| LabTestCatalog | lab_test_catalog | Master catalog of available lab tests with pricing |  
| LabTestRequiredItem | lab_test_required_items | Inventory items consumed per lab test type |  
| LabTest | lab_tests | Individual patient lab test orders and results |  
| Billing | billing | Patient invoices |  
| InvoiceItem | invoice_items | Invoice line items with universal module linkers |  
| Location | locations | Inventory storage locations |  
| InventoryItem | inventory_items | Master inventory item definitions |  
| StockBatch | stock_batches | Physical stock with batch numbers and expiry |  
| InventoryUsageLog | inventory_usage_log | Consumption audit trail |  
  
## Deployment  
  
**Backend (Render)**  
The backend is deployed on Render as a web service. The database configuration automatically detects the `DATABASE_URL` environment variable provided by Render and converts the `postgres://` prefix to `postgresql://` for SQLAlchemy compatibility.  
  
**Frontend (Vercel)**  
The frontend is deployed on Vercel with SPA rewrite rules configured in `vercel.json`. CORS is configured to allow the production domain and all Vercel preview branch URLs via regex matching.  
  
**Production URL:** https://hospital-management-system-7e9s.vercel.app  
  
## Roadmap  
  
The following features are planned for future releases:  
  
**Epic 14: Insurance & Scheme Management (CRITICAL)**  
- Insurance company master register  
- Scheme/plan configuration with coverage limits and co-payment rates  
- Scheme-specific service pricing  
- Patient insurance enrollment  
- Pre-authorization workflows  
- Insurance claim submission and batch tracking  
- NHIF/SHA direct API integration  
- Co-payment and split billing  
- Smart card reader integration (WebUSB/WebSerial)  
- Aged debtors reporting  
  
**Epic 15: Advanced Financial Management (HIGH)**  
- Patient deposits and advance payments  
- Credit notes and refunds with approval workflows  
- Waivers and discounts  
- KRA eTIMS tax compliance integration  
- Professional PDF invoice generation  
- General ledger and chart of accounts (double-entry bookkeeping)  
- Automated daily inpatient billing  
- Unified billing queue  
  
## Copyright  
  
Copyright (c) 2026 Eng. Kamau Keith Kahura. All Rights Reserved.  
  
This software is proprietary. No part of this software may be used, copied, modified, distributed, or transmitted without the prior written consent of the author. See the LICENSE file for full terms.  
  
---  
  
This README is based on the actual contents of your repository:  
  
- The version, title, and description come from `backend/app/main.py` [4-cite-0](#4-cite-0)     
- The 16 route modules are registered in `main.py` [4-cite-1](#4-cite-1)     
- The frontend routes and pages come from `App.jsx` [4-cite-2](#4-cite-2)     
- The database config and env vars come from `database.py` [4-cite-3](#4-cite-3)     
- The seed credentials and demo data come from `seed_master.py` [4-cite-4](#4-cite-4)     
- The dependency versions come from `requirements.txt` and `package.json` [4-cite-5](#4-cite-5) [4-cite-6](#4-cite-6)     
- The roadmap epics come from the `issues/` directory [4-cite-7](#4-cite-7) [4-cite-8](#4-cite-8)
