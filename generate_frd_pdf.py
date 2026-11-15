import os
from fpdf import FPDF

class FRDPDF(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 8)
        self.set_text_color(100, 116, 139)
        self.cell(0, 5, 'AayuCare - Functional Requirements Specification | PromptWars x Catalyst 2026', 0, 1, 'R')
        self.ln(2)

    def footer(self):
        self.set_y(-12)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 8, f'Page {self.page_no()}', 0, 0, 'C')

    def chapter_title(self, title):
        self.set_font('Helvetica', 'B', 13)
        self.set_text_color(15, 23, 42)
        self.set_fill_color(239, 246, 255)
        self.cell(0, 8, f"  {title}", 0, 1, 'L', fill=True)
        self.ln(2)

    def section_title(self, title):
        self.set_font('Helvetica', 'B', 10.5)
        self.set_text_color(29, 78, 216)
        self.cell(0, 6, title, 0, 1, 'L')
        self.ln(1)

    def body_text(self, text):
        self.set_font('Helvetica', '', 9.5)
        self.set_text_color(51, 65, 85)
        self.multi_cell(0, 4.8, text)
        self.ln(2)

    def bullet_point(self, title, text):
        self.set_font('Helvetica', 'B', 9.5)
        self.set_text_color(30, 41, 59)
        self.cell(5, 4.8, chr(149), 0, 0)
        self.cell(38, 4.8, f"{title}: ", 0, 0)
        self.set_font('Helvetica', '', 9.5)
        self.set_text_color(51, 65, 85)
        self.multi_cell(0, 4.8, text)
        self.ln(1)

