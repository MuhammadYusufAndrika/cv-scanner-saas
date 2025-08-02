import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes (except home route which we handle differently)
  if (pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/_next") || pathname.startsWith("/api/public")) {
    return NextResponse.next();
  }

  // Create supabase server client
  const supabase = createClient();

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // Redirect to login if no session found
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Get user metadata which contains role and company_id
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Try to find role from multiple sources
  let role = user?.user_metadata?.role;
  if (!role && user?.app_metadata?.role) {
    role = user.app_metadata.role;
  }

  // If still no role, query database as fallback
  if (!role && user) {
    try {
      // Check if user is a company admin by querying companies table
      const { data: companyData } = await supabase.from("companies").select("id").eq("user_id", user.id).single();

      if (companyData) {
        role = "company_admin";
        // Update user metadata for future requests
        await supabase.auth.updateUser({
          data: { role: "company_admin" },
        });
      } else {
        role = "applicant";
        // Update user metadata for future requests
        await supabase.auth.updateUser({
          data: { role: "applicant" },
        });
      }
    } catch (error) {
      console.error("Error determining user role:", error);
    }
  }

  const company_id = user?.user_metadata?.company_id;

  // Specific route protections
  if (pathname === "/") {
    // Redirect logged-in users to their appropriate page
    if (role === "company_admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else if (role === "applicant") {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  if (pathname.startsWith("/dashboard")) {
    // Only company admins can access the dashboard
    if (role !== "company_admin") {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  if (pathname.startsWith("/profile")) {
    // Redirect company admins to dashboard
    if (role === "company_admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // CV upload routes should include company_id for applicants
  if (pathname.startsWith("/api/cv/upload") && role === "applicant" && !company_id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return NextResponse.next();
}

// Specify routes that should be checked by middleware
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
