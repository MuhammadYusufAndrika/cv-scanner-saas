import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <header className="w-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="CV Scanner Logo" width={40} height={40} priority />
          <span className="font-bold text-xl">CV Scanner</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="text-sm font-medium hover:underline">
            Login
          </Link>
          <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
            Register
          </Link>
        </div>
      </header>
      <main className="flex flex-col gap-[32px] items-center text-center max-w-3xl">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          Scan and <span className="text-blue-600">analyze resumes</span> with AI
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mt-4">Streamline your hiring process with our advanced CV scanning and analysis platform</p>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link href="/register?type=company" className="bg-blue-600 text-white px-6 py-3 rounded-md text-base sm:text-lg font-semibold hover:bg-blue-700 transition-colors">
            Register as Company
          </Link>
          <Link href="/register?type=applicant" className="border border-gray-300 px-6 py-3 rounded-md text-base sm:text-lg font-semibold hover:bg-gray-50 transition-colors dark:border-gray-700 dark:hover:bg-gray-900">
            Register as Applicant
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-4xl">
          <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <path d="M20 7h-3a2 2 0 0 1-2-2V2"></path>
                <path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h6l5 5v9a2 2 0 0 1-2 2z"></path>
                <path d="M14 22H4a2 2 0 0 1-2-2v-8.5"></path>
                <rect width="8" height="6" x="2" y="12"></rect>
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload CV</h3>
            <p className="text-gray-600 dark:text-gray-400">Securely upload your resume for AI analysis</p>
          </div>

          <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                <circle cx="12" cy="12" r="4"></circle>
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
            <p className="text-gray-600 dark:text-gray-400">Advanced Gemini Pro AI extracts key information</p>
          </div>

          <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Candidate Management</h3>
            <p className="text-gray-600 dark:text-gray-400">Easily manage and review applicant profiles</p>
          </div>
        </div>
      </main>
      <footer className="w-full py-6 flex justify-center border-t border-gray-200 dark:border-gray-800 mt-12">
        <div className="text-sm text-gray-600 dark:text-gray-400">© 2025 CV Scanner. All rights reserved.</div>
      </footer>
    </div>
  );
}
