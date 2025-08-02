"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import createClientSupabase from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const supabase = createClientSupabase();

    try {
      console.log("Attempting to sign in with:", email);

      // Langsung proses login saja
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Sign-in response:", signInError ? "Error" : "Success");

      if (signInError) {
        console.error("Sign in error:", signInError.message);

        if (signInError.message.includes("Email not confirmed")) {
          // Jika email belum dikonfirmasi, tawarkan untuk mengirim ulang email konfirmasi
          setError("Please check your email inbox and confirm your email address before logging in.");

          // Tambahkan tombol untuk mengirim ulang email konfirmasi
          const { error: resendError } = await supabase.auth.resend({
            type: "signup",
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/login`,
            },
          });

          if (resendError) {
            console.error("Error resending confirmation email:", resendError);
          } else {
            setError("Email not confirmed. A new confirmation email has been sent. Please check your inbox.");
          }
        } else if (signInError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.");
        } else {
          throw new Error(signInError.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Log the full user object to inspect metadata
        console.log("User data:", JSON.stringify(data.user));

        // Try to find the role from metadata
        let userRole = null;

        // Check for role in user_metadata (primary location)
        if (data.user.user_metadata && data.user.user_metadata.role) {
          userRole = data.user.user_metadata.role;
          console.log("Role found in user_metadata:", userRole);
        }
        // Check for role in app_metadata (fallback location)
        else if (data.user.app_metadata && data.user.app_metadata.role) {
          userRole = data.user.app_metadata.role;
          console.log("Role found in app_metadata:", userRole);
        } else {
          console.log("No role found in metadata, redirecting to home");
          router.push("/");
          return;
        }

        if (userRole === "company_admin") {
          router.push("/dashboard");
        } else if (userRole === "applicant") {
          router.push("/profile");
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);

      // Provide more user-friendly error messages
      if (err.message?.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again. If you just registered, you may need to verify your email first.");
      } else if (err.message?.includes("Email not confirmed")) {
        setError("Please check your email inbox and confirm your email address before logging in.");
      } else {
        setError(err.message || "An error occurred during login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 mb-4 rounded-md text-sm">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md" />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md" />
        </div>

        <button type="submit" disabled={isLoading} className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}>
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* Tambahkan bagian untuk bantuan login */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-3">Having trouble logging in?</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={async () => {
              if (!email) {
                setError("Please enter your email first");
                return;
              }
              setIsLoading(true);
              try {
                const { error } = await createClientSupabase().auth.resend({
                  type: "signup",
                  email,
                });
                if (error) throw error;
                alert("Confirmation email has been sent again. Please check your inbox.");
              } catch (err: any) {
                setError(err.message);
              } finally {
                setIsLoading(false);
              }
            }}
            className="text-sm text-blue-600 hover:underline"
            disabled={isLoading}
          >
            Resend confirmation
          </button>
        </div>
      </div>

      <div className="mt-4 text-center text-sm">
        Don't have an account?{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          Register
        </Link>
      </div>
    </div>
  );
}
