# AI Product Manager Copilot

Your intelligent AI assistant for product planning, strategy, roadmaps, and customer insights. Automate product management workflows with real-time PRD generation, semantic user feedback clustering, and automated feature scoring.

---

## System Architecture

<img width="1344" height="3174" alt="Gemini_Generated_Image_kvea8qkvea8qkvea" src="https://github.com/user-attachments/assets/30cfc7a0-b413-484f-bc69-3b31d342d4de" />

---


## Flow Diagram
```
                 User
                   │
                   ▼
      Login (Firebase Authentication)
                   │
                   ▼
          Create / Select Project
                   │
                   ▼
      Upload Product Documents / Feedback
                   │
                   ▼
        Document Processing Service
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
 Text Extraction        Feedback Cleaning
        │                     │
        └──────────┬──────────┘
                   ▼
          NLP Preprocessing
                   │
                   ▼
        Theme Extraction Engine
                   │
                   ▼
      Feature Request Aggregation
                   │
                   ▼
 AI Prioritization & Impact Analysis
        ┌─────────┼───────────┐
        ▼         ▼           ▼
 PRD      User Stories    Roadmap
Generator  Generator      Generator
        │
        ▼
 Store Results in Firestore
        │
        ▼
 RAG Knowledge Base (ChromaDB)
        │
        ▼
 Conversational AI Assistant
        │
        ▼
 Dashboard & Reports
```

---


## ✨ Features

- **Next-Gen Auth Flow**: High-fidelity, dark-themed, glassmorphic auth cards with Framer Motion animations.
- **Robust Security**: Fully integrated with Firebase Authentication & Cloud Firestore user profiles.
- **OAuth Integration**: Instant login using Google and GitHub provider buttons.
- **Dynamic Password Strength**: Real-time password requirement validation checklist and visual strength meter.
- **Email Verification & Reset**: Built-in verification routing and password recovery screens.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 6, TypeScript
- **Styling**: Tailwind CSS 3, Lucide React (Icons), Framer Motion (Animations)
- **Backend & database**: Firebase Auth & Cloud Firestore
- **Form validation**: React Hook Form, Zod

---

## 🚀 Getting Started

### 1. Clone the project and install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```
