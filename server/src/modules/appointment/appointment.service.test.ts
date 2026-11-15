import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AppointmentService } from './appointment.service';
import { InMemoryAppointmentRepository } from './appointment.repository';
import { InMemoryMedicationRepository } from '../medication/medication.repository';
import { InMemoryCareCircleRepository } from '../care-circle/careCircle.repository';

describe('AppointmentService Unit Tests (SOLID & Clinical Export)', () => {
  const aptRepo = new InMemoryAppointmentRepository();
  const medRepo = new InMemoryMedicationRepository();
  const elderRepo = new InMemoryCareCircleRepository();
  const service = new AppointmentService(aptRepo, medRepo, elderRepo);

  it('should retrieve upcoming appointments for an elder', async () => {
    const list = await service.getAppointments('elder-ramesh-001');

    assert.ok(list.length >= 1);
    const doctor = list.find((a) => a.doctorName.includes('Anjali Mehta'));
    assert.ok(doctor);
    assert.equal(doctor?.status, 'UPCOMING');
  });

  it('should generate 1-Click 30-Day Clinical Briefcase for doctor visits', async () => {
    const briefcase = await service.generateClinicalBriefcase('elder-ramesh-001');

    assert.equal(briefcase.patient.fullName, 'Ramesh Sharma');
    assert.equal(briefcase.patient.age, 74);
    assert.ok(briefcase.activePrescriptions.length >= 2, 'Should include active prescriptions');
    assert.ok(briefcase.adherenceSummary.complianceScore >= 0);
    assert.ok(briefcase.upcomingAppointments.length >= 1);
  });

  it('should schedule a new doctor appointment', async () => {
    const inFiveDays = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();
    const created = await service.createAppointment({
      elderProfileId: 'elder-ramesh-001',
      doctorName: 'Dr. Rajesh Verma',
      specialty: 'Endocrinologist',
      clinicAddress: 'Max Super Specialty Hospital, Gurugram',
      appointmentDate: inFiveDays,
      prepNotes: 'Check fasting blood sugar and HbA1c',
    });

    assert.ok(created.id);
    assert.equal(created.doctorName, 'Dr. Rajesh Verma');
    assert.equal(created.status, 'UPCOMING');
  });
});
