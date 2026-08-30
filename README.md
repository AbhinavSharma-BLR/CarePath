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

Follow these quick steps to get CarePath running on your machine. **No Docker installation or cloud configuration is required**—the project comes pre-configured with a live Supabase database and authentication.

### Prerequisites
- **Node.js**: v20.0.0 or higher.
  - **Download:** [nodejs.org](https://nodejs.org/)
  - **Or via NVM:** `nvm install 20 && nvm use 20`
- **pnpm**: v8.0.0 or higher (`npm install -g pnpm`)

---

### Quick Start (Zero-Docker / Ready to Run)

#### 1. Clone & Install Dependencies
```bash
git clone https://github.com/AbhinavSharma-BLR/CarePath.git
cd CarePath
pnpm install
```

#### 2. Run Automatic Setup
Run this single command to automatically configure all `.env` files (frontend, backend, database) and generate the Prisma Client:
```bash
pnpm setup
```
*(Alternatively, you can manually copy `.env.example` files to `.env` in `backend/`, `frontend/`, and `database/`).*

**IMPORTANT:** Open the newly created `.env` files in `backend/`, `frontend/`, and `database/` and replace the placeholder values (`your_supabase_...`) with your actual Supabase project credentials.

#### 3. Setup the Database
Push the Prisma schema to your connected database and seed it with demo accounts:
```bash
pnpm db:push
pnpm db:seed
```

#### 4. Start the Development Servers
Start both the Frontend and Backend simultaneously using Turborepo:
```bash
pnpm dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

---

### 🔑 Demo Accounts (Use OTP: `123456` for all logins)

- **Patient Account**: `9876543210`
- **Doctor Account**: `9876543211`
- **Admin Account**: `9876543212`

---

### 🐳 Alternative: Running 100% Offline with Local Docker Supabase

If you prefer to run a completely offline local Supabase container instead of using the cloud database:

1. **Install and open [Docker Desktop](https://www.docker.com/products/docker-desktop/)** on your machine.
2. Start the local Supabase containers:
   ```bash
   npx supabase start
   ```
3. Update your `DATABASE_URL` in `backend/.env` and `database/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
   ```
4. Push and seed the database:
   ```bash
   pnpm db:push
   pnpm db:seed
   ```
5. When done testing, stop the containers with `npx supabase stop`.

> **Troubleshooting: `docker: command not found (podman also not found)`**  
> If you encounter this error, it means Docker Desktop is not installed or not running on your system. You **do not need Docker** to run CarePath! Simply follow the [Quick Start](#quick-start-zero-docker--ready-to-run) above using `pnpm setup` and `pnpm dev`.

