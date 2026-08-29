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

## 🚀 How to Run Locally (Zero-Config)

Follow these steps to clone the repository and run the entire platform locally on your machine. **No cloud accounts or keys are required.**

### Prerequisites
- Node.js & `pnpm` installed.
- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** installed and running.

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/AbhinavSharma-BLR/CarePath.git
cd CarePath
npm install -g pnpm
pnpm install
```

### 2. Copy Default Environment Variables
We have provided default offline environment variables. Run this command to copy them into place:
```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

### 3. Start Local Supabase (Docker)
This will use Docker to spin up a local PostgreSQL database, Authentication, and Realtime server:
```bash
npx supabase start
```
*(Note: The first time you run this, it may take a few minutes to download the Docker images).*

### 4. Setup the Database
Push the Prisma schema to your newly created local database and seed it with demo accounts:
```bash
pnpm --filter @carepath/database run db:push
pnpm --filter @carepath/backend run db:seed
```

### 5. Start the App
Start both the Frontend and Backend simultaneously:
```bash
pnpm dev
```

### 6. Explore the Platform
- Open [http://localhost:3000](http://localhost:3000) to view the main Landing Page.
- Try logging in to explore the Role-Based Dashboards!

**Demo Accounts (Use OTP: `123456` for all logins):**
- **Patient Account**: `9876543210`
- **Doctor Account**: `9876543211`
- **Admin Account**: `9876543212`

> **When you're done testing:** You can shut down the local database by running `npx supabase stop`.
