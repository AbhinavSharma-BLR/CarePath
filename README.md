# CarePath+ 🏥

**CarePath+** is a comprehensive virtual consultation and healthcare referral platform designed to seamlessly connect patients with doctors. The platform provides a modern healthcare experience through a virtual waiting room, real-time WebRTC video consultations, live chat, digital prescriptions, and secure medical record management.

---

## 🌟 Key Features

The platform is packed with over 40 distinct features designed for a secure, fast, and high-quality telemedicine experience:

### 🔹 Patient Experience
- **Landing Page & Custom 404 Page**: A beautiful welcoming experience and a dedicated, user-friendly 404 error page.
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

Follow these steps to get the platform up and running on your local machine.

### 1. Install Dependencies
From the root directory of the project, install all workspace dependencies using `pnpm`:
```bash
pnpm install
```

### 2. Configure Environment Variables
Ensure you have your `.env` files set up in the respective `frontend/` and `backend/` directories. You will need your Supabase keys, PostgreSQL connection URLs, and Storage credentials.

### 3. Setup the Database
Navigate to the root directory and push the Prisma schema (located in the `database` workspace) to your PostgreSQL instance:
```bash
pnpm --filter @carepath/database run db:push
```

### 4. Start the Development Servers
Run the `dev` script from the root directory to spin up the entire monorepo simultaneously using Turborepo:
```bash
pnpm dev
```

**Alternatively, you can run the services individually:**
- **Frontend:** `cd frontend && pnpm dev` (Runs on `http://localhost:3000`)
- **Backend:** `cd backend && pnpm dev` (Runs on `http://localhost:3001`)

### 5. Explore the Platform
- Open [http://localhost:3000](http://localhost:3000) to view the main Landing Page.
- View the custom 404 page by navigating to an invalid URL like `http://localhost:3000/this-does-not-exist`.
- Try logging in to explore the Role-Based Dashboards!

**Demo Accounts (Use OTP: `123456` for all logins):**
- **Patient Account**: `9876543210`
- **Doctor Account**: `9876543211`
