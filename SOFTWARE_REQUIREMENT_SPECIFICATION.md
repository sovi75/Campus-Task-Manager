# Software Requirement Specification (SRS)
## Project Name: Campus Task Manager

---

## 1. Introduction

### 1.1 Purpose
This Software Requirement Specification (SRS) document details the functional and non-functional requirements of the "Campus Task Manager" application. The target audience includes project evaluators, software engineering students, and developers maintaining this project.

### 1.2 Scope
The Campus Task Manager is a multi-page web application designed for university students to track, categorize, and complete tasks. It includes:
- Secure JWT-based registration and login system.
- Academic metadata assignment (Course Codes, Categories, Priorities).
- Search, filter, and bulk modification features.
- A built-in study tool (Pomodoro timer & audio generator).
- A monthly visual layout (Interactive Calendar).
- Native desktop task alerts.

### 1.3 Intended Audience
- Course instructors and external evaluators.
- End-users (university students).
- Future developers looking to expand the application's capabilities.

---

## 2. Overall Description

### 2.1 Product Perspective
The Campus Task Manager operates as a lightweight, secure web application. It functions independently of external framework runtimes (e.g. React/Vue) on the frontend, relying purely on the browser's native API capabilities (Web Audio, Notification API, HTML5 local storage). The backend communicates with a cloud-hosted MongoDB Atlas instance via an Express REST API.

```text
+-----------------------+           +----------------------+           +--------------------+
|  HTML5/CSS3/Vanilla   | <=======> |  Node.js / Express   | <=======> |   MongoDB Atlas    |
|   JS User Interface   |           |    REST Backend      |           |     (Cloud DB)     |
+-----------------------+           +----------------------+           +--------------------+
```

### 2.2 Product Functions
The primary features of the application include:
1. **User Management**: Sign up, login, secure profile retrieval, and session logouts.
2. **Task Creation and Details**: Save titles, dates, descriptions, categories, priorities, and course numbers.
3. **Filtering & Searching**: Dynamic search query filters and list sorting options.
4. **Bulk Adjustments**: Modify or delete multiple items simultaneously.
5. **Periodic Reminders**: Monitor upcoming deadlines and pop up native desktop browser notices.
6. **Focus Timer**: Keep track of study blocks and synthesize brown/white/peaking noise.
7. **Interactive Calendar Grid**: Interactive grid visualizer mapping task due dates to a monthly calendar.

### 2.3 User Classes and Characteristics
The application is designed for **University Students**. These users expect:
- Clean, fast-loading, and mobile-friendly pages.
- Minimal setup overhead.
- Practical utilities like a focus timer that runs alongside their task checklist.

### 2.4 Design and Implementation Constraints
- **Stack Constraints**: Use only HTML5, Vanilla CSS3, and Vanilla JS. No React, Angular, Vue, Bootstrap, or Tailwind.
- **Database Constraints**: Connection string must connect to a remote MongoDB Atlas database via the environment variable `MONGODB_URI`.
- **Operating Environment**: Compatible with all modern web browsers (Chrome, Firefox, Safari, Edge) supporting standard Web Audio API and desktop notifications.

---

## 3. Specific Requirements

### 3.1 External Interface Requirements

#### 3.1.1 User Interfaces
- Consistent premium theme using the HSL color space.
- Clean layout featuring a sidebar navigation, header navigation, stat widgets, list grids, and details panels.
- Layout adapts fluidly down to mobile dimensions (below 768px).

#### 3.1.2 Software Interfaces
- **Express.js API Router**: Handles client authentication and database mutations.
- **Mongoose ODM**: Handles document validation and query execution on MongoDB.

#### 3.1.3 Communication Interfaces
- JSON payloads sent over standard HTTP requests using the client's `api.js` request utility.

---

### 3.2 System Features

#### Feature 1: Student Account Authentication
- **Description**: Secure credential setup and identity validation.
- **Functional Requirements**:
  - `REQ-AUTH-1`: Register with Full Name, Email, and a Password (minimum 6 characters).
  - `REQ-AUTH-2`: Passwords must be hashed using `bcrypt` before storage.
  - `REQ-AUTH-3`: Login triggers JWT token generation.
  - `REQ-AUTH-4`: Clients must intercept requests and redirect to `login.html` if the token is missing or invalid.

#### Feature 2: Task CRUD Engine
- **Description**: Add, edit, list, and delete tasks.
- **Functional Requirements**:
  - `REQ-CRUD-1`: Create a task with a title and due date.
  - `REQ-CRUD-2`: Associate optional course codes, descriptions, and categories.
  - `REQ-CRUD-3`: Modify task status between "Pending" and "Completed".
  - `REQ-CRUD-4`: Delete individual or multiple selected tasks.

#### Feature 3: Reminder Banners
- **Description**: Background checks alerting students of task deadlines.
- **Functional Requirements**:
  - `REQ-REM-1`: Request desktop permission.
  - `REQ-REM-2`: Periodically poll task deadlines at regular intervals.
  - `REQ-REM-3`: Pop up native alerts for deadlines due within 24 hours, 1 hour, or due now.

#### Feature 4: Pomodoro Focus Timer
- **Description**: A Pomodoro timer with ambient audio support.
- **Functional Requirements**:
  - `REQ-STUDY-1`: Provide presets for focus (25 min), short break (5 min), and long break (15 min).
  - `REQ-STUDY-2`: Generate ambient noises locally using the Web Audio API.
  - `REQ-STUDY-3`: Prompt the student to mark the selected focus task completed when the timer runs out.

#### Feature 5: Month-Grid Calendar
- **Description**: Display tasks visually in a calendar view.
- **Functional Requirements**:
  - `REQ-CAL-1`: Construct a grid showing monthly calendars and navigation options.
  - `REQ-CAL-2`: Highlight priority tasks with colored labels.
  - `REQ-CAL-3`: Update the details pane with tasks due on the selected date.

---

## 4. Non-Functional Requirements

### 4.1 Security
- Store JWT credentials securely in client-side local storage.
- Passwords must be hashed using a work factor of 10 (`bcrypt`).
- Protect task queries with validation rules ensuring users can only access their own tasks.

### 4.2 Reliability
- Periodically check database connection status and handle errors gracefully.
- Handle malformed inputs by returning structured JSON error messages instead of crashing the server process.

### 4.3 Maintainability
- Keep files organized inside distinct directory folders (`models`, `controllers`, `middleware`, `routes`).
- Use clean class hooks and reusable functions on the frontend.

### 4.4 Usability
- Informative form validators showing detailed tooltips.
- Status banners indicating action progress.
- Clean color schemes that remain readable across desktop, tablet, and mobile screens.
