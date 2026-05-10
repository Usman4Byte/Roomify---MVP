# Roomzup | AI-Powered Architectural Visualizer

Roomzup is a state-of-the-art AI-first design environment that transforms 2D floor plans into photorealistic 3D architectural renders in seconds. Built with a modern tech stack and optimized for performance and scalability.

## ✨ Features

- **2D-to-3D Visualization**: Instant architectural rendering using high-performance AI models.
- **Side-by-Side Comparison**: Interactive slider to visualize the transformation from sketch to render.
- **Persistent Media Hosting**: Secure image storage via Supabase with persistent metadata.
- **Global Community Feed**: Share your architectural designs with the community in one click.
- **Privacy Controls**: Toggle projects between public and private visibility.
- **User-Centric AI**: "Bring Your Own Key" (BYOK) architecture using OpenRouter for flexible AI model access.

## ⚙️ Tech Stack

- **Framework**: [React Router v7](https://reactrouter.com/) (SSR & Client-side routing)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Backend/BaaS**: [Supabase](https://supabase.com/) (Auth, Database, Storage)
- **AI Engine**: [OpenRouter API](https://openrouter.ai/) (Powering Image-to-Image transformations)

## 📋 Prerequisites

Before you begin, ensure you have the following accounts and keys:

1. **OpenRouter API Key**: 
   - Sign up at [openrouter.ai](https://openrouter.ai/).
   - You will need to add a small amount of credits to your account to use image-generation models.
2. **Supabase Project**:
   - Create a new project at [supabase.com](https://supabase.com/).
   - **Database**: Run the SQL schema to create a `projects` table.
   - **Storage**: Create a public bucket named `roomify`.
   - **Auth**: Enable Google OAuth in the Authentication settings.

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Usman4Byte/Roomzup.git
cd Roomzup
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL="your-supabase-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🌍 Production Deployment (Vercel)

Roomzup is optimized for [Vercel](https://vercel.com/).

1. **Import Project**: Link your GitHub repo to Vercel.
2. **Configure Variables**: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your Vercel Project Settings.
3. **Set Node Version**: Ensure the Node.js version is set to **20.x** or higher.
4. **Auth Redirects**: Add your production URL (e.g., `https://your-app.vercel.app`) to the **Redirect URLs** in your Supabase Auth settings.

---

Built with ❤️ by [Usman4Byte](https://linkedin.com/in/usman4byte)
