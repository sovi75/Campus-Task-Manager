# Software Design Document (SDD)
## Project Name: Campus Task Manager

---

## 1. System Architecture

The Campus Task Manager is designed around a decoupled **Client-Server Architecture** utilizing a RESTful API pattern. The frontend client is served as static HTML, CSS, and JS assets by the Express application, while database queries are managed by Mongoose on MongoDB Atlas.

```text
+-----------------------------------------------------------------------------+
|                                  CLIENT LAYER                               |
|   +------------------+     +------------------+     +-------------------+   |
|   |    HTML Pages    |     |  CSS Stylesheet  |     | Vanilla JS Engine |   |
|   | (dashboard, tasks|     | (index, variables|     | (api.js, app.js,  |   |
|   |  study, calendar)|     |  components, css)|     | page controllers) |   |
|   +------------------+     +------------------+     +-------------------+   |
+-----------------------------------------------------------------------------+
                                       ||
                            HTTP requests / Fetch API
                                       ||
+-----------------------------------------------------------------------------+
|                                  SERVER LAYER                               |
|   +---------------------------------------------------------------------+   |
|   |                           Express Server                            |   |
|   |    +-------------------+  +------------------+  +---------------+   |   |
|   |    |  Router Endpoints |  | Auth Middleware  |  | Input Linting |   |   |
|   |    +-------------------+  +------------------+  +---------------+   |   |
|   +---------------------------------------------------------------------+   |
|                                      ||                                     |
|   +---------------------------------------------------------------------+   |
|   |                            Controller Layer                         |   |
|   |       +----------------------------+  +----------------------+      |   |
|   |       |       authController       |  |    taskController    |      |   |
|   |       +----------------------------+  +----------------------+      |   |
|   +---------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------+
                                       ||
                                  Mongoose ODM
                                       ||
+-----------------------------------------------------------------------------+
|                                DATABASE LAYER                               |
|                        +----------------------------+                       |
|                        |        MongoDB Atlas       |                       |
|                        |  (users & tasks collections)                       |
|                        +----------------------------+                       |
+-----------------------------------------------------------------------------+
```

---

## 2. Component Design

### 2.1 Backend Modules

#### 2.1.1 Config (`backend/config/db.js`)
Exposes `connectDB()`, an asynchronous Mongoose function that initializes a connection pool to MongoDB Atlas using the `MONGODB_URI` environment variable.

#### 2.1.2 Middleware (`backend/middleware/`)
- **`auth.js`**: Decodes JWT headers using the configured `JWT_SECRET`. If valid, extracts the corresponding User document from MongoDB and attaches it to `req.user`. If invalid, returns a `401 Unauthorized` JSON response.
- **`validate.js`**: Checks registration payloads (validating email syntax via regex and confirming the password has a minimum of 6 characters) and login payloads.

#### 2.1.3 Controllers (`backend/controllers/`)
- **`authController.js`**: Contains logic for registering users, matching passwords, logging out, and fetching the logged-in user's profile.
- **`taskController.js`**: Contains handlers for task operations, search filters, and bulk updates/deletions.

---

### 2.2 Frontend Modules

#### 2.2.1 API Client (`frontend/js/api.js`)
Configures a global `window.api` client. Key design points:
- Reads the logged-in user's token from `localStorage` and automatically attaches it as a `Bearer` token to the request headers.
- Intercepts `401 Unauthorized` responses and automatically redirects the client to `login.html`.
- Implements custom toast alerts using a CSS-animated notification banner.

#### 2.2.2 Shared App Logic (`frontend/js/app.js`)
- **Auth Guard**: Instantly redirects unauthorized requests to `login.html` if no token is found in localStorage.
- **Sidebar & Navbar Builder**: Dynamically builds the shared layouts (sidebar, filter links, top search inputs, user initials avatar, and logouts) to avoid duplicating layout boilerplate code across pages.
- **Modal Managers**: Global handlers for displaying the add task modal, editing tasks, and confirmation dialogs.

#### 2.2.3 Focus Timer Script (`frontend/js/study.js`)
- Runs a custom Pomodoro interval timer.
- Synthesizes low-latency audio signals using the browser's `AudioContext` to generate background noise like rainfall and lo-fi beats without needing audio files.
- Automatically prompts students to mark tasks completed when a study block ends.

---

## 3. Database Design

### 3.1 Entity Relationship Diagram

```text
   +--------------------+               +--------------------+
   |     User Model     |               |     Task Model     |
   +--------------------+               +--------------------+
   | _id (PK)           | <-----------+ | _id (PK)           |
   | name               |               | userId (FK)        |
   | email (unique)     |               | title              |
   | password (hashed)  |               | description        |
   | createdAt          |               | dueDate            |
   +--------------------+               | priority           |
                                        | status             |
                                        | category           |
                                        | courseCode         |
                                        | reminders          |
                                        +--------------------+
```

### 3.2 Schemas & Constraints
- **User Schema**: Includes basic user information, email validation, and a pre-save hook that hashes passwords using `bcryptjs`.
- **Task Schema**: Includes fields for task metadata, category constraints, priority values, and default values.

---

## 4. Key Procedural Logic

### 4.1 Client Request/Response Flow with JWT Authentication

```text
Client (UI Page)        api.js Client Helper        Express Router        Auth Middleware        Database (Atlas)
       |                         |                        |                      |                      |
       |----- Action Trigger --->|                        |                      |                      |
       |                         |-- Attaches JWT Header->|                      |                      |
       |                         |   (Authorization)      |                      |                      |
       |                         |                        |---- Pass Token ----->|                      |
       |                         |                        |                      |-- Decode & Validate->|
       |                         |                        |                      |<-- Matches User -----|
       |                         |                        |<--- User verified ---|                      |
       |                         |                        |                                             |
       |                         |                        |================ Execute CRUD ===============|
       |                         |                        |-------------------------------------------->|
       |                         |                        |<----------------- Data Result --------------|
       |                         |<--- Returns JSON ------|
       |<-- Renders updates -----|
```

### 4.2 Web Audio Synthesis Logic (Study Mode)

```text
AudioContext (Web Audio API)
       |
       +---> Create Buffer (White Noise samples)
       |
       +---> Pass through BiquadFilter (Lowpass @ 400Hz for Rainfall / Bandpass @ 250Hz for Cafe Hum)
       |
       +---> Connect to GainNode (Set Volume output)
       |
       +---> Destination (User Speakers)
```
Using the browser's audio engine allows for dynamic audio synthesis, avoiding the need to load large mp3 file assets.
