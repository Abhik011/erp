import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/** Routes that stay public (marketing + auth). Everything else requires a signed-in Clerk user. */
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing(.*)",
  "/logout(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;
  await auth.protect();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
