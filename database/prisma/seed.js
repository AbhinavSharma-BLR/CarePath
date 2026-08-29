"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
            role: client_1.Role.PATIENT,
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
    // 2. Create Facilities Across Tiers (Metro, State Capitals, Districts, Rural PHCs)
    const facilitiesData = [
        // Tier 1 Metro - Chennai
        {
            name: 'Rajiv Gandhi Government General Hospital (District Hospital)',
            type: 'DISTRICT_HOSPITAL',
            locationLat: 13.0817,
            locationLng: 80.2778,
            locationText: 'Park Town, Chennai, Tamil Nadu',
            specialties: ['Cardiology', 'Neurology', 'General Medicine', 'Orthopaedics', 'Oncology', 'Pulmonology'],
            isGovernment: true,
            isVerified: true,
            hfrId: 'IN-TN-CHN-001',
        },
        {
            name: 'Apollo Hospital Greams Road',
            type: 'TERTIARY',
            locationLat: 13.0604,
            locationLng: 80.2496,
            locationText: 'Thousands Lights, Chennai, Tamil Nadu',
            specialties: ['Cardiology', 'Cardiac Surgery', 'Neurology', 'Nephrology', 'Oncology'],
            isGovernment: false,
            isVerified: true,
            hfrId: 'IN-TN-CHN-002',
        },
        {
            name: 'Government Stanley Medical College',
            type: 'DISTRICT_HOSPITAL',
            locationLat: 13.1042,
            locationLng: 80.2867,
            locationText: 'Royapuram, Chennai, Tamil Nadu',
            specialties: ['General Medicine', 'Pediatrics', 'Surgery', 'ENT', 'Ophthalmology'],
            isGovernment: true,
            isVerified: true,
            hfrId: 'IN-TN-CHN-003',
        },
        {
            name: 'Primary Health Centre Vyasarpadi',
            type: 'PHC',
            locationLat: 13.1167,
            locationLng: 80.2611,
            locationText: 'Vyasarpadi, Chennai, Tamil Nadu',
            specialties: ['General Medicine', 'Maternal Health', 'Child Health'],
            isGovernment: true,
            isVerified: true,
            hfrId: 'IN-TN-CHN-004',
        },
        // Tier 1 Metro - Delhi NCR
        {
            name: 'AIIMS New Delhi',
            type: 'TERTIARY',
            locationLat: 28.5672,
            locationLng: 77.21,
            locationText: 'Ansari Nagar, New Delhi, Delhi',
            specialties: ['Cardiology', 'Neurology', 'Oncology', 'Endocrinology', 'Gastroenterology', 'General Medicine'],
            isGovernment: true,
            isVerified: true,
            hfrId: 'IN-DL-DEL-001',
        },
        {
            name: 'Safdarjung Hospital',
            type: 'DISTRICT_HOSPITAL',
            locationLat: 28.5694,
            locationLng: 77.2078,
            locationText: 'Ring Road, New Delhi, Delhi',
            specialties: ['General Medicine', 'Orthopaedics', 'Pediatrics', 'Pulmonology', 'Surgery'],
            isGovernment: true,
            isVerified: true,
            hfrId: 'IN-DL-DEL-002',
        },
        {
            name: 'Community Health Centre Sangam Vihar',
            type: 'CHC',
            locationLat: 28.5033,
            locationLng: 77.2411,
            locationText: 'Sangam Vihar, New Delhi, Delhi',
            specialties: ['General Medicine', 'Ophthalmology', 'ENT', 'Maternal Health'],
            isGovernment: true,
            isVerified: true,
            hfrId: 'IN-DL-DEL-003',
        },
        // Tier 1 Metro - Mumbai
        {
            name: 'KEM Hospital & Seth GS Medical College',
            type: 'DISTRICT_HOSPITAL',
            locationLat: 19.0022,
            locationLng: 72.8423,
            locationText: 'Parel, Mumbai, Maharashtra',
            specialties: ['Cardiology', 'Neurology', 'General Medicine', 'Nephrology', 'Surgery'],
            isGovernment: true,
            isVerified: true,
            hfrId: 'IN-MH-MUM-001',
        },
        {
            name: 'Primary Health Centre Dharavi',
            type: 'PHC',
            locationLat: 19.04,
            locationLng: 72.853,
            locationText: 'Dharavi, Mumbai, Maharashtra',
            specialties: ['General Medicine', 'Maternal Health', 'Tuberculosis Control'],
            isGovernment: true,
            isVerified: true,
            hfrId: 'IN-MH-MUM-002',
        },
        // Tier 1 Metro - Bengaluru
        {
            name: 'Victoria Hospital (Bangalore Medical College)',
            type: 'DISTRICT_HOSPITAL',
            locationLat: 12.9644,
            locationLng: 77.5756,
            locationText: 'Fort, Bengaluru, Karnataka',
            specialties: ['General Medicine', 'Orthopaedics', 'Cardiology', 'Dermatology'],
            isGovernment: true,
            isVerified: true,
            hfrId: 'IN-KA-BLR-001',
        },
        // Tier 2 State Capitals
        {
            name: 'Patna Medical College Hospital (PMCH)',
            type: 'DISTRICT_HOSPITAL',
            locationLat: 25.6208,
            locationLng: 85.155,
            locationText: 'Ashok Rajpath, Patna, Bihar',
            specialties: ['General Medicine', 'Cardiology', 'Pediatrics', 'Obstetrics'],
            isGovernment: true,
            isVerified: true,
            hfrId: 'IN-BR-PAT-001',
        },
        {
            name: 'AIIMS Bhubaneswar',
            type: 'TERTIARY',
            locationLat: 20.2281,
            locationLng: 85.7779,
            locationText: 'Sijua, Bhubaneswar, Odisha',
            specialties: ['Cardiology', 'Oncology', 'Neurology', 'Endocrinology'],
            isGovernment: true,
            isVerified: true,
            hfrId: 'IN-OD-BHU-001',
        },
        {
            name: 'Gauhati Medical College Hospital (GMCH)',
            type: 'DISTRICT_HOSPITAL',
            locationLat: 26.155,
            locationLng: 91.7788,
            locationText: 'Bhangagarh, Guwahati, Assam',
            specialties: ['General Medicine', 'Cardiology', 'Neurology', 'Pulmonology'],
            isGovernment: true,
            isVerified: true,
            hfrId: 'IN-AS-GHY-001',
        },
        // Tier 3 & Tier 4 Rural Network
        {
            name: 'District Hospital Gorakhpur',
            type: 'DISTRICT_HOSPITAL',
            locationLat: 26.7606,
            locationLng: 83.3732,
            locationText: 'Civil Lines, Gorakhpur, Uttar Pradesh',
            specialties: ['General Medicine', 'Pediatrics', 'Orthopaedics', 'Cardiology'],
            isGovernment: true,
            isVerified: true,
            hfrId: 'IN-UP-GKP-001',
        },
        {
            name: 'Primary Health Centre Phulwari Sharif',
            type: 'PHC',
            locationLat: 25.5772,
            locationLng: 85.074,
            locationText: 'Phulwari Sharif, Patna, Bihar',
            specialties: ['General Medicine', 'Maternal Health', 'Basic Surgery'],
            isGovernment: true,
            isVerified: true,
            hfrId: 'IN-BR-PAT-002',
        },
        {
            name: 'Community Health Centre Kalahandi',
            type: 'CHC',
            locationLat: 19.9137,
            locationLng: 83.1649,
            locationText: 'Bhawanipatna, Kalahandi, Odisha',
            specialties: ['General Medicine', 'Pediatrics', 'Maternal Health', 'Ophthalmology'],
            isGovernment: true,
            isVerified: true,
            hfrId: 'IN-OD-KLH-001',
        },
        {
            name: 'SNM Zonal Hospital Leh',
            type: 'DISTRICT_HOSPITAL',
            locationLat: 34.1526,
            locationLng: 77.5771,
            locationText: 'Leh Town, Ladakh',
            specialties: ['General Medicine', 'High Altitude Medicine', 'Orthopaedics'],
            isGovernment: true,
            isVerified: true,
            hfrId: 'IN-LA-LEH-001',
        },
    ];
    const createdFacilities = [];
    for (const f of facilitiesData) {
        const facility = await prisma.facility.create({ data: f });
        createdFacilities.push(facility);
    }
    console.log(`🏥 Seeded ${createdFacilities.length} Healthcare Facilities across India.`);
    const mainHospital = createdFacilities[0]; // RGGGH Chennai
    // 3. Create Doctor User & Doctor record
    const doctorUser = await prisma.user.create({
        data: {
            name: 'Dr. K. Rajesh',
            phone: '9876543211',
            email: 'dr.rajesh@carepath.in',
            role: client_1.Role.DOCTOR,
            doctor: {
                create: {
                    specialty: 'Cardiology',
                    facilityId: mainHospital.id,
                    isVerified: true,
                    hprId: 'IN-HPR-TN-88492',
                },
            },
        },
        include: { doctor: true },
    });
    console.log(`👨‍⚕️ Created Doctor: ${doctorUser.name} (${doctorUser.doctor?.specialty})`);
    // 4. Create CARELINK Navigator User
    const navigatorUser = await prisma.user.create({
        data: {
            name: 'Anitha Ramesh',
            phone: '9876543212',
            email: 'anitha.navigator@carelink.in',
            role: client_1.Role.CARELINK_NAVIGATOR,
        },
    });
    console.log(`🧭 Created CARELINK Navigator: ${navigatorUser.name}`);
    // 5. Create Hospital Staff User
    const hospitalStaffUser = await prisma.user.create({
        data: {
            name: 'RGGGH Hospital Desk',
            phone: '9876543213',
            email: 'reception@rgggh.tn.gov.in',
            role: client_1.Role.HOSPITAL_STAFF,
        },
    });
    console.log(`🏥 Created Hospital Staff: ${hospitalStaffUser.name}`);
    // 6. Create Admin User
    const adminUser = await prisma.user.create({
        data: {
            name: 'System Admin',
            phone: '9876543214',
            email: 'admin@carepath.in',
            role: client_1.Role.ADMIN,
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
