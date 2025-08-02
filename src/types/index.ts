import { Database } from "./database";

// Auth related types
export type UserRole = "company_admin" | "applicant";

export interface UserMetadata {
  role?: UserRole;
  company_id?: string;
}

// User from Supabase auth with additional metadata
export interface User {
  id: string;
  email: string;
  role: UserRole;
  company_id?: string;
}

// Database typed objects
export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type CvUpload = Database["public"]["Tables"]["cv_uploads"]["Row"];

// Form inputs
export interface CompanyRegistrationFormData {
  email: string;
  password: string;
  name: string;
  industry: string;
}

export interface ApplicantRegistrationFormData {
  email: string;
  password: string;
  company_id: string;
}
