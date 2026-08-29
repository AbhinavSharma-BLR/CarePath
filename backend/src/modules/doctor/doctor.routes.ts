import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { Role } from '@carepath/database';
import { broadcastDoctorStatus } from '../../lib/socket';
import { memoryAppointments } from '../appointment/appointment.routes';

export interface DoctorProfileData {
  id: string;
  userId: string;
  title: string;
  name: string;
  specialty: string;
  qualification: string;
  registrationNo: string;
  experienceYrs: number;
  languages: string[];
  consultationFee: number;
  rating: number;
  bio: string;
  facilityName: string;
  consultationMode: string;
  consultationDuration: number;
  phone: string;
  avatarUrl?: string;
  isVerified: boolean;
  isOnline: boolean;
  status: 'ONLINE' | 'BUSY' | 'OFFLINE';
  nextAvailable: string;
  availableSlots: string[];
}

// Complete development doctor dataset (15 realistic doctors)
export const memoryDoctors: DoctorProfileData[] = [
  {
    id: 'doc-1',
    userId: 'dev-doctor-user-1',
    title: 'Dr.',
    name: 'Dr. Ananya Sharma',
    specialty: 'Dermatology',
    qualification: 'MBBS, MD (Dermatology)',
    registrationNo: 'MCI-884920',
    experienceYrs: 12,
    languages: ['English', 'Hindi', 'Kannada'],
    consultationFee: 750,
    rating: 4.9,
    bio: 'Senior Dermatologist specializing in clinical dermatology, skin health, acne treatment, and aesthetic medicine.',
    facilityName: 'CarePath Central Clinic',
    consultationMode: 'BOTH',
    consultationDuration: 30,
    phone: '9876543211',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    isVerified: true,
    isOnline: true,
    status: 'ONLINE',
    nextAvailable: 'Today, 09:00 AM',
    availableSlots: ['09:00 AM', '10:30 AM', '02:00 PM', '04:30 PM'],
  },
  {
    id: 'doc-2',
    userId: 'dev-doctor-user-2',
    title: 'Dr.',
    name: 'Dr. Rahul Mehta',
    specialty: 'Cardiology',
    qualification: 'MBBS, DM (Cardiology)',
    registrationNo: 'MCI-773911',
    experienceYrs: 15,
    languages: ['English', 'Hindi'],
    consultationFee: 1000,
    rating: 4.8,
    bio: 'Consultant Cardiologist with expertise in preventive cardiology, ECG interpretation, and heart failure management.',
    facilityName: 'City Heart Institute',
    consultationMode: 'BOTH',
    consultationDuration: 30,
    phone: '9999999999',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    isVerified: true,
    isOnline: true,
    status: 'ONLINE',
    nextAvailable: 'Today, 09:30 AM',
    availableSlots: ['09:30 AM', '11:00 AM', '03:00 PM', '05:00 PM'],
  },
  {
    id: 'doc-3',
    userId: 'dev-doctor-user-3',
    title: 'Dr.',
    name: 'Dr. Priya Nair',
    specialty: 'General Medicine',
    qualification: 'MBBS, MD (General Medicine)',
    registrationNo: 'MCI-662910',
    experienceYrs: 9,
    languages: ['English', 'Hindi', 'Malayalam'],
    consultationFee: 600,
    rating: 4.9,
    bio: 'Lead Physician caring for primary health, chronic disease management, and preventive wellness.',
    facilityName: 'CarePath Health Center',
    consultationMode: 'BOTH',
    consultationDuration: 30,
    phone: '9876543212',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813566-78a5827361a8?auto=format&fit=crop&q=80&w=300',
    isVerified: true,
    isOnline: true,
    status: 'ONLINE',
    nextAvailable: 'Today, 10:00 AM',
    availableSlots: ['10:00 AM', '11:30 AM', '01:30 PM', '04:00 PM'],
  },
  {
    id: 'doc-4',
    userId: 'dev-doctor-user-4',
    title: 'Dr.',
    name: 'Dr. Vikramaditya Rao',
    specialty: 'General Medicine',
    qualification: 'MBBS, MD (Internal Medicine)',
    registrationNo: 'MCI-551829',
    experienceYrs: 15,
    languages: ['English', 'Hindi', 'Telugu'],
    consultationFee: 500,
    rating: 4.7,
    bio: 'Senior General Physician specializing in diabetes management, hypertension, and health screenings.',
    facilityName: 'Metro Health Care',
    consultationMode: 'BOTH',
    consultationDuration: 30,
    phone: '9876543213',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    isVerified: true,
    isOnline: false,
    status: 'OFFLINE',
    nextAvailable: 'Tomorrow, 08:30 AM',
    availableSlots: ['08:30 AM', '10:00 AM', '02:30 PM', '06:00 PM'],
  },
  {
    id: 'doc-5',
    userId: 'dev-doctor-user-5',
    title: 'Dr.',
    name: 'Dr. Sneha Kulkarni',
    specialty: 'Pediatrician',
    qualification: 'MBBS, DCH, MD (Pediatrics)',
    registrationNo: 'MCI-441718',
    experienceYrs: 11,
    languages: ['English', 'Hindi', 'Marathi'],
    consultationFee: 700,
    rating: 4.9,
    bio: 'Pediatric specialist focusing on newborn care, child growth milestones, and pediatric immunology.',
    facilityName: 'Sunshine Children Hospital',
    consultationMode: 'BOTH',
    consultationDuration: 30,
    phone: '9876543214',
    avatarUrl: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=300',
    isVerified: true,
    isOnline: true,
    status: 'ONLINE',
    nextAvailable: 'Today, 09:00 AM',
    availableSlots: ['09:00 AM', '11:00 AM', '02:00 PM', '05:30 PM'],
  },
  {
    id: 'doc-6',
    userId: 'dev-doctor-user-6',
    title: 'Dr.',
    name: 'Dr. Rajesh Iyer',
    specialty: 'Orthopedic',
    qualification: 'MBBS, MS (Orthopedics)',
    registrationNo: 'MCI-330607',
    experienceYrs: 14,
    languages: ['English', 'Tamil', 'Hindi'],
    consultationFee: 850,
    rating: 4.8,
    bio: 'Orthopedic surgeon with expertise in joint replacement, sports injury rehab, and spine care.',
    facilityName: 'Apex Bone & Joint Center',
    consultationMode: 'BOTH',
    consultationDuration: 30,
    phone: '9876543215',
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
    isVerified: true,
    isOnline: false,
    status: 'BUSY',
    nextAvailable: 'Today, 02:00 PM',
    availableSlots: ['10:30 AM', '01:00 PM', '04:00 PM'],
  },
  {
    id: 'doc-7',
    userId: 'dev-doctor-user-7',
    title: 'Dr.',
    name: 'Dr. Meera Sengupta',
    specialty: 'Gynecologist',
    qualification: 'MBBS, MS (Obstetrics & Gynecology)',
    registrationNo: 'MCI-229496',
    experienceYrs: 16,
    languages: ['English', 'Bengali', 'Hindi'],
    consultationFee: 900,
    rating: 4.9,
    bio: 'Senior Gynecologist specializing in high-risk pregnancies, maternal health, and reproductive wellness.',
    facilityName: 'MotherCare Women Clinic',
    consultationMode: 'BOTH',
    consultationDuration: 30,
    phone: '9876543216',
    avatarUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=300',
    isVerified: true,
    isOnline: true,
    status: 'ONLINE',
    nextAvailable: 'Today, 09:30 AM',
    availableSlots: ['09:30 AM', '11:30 AM', '03:00 PM', '05:00 PM'],
  },
  {
    id: 'doc-8',
    userId: 'dev-doctor-user-8',
    title: 'Dr.',
    name: 'Dr. Arvind Deshmukh',
    specialty: 'Neurologist',
    qualification: 'MBBS, DM (Neurology)',
    registrationNo: 'MCI-118385',
    experienceYrs: 18,
    languages: ['English', 'Hindi', 'Marathi'],
    consultationFee: 1200,
    rating: 4.9,
    bio: 'Consultant Neurologist specializing in stroke management, epilepsy, migraine, and neuro-rehabilitation.',
    facilityName: 'Brain & Nerve Institute',
    consultationMode: 'BOTH',
    consultationDuration: 30,
    phone: '9876543217',
    avatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=300',
    isVerified: true,
    isOnline: false,
    status: 'OFFLINE',
    nextAvailable: 'Tomorrow, 10:00 AM',
    availableSlots: ['10:00 AM', '02:00 PM', '04:30 PM'],
  },
  {
    id: 'doc-9',
    userId: 'dev-doctor-user-9',
    title: 'Dr.',
    name: 'Dr. Shalini Kapoor',
    specialty: 'ENT Specialist',
    qualification: 'MBBS, MS (ENT)',
    registrationNo: 'MCI-997274',
    experienceYrs: 10,
    languages: ['English', 'Hindi', 'Punjabi'],
    consultationFee: 650,
    rating: 4.7,
    bio: 'ENT surgeon specializing in sinus treatment, hearing loss assessment, and throat disorders.',
    facilityName: 'ENT & Hearing Care Center',
    consultationMode: 'BOTH',
    consultationDuration: 30,
    phone: '9876543218',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813566-78a5827361a8?auto=format&fit=crop&q=80&w=300',
    isVerified: true,
    isOnline: true,
    status: 'ONLINE',
    nextAvailable: 'Today, 09:00 AM',
    availableSlots: ['09:00 AM', '10:30 AM', '01:30 PM', '04:00 PM'],
  },
  {
    id: 'doc-10',
    userId: 'dev-doctor-user-10',
    title: 'Dr.',
    name: 'Dr. Siddharth Joshi',
    specialty: 'Psychiatrist',
    qualification: 'MBBS, MD (Psychiatry)',
    registrationNo: 'MCI-886163',
    experienceYrs: 13,
    languages: ['English', 'Hindi', 'Gujarati'],
    consultationFee: 800,
    rating: 4.8,
    bio: 'Consultant Psychiatrist providing anxiety management, depression care, and cognitive behavioral therapy.',
    facilityName: 'MindCare Wellness Clinic',
    consultationMode: 'BOTH',
    consultationDuration: 30,
    phone: '9876543219',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    isVerified: true,
    isOnline: true,
    status: 'ONLINE',
    nextAvailable: 'Today, 11:00 AM',
    availableSlots: ['11:00 AM', '02:30 PM', '05:00 PM', '06:30 PM'],
  },
  {
    id: 'doc-11',
    userId: 'dev-doctor-user-11',
    title: 'Dr.',
    name: 'Dr. Kavita Reddy',
    specialty: 'Ophthalmologist',
    qualification: 'MBBS, MS (Ophthalmology)',
    registrationNo: 'MCI-775052',
    experienceYrs: 12,
    languages: ['English', 'Telugu', 'Hindi'],
    consultationFee: 750,
    rating: 4.8,
    bio: 'Ophthalmic surgeon specializing in cataract surgery, glaucoma management, and vision correction.',
    facilityName: 'VisionCare Eye Hospital',
    consultationMode: 'BOTH',
    consultationDuration: 30,
    phone: '9876543220',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    isVerified: true,
    isOnline: false,
    status: 'OFFLINE',
    nextAvailable: 'Tomorrow, 09:30 AM',
    availableSlots: ['09:30 AM', '11:00 AM', '03:00 PM'],
  },
  {
    id: 'doc-12',
    userId: 'dev-doctor-user-12',
    title: 'Dr.',
    name: 'Dr. Alok Verma',
    specialty: 'General Physician',
    qualification: 'MBBS, MD',
    registrationNo: 'MCI-663941',
    experienceYrs: 8,
    languages: ['English', 'Hindi'],
    consultationFee: 450,
    rating: 4.6,
    bio: 'General Physician dedicated to primary healthcare, fever management, and lifestyle wellness.',
    facilityName: 'CarePath Primary Clinic',
    consultationMode: 'BOTH',
    consultationDuration: 30,
    phone: '9876543221',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    isVerified: true,
    isOnline: true,
    status: 'ONLINE',
    nextAvailable: 'Today, 08:00 AM',
    availableSlots: ['08:00 AM', '10:00 AM', '12:00 PM', '03:00 PM'],
  },
  {
    id: 'doc-13',
    userId: 'dev-doctor-user-13',
    title: 'Dr.',
    name: 'Dr. Pooja Pillai',
    specialty: 'Dermatology',
    qualification: 'MBBS, DVD, MD',
    registrationNo: 'MCI-552830',
    experienceYrs: 7,
    languages: ['English', 'Malayalam', 'Hindi'],
    consultationFee: 600,
    rating: 4.7,
    bio: 'Clinical Dermatologist specializing in laser treatments, eczema management, and hair care.',
    facilityName: 'Skin & Aesthetic Care',
    consultationMode: 'BOTH',
    consultationDuration: 30,
    phone: '9876543222',
    avatarUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=300',
    isVerified: true,
    isOnline: true,
    status: 'ONLINE',
    nextAvailable: 'Today, 10:00 AM',
    availableSlots: ['10:00 AM', '01:00 PM', '04:00 PM'],
  },
  {
    id: 'doc-14',
    userId: 'dev-doctor-user-14',
    title: 'Dr.',
    name: 'Dr. Farhan Qureshi',
    specialty: 'Cardiology',
    qualification: 'MBBS, MD, DNB (Cardiology)',
    registrationNo: 'MCI-441719',
    experienceYrs: 13,
    languages: ['English', 'Hindi', 'Urdu'],
    consultationFee: 950,
    rating: 4.9,
    bio: 'Interventional Cardiologist focused on coronary artery disease, lipid disorders, and hypertension.',
    facilityName: 'National Heart Clinic',
    consultationMode: 'BOTH',
    consultationDuration: 30,
    phone: '9876543223',
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
    isVerified: true,
    isOnline: false,
    status: 'BUSY',
    nextAvailable: 'Today, 11:30 AM',
    availableSlots: ['11:30 AM', '03:30 PM', '05:30 PM'],
  },
  {
    id: 'doc-15',
    userId: 'dev-doctor-user-15',
    title: 'Dr.',
    name: 'Dr. Neha Agarwal',
    specialty: 'Pediatrician',
    qualification: 'MBBS, MD (Pediatrics)',
    registrationNo: 'MCI-330608',
    experienceYrs: 9,
    languages: ['English', 'Hindi'],
    consultationFee: 650,
    rating: 4.8,
    bio: 'Pediatrician focused on child nutrition, vaccination schedules, and pediatric respiratory illnesses.',
    facilityName: 'Little Stars Child Clinic',
    consultationMode: 'BOTH',
    consultationDuration: 30,
    phone: '9876543224',
    avatarUrl: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=300',
    isVerified: true,
    isOnline: true,
    status: 'ONLINE',
    nextAvailable: 'Today, 09:30 AM',
    availableSlots: ['09:30 AM', '11:30 AM', '02:30 PM', '05:00 PM'],
  },
];

