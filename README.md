# IELTS Computer-Delivered Mock Testing Platform

A complete, production-grade IELTS computer-delivered simulation platform built from scratch.

---

## 🏛️ Architecture Overview

The platform is designed specifically around the **unmodified HTML test paradigm**:
1. **Zero HTML Alteration**: Uploaded standalone `.html` tests and `.zip` packages (with `index.html`, `css/`, `js/`, `images/`, and `audio/`) are stored and hosted completely untouched. Relative paths and internal assets work seamlessly.
2. **Origin & Sandbox Isolation**: Tests run in an isolated `iframe` with `sandbox="allow-scripts allow-forms allow-modals allow-downloads"`. Without `allow-same-origin`, the browser enforces an opaque `null` origin, blocking uploaded scripts from accessing host authentication tokens, cookies, localStorage, or administrative APIs.
3. **Server-Side Anti-Repeat Randomization**:
   - Full Mock exams randomly assign 1 Listening + 1 Reading + 1 Writing test from published inventory.
   - Per-student anti-repeat tracking ensures zero test repetitions until all published tests in that section are exhausted.
   - When a section's pool is exhausted, only that section's cycle resets independently.
4. **Persistent Full Mock Assignments**:
   - A generated mock assignment is permanent in SQLite / PostgreSQL.
   - Candidate browser refreshes, disconnects, or resumes return the identical test sequence and active section.
5. **Historical Version Safety**:
   - Replacing a test creates a new version (`v2`, `v3`). Past attempts permanently retain links to their original version.

---

## 🔑 Default Credentials

| Role | Email | Password | Candidate ID | Access |
|---|---|---|---|---|
| **Examiner (Admin)** | `admin@ielts.com` | `admin123` | `CDI-ADM001` | Full Test Management, Candidate Dossiers, Settings |
| **Candidate (Student)** | `student@ielts.com` | `student123` | `CDI-849201` | Dashboard, Single Test Libraries, Full Mock Simulation |

---

## 🚀 Quick Start Guide

### Unified Platform (Single Port)
The backend server automatically serves the compiled frontend at `http://localhost:3001`:

```bash
# Start backend and unified frontend
cd server
npm start
```
Visit: **`http://localhost:3001`**

### Development Mode (Concurrent Vite + Express)
To run with live hot reloading:

```bash
# Terminal 1: Backend API
cd server
npm start

# Terminal 2: Frontend Vite
cd client
npm run dev
```
Visit: **`http://localhost:5173`** (proxies `/api` and `/test-content` to `localhost:3001`).

---

## 📂 Pre-Loaded Sample Tests

6 complete sample test packages are pre-seeded in the database and available in `sample-tests/`:
1. **Listening Test 1** (`listening-1.zip`): 4 parts, audio playback, diagram floorplan completion.
2. **Listening Test 2** (`listening-2.zip`): Campus registration, map labeling, audio stream.
3. **Reading Test 1** (`reading-1.zip`): 3 passages, ancient navigation, True/False/Not Given.
4. **Reading Test 2** (`reading-2.html`): Biomimicry architecture, split-pane reading, matching questions.
5. **Writing Test 1** (`writing-1.zip`): Task 1 renewable energy chart + Task 2 digital education essay with live word counters.
6. **Writing Test 2** (`writing-2.html`): Task 1 paper recycling process + Task 2 free higher education essay.

---

## 🧪 Automated Verification

Run the end-to-end verification suite anytime:
```bash
node verify-workflow.js
```
Runs the full 8-stage verification pipeline verifying:
- Admin authentication & test management
- Sandboxed file serving & CSP headers
- Candidate authentication
- Full Mock #1 generation & assignment persistence on reload
- Sequential section transitions (Listening -> Reading -> Writing -> Completed)
- Full Mock #2 anti-repeat verification (0 repeats while unused tests exist)
- Full Mock #3 independent pool reset cycle verification
- Unified web application serving
