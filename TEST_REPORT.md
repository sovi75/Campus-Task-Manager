# Testing Report
## Project Name: Campus Task Manager

---

## 1. Testing Strategy

The quality assurance strategy for the Campus Task Manager spans backend verification tests, frontend static analysis, and manual functional checks.

```text
               +----------------------------------------+
               |            Quality Assurance           |
               +----------------------------------------+
                                   ||
        +--------------------------+--------------------------+
        ||                                                    ||
+---------------+                                     +---------------+
|  Backend API  |                                     | Frontend Code |
|  Integration  |                                     |    Analysis   |
+---------------+                                     +---------------+
        ||                                                    ||
        |-- Register tests                                    |-- HTML syntax checks
        |-- Login/Auth security                               |-- CSS tokens & rules
        |-- CRUD validations                                  |-- Script import checks
        |-- Bulk status/deletes                               |-- LocalStorage integrity
```

---

## 2. Test Environment
- **Runtime**: Node.js v20.19.6
- **Database**: MongoDB Atlas Cloud Sandbox
- **Testing Scripts**: Local JS scripts using fetch and Mongoose queries, run in PowerShell.
- **Port Mapping**:
  - Main App Server: Port `5000`
  - Spawning Verification Server: Port `5001` (avoids address collisions)

---

## 3. Automated Test Executions

### 3.1 Authentication Tests (`testAuth.js`)
*Command*: `$env:PORT=5001; node backend/scripts/testAuth.js`

| Test ID | Endpoint | Description | Status | Note |
|---|---|---|---|---|
| AUTH-01 | `/api/auth/register` | Send empty body payloads; expect 400 validation error | **Passed** | Successfully caught missing params |
| AUTH-02 | `/api/auth/register` | Register new student credentials | **Passed** | Status code 201; token generated |
| AUTH-03 | `/api/auth/register` | Register duplicate student email | **Passed** | 400 error prevents duplicate accounts |
| AUTH-04 | `/api/auth/login` | Login with incorrect password | **Passed** | 401 login error |
| AUTH-05 | `/api/auth/login` | Login with correct credentials | **Passed** | Returns student profile and token |
| AUTH-06 | `/api/auth/me` | Access profile without token | **Passed** | 401 error blocks request |
| AUTH-07 | `/api/auth/me` | Access profile with malformed token | **Passed** | JWT errors caught in middleware |
| AUTH-08 | `/api/auth/me` | Access profile with valid token | **Passed** | Successfully returns student profile info |
| AUTH-09 | `/api/auth/logout` | Perform session logout | **Passed** | Discards token on client side |

---

### 3.2 Task Management API Tests (`testTasks.js`)
*Command*: `$env:PORT=5001; node backend/scripts/testTasks.js`

| Test ID | Endpoint / Action | Description | Status |
|---|---|---|---|
| TASK-01 | Registration | Register mock student tester for task CRUD tests | **Passed** |
| TASK-02 | `/api/tasks` (POST) | Create 3 mock tasks (Calculus, History, Personal Budget) | **Passed** |
| TASK-03 | `/api/tasks` (GET) | Fetch all tasks; verify length matches exactly 3 | **Passed** |
| TASK-04 | `/api/tasks?status=...` | Filter tasks by status, priority, and category | **Passed** |
| TASK-05 | `/api/tasks?search=...` | Search tasks using keywords | **Passed** |
| TASK-06 | `/api/tasks/:id` (PUT) | Mark a single task completed | **Passed** |
| TASK-07 | `/api/tasks/bulk-status`| Mark multiple tasks completed | **Passed** |
| TASK-08 | `/api/tasks/bulk-delete`| Delete multiple tasks | **Passed** |
| TASK-09 | `/api/tasks/:id` (DELETE)| Clean up remaining task entries | **Passed** |

---

### 3.3 Static Assets Analysis (`validateFrontend.js`)
*Command*: `node backend/scripts/validateFrontend.js`

This script audits frontend layouts to ensure they match UI mockups and design token rules.

- **File Existence Checks**: Verified that all HTML pages, global CSS layouts, component libraries, and scripts exist. **Result: 100% Ok**.
- **Interface Structure Audits**:
  - Confirmed `login.html` and `register.html` reference all required styles and scripts.
  - Confirmed forms contain all required email/password input elements and error fields.
- **Client Library Audits**:
  - Confirmed `api.js` exposes the global `window.api` client, intercepts `401 Unauthorized` responses, and redirects to `login.html`.
  - Confirmed `auth.js` intercepts form submits, runs inputs through client-side validation rules, and saves JWT tokens to `localStorage`.
- **CSS Variable Checks**:
  - Confirmed global design variables (`--primary`, `--bg-surface`, `--text-primary`, `--shadow-lg`, styling tokens) exist.

---

## 4. Manual Verification Details

### 4.1 Pomodoro Study Mode Audio Checks
- Verified Web Audio API synthesis logic directly on the browser tab's audio node.
- Confirmed audio nodes generate Rainfall (soft noise), Cafe Hum, and Lo-Fi Beat crackles without loading external media files.

### 4.2 Browser Notification Checker
- Requested desktop alert permission and verified notification displays on task deadlines (e.g. 1 hour before due).
