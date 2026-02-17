# Deployment Guide: Vercel & Render

This project is configured for a split deployment.

## 🚀 Backend Deployment (Render - Docker)

1. **Login to Render**: Go to [dashboard.render.com](https://dashboard.render.com/).
2. **New Service**: 
   - Click **New +** -> **Web Service**.
   - Connect your GitHub repository.
   - **IMPORTANT**: Set the **Environment** to **Docker**.
   - **Root Directory**: Set to `backend`.
3. **Environment Variables**:
   Update the following in the Render Dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `GEMINI_API_KEY`: Your Google AI API key.
   - `GROQ_API_KEY`: Your Groq Cloud API key.
   - `NODE_ENV`: `production`

4. **Whitelist Render on MongoDB Atlas**:
   - Go to **Network Access** (under the Security header) in your MongoDB Atlas Dashboard.
   - Click **Add IP Address**.
   - Select **Allow Access From Anywhere** (adds `0.0.0.0/0`).
   - Click **Confirm**.
   - *Note: This is necessary because Render's IP addresses are dynamic and change with every deploy.*

---

## 🎨 Frontend Deployment (Vercel)

1. **Login to Vercel**: Go to [vercel.com](https://vercel.com/).
2. **Import Project**:
   - Click **Add New** -> **Project**.
   - Select your GitHub repository.
3. **Configure Project**:
   - **Root Directory**: Select `frontend` (Note: `vercel.json` already specifies this).
   - **Framework Preset**: Vite.
4. **Environment Variables**:
   - `VITE_API_URL`: The URL of your backend service on Render (e.g., `https://web-audit-ai-backend.onrender.com`).

---

## 🛠️ Local Development

- Backend: `cd backend && npm run dev`
- Frontend: `cd frontend && npm run dev`
