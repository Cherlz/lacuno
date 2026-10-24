import "server-only";
import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Login is switched on only when all Auth0 settings are present, so the app
// still runs (without accounts) before Auth0 is configured.
export const authEnabled = Boolean(
  process.env.AUTH0_DOMAIN && process.env.AUTH0_CLIENT_ID && process.env.AUTH0_CLIENT_SECRET && process.env.AUTH0_SECRET,
);

export const auth0 = authEnabled
  ? new Auth0Client({ authorizationParameters: { scope: "openid profile email" } })
  : null;
