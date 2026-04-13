# Epic 14: Insurance & Scheme Management

## Description
This Epic covers the implementation of Insurance & Scheme Management functionality across the HMS system, enabling comprehensive financial interaction with third-party insurers, insurance scheme setups, claim management, and related workflows.

## User Stories:
- **US-14.1 Insurance Company Master Register** - Admins create/manage insurance company profiles.  
Model: `InsuranceCompany` in `backend/app/models/insurance.py` with CRUD endpoints in `backend/app/routes/insurance.py`.  
Frontend page: `frontend/src/pages/InsuranceManagement.jsx`.  

- **US-14.2 Insurance Scheme/Plan Configuration** - Admins create schemes/plans per company with coverage limits and co-payment rates.  
Model: `InsuranceScheme` in `backend/app/models/insurance.py`.  

- **US-14.3 Scheme-Specific Service Pricing** - Admins configure prices per service per scheme.  
Model: `SchemePriceList` with billing logic fallback.  

- **US-14.4 Patient Insurance Enrollment** - Receptionists link patients to insurance schemes.  
Model: `PatientInsurance` with member/policy details.  
Frontend updates to `Patients.jsx` and `PatientProfile.jsx`.  

- **US-14.5 Pre-Authorization Workflow** - Receptionists submit pre-auth requests before procedures.  
Model: `PreAuthorization` with frontend forms.  

- **US-14.6 Insurance Claim Submission & Tracking** - Finance generate/batch submit claims.  
Model: `InsuranceClaim` with endpoint `POST /api/insurance/claims/submit-batch`.  
Frontend dashboard.  

- **US-14.7 NHIF/SHA Direct Integration** - Direct API integration via `backend/app/services/nhif_service.py`.  

- **US-14.8 Co-Payment & Split Billing** - Automated co-payment calculation and invoice splitting.  

- **US-14.9 Smart Card Reader Integration** - WebUSB/WebSerial for auto-populating NHIF card data.  

- **US-14.10 Aged Debtors Report** - Report for outstanding claims grouped by insurer.  

## Priority:
**CRITICAL**