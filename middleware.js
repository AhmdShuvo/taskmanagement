import { NextResponse } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import jwt from 'jsonwebtoken';

let defaultLocale = "en";
let locales = ["bn", "en", "ar"];

// Get the preferred locale
function getLocale(request) {
  const acceptedLanguage = request.headers.get("accept-language") ?? undefined;
  let headers = { "accept-language": acceptedLanguage };
  let languages = new Negotiator({ headers }).languages();

  return match(languages, locales, defaultLocale);
}

export async function middleware(request) {
  // 1. Locale Handling
  const pathname = request.nextUrl.pathname;
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    return NextResponse.redirect(
      new URL(`/${locale}/${pathname}`, request.url)
    );
  }

  // 2. Authentication Handling

  const token = request.cookies.get('token')?.value || ''; // Or wherever you store the token
  const path = request.nextUrl.pathname;
  const localeSegment = path.split('/')[1]; // Extract locale if present (e.g., 'en', 'bn', 'ar')

  // Define public paths that *don't* require authentication.  Include locale prefix.
  const publicPaths = [
    `/${localeSegment}/login`,
    `/${localeSegment}/register`,
    `/${localeSegment}`, // Root path with locale
    `/${localeSegment}/error-page`,
    `/${localeSegment}/not-found`,
    `/${localeSegment}/utility`,
    '/', // Root path (without locale)
    '/login', //login without locale
    '/register'// register without locale
  ].filter(Boolean); // Remove empty strings

  const isPublicPath = publicPaths.includes(path) || publicPaths.some(p => path.startsWith(p + '/')); // Handle paths with trailing slashes

  if (isPublicPath) {
    return NextResponse.next();
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return NextResponse.next();

  } catch (error) {
    console.error("Authentication error:", error);
    // Preserve the locale when redirecting to the login page
    const loginUrlWithLocale = `/${localeSegment}/login`;

    return NextResponse.redirect(new URL(loginUrlWithLocale, request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next (Next.js internals)
     * - static and images (static files)
     * - favicon.ico
     */
    "/((?!api|assets|docs|.*\\..*|_next|favicon.ico).*)",
    // Optional: only run on root (/) URL
  ],
};