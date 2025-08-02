"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import createClientSupabase from "@/lib/supabase/client";

export default function RegistrationSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const supabase = createClientSupabase();
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (session) {
        setIsLoggedIn(true);
        // Get user role
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const role = user?.user_metadata?.role || user?.app_metadata?.role;
        setUserRole(role);
        console.log("User already logged in with role:", role);
      } else {
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    }

    checkSession();
  }, []);

  const handleContinue = () => {
    if (userRole === "company_admin") {
      router.push("/dashboard");
    } else if (userRole === "applicant") {
      router.push("/profile");
    } else {
      router.push("/");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Registration Complete</h1>
        <p className="text-center mb-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Registration Complete</h1>

      <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-md mb-6 text-center">
        <p className="text-green-700 dark:text-green-400">Your registration was successful!</p>
      </div>

      {email && !isLoggedIn && (
        <div className="mb-6 text-center">
          <p className="mb-2">A verification email has been sent to:</p>
          <p className="font-medium bg-gray-50 dark:bg-gray-900 p-2 rounded-md">{email}</p>
          <p className="mt-4">Please check your inbox and follow the verification link before logging in.</p>
        </div>
      )}

      <div className="flex justify-center">
        {isLoggedIn ? (
          <button onClick={handleContinue} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md font-medium">
            Continue to {userRole === "company_admin" ? "Dashboard" : "Profile"}
          </button>
        ) : (
          <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md font-medium">
            Go to Login
          </Link>
        )}
      </div>
    </div>
  );
}
