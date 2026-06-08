# Odyssey - Frontend Client

This is the web client for Odyssey, built with Next.js, React, Tailwind CSS, TanStack Query (React Query), and Zustand.

## Tech Stack

*   **Framework**: Next.js 15 (App Router)
*   **Styling**: Tailwind CSS & Framer Motion (for animations)
*   **State Management**: Zustand
*   **Data Fetching**: TanStack Query (React Query) & Axios
*   **Forms & Validation**: React Hook Form & Zod
*   **Icons & UI Components**: Lucide React & Recharts (for analytics dashboards)

## Folder Structure

```text
frontend/
├── src/
│   ├── app/           # App router pages (dashboard, history, login, register, interview, summary)
│   ├── components/    # Reusable UI components (modals, buttons, charts)
│   ├── hooks/         # Custom React hooks & React Query integrations
│   ├── lib/           # Configurations (axios client, utility helper functions)
│   ├── providers/     # Theme, Query, and Toast context providers
│   ├── services/      # API communication modules
│   └── store/         # Zustand global state stores (auth, interview tracking)
├── public/            # Static assets
├── Dockerfile         # Docker build configuration
├── tailwind.config.ts # Tailwind CSS theme configuration
└── tsconfig.json      # TypeScript compiler settings
```

## Getting Started

### Prerequisites

Make sure you have Node.js (v18 or higher) and npm installed.

### Environment Setup

Create a `.env.local` file inside the `frontend` folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### Installation

Install the project dependencies:

```bash
npm install
```

### Running Locally

To run the development server:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Build for Production

To generate an optimized production build:

```bash
npm run build
npm start
```
