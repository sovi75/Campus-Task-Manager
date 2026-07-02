# Deployment Guide
## Production Release Guidelines for Campus Task Manager

This guide walks you through deploying the Campus Task Manager to production hosting environments (e.g. Render, Railway, or Heroku) with a secure MongoDB Atlas production cluster.

---

## 1. Production Readiness Checklist

Before deploying the application, ensure the following checklist is completed:

- [ ] Change `NODE_ENV` to `production` in your environment configuration.
- [ ] Configure a secure, random `JWT_SECRET` key.
- [ ] Verify that Mongoose connection options connect to a production MongoDB Atlas cluster.
- [ ] Whitelist the server's IP address on the MongoDB Atlas Network Access panel.
- [ ] Ensure the server operates over HTTPS to protect session tokens.

---

## 2. Setting Up a Production MongoDB Atlas Database

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a dedicated database cluster for production (shared cluster free tier is suitable for mini projects).
3. Under **Database Access**, create a production database user with write permissions to your database.
4. Under **Network Access**, click **Add IP Address**.
   - If using Render or Railway, choose **Allow Access From Anywhere** (`0.0.0.0/0`) because cloud hosting IP addresses can change.
   - For environments with static IPs, restrict access to only your server's IP address.
5. Copy the connection string for Node.js under the **Connect** tab.

---

## 3. Deploying the Node.js Server

The Campus Task Manager is a self-contained application: the Express backend serves all API routes and static frontend files (`frontend/` folder). This allows you to host both the frontend and backend on a single web service.

---

### Option A: Deploying to Render (Recommended)

1. Sign up at [Render](https://render.com) and link your GitHub repository.
2. Click **New** -> **Web Service**.
3. Choose the repository containing the Campus Task Manager.
4. Configure the service settings:
   - **Name**: `campus-task-manager`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Click **Advanced** and add your environment variables:
   - `PORT` = `10000` (or leave blank; Render binds automatically)
   - `MONGODB_URI` = *(your production MongoDB Atlas connection string)*
   - `JWT_SECRET` = *(a secure random string)*
   - `NODE_ENV` = `production`
6. Click **Create Web Service**. Render will build and deploy the application, providing an HTTPS URL (e.g. `https://campus-task-manager.onrender.com`).

---

### Option B: Deploying to Railway

1. Sign up at [Railway.app](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your repository.
4. Under the **Variables** tab, add your environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV` = `production`
5. Railway will automatically detect the `package.json` file, install dependencies, and start the application on a public port.

---

## 4. Post-Deployment Verification

Once deployed, verify the following:

1. **Routing Verification**: Navigate to your public URL. The page should load securely over HTTPS and redirect you to `/login.html`.
2. **Database Verification**: Sign up with a new email and create a few tasks. Log in to your MongoDB Atlas cluster and verify the documents are saved in the `users` and `tasks` collections.
3. **Session Check**: Log out and verify you cannot access `/dashboard.html` without logging in again.
