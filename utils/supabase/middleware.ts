import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { readDomainId } from "../actions/readDomainId";

export const updateSession = async (request: NextRequest) => {
  try {
    // Create an unmodified response
    let initialResponse = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            initialResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              initialResponse.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // Refresh session if expired - required for Server Components
    const { data: user, error } = await supabase.auth.getUser();
    
    const url = request.nextUrl;
    const pathname = url.pathname;
  
    // Get hostname (e.g., 'mike.com', 'test.mike.com')
    const hostname = request.headers.get("host");
    console.log("Hostname:", hostname); // Logging hostname
  
    let currentHost;
    if (process.env.NODE_ENV === "production") {
      // In production, use the custom base domain from environment variables
      const baseDomain = process.env.BASE_DOMAIN;
      currentHost = hostname?.replace(`.${baseDomain}`, "").toLowerCase();
    } else {
      // In development, handle localhost case
      currentHost = hostname?.replace(`.localhost:3000`, "").toLowerCase();
    }

    console.log("Current Host:", currentHost); // Logging currentHost
  
    // If there's no currentHost, likely accessing the root domain, handle accordingly
    if (!currentHost) {
      // Continue to the next middleware or serve the root content
      return NextResponse.next();
    }

    // Fetch domain_id and id from the schools table
    const school = await readDomainId(currentHost);
    console.log("Fetched School:", school); // Logging fetched school

    // Handle the case where no domain data is found
    if (!school) {
      // Continue to the next middleware or serve the root content
      return NextResponse.next();
    }

    const site_id = school.id;

    if (site_id) {
      return NextResponse.rewrite(
        new URL(`/${site_id}${pathname}`, request.url)
      );
    }

    // Define protected routes
    const isProtectedRoute = (pathname: string) =>
      pathname.startsWith("/tools") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/chatbot") ||
      pathname.startsWith("/protected") ||
      pathname.startsWith("/history") ||
      pathname.startsWith("/rooms");

    // Redirect to /sign-in if accessing protected routes without authentication
    if (isProtectedRoute(request.nextUrl.pathname) && error) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Redirect / to /dashboard if the user is authenticated
    if (request.nextUrl.pathname === "/" && !error) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Allow the request to proceed for other cases
    return initialResponse;
  } catch (e) {
    console.error("Middleware Error:", e); // Logging error
    // Handle errors (e.g., missing environment variables)
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};

