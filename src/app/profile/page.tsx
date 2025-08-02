import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CvUploader from "@/components/cv/cv-uploader";
import { User } from "@/types";

export default async function ProfilePage() {
  const supabase = createClient();

  // Check session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Get user details
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata.role !== "applicant") {
    redirect("/");
  }

  // Create user object
  const userData: User = {
    id: user.id,
    email: user.email!,
    role: user.user_metadata.role as "applicant",
    company_id: user.user_metadata.company_id,
  };

  // Get user's CV uploads
  const { data: cvUploads } = await supabase.from("cv_uploads").select("*").eq("user_id", user.id).order("created_at", { ascending: false });

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Personal Info</h2>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Email</p>
              <p className="font-medium">{userData.email}</p>
            </div>
          </div>

          <CvUploader user={userData} />
        </div>

        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Your CV Uploads</h2>

            {cvUploads && cvUploads.length > 0 ? (
              <div className="space-y-4">
                {cvUploads.map((cv: any) => (
                  <div key={cv.id} className="border dark:border-gray-700 p-4 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">CV Upload</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(cv.created_at).toLocaleDateString()}</p>
                      </div>
                      <a href={cv.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                        View PDF
                      </a>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm">{cv.gemini_extracted_result ? "Analysis complete" : "Pending analysis"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">You haven&apos;t uploaded any CVs yet. Use the form on the left to upload your CV.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
