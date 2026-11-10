export { auth as middleware } from "@/auth";

/** Session presence only (course s.16): no database, no business permission here. */
export const config = {
  matcher: [
    "/dashboard/:path*", "/invoices/:path*", "/expenses/:path*", "/cash/:path*", "/forecast/:path*",
    "/simulations/:path*", "/parties/:path*", "/settings/:path*", "/retainers/:path*", "/onboarding/:path*",
    "/forbidden", "/api/invoices/:path*",
  ],
};
