import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import bcrypt from 'bcryptjs';
import { prisma } from './config/db';

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
    console.log('⚠️ Skipping database seed in production (ALLOW_PROD_SEED not set).');
    return;
  }

  console.log('🌱 Starting AayuCare Database Seeding...');

  // 1. Create or Find Dada Ji (Elderly User)
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const elderUser = await prisma.user.upsert({
    where: { email: 'dadaji.demo@aayucare.in' },
    update: { password: passwordHash },
    create: {
      email: 'dadaji.demo@aayucare.in',
      password: passwordHash,
      name: 'Ram Chandra Sharma',
      role: 'ELDERLY'
    }
  });

  // 2. Create or Find Elder Profile with CARE-8421 CarePasscode
  let elderProfile = await prisma.elderProfile.findUnique({
    where: { userId: elderUser.id }
  });

  if (!elderProfile) {
    elderProfile = await prisma.elderProfile.create({
      data: {
        userId: elderUser.id,
        fullName: 'Ram Chandra Sharma',
        age: 74,
        bloodGroup: 'B+',
        emergencyContact: '+919876543210',
        carePasscode: 'CARE-8421',
        notes: 'Hypertension & Type-2 Diabetes management. Mild morning forgetfulness.'
      }
    });
  }

  // 3. Create or Find Caretaker / Son User
  const caregiverUser = await prisma.user.upsert({
    where: { email: 'rohit.caregiver@aayucare.in' },
    update: { password: passwordHash },
    create: {
      email: 'rohit.caregiver@aayucare.in',
      password: passwordHash,
      name: 'Rohit Sharma (Son)',
      role: 'CAREGIVER'
    }
  });

  // 4. Link Caregiver in Care Circle
  const existingCircle = await prisma.careCircleAccess.findFirst({
    where: {
      elderProfileId: elderProfile.id,
      userId: caregiverUser.id
    }
  });

  if (!existingCircle) {
    await prisma.careCircleAccess.create({
      data: {
        elderProfileId: elderProfile.id,
        userId: caregiverUser.id,
        accessRole: 'PRIMARY_ADMIN'
      }
    });
  }

  // 5. Seed Real-world Indian Medications with Strip Photos and Loving Voice Notes
  const existingMeds = await prisma.medication.findMany({
    where: { elderProfileId: elderProfile.id }
  });

  if (existingMeds.length === 0) {
    // A. Telmisartan 40mg (BP - Morning)
    await prisma.medication.create({
      data: {
        elderProfileId: elderProfile.id,
        name: 'Telmisartan 40mg (Micardis)',
        dosage: '1 Tablet',
        frequency: 'DAILY',
        scheduleTimes: ['08:30'],
        mealRelation: 'AFTER_MEAL',
        criticality: 'HIGH_RISK',
        pillImageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        voiceNoteUrl: null,
        voiceNoteText: 'दादा जी, नाश्ते के 15 मिनट बाद एक गोली गुनगुने पानी के साथ ले लीजिए। यह बीपी सामान्य रखेगी।',
        dietaryGuidelines: ['खट्टे फल और मौसमी का जूस साथ में न लें', 'Avoid grapefruit'],
        instructions: 'Take with warm water after breakfast',
        isActive: true
      }
    });

    // B. Metformin 500mg (Diabetes - Afternoon & Night)
    await prisma.medication.create({
      data: {
        elderProfileId: elderProfile.id,
        name: 'Metformin 500mg (Glycomet-SR)',
        dosage: '1 Tablet',
        frequency: 'DAILY',
        scheduleTimes: ['13:30', '20:30'],
        mealRelation: 'WITH_MEAL',
        criticality: 'ROUTINE',
        pillImageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80',
        voiceNoteUrl: null,
        voiceNoteText: 'दोपहर और रात के खाने के बीच में यह गोली लें। खाली पेट बिल्कुल न लें।',
        dietaryGuidelines: ['खाने के साथ ही लें, पेट खराब नहीं होगा'],
        instructions: 'Take strictly with main meals',
        isActive: true
      }
    });

    // C. Atorvastatin 10mg (Cholesterol - Night)
    await prisma.medication.create({
      data: {
        elderProfileId: elderProfile.id,
        name: 'Atorvastatin 10mg (Atorva)',
        dosage: '1 Tablet',
        frequency: 'DAILY',
        scheduleTimes: ['21:30'],
        mealRelation: 'AFTER_MEAL',
        criticality: 'ROUTINE',
        pillImageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&q=80',
        voiceNoteUrl: null,
        voiceNoteText: 'सोने से पहले पानी के साथ एक गोली लें। शुभ रात्रि दादा जी!',
        dietaryGuidelines: ['हल्के गुनगुने पानी के साथ लें'],
        instructions: 'Take before sleeping',
        isActive: true
      }
    });
  }

  // 6. Seed Doctor Appointment
  const existingAppt = await prisma.appointment.findFirst({
    where: { elderProfileId: elderProfile.id }
  });

  if (!existingAppt) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    futureDate.setHours(11, 0, 0, 0);

    await prisma.appointment.create({
      data: {
        elderProfileId: elderProfile.id,
        doctorName: 'Dr. Arvind Sharma, MD',
        specialty: 'Senior Cardiologist',
        clinicAddress: 'Max Super Speciality Hospital, Saket, New Delhi',
        appointmentDate: futureDate,
        prepNotes: '10 hours overnight fasting required for Lipid Profile & HbA1c test.',
        status: 'UPCOMING'
      }
    });
  }

  console.log('✅ AayuCare Database Seeding Completed Successfully!');
  console.log('   - Elder Login: dadaji.demo@aayucare.in / Password@123');
  console.log('   - Caregiver Login: rohit.caregiver@aayucare.in / Password@123');
  console.log(`   - CarePasscode: ${elderProfile.carePasscode}`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
