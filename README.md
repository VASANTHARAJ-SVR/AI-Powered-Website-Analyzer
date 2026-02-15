<div align="center">

# Web Analyser

### AI-Powered Website Performance & Accessibility Intelligence

<p align="center">
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-24.10-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/AI-Gemini_%26_Groq-FFD700?style=for-the-badge&logo=google&logoColor=black" />
</p>

[Key Features](#key-features) • [Tech Stack](#tech-stack) • [Installation](#installation) • [Configuration](#configuration)

</div>

---

## 📖 Overview

**Web Analyser** is a sophisticated full-stack application designed to provide deep insights into website performance, accessibility, and SEO. Leveraging the power of modern AI and industry-standard auditing tools, it delivers actionable intelligence to optimize web experiences.

## ✨ Key Features

- **🤖 AI-Driven Analysis**: Utilizes advanced LLMs to interpret site data and provide human-readable recommendations.
- **⚡ Performance Audits**: Integrated with **Lighthouse** for real-time performance, SEO, and best-practices scoring.
- **♿ Accessibility Checks**: Automated accessibility testing powered by **axe-core** to ensure WCAG compliance.
- **🕷️ Smart Scraping**: Robust headless browsing capabilities using **Playwright** for accurate data extraction.
- **📊 Interactive Visualizations**: Beautiful, data-rich dashboards built with **Recharts** and **Three.js**.
- **🎨 Modern UI/UX**: A fluid, responsive interface crafted with **React 19**, **Tailwind CSS**, and **Framer Motion**.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4, PostCSS
- **Animation**: Framer Motion
- **Visualization**: Recharts, Three.js
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **AI Integration**: Google Generative AI, Groq SDK
- **Tools**: Playwright, Lighthouse, Axe-core, Natural

## 🚀 Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)

### Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/web-analyser.git
    cd web-analyser
    ```

2.  **Install Backend Dependencies**
    ```bash
    cd backend
    npm install
    ```

3.  **Install Frontend Dependencies**
    ```bash
    cd ../frontend
    npm install
    ```

## ⚙️ Configuration

Create a `.env` file in both the `backend` and `frontend` directories.

**Backend (`backend/.env`):**
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
# AI Service Credentials
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
# Other configurations implied by functionality
```

**Frontend (`frontend/.env`):**
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000
```

> **Note**: Specific model configurations and internal environment parameters should be set according to your deployment requirements.

## 🏃 Usage

1.  **Start the Backend Server**
    ```bash
    cd backend
    npm start
    ```

2.  **Start the Frontend Development Server**
    ```bash
    cd frontend
    npm run dev
    ```

3.  **Access the Application**
    Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal).

## 📄 License

This project is licensed under the ISC License.
