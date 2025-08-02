import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_APP_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { fileUrl, cvUploadId } = await request.json();

    if (!fileUrl || !cvUploadId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get CV upload record to verify permissions
    const { data: cvUpload, error: cvUploadError } = await supabase.from("cv_uploads").select("*").eq("id", cvUploadId).single();

    if (cvUploadError || !cvUpload) {
      return NextResponse.json({ error: "CV upload not found" }, { status: 404 });
    }

    // Get user metadata
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userRole = user?.user_metadata.role;
    const userCompanyId = user?.user_metadata.company_id;

    // Check if user has permission to analyze this CV
    if ((userRole === "company_admin" && cvUpload.company_id !== user?.user_metadata.company_id) || (userRole === "applicant" && cvUpload.user_id !== user?.id)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Fetch CV content from the URL
    // In a real app, you'd need to extract text from the PDF
    // This is a simplified example that assumes fileUrl is accessible and contains text
    const cvResponse = await fetch(fileUrl);
    if (!cvResponse.ok) {
      return NextResponse.json({ error: "Could not fetch CV file" }, { status: 500 });
    }

    // In a real implementation, you'd use a PDF parsing library here
    // For this example, let's assume we have the CV text
    const cvText = "Sample CV text. In a real app, this would be extracted from the PDF.";

    // Create Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create prompt for analyzing the CV
    const prompt = `
      Analyze the following CV/resume and extract key information in a structured JSON format:
      
      ${cvText}
      
      Extract and return a JSON object with the following structure:
      {
        "name": "Candidate's full name",
        "title": "Job title/role",
        "contactInfo": "Email and/or phone",
        "location": "City, Country",
        "summary": "Brief professional summary",
        "skills": ["Skill 1", "Skill 2", ...],
        "experience": [
          {
            "position": "Job title",
            "company": "Company name",
            "duration": "Start date - End date",
            "description": "Brief description of responsibilities"
          }
        ],
        "education": [
          {
            "degree": "Degree name",
            "institution": "School/University name",
            "duration": "Start year - End year"
          }
        ],
        "aiAnalysis": "Provide a brief assessment of the candidate's strengths, experience level, and potential job fit"
      }
      
      Ensure the output is a valid JSON object without any markdown formatting or additional text.
    `;

    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();

    // Extract the JSON part from the response
    let extractedJson;
    try {
      // Look for JSON in the text - this handles cases where Gemini might add extra text
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedJson = JSON.parse(jsonMatch[0]);
      } else {
        extractedJson = JSON.parse(analysisText);
      }
    } catch (err) {
      console.error("Error parsing Gemini response as JSON:", err);
      // If parsing fails, store the raw text
      extractedJson = { raw: analysisText };
    }

    // Update the CV upload with extracted information
    const { error: updateError } = await supabase
      .from("cv_uploads")
      .update({ gemini_extracted_result: JSON.stringify(extractedJson) })
      .eq("id", cvUploadId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update CV analysis" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "CV analysis completed",
      result: extractedJson,
    });
  } catch (error: any) {
    console.error("CV analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze CV", message: error.message }, { status: 500 });
  }
}
