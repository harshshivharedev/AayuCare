import os
from fpdf import FPDF
from fpdf.enums import XPos, YPos

class MasterArchitecturePDF(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 7.5)
        self.set_text_color(100, 116, 139)
        self.cell(0, 4, 'AayuCare - Master System Architecture & Planning Document | Catalyst 2026', new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='R')
        self.set_draw_color(226, 232, 240)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(2)

    def footer(self):
        self.set_y(-10)
        self.set_font('Helvetica', 'I', 7.5)
        self.set_text_color(148, 163, 184)
        self.cell(0, 6, f'Page {self.page_no()}', new_x=XPos.RIGHT, new_y=YPos.TOP, align='C')

    def chapter_title(self, number, title):
        self.set_font('Helvetica', 'B', 10.5)
        self.set_text_color(15, 23, 42)
        self.set_fill_color(238, 242, 255)
        self.set_draw_color(199, 210, 254)
        self.cell(0, 6, f" {number}. {title}", border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='L')
        self.ln(1.5)

    def section_title(self, title):
        self.set_font('Helvetica', 'B', 9)
        self.set_text_color(29, 78, 216)
        self.cell(0, 4.5, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='L')
        self.ln(0.5)

    def body_text(self, text):
        self.set_font('Helvetica', '', 8.2)
        self.set_text_color(51, 65, 85)
        self.multi_cell(0, 3.8, text)
        self.ln(1)

    def callout_box(self, title, text):
        self.set_fill_color(248, 250, 252)
        self.set_draw_color(59, 130, 246)
        self.set_line_width(0.5)
        self.set_font('Helvetica', 'B', 8.5)
        self.set_text_color(30, 58, 138)
        self.cell(0, 4.5, f"  {title}", border="L", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_font('Helvetica', '', 8)
        self.set_text_color(71, 85, 105)
        self.multi_cell(0, 3.6, f"  {text}", border="L", fill=True)
        self.set_line_width(0.2)
        self.ln(1.5)

    def bullet(self, label, text):
        self.set_font('Helvetica', 'B', 8)
        self.set_text_color(30, 41, 59)
        self.cell(3.5, 3.7, chr(149), new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.cell(32, 3.7, f"{label}: ", new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.set_font('Helvetica', '', 8)
        self.set_text_color(51, 65, 85)
        self.multi_cell(0, 3.7, text)
        self.ln(0.4)

    def table_header(self, col_widths, headers):
        self.set_font('Helvetica', 'B', 8)
        self.set_text_color(15, 23, 42)
        self.set_fill_color(241, 245, 249)
        for i, header in enumerate(headers):
            self.cell(col_widths[i], 5, header, border=1, fill=True, new_x=XPos.RIGHT, new_y=YPos.TOP, align='L')
        self.ln(5)

    def table_row(self, col_widths, cells):
        self.set_font('Helvetica', '', 7.6)
        self.set_text_color(51, 65, 85)
        for i, cell in enumerate(cells):
            self.cell(col_widths[i], 4.6, cell, border=1, new_x=XPos.RIGHT, new_y=YPos.TOP, align='L')
        self.ln(4.6)

def build_pdf():
    pdf = MasterArchitecturePDF()
    pdf.set_margins(10, 10, 10)
    pdf.set_auto_page_break(auto=True, margin=10)
    pdf.add_page()

    # Master Document Header
    pdf.set_font('Helvetica', 'B', 15)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 7, "AayuCare (Ayur-Care) Healthcare Platform", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='L')
    
    pdf.set_font('Helvetica', 'B', 9.5)
    pdf.set_text_color(37, 99, 235)
    pdf.cell(0, 4.5, "Master System Specification & Architecture Plan (SRS + LLD + HLD)", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='L')
    
    pdf.set_font('Helvetica', '', 7.5)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(0, 4, "Catalyst x PromptWars 2026 | Google for Developers | AI Engine: Adaption AI & Gemini | Stack: React, Node/Express, PostgreSQL, Prisma", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align='L')
    pdf.ln(2)

    # 1. Executive Mission
    pdf.chapter_title("1", "Executive Mission & Slide 13 Compliance Audit")
    pdf.callout_box(
        "Slide 13 Official Mandate:",
        "Develop an interconnected healthcare management platform helping elderly individuals manage daily medications, appointments, and routines while keeping family/caretakers informed via secure passcode-based access and proactive email reminders, ensuring elders remain at the center of their own decisions."
    )
    pdf.body_text(
        "AayuCare solves elderly healthcare friction through an ambient bedside companion. It combines real visual pill matching, "
        "hands-free bilingual voice confirmations ('Kha li'), 6-hour anti-overdose lockout shields, and clinical dietary guideline ingestion."
    )

    # 2. Actors Matrix
    pdf.chapter_title("2", "System Personas & Access Roles")
    col_w = [32, 68, 90]
    pdf.table_header(col_w, ["Persona", "Primary Responsibility", "Interface Touchpoint"])
    pdf.table_row(col_w, ["Elderly Patient", "Dose consumption & voice confirm", "Ambient Bedside Kiosk (Zero typing, giant buttons)"])
    pdf.table_row(col_w, ["Primary Caregiver", "Passcode sync, prescription upload, alert triage", "Caregiver Cockpit (Med schedule, adherence charts)"])
    pdf.table_row(col_w, ["Family Observer", "Remote oversight & emergency escalation", "Family Portal (Weekly scorecards, live logs)"])
    pdf.table_row(col_w, ["Doctor / Clinician", "Consultation recipient of 30-day compliance report", "1-Click Clinical Adherence Briefcase"])
    pdf.ln(1.5)

    # 3. Functional Requirements
    pdf.chapter_title("3", "Functional Requirements Specification (FRD)")
    pdf.section_title("FR-1: Shared Ecosystem & CarePasscode Access")
    pdf.bullet("FR-1.1", "Elder Profile setup: Name, age, blood group, emergency contact, and baseline medical notes.")
    pdf.bullet("FR-1.2", "CarePasscode Generation: Cryptographic 6-character access key (e.g. CARE-8492) bound to the elder.")
    pdf.bullet("FR-1.3", "Zero-Friction Pairing: Caregivers input passcode to link instantly without complex multi-login friction.")
    pdf.bullet("FR-1.4", "Role Permissions: Distinguishes PRIMARY_CAREGIVER (full write) and FAMILY_OBSERVER (read-only audit).")

    pdf.section_title("FR-2: Smart Prescription & Dietary Guideline Ingestion")
    pdf.bullet("FR-2.1", "Adaption AI Vision OCR: Extracts medication names, dosage, timing frequency, and meal relations from prescription.")
    pdf.bullet("FR-2.2", "Dietary Warnings Parser: Ingests doctor-prescribed meal rules (e.g., 'Take after meal', 'Avoid dairy/salt').")
    pdf.bullet("FR-2.3", "Physical Pill Photo Binding: Caretaker uploads actual photo of tablet strip for visual matching.")
    pdf.bullet("FR-2.4", "Criticality Tiering: High-Risk (BP, Heart, Insulin) vs Routine (Vitamins, Calcium, Antacids).")

    pdf.section_title("FR-3: Ambient Visual & Voice Reminder Companion")
    pdf.bullet("FR-3.1", "Scheduled Screen Takeover: At scheduled time, screen awakes displaying full-size photo of the exact pill.")
    pdf.bullet("FR-3.2", "Bilingual Voice Synthesis: Spoken reminder: 'Babuji, aapki subah ki BP wali goli ka time ho gaya hai.'")
    pdf.bullet("FR-3.3", "Dual-Confirmation: Voice match ('Kha li') via Web Speech API OR giant 80px green button ('MAINE LE LI').")

    pdf.section_title("FR-4: Adherence Tracking & Anti-Overdose Shield")
    pdf.bullet("FR-4.1", "State Tracking: SCHEDULED -> TAKEN | MISSED | SKIPPED with timestamp and confirmation method.")
    pdf.bullet("FR-4.2", "Anti-Overdose Lockout: Once taken, 6-hour Green Shield locks slot to prevent dementia repeat dosing.")
    pdf.bullet("FR-4.3", "Clinical Catch-Up Rule: If >3 hours late, system instructs patient not to double-dose and await next regular cycle.")

    pdf.section_title("FR-5: Proactive Family Escalation & Email Alert Engine")
    pdf.bullet("FR-5.1", "Escalation Ladder: T+0 min audio chime; T+30 min second nudge; T+45 min automated emergency email to Caretaker.")
    pdf.bullet("FR-5.2", "Appointment Dispatcher: Automatic reminders dispatched 24 hours and 2 hours before scheduled doctor visits.")

    pdf.section_title("FR-6 & FR-7: Appointments & Caretaker Cockpit")
    pdf.bullet("FR-6.1", "Appointment Scheduler: Doctor name, specialty, clinic address, appointment date/time, and prep checklist.")
    pdf.bullet("FR-6.2", "Clinical Briefcase: 1-Click generation of 30-day compliance report for doctors during clinic visits.")
    pdf.bullet("FR-7.1", "Caretaker Cockpit: Live adherence percentage metrics, real-time activity stream, and instant SOS beacon.")
    pdf.ln(1.5)

    # 4. Non-Functional Requirements
    pdf.chapter_title("4", "Non-Functional Requirements Specification (NFRs)")
    pdf.bullet("NFR-1 (Accessibility)", "WCAG 2.1 AAA high contrast (>7:1 ratio), 80px touch targets, zero typing required for elders.")
    pdf.bullet("NFR-2 (Security)", "HttpOnly Cookie sessions, Passcode bcrypt hashing, 100% Zod validation, Rate-limiting, strict CORS.")
    pdf.bullet("NFR-3 (Performance)", "API latency < 150ms, 1MB strict body payload limit, Prisma connection pooling, 8s AI timeout circuit breaker.")
    pdf.bullet("NFR-4 (Reliability)", "Idempotent dose logging (no double records), offline schedule caching, anti-double-dosing lock.")
    pdf.bullet("NFR-5 (Code Quality)", "Strict 3-Tier Layered Architecture (Controller -> Service -> Repository), 100% TypeScript type safety.")
    pdf.bullet("NFR-6 (Testing)", "Automated unit test suite verifying repository substitution (LSP) and domain logic (< 1 sec execution).")
    pdf.bullet("NFR-7 (Deployment)", "Cloud health probes (/api/health/live and /api/health/ready), zero-crash boot resilience.")
    pdf.ln(1.5)

    # 5. Low-Level Design (LLD)
    pdf.chapter_title("5", "Low-Level Design (LLD) Architecture")
    pdf.section_title("5.1 Relational Data Models (PostgreSQL + Prisma)")
    col_erd = [30, 45, 115]
    pdf.table_header(col_erd, ["Model Name", "Relationships", "Core Fields"])
    pdf.table_row(col_erd, ["User", "has 1 Elder / CareCircle", "id, email, password, role (ELDERLY, CAREGIVER, FAMILY)"])
    pdf.table_row(col_erd, ["ElderProfile", "has many Meds, Visits", "id, userId, fullName, age, bloodGroup, carePasscode"])
    pdf.table_row(col_erd, ["CareCircleAccess", "links User & ElderProfile", "id, elderProfileId, userId, accessRole (PRIMARY, OBSERVER)"])
    pdf.table_row(col_erd, ["Medication", "has many Logs", "id, elderId, name, dosage, scheduleTimes, pillImageUrl, criticality"])
    pdf.table_row(col_erd, ["MedicationLog", "belongs to Medication", "id, medicationId, scheduledFor, takenAt, status, confirmationMethod"])
    pdf.table_row(col_erd, ["Appointment", "belongs to ElderProfile", "id, elderProfileId, doctorName, specialty, clinicAddress, appointmentDate"])
    pdf.table_row(col_erd, ["AlertNotification", "belongs to ElderProfile", "id, elderProfileId, recipientEmail, alertType, status, sentAt"])
    pdf.ln(1)

    pdf.section_title("5.2 SOLID Principles Implementation Proof")
    pdf.bullet("Single Responsibility", "Controllers only serialize HTTP; Services execute domain logic; Repositories isolate Prisma queries.")
    pdf.bullet("Open / Closed", "IAiProvider interface allows switching between Adaption AI, Gemini, and Mock without altering services.")
    pdf.bullet("Liskov Substitution", "InMemoryMockRepositories cleanly substitute Prisma repositories in unit tests with zero code changes.")
    pdf.bullet("Interface Segregation", "Fine-grained contracts (IMedicationReader, ISafetyShieldPolicy, IAiProvider) prevent bloated interfaces.")
    pdf.bullet("Dependency Inversion", "Controllers depend on Service abstractions; Services depend on Repository abstractions via DI.")
    pdf.ln(1.5)

    # 6. High-Level Design (HLD)
    pdf.chapter_title("6", "High-Level Design (HLD) Architecture")
    pdf.body_text(
        "AayuCare is structured across 4 decoupled enterprise tiers: "
        "(1) Presentation Tier: React 19 SPA running in Dual Mode (Ambient Elder Display & Caregiver Cockpit). "
        "(2) Edge & Gateway Tier: Vercel CDN, Helmet security headers, CORS origin whitelist, and Rate Limiter. "
        "(3) Application Tier: Stateless Express TypeScript server hosting modular domain services and the Escalation Worker. "
        "(4) Intelligence & Persistence Tier: Adaption AI API, Resend/SendGrid transactional gateway, and PostgreSQL via Prisma ORM."
    )
    pdf.section_title("6.1 Core End-to-End Sequence Flows")
    pdf.bullet("Prescription Scan Flow", "Caregiver uploads image -> Adaption AI extracts meds & diet cautions -> Caregiver binds pill photo -> DB save.")
    pdf.bullet("Ambient Alarm Flow", "09:00 AM arrives -> Screen wakes up with pill photo -> Audio TTS speaks -> Voice 'Kha li' -> 6-hr Lockout shield.")
    pdf.bullet("Missed Dose Escalation", "T+45 min reached without TAKEN log -> Escalation engine queries DB -> Dispatches emergency email to Caregiver.")
    pdf.ln(1.5)

    # 7. Execution Roadmap
    pdf.chapter_title("7", "Execution Roadmap (11:15 AM - 4:00 PM)")
    col_time = [35, 45, 110]
    pdf.table_header(col_time, ["Time Window", "Phase", "Key Deliverables"])
    pdf.table_row(col_time, ["11:15 AM - 12:00 PM", "Phase 1: DB & Entities", "Update schema.prisma with 7 models, run migrations, seed sample data"])
    pdf.table_row(col_time, ["12:00 PM - 01:30 PM", "Phase 2: Core APIs", "Medication CRUD, Passcode pairing, Adaption AI service, Alert engine"])
    pdf.table_row(col_time, ["01:30 PM - 03:00 PM", "Phase 3: Dual Frontend", "Ambient Pill Photo display, Web Speech voice listener, Caretaker dashboard"])
    pdf.table_row(col_time, ["03:00 PM - 03:45 PM", "Phase 4: Cloud Deploy", "Deploy live to Vercel + Neon DB, verify public URL to prevent DQ"])
    pdf.table_row(col_time, ["03:45 PM - 04:30 PM", "Phase 5: Final Polish", "README update, video/demo run, LinkedIn post draft, form submission"])

    output_file = "AayuCare_Master_Architecture_and_Planning.pdf"
    pdf.output(output_file)
    print(f"Master Architecture PDF generated successfully: {output_file}")

if __name__ == "__main__":
    build_pdf()
