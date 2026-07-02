# Campus Task Manager

A comprehensive, responsive, student-friendly **Campus Task Manager** designed to help college students organize their assignments, exams, projects, and personal tasks. This project features a robust Node.js/Express backend, MongoDB Atlas integration, JWT-based security, desktop/browser reminders, an interactive Pomodoro study mode with dynamic ambient noise synthesis, and a calendar synchronization visualizer.

## 🚀 Features

### 1. Authentication & Security
- Secure registration and login endpoints.
- JWT (JSON Web Tokens) stored securely in client-side local storage.
- Route-guard middleware on the backend and client-side page guards preventing unauthorized access.

### 2. Dashboard Widgets & Today's Focus
- Comprehensive dashboard providing visual summaries: total tasks, pending count, completed count, and overdue items.
- **Today's Focus** card listing high-priority tasks due today.
- **Upcoming Deadlines** panel sorted chronologically.
- Inline **Quick Add Task** form for seamless task generation.

### 3. Task Management (CRUD)
- Create, read, update, and delete tasks.
- Advanced filtering: Status (Pending, Completed), Priority (High, Medium, Low), and Category (Assignment, Exam, Project, Personal).
- Sorting options (due dates ascending/descending, creation date, priority).
- **Bulk Actions**: Select multiple tasks to mark completed or delete in one click.

### 4. Real-time Reminders
- Browser-native notifications and in-app alert banners alerting students of upcoming deadlines.
- Flexible trigger options: At time of due, 1 hour before, or 1 day before.

### 5. Pomodoro Study Mode
- Distraction-free workspace with a customizable Pomodoro timer (Focus, Short Break, Long Break).
- Synthetic ambient noise generator (Rainfall, Lo-Fi Beats, Cafe Ambience, White Noise) using the native Web Audio API (no external file dependencies).
- Option to select an active task to work on, with an automated prompt to mark it complete when the timer finishes.

### 6. Interactive Calendar Sync
- Full-month interactive grid displaying daily tasks with color-coded priority dots.
- Task detail drawer displaying deadlines for any clicked date.
- Secure Calendar Sync simulation visualizing progress with Google Calendar & Outlook.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom design tokens, glassmorphism, responsive media queries), Vanilla JavaScript (ES6+ Fetch API, Web Audio API, Notification API).
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB Atlas (Mongoose ODM).
- **Authentication**: JWT, bcryptjs.

---

## 📁 Workspace Structure

```text
SE_PROJECT/
├── backend/
│   ├── config/
│   │   └── db.js            # MongoDB Atlas connection helper
│   ├── controllers/
│   │   ├── authController.js# Registration, Login, Profile controllers
│   │   └── taskController.js# Task CRUD and Bulk controllers
│   ├── middleware/
│   │   ├── auth.js          # JWT protection middleware
│   │   └── validate.js      # Input validation middleware
│   ├── models/
│   │   ├── Task.js          # Task model definition
│   │   └── User.js          # User model definition
│   ├── routes/
│   │   ├── authRoutes.js    # /api/auth endpoints
│   │   └── taskRoutes.js    # /api/tasks endpoints
│   ├── scripts/
│   │   ├── seed.js          # Database seeding script
│   │   ├── testAuth.js      # Automated Authentication route tests
│   │   ├── testTasks.js     # Automated Tasks route tests
│   │   └── validateFrontend.js # Frontend code syntax & structure lint script
│   └── server.js            # Express server entry point
├── docs/
│   ├── Database architecture.png
│   ├── System architecture.png
│   └── visily.pdf            # Interactive UI Mockups
├── frontend/
│   ├── css/
│   │   ├── auth.css
│   │   ├── components.css   # Common sidebar, topbar, cards, and modal components
│   │   ├── index.css        # Global CSS variables and styling tokens
│   │   └── tasks.css
│   ├── js/
│   │   ├── api.js           # API client layer (fetch configuration & error interception)
│   │   ├── app.js           # Common UI loaders, sidebar injection, and modal engines
│   │   ├── auth.js          # Login & registration validator & trigger
│   │   ├── calendar.js      # Interactive calendar grid controller
│   │   ├── dashboard.js     # Dashboard state manager
│   │   ├── reminders.js     # Browser-native periodic deadline checker
│   │   ├── study.js         # Pomodoro timer and audio synthesis logic
│   │   └── tasks.js         # Task lists, filters, sorting, search, and bulk operations
│   ├── calendar.html
│   ├── dashboard.html
│   ├── login.html
│   ├── register.html
│   ├── search.html
│   ├── study.html
│   └── tasks.html
├── .env                     # MongoDB Atlas & JWT secret configuration
├── package.json
└── README.md
```

---

## ⚡ Quick Start

### 1. Prerequisite
Ensure [Node.js](https://nodejs.org/) (v16+) is installed on your computer.

### 2. Install Dependencies
Clone the repository, enter the root directory and run:
```bash
npm install
```

### 3. Environment Setup
Configure your variables in the `.env` file at the root directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/campus_task_manager?retryWrites=true&w=majority
JWT_SECRET=campus_task_manager_secret_key_2026_se_project
JWT_EXPIRE=24h
NODE_ENV=development
```

### 4. Populate Database
Seed the database with sample user and tasks for immediate testing:
```bash
npm run seed
```

### 5. Launch Application
Start the backend server (which also serves the static frontend):
```bash
npm start
```
Open [http://localhost:5000](http://localhost:5000) in your web browser.

---

## 🧪 Testing

The project has automated testing suites built-in. To avoid port conflicts with the running server, specify a custom port:

- **Authentication API Verification**:
  ```bash
  $env:PORT=5001; node backend/scripts/testAuth.js
  ```
- **Task API CRUD Verification**:
  ```bash
  $env:PORT=5001; node backend/scripts/testTasks.js
  ```
- **Frontend File Structure Lint**:
  ```bash
  node backend/scripts/validateFrontend.js
  ```

---

## 📚 References
- [ExpressJS Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MDN Web Audio API docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [JWT Introduction](https://jwt.io/introduction/)
