# CarePath+ 🏥

**CarePath+** is a comprehensive virtual consultation and healthcare referral platform designed to seamlessly connect patients with doctors. The platform provides a modern healthcare experience through a virtual waiting room, real-time WebRTC video consultations, live chat, digital prescriptions, and secure medical record management.

---

## 🌟 Key Features

The platform is packed with over 40 distinct features designed for a secure, fast, and high-quality telemedicine experience:

### 🔹 Patient Experience
- **Landing Page**: A beautiful, welcoming experience setting the tone for virtual care.
- **Custom 404 Page**: A beautifully designed "Page Not Found" screen featuring the CarePath+ logo, clear error messaging, and a quick-return button to the dashboard to prevent users from getting lost.
- **Role-Based Dashboards**: Tailored UI for Patients, Doctors, and Admins.
- **Patient Profiles & Avatar Uploads**: Complete personal health tracking.
- **Doctor Discovery**: Robust Doctor Search and real-time Availability checking.
- **Appointment Booking**: Dynamic Slot Picker and instant Appointment Booking.
- **Virtual Waiting Room**: Real-Time Queue Position tracking.
- **Call Notifications**: Instant alerts when a Doctor Calls the Patient.
- **Prescription Access**: Secure Patient Prescription Access & PDF downloads.
- **Follow-Up Appointments**: Easy re-booking flows.
- **Consultation History**: Historical logs of past visits.
- **Secure Medical Records**: Medical Record Uploads and Secure Viewing.

### 🔹 Doctor Experience
- **Doctor Workspace**: Dedicated consultation control center.
- **Patient Context Panel**: In-call access to patient history.
- **Real-Time Consultations**: WebRTC Video Consultation & WebRTC Signaling.
- **Camera/Microphone Controls**: Full A/V toggles during the call.
- **Clinical Tools**: Autosaving Clinical Notes & Digital Prescription Builder.
- **Prescription Generation**: Automated PDF generation with embedded Prescription Information.
- **Doctor Access Control**: Permission-based access to patient medical records.
- **Doctor Verification**: Admin approval workflow for new doctors.

### 🔹 Admin & Security
- **Admin Dashboard**: Comprehensive platform analytics and user management.
- **Emergency Detection**: Priority flagging for critical conditions.
- **Notifications**: Push Notifications (FCM) & In-App Notifications.
- **Security**: Rate Limiting, Audit Logs, and Secure Sign-in (Supabase).
- **Route Guard / Middleware**: Robust protection for all private routes.

---

## 🛠 Tech Stack & Architecture

The project is built on a modern **flattened Turborepo Workspace Architecture** for optimal development speed and clear separation of concerns.

- **`frontend/`**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **`backend/`**: Fastify / Node.js
- **`database/`**: Standalone Prisma ORM package with Supabase PostgreSQL
- **`mobile/`**: React Native / Expo application
- **Authentication**: Supabase Auth (JWT)
- **Storage**: Supabase Storage / Cloudflare R2
- **Real-Time Signaling**: Socket.io / Supabase Realtime
- **Video & Audio**: Peer-to-Peer WebRTC

---

## 🚀 How to Run Locally

Follow these steps to clone the repository and run the platform on your local machine.

### 1. Clone the Repository
Clone the project to your local machine:
```bash
git clone https://github.com/AbhinavSharma-BLR/CarePath.git
cd CarePath
```

### 2. Install Dependencies
This project uses `pnpm` as the package manager. Install all workspace dependencies:
```bash
npm install -g pnpm  # If you don't have pnpm installed
pnpm install
```

### 3. Configure Environment Variables
You need to set up environment variables for both the frontend and backend.

**Create `frontend/.env`:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:10000
```

**Create `backend/.env`:**
```env
DATABASE_URL=your_supabase_transaction_pooler_url
DIRECT_URL=your_supabase_session_direct_url
PORT=10000
FRONTEND_URL=http://localhost:3000
```

### 4. Setup the Database
Navigate to the root directory and push the Prisma schema (located in the `database` workspace) to your PostgreSQL instance:
```bash
pnpm --filter @carepath/database run db:push
```

*(Optional) Seed the database with initial data:*
```bash
pnpm --filter @carepath/backend run db:seed
```

### 5. Start the Development Servers
Run the `dev` script from the root directory to spin up the entire monorepo simultaneously using Turborepo:
```bash
pnpm dev
```

**Alternatively, you can run the services individually:**
- **Frontend:** `cd frontend && pnpm dev` (Runs on `http://localhost:3000`)
- **Backend:** `cd backend && pnpm dev` (Runs on `http://localhost:10000`)

### 6. Explore the Platform
- Open [http://localhost:3000](http://localhost:3000) to view the main Landing Page.
- Try logging in to explore the Role-Based Dashboards!

**Demo Accounts (Use OTP: `123456` for all logins):**
- **Patient Account**: `9876543210`
- **Doctor Account**: `9876543211`
- **Admin Account**: `9876543212`
