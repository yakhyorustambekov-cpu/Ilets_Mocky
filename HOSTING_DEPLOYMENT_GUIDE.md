# IELTS Mock Testing Platform - Hosting & Deployment Guide

This package contains the complete, production-ready IELTS Computer-Delivered Mock Platform.
The frontend is already built into `client/dist`, and tests are stored in `test.json` so you do not need to configure any complex external databases for tests.

---

## ?? Quick Start (Local or Any Node.js Server)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Platform**:
   ```bash
   npm start
   ```

3. Open your browser at:
   ```
   http://localhost:3001
   ```

---

## ?? Deploying to Render.com (Free Web Service)

1. Create a **New Web Service** on Render connected to your Git repository (or upload).
2. Configure the settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: (generate a random string)
   - `PORT`: `10000` (Render sets this automatically)
   - `CLIENT_URL`: `*`
4. Click **Deploy Web Service**. Render will start the Express server and serve both the React frontend and the backend API!

---

## ??? Deploying to VPS (Ubuntu / Debian / DigitalOcean / Linode)

1. Upload and unzip the project folder to `/var/www/ielts-platform`.
2. Install dependencies:
   ```bash
   cd /var/www/ielts-platform
   npm install --production
   ```
3. Run with PM2 for 24/7 background uptime:
   ```bash
   npm install -g pm2
   pm2 start "npm start" --name "ielts-platform"
   pm2 startup
   pm2 save
   ```
4. Point Nginx reverse proxy to port `3001` (or your configured `PORT`).

---

## ?? Key Files & Directories

- `test.json`: The central store for all admin-uploaded tests and versions.
- `client/dist/`: Pre-compiled production React frontend.
- `server/src/index.js`: Main Express server serving API, test static sandboxes, and React frontend.
- `server/uploads/tests/`: Stored audio tracks, HTML files, stylesheets, diagrams, and maps for tests.
