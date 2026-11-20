# SpaRE (Spaced Revision Engine) — MVP v1.0

A lightweight, rule-based spaced repetition and revision scheduling web app designed for students balancing multiple study tracks: **College Semester Coursework**, **Competitive Exam Preparation (GATE)**, and **Self-Study / Skill Building**.

---

## 🚀 Key Features Implemented

1. **5-Step Core Spaced Revision Quota (`Day 1, 3, 7, 14, 30`):**
   - Automatically generates revision milestones when a topic is added on Day $T_0$.
   - Preserves core cognitive intervals (+1d, +2d, +4d, +7d, +16d).

2. **Dynamic Delay & Cascade Shift Logic (`+1 Day` Rule):**
   - **`[✓ Revised]`**: Completes current stage and activates next milestone. If marked late, automatically cascade-shifts future milestones first to protect genuine memory intervals.
   - **`[⏳ Not Revised (+1d)]`**: Shifts the current pending milestone and **all future pending milestones** by `+1 day` without breaking the spacing. Cumulative delay days are tracked.

3. **30-Day Maintenance Loop:**
   - Once Rev 5 (Day 30) is completed, topics transition into `MAINTENANCE` status.
   - Automatically scheduled every 30 days (`last completed date + 30 days`).
   - Automatically archives when the category's maintenance limit is reached.

4. **Multi-Track Categories & Custom Maintenance Settings:**
   - **College**: Default 4 months (or semester end date picker).
   - **GATE**: Default 18 months (or target GATE exam date picker).
   - **Self**: Default Infinite or custom months.

5. **Value-Add Enhancements:**
   - **Difficulty Tag & 1-Click 3-Day Booster Revision**: If a topic is rated `Hard`, insert a 3-day booster milestone without breaking the main schedule.
   - **Exam Freeze Mode (Bulk Shift)**: Freeze `GATE`, `Self`, or `College` tracks during exam or vacation periods with 1 click.
   - **Automatic Midnight Rollover**: Checks for overdue topics and shifts them forward so backlogs never pile up silently.
   - **Daily Load Warning Badge**: Alerts if $\ge 8$ topics are scheduled on any day.
   - **JSON Export & Import**: Full offline backup & restore.
   - **Daily Streak Counter & Progress Tracker**: Consecutive revision tracking with automatic break reset.

---

## 🛠️ Tech Stack
- **Framework:** React 19 + Vite 6
- **Styling:** Tailwind CSS (Dark aesthetic with glowing category accents)
- **Database:** Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **Backend API:** Express.js REST API
- **Icons:** Lucide React
- **Date Engine:** date-fns
- **Storage:** Offline-first architecture (Neon Cloud Sync + LocalStorage fallback)
- **Celebration Effects:** Canvas Confetti

---

## 🐘 Neon PostgreSQL Database Setup

1. Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```
2. Paste your Neon connection string in `.env`:
```env
DATABASE_URL=postgresql://<user>:<password>@<ep-name>.neon.tech/<dbname>?sslmode=require
```
3. Run automated schema migration & seed:
```bash
npm run db:setup
```
*(Alternatively, you can copy the contents of `db/schema.sql` and run it directly in the Neon SQL Console).*

4. Start the backend API server:
```bash
npm run server
```

5. In another terminal, start the frontend Vite app:
```bash
npm run dev
```

---

## 🏃 Running the App Locally

To start the development server:
```bash
npm run dev
```

To run the Neon backend API server:
```bash
npm run server
```

To initialize / migrate Neon database schema:
```bash
npm run db:setup
```

To build for production:
```bash
npm run build
```

To run the unit test suite (12 tests):
```bash
node src/engine/scheduler.test.js
```