// In-memory availability overrides by date: { doctorId: { dateString: slotArray } }
export const memoryAvailabilities: Record<string, Record<string, string[]>> = {};

function getDoctorSortWeight(doc: DoctorProfileData): number {
  if (doc.isOnline && doc.availableSlots && doc.availableSlots.length > 0) return 1;
  if (doc.isOnline) return 2;
  if (doc.availableSlots && doc.availableSlots.length > 0) return 3;
  return 4;
}

// Helper to parse time string e.g. "09:00 AM" into minutes for sorting/validation
function parseTimeMinutes(timeStr: string): number {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export async function doctorRoutes(fastify: FastifyInstance) {
  
  // GET /doctors (supports ?specialty= & ?language= & ?search= & ?onlineOnly= & ?availableToday= & ?sort=)
  fastify.get('/doctors', async (request, reply) => {
    const { specialty, language, search, onlineOnly, availableToday, sort } = request.query as {
      specialty?: string;
      language?: string;
      search?: string;
      onlineOnly?: string;
      availableToday?: string;
      sort?: string;
    };

    try {
      const dbDoctors = await prisma.doctor.findMany({
        where: {
          isVerified: true,
          ...(specialty && specialty !== 'All' ? { specialty: { equals: specialty, mode: 'insensitive' } } : {}),
        },
        include: {
          user: true,
          facility: true,
          availabilities: true,
        },
      });

      if (dbDoctors && dbDoctors.length > 0) {
        let allMapped = dbDoctors.map(d => {
          const memDoc = memoryDoctors.find(m => m.id === d.id);
          return {
            id: d.id,
            name: d.user.name,
            specialty: d.specialty,
            qualification: memDoc?.qualification || 'MBBS, MD',
            registrationNo: memDoc?.registrationNo || 'MCI-987654',
            languages: d.languages,
            consultationFee: d.consultationFee,
            rating: d.rating,
            experienceYrs: d.experienceYrs,
            bio: d.bio,
            facilityName: d.facility?.name || 'CarePath Virtual Clinic',
            consultationMode: 'BOTH',
            consultationDuration: 30,
            isVerified: d.isVerified,
            isOnline: memDoc?.isOnline ?? true,
            status: memDoc?.status || 'ONLINE',
            nextAvailable: memDoc?.nextAvailable || 'Today, 09:00 AM',
            availableSlots: memDoc?.availableSlots || ['09:00 AM', '10:30 AM', '02:00 PM', '04:30 PM'],
          };
        });

        if (language && language !== 'All') {
          allMapped = allMapped.filter(d =>
            d.languages.some(l => l.toLowerCase() === language.toLowerCase())
          );
        }

        if (search) {
          const s = search.toLowerCase().trim();
          allMapped = allMapped.filter(d =>
            d.name.toLowerCase().includes(s) || d.specialty.toLowerCase().includes(s)
          );
        }

        // Summary is computed on ALL matching doctors BEFORE onlineOnly / availableToday filters!
        const summary = {
          totalDoctors: allMapped.length,
          onlineCount: allMapped.filter(d => d.isOnline).length,
          availableTodayCount: allMapped.filter(d => d.availableSlots && d.availableSlots.length > 0).length,
        };

        let filtered = [...allMapped];

        if (onlineOnly === 'true') {
          filtered = filtered.filter(d => d.isOnline);
        }

        if (availableToday === 'true') {
          filtered = filtered.filter(d => d.availableSlots && d.availableSlots.length > 0);
        }

        if (sort === 'fee_low') {
          filtered.sort((a, b) => a.consultationFee - b.consultationFee);
        } else if (sort === 'fee_high') {
          filtered.sort((a, b) => b.consultationFee - a.consultationFee);
        } else if (sort === 'rating') {
          filtered.sort((a, b) => b.rating - a.rating);
        } else {
          filtered.sort((a, b) => getDoctorSortWeight(a as any) - getDoctorSortWeight(b as any));
        }

        return reply.send({
          success: true,
          summary,
          doctors: filtered,
        });
      }
    } catch (err) {}

    // In-memory fallback
    let allBase = [...memoryDoctors];

    if (specialty && specialty !== 'All') {
      allBase = allBase.filter(d => d.specialty.toLowerCase() === specialty.toLowerCase());
    }

    if (language && language !== 'All') {
      allBase = allBase.filter(d =>
        d.languages.some(l => l.toLowerCase() === language.toLowerCase())
      );
    }

    if (search) {
      const s = search.toLowerCase().trim();
      allBase = allBase.filter(d =>
        d.name.toLowerCase().includes(s) ||
        d.specialty.toLowerCase().includes(s) ||
        (d.bio && d.bio.toLowerCase().includes(s)) ||
        (d.facilityName && d.facilityName.toLowerCase().includes(s)) ||
        d.languages.some(l => l.toLowerCase().includes(s))
      );
    }

    // Summary computed BEFORE applying onlineOnly or availableToday filters
    const summary = {
      totalDoctors: allBase.length,
      onlineCount: allBase.filter(d => d.isOnline).length,
      availableTodayCount: allBase.filter(d => d.availableSlots && d.availableSlots.length > 0).length,
    };

    let results = [...allBase];

    if (onlineOnly === 'true') {
      results = results.filter(d => d.isOnline);
    }

    if (availableToday === 'true') {
      results = results.filter(d => d.availableSlots && d.availableSlots.length > 0);
    }

    if (sort === 'fee_low') {
      results.sort((a, b) => a.consultationFee - b.consultationFee);
    } else if (sort === 'fee_high') {
      results.sort((a, b) => b.consultationFee - a.consultationFee);
    } else if (sort === 'rating') {
      results.sort((a, b) => b.rating - a.rating);
    } else {
      results.sort((a, b) => getDoctorSortWeight(a) - getDoctorSortWeight(b));
    }

    return reply.send({
      success: true,
      summary,
      doctors: results,
    });
  });

  // GET /doctors/:id (Public doctor detail page)
  fastify.get('/doctors/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const doc = await prisma.doctor.findUnique({
        where: { id },
        include: { user: true, facility: true, availabilities: true },
      });

      if (doc) {
        const memDoc = memoryDoctors.find(m => m.id === id);
        return reply.send({
          success: true,
          doctor: {
            id: doc.id,
            name: doc.user.name,
            specialty: doc.specialty,
            qualification: memDoc?.qualification || 'MBBS, MD',
            registrationNo: memDoc?.registrationNo || 'MCI-987654',
            languages: doc.languages,
            consultationFee: doc.consultationFee,
            rating: doc.rating,
            experienceYrs: doc.experienceYrs,
            bio: doc.bio,
            facilityName: doc.facility?.name || 'CarePath Central Hospital',
            consultationMode: memDoc?.consultationMode || 'BOTH',
            consultationDuration: memDoc?.consultationDuration || 30,
            phone: doc.user.phone,
            avatarUrl: memDoc?.avatarUrl,
            isVerified: doc.isVerified,
            isOnline: memDoc?.isOnline ?? true,
            status: memDoc?.status || 'ONLINE',
            nextAvailable: memDoc?.nextAvailable || 'Today, 09:00 AM',
            availableSlots: memDoc?.availableSlots || ['09:00 AM', '10:30 AM', '02:00 PM', '04:30 PM'],
          },
        });
      }
    } catch (err) {}

    const seedDoc = memoryDoctors.find(d => d.id === id) || memoryDoctors[0];
    return reply.send({ success: true, doctor: seedDoc });
  });

  // GET /doctors/:id/availability?date=YYYY-MM-DD
  fastify.get('/doctors/:id/availability', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { date } = request.query as { date?: string };

    const targetDate = date || new Date().toISOString().split('T')[0];

    const doc = memoryDoctors.find(d => d.id === id) || memoryDoctors[0];
    const customDateSlots = memoryAvailabilities[id]?.[targetDate];
    const standardSlots = customDateSlots || doc.availableSlots || [
      '09:00 AM',
      '10:00 AM',
      '11:00 AM',
      '02:00 PM',
      '03:00 PM',
      '04:30 PM',
    ];

    // Compute real-time booked slots for this doctor & date
    const memoryBooked = memoryAppointments
      .filter(a => a.doctorId === id && a.date === targetDate && a.status !== 'CANCELLED')
      .map(a => a.timeSlot);

    let dbBooked: string[] = [];
    try {
      const dbApts = await prisma.appointment.findMany({
        where: {
          doctorId: id,
          date: new Date(targetDate),
          status: { not: 'CANCELLED' },
        },
        select: { timeSlot: true },
      });
      dbBooked = dbApts.map(a => a.timeSlot);
    } catch (err) {}

    const allBookedSlots = Array.from(new Set([...memoryBooked, ...dbBooked]));
    const availableSlots = standardSlots.filter(slot => !allBookedSlots.includes(slot));

    return reply.send({
      success: true,
      doctorId: id,
      date: targetDate,
      allSlots: standardSlots,
      bookedSlots: allBookedSlots,
      availableSlots: availableSlots,
    });
  });

  // AUTHENTICATED DOCTOR ROUTES
  // GET /doctor/profile
  fastify.get('/doctor/profile', { preHandler: [authenticate, requireRole(Role.DOCTOR)] }, async (request, reply) => {
    const user = request.user!;

    // Resolve doctor ID securely from DB or memory dataset
    let dbDoc = null;
    try {
      dbDoc = await prisma.doctor.findUnique({
        where: { userId: user.id },
        include: { user: true, facility: true },
      });
    } catch (err) {}

    const doctorId = dbDoc?.id || user.doctorId || 'doc-1';
    console.log(`[DOCTOR AUTH] Authenticated User ID: ${user.id}, Resolved Doctor ID: ${doctorId}`);

    let doc = memoryDoctors.find(d => d.id === doctorId || d.userId === user.id);
    if (!doc) {
      doc = {
        ...memoryDoctors[0],
        id: doctorId,
        userId: user.id,
        name: user.name || 'Dr. Ananya Sharma',
        phone: user.phone || '9876543211',
      };
      memoryDoctors.push(doc);
    }

    if (dbDoc) {
      return reply.send({
        success: true,
        profile: {
          ...doc,
          id: dbDoc.id,
          name: dbDoc.user.name,
          specialty: dbDoc.specialty,
          languages: dbDoc.languages,
          consultationFee: dbDoc.consultationFee,
        },
        doctor: {
          ...doc,
          id: dbDoc.id,
          name: dbDoc.user.name,
          specialty: dbDoc.specialty,
        },
      });
    }

    return reply.send({ success: true, profile: doc, doctor: doc });
  });

  // PUT /doctor/profile
  fastify.put('/doctor/profile', { preHandler: [authenticate, requireRole(Role.DOCTOR)] }, async (request, reply) => {
    const user = request.user!;
    const doctorId = user.doctorId || 'doc-1';
    const body = request.body as any;

    let docIndex = memoryDoctors.findIndex(d => d.id === doctorId || d.userId === user.id);
    if (docIndex !== -1) {
      memoryDoctors[docIndex] = {
        ...memoryDoctors[docIndex],
        name: body.name || memoryDoctors[docIndex].name,
        specialty: body.specialty || memoryDoctors[docIndex].specialty,
        qualification: body.qualification || memoryDoctors[docIndex].qualification,
        registrationNo: body.registrationNo || memoryDoctors[docIndex].registrationNo,
        experienceYrs: body.experienceYrs ? parseInt(body.experienceYrs, 10) : memoryDoctors[docIndex].experienceYrs,
        languages: Array.isArray(body.languages) ? body.languages : memoryDoctors[docIndex].languages,
        consultationFee: body.consultationFee ? parseFloat(body.consultationFee) : memoryDoctors[docIndex].consultationFee,
        bio: body.bio || memoryDoctors[docIndex].bio,
        facilityName: body.facilityName || memoryDoctors[docIndex].facilityName,
        avatarUrl: body.avatarUrl || memoryDoctors[docIndex].avatarUrl,
      };
    }

    try {
      if (body.name) {
        await prisma.user.update({
          where: { id: user.id },
          data: { name: body.name },
        });
      }

      await prisma.doctor.upsert({
        where: { userId: user.id },
        update: {
          specialty: body.specialty,
          consultationFee: body.consultationFee ? parseFloat(body.consultationFee) : undefined,
          experienceYrs: body.experienceYrs ? parseInt(body.experienceYrs, 10) : undefined,
          bio: body.bio,
          languages: Array.isArray(body.languages) ? body.languages : undefined,
        },
        create: {
          userId: user.id,
          specialty: body.specialty || 'Dermatology',
          consultationFee: body.consultationFee ? parseFloat(body.consultationFee) : 500,
          experienceYrs: body.experienceYrs ? parseInt(body.experienceYrs, 10) : 5,
          bio: body.bio || '',
          languages: Array.isArray(body.languages) ? body.languages : ['English'],
        },
      });
    } catch (err) {}

    const updatedDoc = docIndex !== -1 ? memoryDoctors[docIndex] : { id: doctorId, ...body };
    return reply.send({ success: true, message: 'Doctor profile updated', doctor: updatedDoc });
  });

  // GET /doctor/availability
  fastify.get('/doctor/availability', { preHandler: [authenticate, requireRole(Role.DOCTOR)] }, async (request, reply) => {
    const user = request.user!;
    
    let dbDoc = null;
    try {
      dbDoc = await prisma.doctor.findUnique({ where: { userId: user.id } });
    } catch (err) {}

    const doctorId = dbDoc?.id || user.doctorId || 'doc-1';
    const { date } = request.query as { date?: string };

    const targetDate = date || new Date().toISOString().split('T')[0];
    const doc = memoryDoctors.find(d => d.id === doctorId || d.userId === user.id) || memoryDoctors[0];

    const customDateSlots = memoryAvailabilities[doctorId]?.[targetDate];
    const allSlots = customDateSlots || doc.availableSlots || ['09:00 AM', '10:30 AM', '02:00 PM', '04:30 PM'];

    // Compute booked slots
    const memoryBooked = memoryAppointments
      .filter(a => a.doctorId === doctorId && a.date === targetDate && a.status !== 'CANCELLED')
      .map(a => a.timeSlot);

    let dbBooked: string[] = [];
    try {
      const dbApts = await prisma.appointment.findMany({
        where: { doctorId, date: new Date(targetDate), status: { not: 'CANCELLED' } },
        select: { timeSlot: true },
      });
      dbBooked = dbApts.map(a => a.timeSlot);
    } catch (err) {}

    const bookedSlots = Array.from(new Set([...memoryBooked, ...dbBooked]));

    return reply.send({
      success: true,
      doctorId,
      date: targetDate,
      isOnline: doc.isOnline,
      status: doc.status,
      slots: allSlots,
      allSlots,
      bookedSlots,
      availableSlots: allSlots.filter(s => !bookedSlots.includes(s)),
    });
  });

  // POST /doctor/availability - Add Slot with Validation & Duplicate Checking
  fastify.post('/doctor/availability', { preHandler: [authenticate, requireRole(Role.DOCTOR)] }, async (request, reply) => {
    const user = request.user!;

    let dbDoc = null;
    try {
      dbDoc = await prisma.doctor.findUnique({ where: { userId: user.id } });
    } catch (err) {}

    const doctorId = dbDoc?.id || user.doctorId || 'doc-1';
    const body = request.body as any;

    const targetDate = body.date || new Date().toISOString().split('T')[0];
    const newSlotTime = body.timeSlot || body.slot || (body.startTime ? `${body.startTime}${body.endTime ? ' - ' + body.endTime : ''}` : '');

    if (!newSlotTime || !newSlotTime.trim()) {
      return reply.status(400).send({
        success: false,
        error: 'Validation Error',
        message: 'Please provide a valid time slot (e.g. 10:00 AM).',
      });
    }

    const slotStr = newSlotTime.trim();

    // Fetch existing slots for doctor on targetDate
    if (!memoryAvailabilities[doctorId]) {
      memoryAvailabilities[doctorId] = {};
    }

    const doc = memoryDoctors.find(d => d.id === doctorId || d.userId === user.id) || memoryDoctors[0];
    const currentSlots = memoryAvailabilities[doctorId][targetDate] || [...(doc.availableSlots || [])];

    // Check for Duplicate Slot
    if (currentSlots.some(s => s.toLowerCase() === slotStr.toLowerCase())) {
      return reply.status(400).send({
        success: false,
        error: 'Duplicate Slot Error',
        message: `Slot "${slotStr}" already exists for ${targetDate}.`,
      });
    }

    // Add new slot & sort chronologically
    const updatedSlots = [...currentSlots, slotStr].sort((a, b) => parseTimeMinutes(a) - parseTimeMinutes(b));
    memoryAvailabilities[doctorId][targetDate] = updatedSlots;

    const docIndex = memoryDoctors.findIndex(d => d.id === doctorId || d.userId === user.id);
    if (docIndex !== -1) {
      memoryDoctors[docIndex].availableSlots = updatedSlots;
    }

    console.log(`[SLOT MUTATION] Doctor ID: ${doctorId}, Date: ${targetDate}, Added Slot: ${slotStr}`);

    return reply.send({
      success: true,
      message: `Slot "${slotStr}" added successfully for ${targetDate}`,
      date: targetDate,
      slots: updatedSlots,
      slot: {
        id: `slot-${Date.now()}`,
        doctorId,
        date: targetDate,
        timeSlot: slotStr,
        startTime: body.startTime || slotStr,
        endTime: body.endTime || '',
        status: 'available',
      },
    });
  });

  // DELETE /doctor/availability - Remove Slot
  fastify.delete('/doctor/availability', { preHandler: [authenticate, requireRole(Role.DOCTOR)] }, async (request, reply) => {
    const user = request.user!;

    let dbDoc = null;
    try {
      dbDoc = await prisma.doctor.findUnique({ where: { userId: user.id } });
    } catch (err) {}

    const doctorId = dbDoc?.id || user.doctorId || 'doc-1';
    const { date, timeSlot } = request.body as { date: string; timeSlot: string };

    const targetDate = date || new Date().toISOString().split('T')[0];
    if (!timeSlot) {
      return reply.status(400).send({ success: false, message: 'timeSlot parameter required' });
    }

    // Prevent deletion of already-booked slot
    const isBooked = memoryAppointments.some(a => a.doctorId === doctorId && a.date === targetDate && a.timeSlot === timeSlot && a.status !== 'CANCELLED');
    if (isBooked) {
      return reply.status(400).send({
        success: false,
        error: 'Slot Booked',
        message: `Slot "${timeSlot}" cannot be deleted because a patient has already booked it.`,
      });
    }

    if (!memoryAvailabilities[doctorId]) {
      memoryAvailabilities[doctorId] = {};
    }

    const doc = memoryDoctors.find(d => d.id === doctorId || d.userId === user.id) || memoryDoctors[0];
    const currentSlots = memoryAvailabilities[doctorId][targetDate] || [...(doc.availableSlots || [])];
    const updatedSlots = currentSlots.filter(s => s !== timeSlot);

    memoryAvailabilities[doctorId][targetDate] = updatedSlots;

    const docIndex = memoryDoctors.findIndex(d => d.id === doctorId || d.userId === user.id);
    if (docIndex !== -1) {
      memoryDoctors[docIndex].availableSlots = updatedSlots;
    }

    console.log(`[SLOT MUTATION] Doctor ID: ${doctorId}, Date: ${targetDate}, Removed Slot: ${timeSlot}`);

    return reply.send({
      success: true,
      message: `Slot "${timeSlot}" removed successfully`,
      date: targetDate,
      slots: updatedSlots,
    });
  });

  // PUT /doctor/status - Toggle online/offline status
  fastify.put('/doctor/status', { preHandler: [authenticate, requireRole(Role.DOCTOR)] }, async (request, reply) => {
    const user = request.user!;

    let dbDoc = null;
    try {
      dbDoc = await prisma.doctor.findUnique({ where: { userId: user.id } });
    } catch (err) {}

    const doctorId = dbDoc?.id || user.doctorId || 'doc-1';
    const { isOnline } = request.body as { isOnline: boolean };

    const docIndex = memoryDoctors.findIndex(d => d.id === doctorId || d.userId === user.id);
    if (docIndex !== -1) {
      memoryDoctors[docIndex].isOnline = isOnline;
      memoryDoctors[docIndex].status = isOnline ? 'ONLINE' : 'OFFLINE';
    }

    broadcastDoctorStatus(doctorId, isOnline);

    console.log(`[DOCTOR STATUS UPDATE] User ID: ${user.id}, Doctor ID: ${doctorId}, isOnline: ${isOnline}`);

    return reply.send({
      success: true,
      isOnline,
      status: isOnline ? 'ONLINE' : 'OFFLINE',
      message: `Practitioner status set to ${isOnline ? 'ONLINE' : 'OFFLINE'}`,
    });
  });
}
