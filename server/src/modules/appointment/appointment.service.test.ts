import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { AppointmentService } from './appointment.service';
import { InMemoryAppointmentRepository } from './appointment.repository';
import { AppointmentStatus } from '@prisma/client';

describe('AppointmentService & 30-Day Clinical Briefcase Unit Tests', () => {
  let repo: InMemoryAppointmentRepository;
  let service: AppointmentService;
  const elderProfileId = 'elder-ramesh-1';

  beforeEach(() => {
    repo = new InMemoryAppointmentRepository();
    service = new AppointmentService(repo);
  });

  it('should successfully schedule a new doctor appointment with checklist notes', async () => {
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    const appointment = await service.createAppointment({
      elderProfileId,
      doctorName: 'Dr. Arvind Sharma',
      specialty: 'Cardiologist',
      clinicAddress: 'Max Super Specialty Hospital, Saket',
      appointmentDate: futureDate,
      prepNotes: 'Fasting blood sugar & lipid profile test required. Bring previous ECG report.'
    });

    assert.ok(appointment.id);
    assert.equal(appointment.doctorName, 'Dr. Arvind Sharma');
    assert.equal(appointment.specialty, 'Cardiologist');
    assert.equal(appointment.clinicAddress, 'Max Super Specialty Hospital, Saket');
    assert.equal(appointment.status, AppointmentStatus.UPCOMING);
    assert.equal(
      appointment.prepNotes,
      'Fasting blood sugar & lipid profile test required. Bring previous ECG report.'
    );
  });

  it('should reject scheduling with invalid date string', async () => {
    await assert.rejects(
      async () => {
        await service.createAppointment({
          elderProfileId,
          doctorName: 'Dr. Mehta',
          specialty: 'General Physician',
          clinicAddress: 'Apollo Clinic',
          appointmentDate: 'not-a-valid-date'
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.ok(err.message.includes('Invalid appointment date format'));
        return true;
      }
    );
  });

  it('should retrieve upcoming appointments sorted by date', async () => {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const tomorrow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();

    await service.createAppointment({
      elderProfileId,
      doctorName: 'Dr. NextWeek',
      specialty: 'Orthopedic',
      clinicAddress: 'Fortis Hospital',
      appointmentDate: nextWeek
    });

    await service.createAppointment({
      elderProfileId,
      doctorName: 'Dr. Tomorrow',
      specialty: 'Cardiologist',
      clinicAddress: 'Max Hospital',
      appointmentDate: tomorrow
    });

    const upcoming = await service.getUpcomingAppointments(elderProfileId);
    assert.equal(upcoming.length, 2);
    // Earliest appointment should be first
    assert.equal(upcoming[0].doctorName, 'Dr. Tomorrow');
    assert.equal(upcoming[1].doctorName, 'Dr. NextWeek');
  });

  it('should update appointment status to COMPLETED after consultation', async () => {
    const appointment = await service.createAppointment({
      elderProfileId,
      doctorName: 'Dr. Neha Gupta',
      specialty: 'Diabetologist',
      clinicAddress: 'Medanta Clinic',
      appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    });

    const updated = await service.updateAppointment(appointment.id, {
      status: 'COMPLETED',
      prepNotes: 'Consultation completed. BP normal (120/80). Reduced Telmisartan to 20mg.'
    });

    assert.equal(updated.status, 'COMPLETED');
    assert.ok(updated.prepNotes?.includes('Reduced Telmisartan to 20mg'));
  });

  it('should generate a comprehensive 30-Day Clinical Briefcase for doctor visits', async () => {
    // Schedule one upcoming appointment for context
    await service.createAppointment({
      elderProfileId,
      doctorName: 'Dr. Arvind Sharma',
      specialty: 'Cardiologist',
      clinicAddress: 'Max Super Specialty Hospital',
      appointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    });

    const briefcase = await service.getClinicalBriefcase(elderProfileId, 30);

    // 1. Elder Profile & Demographics
    assert.equal(briefcase.elder.fullName, 'Ramesh Sharma');
    assert.equal(briefcase.elder.age, 74);
    assert.equal(briefcase.elder.bloodGroup, 'B+');

    // 2. 30-Day Adherence Metrics
    assert.equal(briefcase.metrics.analysisPeriodDays, 30);
    assert.equal(briefcase.metrics.totalScheduledDoses, 60);
    assert.equal(briefcase.metrics.totalTakenDoses, 56);
    assert.equal(briefcase.metrics.adherenceRate, 93);
    assert.equal(briefcase.metrics.adherenceRating, 'EXCELLENT');

    // 3. Active Regimens
    assert.equal(briefcase.activeRegimen.length, 2);
    assert.equal(briefcase.activeRegimen[0].name, 'Telmisartan 40mg');
    assert.equal(briefcase.activeRegimen[1].name, 'Metformin 500mg');

    // 4. Missed Doses Audit Log
    assert.equal(briefcase.missedDosesLog.length, 1);
    assert.equal(briefcase.missedDosesLog[0].medicationName, 'Metformin 500mg');

    // 5. Doctor's Executive Summary
    assert.ok(briefcase.executiveSummary.includes('Ramesh Sharma'));
    assert.ok(briefcase.executiveSummary.includes('93%'));
    assert.ok(briefcase.executiveSummary.includes('EXCELLENT'));
    assert.ok(briefcase.generatedAt);
  });

  it('should throw 404 when generating clinical briefcase for non-existent elder', async () => {
    repo.mockElder = null as any;

    await assert.rejects(
      async () => {
        await service.getClinicalBriefcase('ghost-elder-id');
      },
      (err: any) => {
        assert.equal(err.statusCode, 404);
        assert.ok(err.message.includes('Elder profile not found for clinical briefcase'));
        return true;
      }
    );
  });

  it('should delete an appointment successfully', async () => {
    const appointment = await service.createAppointment({
      elderProfileId,
      doctorName: 'Dr. Cancelled',
      specialty: 'Dermatologist',
      clinicAddress: 'Skin Care Clinic',
      appointmentDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
    });

    await service.deleteAppointment(appointment.id);
    const found = await repo.findById(appointment.id);
    assert.equal(found, null);
  });
});
