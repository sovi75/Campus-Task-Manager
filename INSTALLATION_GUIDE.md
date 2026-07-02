# Installation Guide
## Developer Environment Setup for Campus Task Manager

This guide walks you through setting up the developer environment to run the Campus Task Manager on a local machine.

---

## 1. Prerequisites
Ensure you have the following software installed:
- **Node.js**: Version 16.0.0 or higher. Verify with:
  ```bash
  node -v
  ```
- **NPM**: Package manager (comes bundled with Node). Verify with:
  ```bash
  npm -v
  ```
- **MongoDB Atlas Cloud Account**: Since this project connects to a remote MongoDB Atlas database, a local MongoDB installation is not required.

---

## 2. Step-by-Step Installation

### Step 2.1: Clone/Extract the Project
Extract the zip folder into your workspace directory (e.g. `C:\Users\Username\Downloads\SE_PROJECT`).

### Step 2.2: Install Package Dependencies
Open your terminal (PowerShell, Command Prompt, or Bash), navigate to the root directory, and install the package dependencies listed in `package.json`:
```bash
npm install
```
This command installs backend packages (`express`, `mongoose`, `cors`, `dotenv`, `jsonwebtoken`, `bcryptjs`) and local dev utilities.

### Step 2.3: Set Up Environment Variables (`.env`)
Create a file named `.env` in the root directory. Paste the following configuration, replacing placeholder values with your MongoDB Atlas credentials:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@<cluster_address>/campus_task_manager?retryWrites=true&w=majority
JWT_SECRET=campus_task_manager_secret_key_2026_se_project
JWT_EXPIRE=24h
NODE_ENV=development
```

> **How to create a free MongoDB Atlas connection string:**
> 1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
> 2. Create a new Shared Cluster (free tier) in any region.
> 3. Create a database user with password access under **Database Access**.
> 4. Add `0.0.0.0/0` (allow access from anywhere) to your IP Access List under **Network Access**.
> 5. Click **Connect** on your cluster page, choose **Drivers**, copy the connection string, and replace `<db_username>` and `<db_password>` in your `.env` file.

### Step 2.4: Seed the Database
Populate the database with test user credentials and sample task entries:
```bash
npm run seed
```
Confirm the console output displays `Database seeding completed successfully!`.

### Step 2.5: Run the Server
Launch the Express backend server (which also hosts the frontend client):
```bash
npm start
```
You should see:
```text
Server running in development mode on port 5000
MongoDB Connected: cluster0-shard-00.mongodb.net
```

---

## 3. Accessing the Application
Once the server is running, open your web browser and navigate to:
- **Application URL**: [http://localhost:5000](http://localhost:5000)
- You will be automatically redirected to `login.html`. Log in using the seeded test user credentials or sign up for a new account.

---

## 4. Troubleshooting Guide

### 4.1 Address In Use Error (`EADDRINUSE`)
- **Problem**: The server fails to start, displaying `Error: listen EADDRINUSE: address already in use :::5000`.
- **Solution**: Port 5000 is currently occupied by another process. Free up port 5000, or update the `PORT` variable in your `.env` file to a different port (e.g. `PORT=5002` or `PORT=8080`).

### 4.2 Database Connection Timeouts
- **Problem**: The server hangs at startup, eventually throwing a database connection timeout error.
- **Solution**: MongoDB Atlas is blocking connection requests. Open the Atlas dashboard, navigate to **Network Access**, and confirm that your current IP address (or `0.0.0.0/0`) is added to the IP Access List.

### 4.3 JWT Secret Key Warnings
- **Problem**: Errors like `jwt malformed` or validation issues during logins.
- **Solution**: Ensure `JWT_SECRET` is configured in your `.env` file. If the file is missing or unread, check that it is saved exactly as `.env` (not `.env.txt`) in the root directory.
