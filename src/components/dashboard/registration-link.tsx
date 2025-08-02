'use client';

import { useState } from 'react';

interface RegistrationLinkProps {
  companyId: string;
}

export default function RegistrationLink({ companyId }: RegistrationLinkProps) {
  const [copied, setCopied] = useState(false);
  const registrationLink = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/register?type=applicant&company_id=${companyId}`;

  const handleCopyClick = () => {
    navigator.clipboard.writeText(registrationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Applicant Registration</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Share this registration link with applicants to allow them to upload their CVs to your company.</p>

      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md mb-4">
        <p className="text-sm font-mono break-all">{registrationLink}</p>
      </div>

      <button
        onClick={handleCopyClick}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium text-sm"
      >
        {copied ? "Copied!" : "Copy Registration Link"}
      </button>
    </div>
  );
}