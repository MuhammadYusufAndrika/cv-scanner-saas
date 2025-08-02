import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User } from "@/types";
import RegistrationLink from "@/components/dashboard/registration-link"; // Impor komponen Client
import CompanyForm from "@/components/dashboard/company-form";

export default async function DashboardPage() {
  try {
    const supabase = createClient();

    // Check session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.log("No session found, redirecting to login");
      redirect("/login");
    }

    // Get user details
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("No user found, redirecting to home");
      redirect("/");
    }

    console.log("User metadata:", JSON.stringify(user.user_metadata || {}));

    // Handle case when role might not exist in metadata
    const userRole = user.user_metadata?.role || user.app_metadata?.role || "unknown";

    if (userRole !== "company_admin") {
      console.log(`User role is ${userRole}, not company_admin, redirecting to home`);
      redirect("/");
    }

    // Create user object
    const userData: User = {
      id: user.id,
      email: user.email!,
      role: userRole as "company_admin",
    };

    // Try to get company info without using .single() first
    const { data: companies, error: companyQueryError } = await supabase.from("companies").select("*").eq("user_id", user.id);

    if (companyQueryError) {
      console.error("Error fetching companies:", companyQueryError.message);
      return (
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold mb-4">Dashboard Error</h1>
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-md">
            <p>Error loading company information: {companyQueryError.message}</p>
            <p className="mt-2">Please ensure your company record is properly set up.</p>
          </div>
        </div>
      );
    }

    // Check if we have any companies
    if (!companies || companies.length === 0) {
      console.log("No company found for this user");

      // Form to create a company
      return (
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6">Create Your Company</h1>
          <p className="mb-8">To complete your registration, please create a company profile.</p>

          <CompanyForm userId={user.id} />
        </div>
      );
    }

    // Use the first company found
    const company = companies[0];

    // Get latest CV uploads with error handling
    const { data: recentCvs, error: cvsError } = await supabase
      .from("cv_uploads")
      .select(
        `
        id,
        file_url,
        created_at,
        gemini_extracted_result,
        user_id
      `
      )
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (cvsError) {
      console.error("Error fetching CV uploads:", cvsError.message);
    }

    // Get total counts with error handling
    const { count: totalApplicants, error: applicantsError } = await supabase.from("auth.users").select("*", { count: "exact", head: true }).eq("raw_user_meta_data->company_id", company.id).eq("raw_user_meta_data->role", "applicant");

    if (applicantsError) {
      console.error("Error fetching applicant count:", applicantsError.message);
    }

    const { count: totalCvs, error: totalCvsError } = await supabase.from("cv_uploads").select("*", { count: "exact", head: true }).eq("company_id", company.id);

    if (totalCvsError) {
      console.error("Error fetching CV count:", totalCvsError.message);
    }

    const { count: analyzedCvs, error: analyzedCvsError } = await supabase.from("cv_uploads").select("*", { count: "exact", head: true }).eq("company_id", company.id).not("gemini_extracted_result", "is", null);

    if (analyzedCvsError) {
      console.error("Error fetching analyzed CV count:", analyzedCvsError.message);
    }

    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Company Dashboard</h1>

          <div>
            <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs font-medium py-1 px-2 rounded">{company.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-2">Total Applicants</h2>
            <p className="text-3xl font-bold">{totalApplicants || 0}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-2">CV Uploads</h2>
            <p className="text-3xl font-bold">{totalCvs || 0}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-2">Analyzed CVs</h2>
            <p className="text-3xl font-bold">{analyzedCvs || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent CV Uploads</h2>
              <Link href="/dashboard/cvs" className="text-blue-600 hover:underline text-sm">
                View all
              </Link>
            </div>

            {recentCvs && recentCvs.length > 0 ? (
              <div className="space-y-4">
                {recentCvs.map((cv: any) => (
                  <Link key={cv.id} href={`/dashboard/cvs/${cv.id}`} className="block border dark:border-gray-700 p-4 rounded-md hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">CV Upload</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(cv.created_at).toLocaleDateString()}</p>
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full ${
                          cv.gemini_extracted_result ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        }`}
                      >
                        {cv.gemini_extracted_result ? "Analyzed" : "Pending"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No CV uploads yet.</p>
            )}
          </div>

          {/* Ganti dengan Client Component */}
          <RegistrationLink companyId={company.id} />
        </div>
      </div>
    );
  } catch (error) {
    // Global error handler
    console.error("Dashboard error:", error);
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-md">
          <p>An error occurred while loading the dashboard.</p>
          <p className="mt-2">Please try again later or contact support.</p>
          <pre className="mt-4 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">{error instanceof Error ? error.message : String(error)}</pre>
        </div>
      </div>
    );
  }
}
