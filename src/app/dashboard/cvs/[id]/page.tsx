import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { User } from "@/types";

interface CvDetailPageProps {
  params: {
    id: string;
  };
}

export default async function CvDetailPage({ params }: CvDetailPageProps) {
  const cvId = params.id;
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

  if (!user || user.user_metadata.role !== "company_admin") {
    redirect("/");
  }

  // Get company info
  const { data: company } = await supabase.from("companies").select("*").eq("user_id", user.id).single();

  if (!company) {
    redirect("/");
  }

  // Get CV details
  const { data: cv } = await supabase
    .from("cv_uploads")
    .select(
      `
      *,
      users:user_id (
        id,
        email,
        user_metadata
      )
    `
    )
    .eq("id", cvId)
    .eq("company_id", company.id) // Ensure company_id matches (RLS should handle this anyway)
    .single();

  if (!cv) {
    return notFound();
  }

  // Parse the Gemini extracted result
  const analysisResult = cv.gemini_extracted_result ? JSON.parse(cv.gemini_extracted_result) : null;

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center mb-8">
        <Link href="/dashboard/cvs" className="text-blue-600 hover:underline mr-4">
          ← Back to CVs
        </Link>
        <h1 className="text-3xl font-bold">CV Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Applicant Info</h2>
            <dl>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Email</dt>
              <dd className="font-medium mb-2">{cv.users.email}</dd>

              <dt className="text-sm text-gray-600 dark:text-gray-400">Upload Date</dt>
              <dd className="font-medium mb-2">{new Date(cv.created_at).toLocaleDateString()}</dd>

              <dt className="text-sm text-gray-600 dark:text-gray-400">Status</dt>
              <dd className="font-medium mb-2">
                <span
                  className={`inline-block text-xs px-2 py-1 rounded-full ${
                    cv.gemini_extracted_result ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                  }`}
                >
                  {cv.gemini_extracted_result ? "Analyzed" : "Pending Analysis"}
                </span>
              </dd>
            </dl>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Document</h2>
            <a href={cv.file_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium block text-center">
              View Original CV
            </a>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-6">CV Analysis</h2>

            {analysisResult ? (
              <div className="space-y-6">
                {/* Profile section */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Profile</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysisResult.name && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                        <p className="font-medium">{analysisResult.name}</p>
                      </div>
                    )}

                    {analysisResult.title && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Job Title</p>
                        <p className="font-medium">{analysisResult.title}</p>
                      </div>
                    )}

                    {analysisResult.location && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                        <p className="font-medium">{analysisResult.location}</p>
                      </div>
                    )}

                    {analysisResult.contactInfo && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Contact</p>
                        <p className="font-medium">{analysisResult.contactInfo}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills section */}
                {analysisResult.skills && analysisResult.skills.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.skills.map((skill: string, index: number) => (
                        <span key={index} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium py-1 px-2 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience section */}
                {analysisResult.experience && analysisResult.experience.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Experience</h3>
                    <div className="space-y-4">
                      {analysisResult.experience.map((exp: any, index: number) => (
                        <div key={index} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                          <p className="font-medium">{exp.position || "Position"}</p>
                          <p className="text-sm">{exp.company || "Company"}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{exp.duration || "Duration"}</p>
                          {exp.description && <p className="text-sm mt-1">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education section */}
                {analysisResult.education && analysisResult.education.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Education</h3>
                    <div className="space-y-3">
                      {analysisResult.education.map((edu: any, index: number) => (
                        <div key={index}>
                          <p className="font-medium">{edu.degree || "Degree"}</p>
                          <p className="text-sm">{edu.institution || "Institution"}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{edu.duration || "Duration"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary section */}
                {analysisResult.summary && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Summary</h3>
                    <p className="text-sm">{analysisResult.summary}</p>
                  </div>
                )}

                {/* AI Analysis section */}
                {analysisResult.aiAnalysis && (
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-lg mb-2">AI Analysis</h3>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4">
                      <p className="text-sm">{analysisResult.aiAnalysis}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">This CV is still being analyzed by our AI. Please check back later.</p>
                <button
                  onClick={async () => {
                    // Trigger reanalysis
                    const response = await fetch("/api/cv/analyze", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        fileUrl: cv.file_url,
                        cvUploadId: cv.id,
                      }),
                    });

                    // Refresh page
                    window.location.reload();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium text-sm"
                >
                  Retry Analysis
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
