-- Create tables with RLS enabled
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.cv_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  gemini_extracted_result JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_uploads ENABLE ROW LEVEL SECURITY;

-- Create a function to check if a user is a company admin
CREATE OR REPLACE FUNCTION public.is_company_admin(company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1
      FROM auth.users
      WHERE
        id = auth.uid() AND
        raw_user_meta_data->>'role' = 'company_admin' AND
        raw_user_meta_data->>'company_id' = company_id::TEXT
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user belongs to a company
CREATE OR REPLACE FUNCTION public.belongs_to_company(company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1
      FROM auth.users
      WHERE
        id = auth.uid() AND
        (
          (raw_user_meta_data->>'role' = 'company_admin' AND raw_user_meta_data->>'company_id' = company_id::TEXT)
          OR
          (raw_user_meta_data->>'role' = 'applicant' AND raw_user_meta_data->>'company_id' = company_id::TEXT)
        )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Companies table policies

-- Company admins can only see their own company
CREATE POLICY "Company admins can view their own company" ON public.companies
  FOR SELECT
  USING (user_id = auth.uid());

-- Only company admins can create companies
CREATE POLICY "Company admins can create companies" ON public.companies
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    (auth.jwt()->>'role' = 'company_admin' OR 
     EXISTS (
       SELECT 1 FROM auth.users 
       WHERE id = auth.uid() AND 
       raw_user_meta_data->>'role' = 'company_admin'
     ))
  );

-- Allow any authenticated user to create a company record for themselves
CREATE POLICY "Authenticated users can create their own company" ON public.companies
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    auth.role() = 'authenticated'
  );

-- Only company admins can update their own company
CREATE POLICY "Company admins can update their own company" ON public.companies
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- CV uploads policies

-- Users can view CV uploads for their company
CREATE POLICY "Users can view CV uploads for their company" ON public.cv_uploads
  FOR SELECT
  USING (
    -- Company admins can see all CVs for their company
    (
      auth.jwt()->>'role' = 'company_admin' AND
      company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
    )
    OR
    -- Applicants can only see their own CVs
    (
      auth.jwt()->>'role' = 'applicant' AND
      user_id = auth.uid()
    )
  );

-- Applicants can insert CVs for their company
CREATE POLICY "Applicants can insert CVs for their company" ON public.cv_uploads
  FOR INSERT
  WITH CHECK (
    auth.jwt()->>'role' = 'applicant' AND
    user_id = auth.uid() AND
    company_id = (auth.jwt()->>'company_id')::UUID
  );

-- Users can update their own CV uploads
CREATE POLICY "Users can update their own CV uploads" ON public.cv_uploads
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create storage buckets with appropriate policies
INSERT INTO storage.buckets (id, name) VALUES ('cv-documents', 'cv-documents');

-- Storage policies for CV documents
CREATE POLICY "Applicants can upload their CVs" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'cv-documents' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.jwt()->>'company_id'
  );

CREATE POLICY "Company admins can view company CVs" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'cv-documents' AND
    auth.role() = 'authenticated' AND
    (
      -- Company admins can see all CVs for their company
      (
        auth.jwt()->>'role' = 'company_admin' AND
        (storage.foldername(name))[1] IN (
          SELECT id::text FROM public.companies WHERE user_id = auth.uid()
        )
      )
      OR
      -- Applicants can only see their own CVs
      (
        auth.jwt()->>'role' = 'applicant' AND
        (storage.foldername(name))[1] = auth.jwt()->>'company_id' AND
        (storage.foldername(name))[2] LIKE auth.uid() || '%'
      )
    )
  );

-- Create auth user trigger to handle user creation with roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is a company admin, associate them with their company
  IF NEW.raw_user_meta_data->>'role' = 'company_admin' THEN
    -- Company record will be created by the client
    RETURN NEW;
  END IF;

  -- If the user is an applicant, update their metadata with company_id
  IF NEW.raw_user_meta_data->>'role' = 'applicant' AND NEW.raw_user_meta_data->>'company_id' IS NOT NULL THEN
    -- Verify company exists
    IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = (NEW.raw_user_meta_data->>'company_id')::UUID) THEN
      RAISE EXCEPTION 'Invalid company_id';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
