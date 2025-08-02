# CV Scanner SaaS

A modern web application for companies to manage and analyze CV/resume uploads from applicants using AI-powered scanning technology.

## Features

- **User Authentication**: Complete authentication system with different user roles (company admins and applicants)
- **Company Management**: Create and manage company profiles
- **CV Upload & Analysis**: Upload and automatically analyze CV documents
- **AI Integration**: Extract key information from CVs using Gemini AI
- **Dashboard**: View analytics and manage uploaded CVs
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **File Storage**: Supabase Storage
- **AI Processing**: Google Gemini API

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- Google Cloud account (for Gemini API)

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

Replace `your_supabase_url`, `your_supabase_anon_key`, and `your_gemini_api_key` with your actual Supabase and Google Gemini API credentials.

### Install Dependencies

Install the required dependencies by running one of the following commands:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Run the Development Server

Start the development server with one of the following commands:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
