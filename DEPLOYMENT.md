# Deployment Guide: Vercel & Render

This project is configured for a split deployment.

## 🚀 Backend Deployment (Render)

1. **Login to Render**: Go to [dashboard.render.com](https://dashboard.render.com/).
2. **New Blueprint Instance**:
   - Click **New +** -> **Blueprint**.
   - Connect your GitHub repository.
   - Render will detect `render.yaml` automatically.
3. **Environment Variables**:
   Update the following in the Render Dashboard (or via the blueprint setup):
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `GEMINI_API_KEY`: Your Google AI API key.
   - `GROQ_API_KEY`: Your Groq Cloud API key.
   - `NODE_ENV`: `production`

> [!IMPORTANT]
> The build process installs Chromium automatically. If the scraper fails due to missing system libraries, you may need to switch to a **Docker Service** (Dockerfile) as Render's native environment has limited system permissions.

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
