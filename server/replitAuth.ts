import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  // Check if user already exists to avoid overwriting existing roles
  const existingUser = await storage.getUser(claims["sub"]);
  
  // Check if user exists by email but with pending ID (created via User Management)
  const existingUserByEmail = await storage.getUserByEmail(claims["email"]);
  
  // For new users, determine roles based on email domain or admin configuration
  let defaultRoles = ["field_staff"];
  
  // Check if this is the first user (make them admin)
  const allUsers = await storage.getAllUsers();
  if (allUsers.length === 0) {
    defaultRoles = ["admin", "supervisor"];
    console.log("First user detected, assigning admin privileges:", claims["email"]);
  }
  
  // Admin emails can be configured via environment variable or hardcoded for key users
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const hardcodedAdminEmails = ['nagupv@gmail.com']; // Persistent admin emails
  const allAdminEmails = [...adminEmails, ...hardcodedAdminEmails];
  
  if (allAdminEmails.includes(claims["email"])) {
    defaultRoles = ["admin", "supervisor"];
    console.log("Admin email detected, assigning admin privileges:", claims["email"]);
  }

  // If user exists by email but with pending ID, activate them with real Replit ID
  if (existingUserByEmail && existingUserByEmail.id.startsWith('pending_')) {
    console.log("Activating pending user with Replit ID:", claims["email"]);
    
    // Delete the pending user record
    await storage.deleteUser(existingUserByEmail.id);
    
    // Create new user with real Replit ID and preserve roles
    await storage.upsertUser({
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
      roles: existingUserByEmail.roles, // Preserve existing roles
    });
    
    // Create audit entry for activation
    await storage.createAuditEntry({
      action: 'user_activation',
      userId: claims["sub"],
      reason: `User ${claims["email"]} activated via Replit Auth, migrated from pending ID ${existingUserByEmail.id}`
    });
  } else {
    // Normal user creation/update
    await storage.upsertUser({
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
      roles: existingUser ? existingUser.roles : JSON.stringify(defaultRoles),
    });
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      console.log(`[Auth Verify] Processing tokens for user authentication`);
      const claims = tokens.claims();
      console.log(`[Auth Verify] User claims:`, { 
        sub: claims.sub, 
        email: claims.email, 
        first_name: claims.first_name,
        last_name: claims.last_name 
      });
      
      const user = {};
      updateUserSession(user, tokens);
      console.log(`[Auth Verify] Updated user session`);
      
      await upsertUser(claims);
      console.log(`[Auth Verify] Upserted user successfully`);
      
      verified(null, user);
    } catch (error) {
      console.error(`[Auth Verify] Error during authentication verification:`, error);
      console.error(`[Auth Verify] Error details:`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      verified(error, null);
    }
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    // Determine the correct domain for the strategy
    const domains = process.env.REPLIT_DOMAINS!.split(",");
    const requestDomain = req.hostname;
    
    // For localhost development, use the first Replit domain
    const targetDomain = domains.find(d => d === requestDomain) || domains[0];
    
    console.log(`[Auth Login] Request hostname: ${requestDomain}`);
    console.log(`[Auth Login] Available domains: ${domains.join(', ')}`);
    console.log(`[Auth Login] Using strategy: replitauth:${targetDomain}`);
    
    passport.authenticate(`replitauth:${targetDomain}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    // Determine the correct domain for the strategy (same logic as login)
    const domains = process.env.REPLIT_DOMAINS!.split(",");
    const requestDomain = req.hostname;
    const targetDomain = domains.find(d => d === requestDomain) || domains[0];
    
    console.log(`[Auth Callback] Processing authentication callback for domain: ${requestDomain}`);
    console.log(`[Auth Callback] Query parameters:`, req.query);
    console.log(`[Auth Callback] Using strategy: replitauth:${targetDomain}`);
    
    passport.authenticate(`replitauth:${targetDomain}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, (error: any) => {
      if (error) {
        console.error(`[Auth Callback] Authentication error:`, error);
        console.error(`[Auth Callback] Error details:`, {
          message: error.message,
          stack: error.stack,
          code: error.code
        });
        res.status(500).json({ 
          error: "Authentication failed", 
          message: error.message,
          details: "Check server logs for more information"
        });
      } else {
        next();
      }
    });
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated()) {
    console.log("Authentication failed: User not authenticated");
    return res.status(401).json({ message: "Unauthorized - not authenticated" });
  }

  if (!user || !user.expires_at) {
    console.log("Authentication failed: No user or expires_at found", { user: !!user, expires_at: user?.expires_at });
    return res.status(401).json({ message: "Unauthorized - invalid session" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    // Check if user is still active in the system
    try {
      const userRecord = await storage.getUser(user.claims.sub);
      if (!userRecord || userRecord.isActive === false) {
        req.logout(() => {
          res.status(401).json({ message: "Account has been deactivated" });
        });
        return;
      }
    } catch (error) {
      console.error("Error checking user status:", error);
      return res.status(500).json({ message: "Authentication error" });
    }
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    
    // Check if user is still active after token refresh
    const userRecord = await storage.getUser(user.claims.sub);
    if (!userRecord || userRecord.isActive === false) {
      console.log("User account deactivated:", user.claims.sub);
      req.logout(() => {
        res.status(401).json({ message: "Account has been deactivated" });
      });
      return;
    }
    
    return next();
  } catch (error) {
    console.error("Token refresh failed:", error);
    res.status(401).json({ message: "Token refresh failed - please log in again" });
    return;
  }
};
