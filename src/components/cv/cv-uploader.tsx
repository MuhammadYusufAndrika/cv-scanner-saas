"use client";

import { useState } from "react";
import createClientSupabase from "@/lib/supabase/client"; // Removed curly braces
import { User } from "@/types";

interface CvUploaderProps {
  user: User;
}

export default function CvUploader({ user }: CvUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      // Validate file type (PDF only)
      if (!selectedFile.type.includes("pdf")) {
        setError("Please upload a PDF file only.");
        setFile(null);
        return;
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB.");
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !user.company_id) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    const supabase = createClientSupabase();

    try {
      // Upload file to storage
      const timestamp = new Date().getTime();
      const fileName = `${user.id}-${timestamp}-${file.name}`;
      const filePath = `cv-uploads/${user.company_id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage.from("cv-documents").upload(filePath, file, {
        upsert: true,
      });

      if (uploadError) throw new Error(uploadError.message);

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from("cv-documents").getPublicUrl(uploadData.path);

      // Save record to cv_uploads table
      const { data: insertedData, error: dbError } = await supabase
        .from("cv_uploads")
        .insert({
          user_id: user.id,
          company_id: user.company_id,
          file_path: filePath,
          file_name: file.name,
        })
        .select();

      if (dbError) throw new Error(dbError.message);

      // Use the inserted record ID, not the upload ID
      const cvUploadId = insertedData?.[0]?.id;

      // Trigger analysis process
      const response = await fetch("/api/cv/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileUrl: publicUrlData.publicUrl,
          cvUploadId: cvUploadId,
        }),
      });

      if (!response.ok) {
        console.error("Analysis triggered with warnings:", await response.json());
      }

      setSuccess("Your CV was uploaded successfully! We are analyzing it now.");
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById("cv-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Upload Your CV</h2>

      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 mb-4 rounded-md text-sm">{error}</div>}

      {success && <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-3 mb-4 rounded-md text-sm">{success}</div>}

      <div className="mb-4">
        <label htmlFor="cv-upload" className="block text-sm font-medium mb-2">
          Select PDF file
        </label>
        <input
          id="cv-upload"
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-900 dark:text-gray-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    dark:file:bg-blue-900/30 dark:file:text-blue-400
                    hover:file:bg-blue-100 dark:hover:file:bg-blue-900/40"
          disabled={isUploading}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">PDF only, max 5MB</p>
      </div>

      {isUploading && (
        <div className="mb-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-1">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{uploadProgress}% complete</p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? "Uploading..." : "Upload CV"}
      </button>
    </div>
  );
}
