# Epic 16: Triage Module

**Description:**  This Epic delivers a robust triage module for nurse-led vital signs entry with acuity scoring, integrated queue workflow, and clinician data visibility.

**User Stories:** 

- **US-16.1 Triage Vitals Recording** - Nurses record vitals including BP, pulse, temperature, weight, height, BMI auto-calc, respiratory rate, SpO2, pain score, Glasgow Coma Scale. Model TriageRecord in backend/app/models/triage.py. CRUD routes and frontend page frontend/src/pages/Triage.jsx. Auto-advance patient from Triage to Consultation queue on submit.

- **US-16.2 Triage Acuity Auto-Suggestion** - Automated acuity suggestion based on configurable thresholds (Emergency/Urgent/Standard). Nurse can override. Logic in triage route.

- **US-16.3 Vitals Available in Clinical Desk** - Sync latest triage vitals to doctor's consultation view. Display in frontend/src/pages/ClinicalDesk.jsx.

**Priority:** HIGH