def build_pdf():
    pdf = FRDPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # Document Header Box
    pdf.set_font('Helvetica', 'B', 18)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 9, "AayuCare (Ayur-Care) Healthcare Platform", 0, 1, 'L')
    
    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_text_color(37, 99, 235)
    pdf.cell(0, 6, "Functional Requirements Specification (FRS) - Project Source of Truth", 0, 1, 'L')
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(0, 5, "Hackathon: Catalyst x PromptWars 2026 | Powered by Google for Developers | AI Engine: Adaption AI", 0, 1, 'L')
    pdf.ln(4)

    # 1. Executive Problem Statement
    pdf.chapter_title("1. Executive Mission & Problem Statement (Slide 13 Compliance)")
    pdf.body_text(
        "Develop a smart, interconnected healthcare management platform designed to help elderly individuals manage their daily medications, "
        "medical appointments, and healthcare routines while keeping family members and caretakers informed through secure, passcode-based access "
        "and proactive email reminders, ensuring elderly individuals remain at the centre of their own healthcare decisions."
    )
    pdf.body_text(
        "AayuCare eliminates complex technical friction for the elderly by introducing an ambient, zero-cognitive-burden bedside companion. "
        "It features visual pill-photo matching, bilingual voice confirmation, anti-overdose locks, and clinical dietary guideline ingestion."
    )

    # 2. Actors
    pdf.chapter_title("2. System Personas & Role Matrix")
    pdf.bullet_point("Elderly Patient", "The primary consumer. Minimal UI, high-contrast digital pillbox display, hands-free voice confirmations ('Kha li').")
    pdf.bullet_point("Primary Caregiver", "Full administration access. Uses 6-digit CarePasscode to pair, uploads doctor prescriptions, attaches pill photos, manages appointments.")
    pdf.bullet_point("Family Observer", "Remote family members. Read-only adherence analytics, weekly compliance score, and emergency escalation alerts.")
    pdf.bullet_point("Doctor / Clinician", "Recipient of single-click 30-day clinical adherence passports during consultations.")
    pdf.ln(2)

    # 3. Functional Modules
    pdf.chapter_title("3. Detailed Functional Modules Specification")
    
    # FR-1
    pdf.section_title("FR-1: Shared Ecosystem & CarePasscode Access")
    pdf.bullet_point("FR-1.1", "Elder Profile setup: Name, age, blood group, emergency contact, and medical baseline notes.")
    pdf.bullet_point("FR-1.2", "CarePasscode Generation: Cryptographic 6-character access key (e.g., CARE-8492) bound to the elder.")
    pdf.bullet_point("FR-1.3", "Zero-Friction Pairing: Caregivers input the passcode on their devices for instant pairing without OTP friction.")
    pdf.bullet_point("FR-1.4", "Role Permissions: Distinguishes between PRIMARY_CAREGIVER (full write) and FAMILY_OBSERVER (audit only).")
    pdf.ln(2)

    # FR-2
    pdf.section_title("FR-2: Smart Prescription & Dietary Guideline Ingestion")
    pdf.bullet_point("FR-2.1", "Adaption AI Prescription Vision OCR: Parses doctor prescriptions to extract med names, dosage, frequency, and duration.")
    pdf.bullet_point("FR-2.2", "Dietary Restrictions Extractor: Ingests doctor-prescribed meal rules (e.g., 'Take after breakfast', 'Avoid dairy/salt').")
    pdf.bullet_point("FR-2.3", "Physical Tablet Photo Binding: Caretaker uploads actual image of the tablet/strip for instant visual recognition.")
    pdf.bullet_point("FR-2.4", "Criticality Classification: High-Risk (BP, Heart, Insulin, Blood Thinner) vs Routine (Vitamins, Antacids).")
    pdf.ln(2)

    # FR-3
    pdf.section_title("FR-3: Ambient Visual & Voice Reminder Companion")
    pdf.bullet_point("FR-3.1", "Time-Triggered Screen Takeover: At scheduled time, screen awakes displaying full-size photo of the exact pill.")
    pdf.bullet_point("FR-3.2", "Voice Synthesis (TTS): Bilingual spoken announcement: 'Babuji, aapki subah ki BP wali goli ka time ho gaya hai.'")
    pdf.bullet_point("FR-3.3", "Dual-Confirmation Action: Spoken confirmation ('Kha li') via Web Speech API OR giant 80px green button ('MAINE LE LI').")
    pdf.ln(2)

    # FR-4
    pdf.section_title("FR-4: Adherence Tracking & Anti-Overdose Lockout Shield")
    pdf.bullet_point("FR-4.1", "State Tracking: Real-time transition: SCHEDULED -> TAKEN | MISSED | SKIPPED with timestamp and confirmation method.")
    pdf.bullet_point("FR-4.2", "Anti-Overdose Lockout: Once taken, slot displays a prominent 6-hour Green Shield to prevent dementia repeat dosing.")
    pdf.bullet_point("FR-4.3", "Clinical Catch-Up Window: If >3 hours late, system instructs patient not to double-dose and await next regular cycle.")
    pdf.ln(2)

    # FR-5
    pdf.section_title("FR-5: Proactive Family Escalation & Email Alert Engine")
    pdf.bullet_point("FR-5.1", "Escalation Ladder: T+0 min audio chime; T+30 min second nudge; T+45 min automated emergency email to Caretaker.")
    pdf.bullet_point("FR-5.2", "Appointment Dispatcher: Automatic reminders dispatched 24 hours and 2 hours before scheduled doctor visits.")
    pdf.ln(2)

    # FR-6 & 7
    pdf.section_title("FR-6 & FR-7: Appointments & Caretaker Cockpit")
    pdf.bullet_point("FR-6.1", "Appointment Manager: Doctor name, specialty, clinic address, appointment time, and prep checklist.")
    pdf.bullet_point("FR-6.2", "Clinical Briefcase: 1-Click generation of 30-day compliance report for doctors during clinic visits.")
    pdf.bullet_point("FR-7.1", "Caretaker Cockpit: Live adherence percentage metrics, real-time activity stream, and instant SOS beacon.")
    pdf.ln(4)

    # 4. Architecture
    pdf.chapter_title("4. Production Architecture & AI Strategy")
    pdf.body_text(
        "AayuCare uses a strict 3-Tier Layered Architecture: Controllers handle HTTP transport; Services handle domain business logic; "
        "Repositories isolate PostgreSQL Prisma queries. AI functionality is decoupled through an IAiProvider interface, enabling "
        "seamless execution via Adaption AI credits with automatic fallback support."
    )

    pdf.output("AayuCare_Functional_Requirements.pdf")
    print("PDF generated successfully: AayuCare_Functional_Requirements.pdf")

if __name__ == "__main__":
    build_pdf()
