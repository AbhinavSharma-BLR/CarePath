import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const seedDoctors = [
  { name: 'Dr. Ananya Sharma', phone: '9876543211', email: 'dr.ananya@carepath.in', specialty: 'Dermatology', fee: 750, rating: 4.9, exp: 12, bio: 'Senior Dermatologist specializing in clinical dermatology and skin health.', languages: ['English', 'Hindi', 'Kannada'] },
  { name: 'Dr. Rahul Mehta', phone: '9999999999', email: 'dr.rahul@carepath.in', specialty: 'Cardiology', fee: 1000, rating: 4.8, exp: 15, bio: 'Consultant Cardiologist with expertise in preventive cardiology.', languages: ['English', 'Hindi'] },
  { name: 'Dr. Priya Nair', phone: '9876543212', email: 'dr.priya@carepath.in', specialty: 'General Medicine', fee: 600, rating: 4.9, exp: 9, bio: 'Lead Physician caring for primary health and chronic disease management.', languages: ['English', 'Hindi', 'Malayalam'] },
  { name: 'Dr. Vikramaditya Rao', phone: '9876543213', email: 'dr.vikram@carepath.in', specialty: 'General Medicine', fee: 500, rating: 4.7, exp: 15, bio: 'Senior General Physician specializing in diabetes management and health screenings.', languages: ['English', 'Hindi', 'Telugu'] },
  { name: 'Dr. Sneha Kulkarni', phone: '9876543214', email: 'dr.sneha@carepath.in', specialty: 'Pediatrics', fee: 700, rating: 4.9, exp: 11, bio: 'Pediatric specialist focusing on newborn care and child growth milestones.', languages: ['English', 'Hindi', 'Marathi'] },
  { name: 'Dr. Rajesh Iyer', phone: '9876543215', email: 'dr.iyer@carepath.in', specialty: 'Orthopedics', fee: 850, rating: 4.8, exp: 14, bio: 'Orthopedic surgeon with expertise in joint replacement and sports injury rehab.', languages: ['English', 'Tamil', 'Hindi'] },
  { name: 'Dr. Meera Sengupta', phone: '9876543216', email: 'dr.meera@carepath.in', specialty: 'Gynecology', fee: 900, rating: 4.9, exp: 16, bio: 'Senior Gynecologist specializing in maternal health and reproductive wellness.', languages: ['English', 'Bengali', 'Hindi'] },
  { name: 'Dr. Arvind Deshmukh', phone: '9876543217', email: 'dr.arvind@carepath.in', specialty: 'Neurology', fee: 1200, rating: 4.9, exp: 18, bio: 'Consultant Neurologist specializing in stroke management and neuro-rehabilitation.', languages: ['English', 'Hindi', 'Marathi'] },
  { name: 'Dr. Shalini Kapoor', phone: '9876543218', email: 'dr.shalini@carepath.in', specialty: 'ENT', fee: 650, rating: 4.7, exp: 10, bio: 'ENT surgeon specializing in sinus treatment and hearing loss assessment.', languages: ['English', 'Hindi', 'Punjabi'] },
  { name: 'Dr. Siddharth Joshi', phone: '9876543219', email: 'dr.siddharth@carepath.in', specialty: 'Psychiatry', fee: 800, rating: 4.8, exp: 13, bio: 'Consultant Psychiatrist providing anxiety management and depression care.', languages: ['English', 'Hindi', 'Gujarati'] },
  { name: 'Dr. Kavita Reddy', phone: '9876543220', email: 'dr.kavita@carepath.in', specialty: 'Ophthalmology', fee: 750, rating: 4.8, exp: 12, bio: 'Ophthalmic surgeon specializing in cataract surgery and vision correction.', languages: ['English', 'Telugu', 'Hindi'] },
  { name: 'Dr. Alok Verma', phone: '9876543221', email: 'dr.alok@carepath.in', specialty: 'General Medicine', fee: 450, rating: 4.6, exp: 8, bio: 'General Physician dedicated to primary healthcare and fever management.', languages: ['English', 'Hindi'] },
  { name: 'Dr. Pooja Pillai', phone: '9876543222', email: 'dr.pooja@carepath.in', specialty: 'Dermatology', fee: 600, rating: 4.7, exp: 7, bio: 'Clinical Dermatologist specializing in laser treatments and eczema management.', languages: ['English', 'Malayalam', 'Hindi'] },
  { name: 'Dr. Farhan Qureshi', phone: '9876543223', email: 'dr.farhan@carepath.in', specialty: 'Cardiology', fee: 950, rating: 4.9, exp: 13, bio: 'Interventional Cardiologist focused on coronary artery disease and hypertension.', languages: ['English', 'Hindi', 'Urdu'] },
  { name: 'Dr. Neha Agarwal', phone: '9876543224', email: 'dr.neha@carepath.in', specialty: 'Pediatrics', fee: 650, rating: 4.8, exp: 9, bio: 'Pediatrician focused on child nutrition and vaccination schedules.', languages: ['English', 'Hindi'] },
];

