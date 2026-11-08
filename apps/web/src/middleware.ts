export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/invoices/:path*", "/expenses/:path*", "/cash/:path*", "/forecast/:path*", "/simulations/:path*", "/parties/:path*", "/settings/:path*", "/retainers/:path*"],
};
