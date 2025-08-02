"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import createClientSupabase from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "company";
  const companyId = searchParams.get("company_id") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);

  // Jika ini adalah pendaftaran aplikasi, ambil info perusahaan untuk ditampilkan
  useEffect(() => {
    if (type === "applicant" && companyId) {
      fetchCompanyInfo();
    }
  }, [type, companyId]);

  const fetchCompanyInfo = async () => {
    setIsLoadingCompany(true);
    const supabase = createClientSupabase();

    try {
      const { data, error } = await supabase.from("companies").select("name, industry").eq("id", companyId).single();

      if (error) {
        throw error;
      }

      if (data) {
        setCompanyInfo(data);
      }
    } catch (err: any) {
      console.error("Error fetching company:", err.message);
      setError(`Could not verify company information. Please check the URL and try again.`);
    } finally {
      setIsLoadingCompany(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const supabase = createClientSupabase();

    try {
      console.log(`Registering as ${type}...`);

      // Validasi password length
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      // Set user metadata based on type
      const userData = type === "company" ? { role: "company_admin" } : { role: "applicant", company_id: companyId };

      console.log("Registering with user data:", userData);

      // Step 1: Create the user with role in metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (authError) {
        console.error("Auth error:", authError);
        throw authError;
      }

      console.log("Auth data:", authData);

      if (!authData.user) {
        throw new Error("User registration failed");
      }

      // Step 2: Sign in to get a session
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Jika email confirmation dibutuhkan, kita arahkan ke halaman success
        if (signInError.message.includes("Email not confirmed")) {
          console.log("Email confirmation required");
          router.push("/register/success?email=" + encodeURIComponent(email));
          return;
        }
        console.error("Sign in error after registration:", signInError);
        throw signInError;
      }

      console.log("Sign in data after registration:", signInData);

      // Step 3: For company registration, create a company record
      if (type === "company") {
        console.log("Creating company record...");

        // Debug to see the user ID
        console.log("User ID:", authData.user.id);

        // Create company record with service role key (di server)
        // Untuk sementara kita akan mencoba tanpa menonaktifkan RLS
        // dan memastikan RLS policy di Supabase mengizinkan user membuat company
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .insert([
            {
              name: companyName,
              industry,
              user_id: authData.user.id,
            },
          ])
          .select()
          .single();

        if (companyError) {
          console.error("Company creation error:", companyError);

          // Jika gagal membuat company, buat endpoint API server untuk membantu
          if (companyError.message.includes("row-level security policy")) {
            // Fallback: Kirim request ke API endpoint yang menggunakan service_role key
            const response = await fetch("/api/create-company", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: companyName,
                industry,
                userId: authData.user.id,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || "Failed to create company");
            }

            const companyData = await response.json();
            console.log("Company created via API:", companyData);

            // Lanjutkan dengan update metadata user
            const { error: updateError } = await supabase.auth.updateUser({
              data: {
                role: "company_admin",
                company_id: companyData.id,
              },
            });

            if (updateError) {
              console.error("Failed to update user metadata:", updateError);
            } else {
              console.log("User metadata updated with company_id");
            }
          } else {
            throw companyError;
          }
        } else {
          console.log("Company created:", companyData);

          // Update user metadata with company_id
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              role: "company_admin",
              company_id: companyData.id,
            },
          });

          if (updateError) {
            console.error("Failed to update user metadata:", updateError);
          } else {
            console.log("User metadata updated with company_id");
          }
        }
      }

      // Redirect based on confirmation status
      if (type === "company") {
        router.push("/dashboard");
      } else {
        router.push("/profile");
      }
    } catch (err: any) {
      console.error("Registration error:", err);

      // Better error message
      if (err.message?.includes("duplicate key value violates unique constraint")) {
        setError("This email is already registered. Please log in instead.");
      } else if (err.message?.includes("row-level security policy")) {
        setError("Permission error when creating company record. Please contact support.");
      } else {
        setError(err.message || "An error occurred during registration");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">{type === "company" ? "Register as a Company" : "Register as an Applicant"}</h1>

      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 mb-4 rounded-md text-sm">{error}</div>}

      {type === "applicant" && companyInfo && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md">
          <p className="font-medium">You are registering as an applicant for:</p>
          <p className="text-lg font-bold">{companyInfo.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Industry: {companyInfo.industry}</p>
        </div>
      )}

      {type === "applicant" && isLoadingCompany && (
        <div className="mb-6 text-center p-4">
          <p>Verifying company information...</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md" />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md" />
          <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters long</p>
        </div>

        {type === "company" && (
          <>
            <div className="mb-4">
              <label htmlFor="companyName" className="block text-sm font-medium mb-1">
                Company Name
              </label>
              <input id="companyName" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md" />
            </div>

            <div className="mb-6">
              <label htmlFor="industry" className="block text-sm font-medium mb-1">
                Industry
              </label>
              <select id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md">
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
          </>
        )}

        <button
          type="submit"
          disabled={isLoading || (type === "applicant" && !companyInfo && !error)}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 ${isLoading || (type === "applicant" && !companyInfo && !error) ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Log in
        </Link>
      </div>
    </div>
  );
}
