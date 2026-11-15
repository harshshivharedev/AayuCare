/// <reference types="node" />
import { PrismaClient, Role, MealRelation, Criticality, MedicationLogStatus, ConfirmationMethod, AppointmentStatus, AlertType, AlertStatus, AccessRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seed() {
  console.log('🌱 Starting AayuCare Database Seeding...');

  // 1. Create Default Users (Elder & Caregiver)
  const salt = await bcrypt.genSalt(10);
  const elderPassword = await bcrypt.hash('AayuCare2026!', salt);
  const caregiverPassword = await bcrypt.hash('Caregiver2026!', salt);

  const elderUser = await prisma.user.upsert({
    where: { email: 'ramesh.sharma@aayucare.in' },
    update: {},
    create: {
      email: 'ramesh.sharma@aayucare.in',
      name: 'Ramesh Sharma',
      password: elderPassword,
      role: Role.ELDERLY,
    },
  });

  const caregiverUser = await prisma.user.upsert({
    where: { email: 'priya.sharma@aayucare.in' },
    update: {},
    create: {
      email: 'priya.sharma@aayucare.in',
      name: 'Priya Sharma (Daughter)',
      password: caregiverPassword,
      role: Role.CAREGIVER,
    },
  });

  console.log(`✅ Seeded Users: ${elderUser.name} (${elderUser.role}), ${caregiverUser.name} (${caregiverUser.role})`);

  // 2. Create Elder Profile with 6-char CarePasscode "CARE-8421"
  const elderProfile = await prisma.elderProfile.upsert({
    where: { userId: elderUser.id },
    update: {
      carePasscode: 'CARE-8421',
      fullName: 'Ramesh Sharma',
      age: 74,
      bloodGroup: 'B+',
      emergencyContact: '+91 98765 43210',
      notes: 'Hypertension (BP) and Type-2 Diabetes management. Mild morning disorientation.',
    },
    create: {
      userId: elderUser.id,
      fullName: 'Ramesh Sharma',
      age: 74,
      bloodGroup: 'B+',
      emergencyContact: '+91 98765 43210',
      carePasscode: 'CARE-8421',
      notes: 'Hypertension (BP) and Type-2 Diabetes management. Mild morning disorientation.',
    },
  });

  console.log(`✅ Seeded ElderProfile: ${elderProfile.fullName} with Passcode [${elderProfile.carePasscode}]`);

  // 3. Link Caregiver in CareCircle
  await prisma.careCircleAccess.upsert({
    where: {
      elderProfileId_userId: {
        elderProfileId: elderProfile.id,
        userId: caregiverUser.id,
      },
    },
    update: {},
    create: {
      elderProfileId: elderProfile.id,
      userId: caregiverUser.id,
      accessRole: AccessRole.PRIMARY_ADMIN,
    },
  });

  console.log(`✅ Linked CareCircle: Priya Sharma -> Ramesh Sharma`);

  // 4. Create Core Medications
  const medBp = await prisma.medication.create({
    data: {
      elderProfileId: elderProfile.id,
      name: 'Telmisartan 40mg',
      dosage: '1 Round White Tablet',
      frequency: 'DAILY',
      scheduleTimes: ['09:00'],
      mealRelation: MealRelation.AFTER_MEAL,
      criticality: Criticality.HIGH_RISK,
      pillImageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=60',
      dietaryGuidelines: [
        'Take within 30 minutes after breakfast',
        'Avoid excessive potassium-rich supplements',
        'Drink a full glass of lukewarm water',
      ],
      instructions: 'Subah nashte ke baad lein. BP niyantran ke liye anivarya hai.',
      isActive: true,
    },
  });

  const medDiabetes = await prisma.medication.create({
    data: {
      elderProfileId: elderProfile.id,
      name: 'Metformin 500mg SR',
      dosage: '1 Oval Blue Tablet',
      frequency: 'DAILY',
      scheduleTimes: ['20:30'],
      mealRelation: MealRelation.AFTER_MEAL,
      criticality: Criticality.HIGH_RISK,
      pillImageUrl: 'https://images.unsplash.com/photo-1550572017-ed200f5e5a43?w=400&auto=format&fit=crop&q=60',
      dietaryGuidelines: [
        'Strictly take during or immediately after dinner',
        'Do not skip meals before taking this medicine',
        'Avoid sugary snacks late at night',
      ],
      instructions: 'Raat ke khane ke turant baad lein. Sugar niyantrit rakhta hai.',
      isActive: true,
    },
  });

  const medMultivitamin = await prisma.medication.create({
    data: {
      elderProfileId: elderProfile.id,
      name: 'Neurobion Forte / Zinc',
      dosage: '1 Red Strip Capsule',
      frequency: 'DAILY',
      scheduleTimes: ['13:30'],
      mealRelation: MealRelation.AFTER_MEAL,
      criticality: Criticality.ROUTINE,
      pillImageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&auto=format&fit=crop&q=60',
      dietaryGuidelines: [
        'Take after lunch',
        'Supports nerve health and energy',
      ],
      instructions: 'Dopahar ke khane ke baad lein.',
      isActive: true,
    },
  });

  console.log(`✅ Seeded Medications: Telmisartan, Metformin, Neurobion`);

  // 5. Seed Adherence Logs for Today and Past 3 Days
  const now = new Date();
  const todayMorning = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);

  // Today's morning dose - TAKEN via Voice
  await prisma.medicationLog.create({
    data: {
      medicationId: medBp.id,
      scheduledFor: todayMorning,
      takenAt: new Date(todayMorning.getTime() + 12 * 60000), // taken 12 mins late
      status: MedicationLogStatus.TAKEN,
      confirmationMethod: ConfirmationMethod.VOICE,
      notes: 'Bilingual voice confirmed: "Haan Babuji ne kha li"',
    },
  });

  // Today's afternoon dose - SCHEDULED
  const todayLunch = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 30, 0);
  await prisma.medicationLog.create({
    data: {
      medicationId: medMultivitamin.id,
      scheduledFor: todayLunch,
      status: MedicationLogStatus.SCHEDULED,
      notes: 'Pending afternoon dose',
    },
  });

  // Today's evening dose - SCHEDULED
  const todayDinner = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 30, 0);
  await prisma.medicationLog.create({
    data: {
      medicationId: medDiabetes.id,
      scheduledFor: todayDinner,
      status: MedicationLogStatus.SCHEDULED,
      notes: 'Scheduled for tonight after dinner',
    },
  });

  // Yesterday morning dose - TAKEN via Button Tap
  const yesterdayMorning = new Date(todayMorning.getTime() - 24 * 3600 * 1000);
  await prisma.medicationLog.create({
    data: {
      medicationId: medBp.id,
      scheduledFor: yesterdayMorning,
      takenAt: yesterdayMorning,
      status: MedicationLogStatus.TAKEN,
      confirmationMethod: ConfirmationMethod.BUTTON_TAP,
      notes: 'Confirmed via 80px Giant Tap Button',
    },
  });

  console.log(`✅ Seeded MedicationLogs with Voice & Giant Tap confirmations`);

  // 6. Seed Doctor Appointment
  const upcomingAppointmentDate = new Date(now.getTime() + 3 * 24 * 3600 * 1000); // 3 days ahead
  upcomingAppointmentDate.setHours(10, 30, 0, 0);

  await prisma.appointment.create({
    data: {
      elderProfileId: elderProfile.id,
      doctorName: 'Dr. Anjali Mehta',
      specialty: 'Cardiologist & Geriatric Specialist',
      clinicAddress: 'Apollo Clinic, Sector 14, Gurugram (Room 204)',
      appointmentDate: upcomingAppointmentDate,
      status: AppointmentStatus.UPCOMING,
      prepNotes: 'Bring fasting BP log book & last HbA1c test reports. Doctor requested to check potassium levels.',
    },
  });

  console.log(`✅ Seeded Doctor Appointment with Dr. Anjali Mehta`);

  // 7. Seed Alert Notification
  await prisma.alertNotification.create({
    data: {
      elderProfileId: elderProfile.id,
      recipientEmail: caregiverUser.email,
      alertType: AlertType.APPOINTMENT,
      title: 'Upcoming Cardiologist Appointment in 3 Days',
      message: 'Dr. Anjali Mehta at Apollo Clinic on ' + upcomingAppointmentDate.toLocaleDateString() + ' at 10:30 AM.',
      status: AlertStatus.SENT,
      sentAt: new Date(),
    },
  });

  console.log(`✅ Seeded Proactive Alert Notifications`);
  console.log('🎉 AayuCare Database Seeding Complete!');
}

seed()
  .catch((e: unknown) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
