import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MedicationService } from './medication.service';
import { InMemoryMedicationRepository } from './medication.repository';
import { MealRelation, Criticality } from '@prisma/client';

describe('MedicationService & Visual Pillbox Unit Tests', () => {
  let repo: InMemoryMedicationRepository;
  let service: MedicationService;
  const elderProfileId = 'elder-ramesh-uuid-123';

  beforeEach(() => {
    repo = new InMemoryMedicationRepository();
    service = new MedicationService(repo);
  });

  it('should successfully schedule a medication with caretaker tablet photo and recorded voice guidance', async () => {
    const med = await service.createMedication({
      elderProfileId,
      name: 'Telmisartan 40mg',
      dosage: '1 Tablet',
      frequency: 'DAILY',
      scheduleTimes: ['08:00', '20:00'],
      mealRelation: 'AFTER_MEAL',
      criticality: 'HIGH_RISK',
      pillImageUrl: 'https://storage.aayucare.in/pills/telmisartan_strip.jpg',
      voiceNoteUrl: 'https://storage.aayucare.in/audio/caretaker_priya_telmisartan.mp3',
      voiceNoteText:
        'Dada ji, ye aapki BP ki goli hai. Khana khane ke baad 1 goli lijiye aur thodi der aaram kijiye.',
      dietaryGuidelines: ['Kam namak lijiye', 'Pani khoob piyein'],
      instructions: 'Take with warm water after breakfast and dinner'
    });

    assert.ok(med.id);
    assert.equal(med.name, 'Telmisartan 40mg');
    assert.equal(med.pillImageUrl, 'https://storage.aayucare.in/pills/telmisartan_strip.jpg');
    assert.equal(med.voiceNoteUrl, 'https://storage.aayucare.in/audio/caretaker_priya_telmisartan.mp3');
    assert.equal(
      med.voiceNoteText,
      'Dada ji, ye aapki BP ki goli hai. Khana khane ke baad 1 goli lijiye aur thodi der aaram kijiye.'
    );
    assert.equal(med.criticality, Criticality.HIGH_RISK);
    assert.equal(med.mealRelation, MealRelation.AFTER_MEAL);
  });

  it('should generate Today Visual Pillbox with bucketed time slots and visual references', async () => {
    // Schedule 2 medications: Morning & Afternoon
    await service.createMedication({
      elderProfileId,
      name: 'Thyronorm 50mcg',
      dosage: '1 Tablet',
      scheduleTimes: ['07:00'],
      mealRelation: 'BEFORE_MEAL',
      pillImageUrl: 'https://storage.aayucare.in/pills/thyronorm.jpg',
      voiceNoteText: 'Dada ji, ye khali pet leni hai chai se pehle',
      dietaryGuidelines: []
    });

    await service.createMedication({
      elderProfileId,
      name: 'Metformin 500mg',
      dosage: '1 Tablet',
      scheduleTimes: ['14:00'],
      mealRelation: 'AFTER_MEAL',
      pillImageUrl: 'https://storage.aayucare.in/pills/metformin.jpg',
      voiceNoteText: 'Dada ji, ye lunch ke baad ki sugar wali goli hai',
      dietaryGuidelines: []
    });

    const pillbox = await service.getTodayPillbox(elderProfileId);

    assert.equal(pillbox.elderProfileId, elderProfileId);
    assert.equal(pillbox.summary.totalDoses, 2);
    assert.equal(pillbox.summary.pendingDoses, 2);
    assert.equal(pillbox.summary.takenDoses, 0);

    // Morning slot should contain Thyronorm
    assert.equal(pillbox.slots.morning.length, 1);
    assert.equal(pillbox.slots.morning[0].name, 'Thyronorm 50mcg');
    assert.equal(pillbox.slots.morning[0].pillImageUrl, 'https://storage.aayucare.in/pills/thyronorm.jpg');

    // Afternoon slot should contain Metformin
    assert.equal(pillbox.slots.afternoon.length, 1);
    assert.equal(pillbox.slots.afternoon[0].name, 'Metformin 500mg');
    assert.equal(pillbox.slots.afternoon[0].voiceNoteText, 'Dada ji, ye lunch ke baad ki sugar wali goli hai');
  });

  it('should confirm dose when elder clicks "Maine Kha Li" and return caretaker voice note + sound alert', async () => {
    const med = await service.createMedication({
      elderProfileId,
      name: 'Amlodipine 5mg',
      dosage: '1 Tablet',
      scheduleTimes: ['09:00'],
      pillImageUrl: 'https://storage.aayucare.in/pills/amlodipine.jpg',
      voiceNoteUrl: 'https://storage.aayucare.in/audio/caretaker_amlodipine.mp3',
      voiceNoteText: 'Dada ji, goli le li na? Ab shanti se 15 minute baithein.',
      dietaryGuidelines: []
    });

    const result = await service.confirmDose({
      medicationId: med.id,
      method: 'BUTTON_TAP',
      notes: 'Maine Kha Li'
    });

    assert.ok(result.log);
    assert.equal(result.log.status, 'TAKEN');
    assert.equal(result.soundAlert, 'success_chime');
    assert.equal(result.voiceNoteUrl, 'https://storage.aayucare.in/audio/caretaker_amlodipine.mp3');
    assert.equal(result.voiceNoteText, 'Dada ji, goli le li na? Ab shanti se 15 minute baithein.');

    // Now verify today's pillbox shows 1 taken dose
    const pillbox = await service.getTodayPillbox(elderProfileId);
    assert.equal(pillbox.summary.takenDoses, 1);
    assert.equal(pillbox.summary.pendingDoses, 0);
  });

  it('should enforce 6-Hour Anti-Overdose Lockout Shield when duplicate dose is attempted', async () => {
    const med = await service.createMedication({
      elderProfileId,
      name: 'Atorvastatin 20mg',
      dosage: '1 Tablet',
      scheduleTimes: ['21:00'],
      dietaryGuidelines: []
    });

    // 1st dose taken at 9:00 PM
    await service.confirmDose({
      medicationId: med.id,
      method: 'BUTTON_TAP'
    });

    // 2nd dose attempted 20 minutes later by mistake
    await assert.rejects(
      async () => {
        await service.confirmDose({
          medicationId: med.id,
          method: 'BUTTON_TAP'
        });
      },
      (err: any) => {
        assert.equal(err.statusCode, 400);
        assert.ok(err.message.includes('Anti-Overdose Shield Active'));
        assert.ok(err.message.includes('Atorvastatin 20mg was already taken'));
        return true;
      }
    );
  });

  it('should calculate accurate 7-day adherence rate', async () => {
    const med = await service.createMedication({
      elderProfileId,
      name: 'Voglibose 0.2mg',
      dosage: '1 Tablet',
      scheduleTimes: ['13:00'],
      dietaryGuidelines: []
    });

    // Confirm 1 dose
    await service.confirmDose({
      medicationId: med.id
    });

    const adherence = await service.getAdherenceRate(elderProfileId, 7);
    assert.equal(adherence.totalTaken, 1);
    assert.equal(adherence.adherenceRate, 100);
  });

  it('should allow caretaker to update medication image, voice note, and dosage when prescription changes', async () => {
    const med = await service.createMedication({
      elderProfileId,
      name: 'Telmisartan 40mg',
      dosage: '1 Tablet (40mg)',
      scheduleTimes: ['09:00'],
      pillImageUrl: 'https://storage.aayucare.in/pills/old_40mg.jpg',
      voiceNoteText: 'Dada ji, ye 40mg wali goli hai',
      dietaryGuidelines: []
    });

    // Doctor reduces dose to 20mg and brand packaging changes
    const updatedMed = await service.updateMedication(med.id, {
      name: 'Telmisartan 20mg',
      dosage: '1 Tablet (20mg)',
      pillImageUrl: 'https://storage.aayucare.in/pills/new_20mg.jpg',
      voiceNoteText: 'Dada ji, doctor ne dose 20mg kar di hai. Ye nayi wali goli leni hai.'
    });

    assert.equal(updatedMed.name, 'Telmisartan 20mg');
    assert.equal(updatedMed.dosage, '1 Tablet (20mg)');
    assert.equal(updatedMed.pillImageUrl, 'https://storage.aayucare.in/pills/new_20mg.jpg');
    assert.equal(
      updatedMed.voiceNoteText,
      'Dada ji, doctor ne dose 20mg kar di hai. Ye nayi wali goli leni hai.'
    );

    // Verify Today's pillbox now presents the new image & instructions automatically
    const pillbox = await service.getTodayPillbox(elderProfileId);
    const morningSlot = pillbox.slots.morning.find((i) => i.id === med.id);
    assert.ok(morningSlot);
    assert.equal(morningSlot.name, 'Telmisartan 20mg');
    assert.equal(morningSlot.pillImageUrl, 'https://storage.aayucare.in/pills/new_20mg.jpg');
  });

  it('should remove medication from Today Pillbox when caretaker deactivates/stops it', async () => {
    const med = await service.createMedication({
      elderProfileId,
      name: 'Temporary Antibiotic 500mg',
      dosage: '1 Capsule',
      scheduleTimes: ['08:00'],
      dietaryGuidelines: []
    });

    // Verify it initially appears
    let pillbox = await service.getTodayPillbox(elderProfileId);
    assert.ok(pillbox.slots.morning.some((i) => i.id === med.id));

    // Course completed, caretaker stops medication
    await service.deleteMedication(med.id);

    // Verify it no longer appears in today's pillbox
    pillbox = await service.getTodayPillbox(elderProfileId);
    assert.equal(pillbox.slots.morning.some((i) => i.id === med.id), false);
  });
});
