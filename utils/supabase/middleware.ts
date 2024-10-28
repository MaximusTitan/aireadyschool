import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    // Create an unmodified response
    let response = NextResponse.next({
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
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // Refresh session if expired - required for Server Components
    const { data: user, error } = await supabase.auth.getUser();

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

    // Redirect / to /tools if the user is authenticated
    if (request.nextUrl.pathname === "/" && !error) {
      return NextResponse.redirect(new URL("/tools", request.url));
    }

    // Allow the request to proceed for other cases
    return response;
  } catch (e) {
    // Handle errors (e.g., missing environment variables)
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