async function main() {
  console.log('🌱 Seeding CarePath + CareLink database with All-India facility network...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.followup.deleteMany();
  await prisma.assistanceRequest.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.referralEvent.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.careJourney.deleteMany();
  await prisma.report.deleteMany();
  await prisma.doctorAvailability.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.facility.deleteMany();

  // 1. Create Demo Patient: Abhinav Sharma (Age 20)
  const patientUser = await prisma.user.create({
    data: {
      name: 'Abhinav Sharma',
      phone: '9876543210',
      email: 'abhinav.sharma@example.com',
      role: Role.PATIENT,
      patient: {
        create: {
          age: 20,
          gender: 'Male',
          locationLat: parseFloat(process.env.DEMO_LAT || '13.0827'),
          locationLng: parseFloat(process.env.DEMO_LNG || '80.2707'),
          locationText: process.env.DEMO_LOCATION_TEXT || 'Chennai, Tamil Nadu',
          knownConditions: ['Hypertension', 'Type 2 Diabetes'],
          medications: ['Metformin 500mg', 'Amlodipine 5mg'],
          allergies: ['Penicillin'],
          emergencyContact: '9876500000',
          abhaId: '91-8273-4920-1124',
        },
      },
    },
    include: { patient: true },
  });

  console.log(`👤 Created Demo Patient: ${patientUser.name} (ID: ${patientUser.patient?.id})`);

  // 2. Create Facilities
  const mainHospital = await prisma.facility.create({
    data: {
      name: 'CarePath Central Hospital & Virtual Clinic',
      type: 'DISTRICT_HOSPITAL',
      locationLat: 13.0817,
      locationLng: 80.2778,
      locationText: 'Park Town, Chennai, Tamil Nadu',
      specialties: ['Cardiology', 'Dermatology', 'General Medicine', 'Pediatrics', 'Orthopaedics', 'Neurology', 'ENT', 'Psychiatry', 'Ophthalmology'],
      isGovernment: false,
      isVerified: true,
      hfrId: 'IN-TN-CHN-001',
    },
  });

  console.log(`🏥 Created Main Facility: ${mainHospital.name}`);

  // 3. Create 15 Doctors with User Accounts and Availabilities
  for (let i = 0; i < seedDoctors.length; i++) {
    const d = seedDoctors[i];
    const docUser = await prisma.user.create({
      data: {
        name: d.name,
        phone: d.phone,
        email: d.email,
        role: Role.DOCTOR,
        doctor: {
          create: {
            id: `doc-${i + 1}`,
            specialty: d.specialty,
            consultationFee: d.fee,
            rating: d.rating,
            experienceYrs: d.exp,
            bio: d.bio,
            languages: d.languages,
            facilityId: mainHospital.id,
            isVerified: true,
            hprId: `IN-HPR-TN-${88400 + i}`,
            availabilities: {
              create: [
                { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', slotDurationMins: 30 },
                { dayOfWeek: 2, startTime: '10:00', endTime: '13:00', slotDurationMins: 30 },
                { dayOfWeek: 3, startTime: '14:00', endTime: '17:00', slotDurationMins: 30 },
                { dayOfWeek: 4, startTime: '09:30', endTime: '12:30', slotDurationMins: 30 },
                { dayOfWeek: 5, startTime: '15:00', endTime: '18:00', slotDurationMins: 30 },
              ],
            },
          },
        },
      },
      include: { doctor: true },
    });
    console.log(`👨‍⚕️ Created Doctor ${i + 1}/${seedDoctors.length}: ${docUser.name} (${docUser.doctor?.specialty})`);
  }

  // 4. Create CARELINK Navigator User
  const navigatorUser = await prisma.user.create({
    data: {
      name: 'Anitha Ramesh',
      phone: '9876543299',
      email: 'anitha.navigator@carelink.in',
      role: Role.CARELINK_NAVIGATOR,
    },
  });
  console.log(`🧭 Created CARELINK Navigator: ${navigatorUser.name}`);

  // 5. Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      name: 'System Admin',
      phone: '9876543298',
      email: 'admin@carepath.in',
      role: Role.ADMIN,
    },
  });
  console.log(`🛡️ Created Admin: ${adminUser.name}`);

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
