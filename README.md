# CarePath+ 🏥

CarePath+ is a comprehensive virtual consultation and healthcare referral platform. It connects patients with doctors through a seamless virtual waiting room, real-time WebRTC video consultations, live chat, and a fully integrated digital prescription system. 

## 🛠 Tech Stack

*   **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
*   **Backend:** Fastify, Node.js
*   **Database ORM:** Prisma
*   **Database:** Supabase PostgreSQL
*   **Authentication:** Supabase Auth (JWT)
*   **Storage:** Supabase Storage (Prescriptions) / Cloudflare R2 (Medical Records)
*   **Realtime:** Socket.io / Supabase Realtime
*   **Video:** WebRTC (Peer-to-Peer)

## 🚀 Implementation Plan (Start to End)

The project is divided into 6 strategic phases. 

### ✅ Phase 1: Foundation & Auth (Completed)
*   **Objective:** Project scaffolding, database schema, and user authentication.
*   **Features:**
    *   Turborepo monorepo setup (`apps/web`, `apps/api`).
    *   Prisma database schema with PostgreSQL.
    *   Supabase JWT Authentication and `middleware.ts` route guards.
    *   Role-based redirects (Patient, Doctor, Admin).

### ✅ Phase 2: Patient Profile & Doctor Discovery (Completed)
*   **Objective:** Enable patients to find doctors and book appointments.
*   **Features:**
    *   Dynamic Patient and Doctor profile forms using `react-hook-form` and `zod`.
    *   Doctor search and filtering (by specialty/availability).
    *   Slot picker and Appointment booking system.

### ✅ Phase 3: Queue & Video Consultation (Completed)
*   **Objective:** Real-time virtual waiting room and video calling.
*   **Features:**
    *   Virtual queue system (`POST /queue/join`, `POST /queue/call`).
    *   Real-time queue position tracking.
    *   Browser-to-browser **WebRTC** video and audio.
    *   Real-time text chat during consultations.

### ✅ Phase 4: Doctor Workspace & Prescriptions (Completed)
*   **Objective:** In-consultation tools for doctors to treat patients.
*   **Features:**
    *   Patient context panel (shows history, allergies, meds).
    *   Autosaving clinical notes.
    *   Digital Prescription builder.
    *   Server-side PDF generation (`@react-pdf/renderer`).
    *   PDF uploads to Supabase Storage and short-lived signed URLs for patient downloads.

### 🟡 Phase 5: Admin Panel, Records & History (In Progress)
*   **Objective:** Platform administration and patient medical history.
*   **Features:**
    *   Admin dashboard for platform analytics (Currently scaffolded).
    *   Doctor verification workflows.
    *   Patient Medical Record uploads (Backend API complete using Cloudflare R2; Frontend UI pending).
    *   Full consultation history views.

### 🔴 Phase 6: Notifications, Polish & Security (Pending)
*   **Objective:** Final production readiness.
*   **Features:**
    *   Push Notifications via Firebase Cloud Messaging (FCM) for queue alerts.
    *   System audit logs for medical record access.
    *   Rate limiting and API security hardening.
    *   Final UX polish (animations, accessibility).

## 💻 How to Run Locally

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Database Setup:**
   Ensure `DATABASE_URL` is set in `apps/api/.env`, then push the schema:
   ```bash
   pnpm --filter @carepath/api run db:push
   ```

3. **Start the Development Servers:**
   ```bash
   pnpm dev
   ```
   * Frontend runs on `http://localhost:3000`
   * Backend API runs on `http://localhost:3001`
