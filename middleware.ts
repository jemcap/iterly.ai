import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
    console.log("Protected route accessed:", req.nextUrl.pathname);
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",    // User dashboard
    "/profile/:path*",      // User profile
    "/settings/:path*",     // User settings
    "/api/tasks/:path*",    // API routes
    "/api/feedback/:path*", // Feedback API
    "/api/design-files/:path*", // Design files API
    "/api/nlp/process/:path*", // NLP processing API
  ],
};
// This middleware will protect the specified routes and ensure that only authenticated users can access them.
// It uses the `next-auth` middleware to check for a valid session token and allows access
// only if the user is authenticated. The `matcher` specifies which paths this middleware applies to.
