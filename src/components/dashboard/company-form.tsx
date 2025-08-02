"use client";

import { useState } from "react";
import { createClientSupabase } from "@/lib/supabase/client";

interface CompanyFormProps {
  userId: string;
}

export default function CompanyForm({ userId }: CompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("companyName") as string;
    const industry = formData.get("industry") as string;

    const supabase = createClientSupabase();

    try {
      const { data, error } = await supabase
        .from("companies")
        .insert([{ name, industry, user_id: userId }])
        .select();

      if (error) {
        throw error;
      }

      // Update user metadata with company_id
      if (data && data[0]) {
        await supabase.auth.updateUser({
          data: { company_id: data[0].id },
        });
      }

      // Reload the page
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "An error occurred while creating your company");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 mb-4 rounded-md text-sm">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="companyName" className="block text-sm font-medium mb-1">
            Company Name
          </label>
          <input id="companyName" name="companyName" type="text" required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md" />
        </div>

        <div className="mb-6">
          <label htmlFor="industry" className="block text-sm font-medium mb-1">
            Industry
          </label>
          <select id="industry" name="industry" required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md">
            <option value="">Select an industry</option>
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance</option>
            <option value="Education">Education</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Retail">Retail</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <button type="submit" disabled={isSubmitting} className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}>
          {isSubmitting ? "Creating..." : "Create Company"}
        </button>
      </form>
    </div>
  );
}
