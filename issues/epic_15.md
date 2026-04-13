### Epic 15: Advanced Financial Management

**Description:** This Epic introduces advanced accounting and financial management capabilities including patient deposits, credit notes, waivers/discounts, tax compliance, professional invoice PDFs, double-entry bookkeeping, daily inpatient billing, and unified billing queue.

**User Stories:**
- **US-15.1 Patient Deposits/Advance Payments** - Cashiers accept advance deposits. Model PatientDeposit.
- **US-15.2 Credit Notes & Refunds** - Finance issue credit notes with approval workflows. Model CreditNote.
- **US-15.3 Waivers & Discounts** - Cashiers apply waivers with mandatory reason and approval.
- **US-15.4 KRA eTIMS Tax Compliance** - Integration with KRA eTIMS for tax classification. Service etims_service.py.
- **US-15.5 Invoice PDF Generation** - Professional PDF invoices using WeasyPrint/ReportLab. Endpoint GET /api/billing/{invoice_id}/pdf.
- **US-15.6 General Ledger & Chart of Accounts** - Double-entry bookkeeping models ChartOfAccount and JournalEntry.
- **US-15.7 Inpatient Daily Billing** - Automated daily billing for bed charges. Model InpatientCharge with scheduled task.
- **US-15.8 Unified Billing Queue** - All unbilled services in single queue. Modify get_billing_queue() and get_unbilled_items().

**Priority:** HIGH