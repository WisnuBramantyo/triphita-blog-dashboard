import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";

function dashboardCredential(envKey: string, fallback: string): string {
  const raw = process.env[envKey];
  if (raw == null || raw.trim() === "") {
    return fallback;
  }
  return raw.trim();
}

declare global {
  namespace Express {
    interface User {
      username: string;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    passport?: { user?: string };
  }
}

export function configureAuth(app: Express): void {
  const sessionSecret =
    process.env.SESSION_SECRET || "dev-only-set-SESSION_SECRET-in-production";

  // Default express-session in-memory store (not `memorystore`). Passport 0.7's
  // req.logIn() calls session.regenerate(); some third-party memory stores have
  // been flaky with that flow and surfaced as 500 on POST /api/login.
  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.username);
  });

  passport.deserializeUser((username: string, done) => {
    done(null, { username });
  });

  app.use(passport.initialize());
  app.use(passport.session());
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    next();
    return;
  }
  res.status(401).json({ message: "Unauthorized" });
}

export function registerAuthRoutes(app: Express): void {
  app.post("/api/login", (req, res, next) => {
    const expectedUser = dashboardCredential("DASHBOARD_USERNAME", "admin");
    const expectedPass = dashboardCredential("DASHBOARD_PASSWORD", "changeme");

    const username =
      typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (!username || !password) {
      res.status(400).json({ message: "Enter a username and password." });
      return;
    }

    if (username !== expectedUser || password !== expectedPass) {
      res.status(401).json({ message: "Invalid username or password." });
      return;
    }

    const user: Express.User = { username: expectedUser };

    // Write session the same way Passport would after serializeUser (username string).
    // We avoid Passport's req.logIn() because it always calls session.regenerate(), which
    // has caused 500s in some environments (certain stores / proxies).
    req.session.passport = { user: expectedUser };
    req.session.save((saveErr) => {
      if (saveErr) {
        next(saveErr);
        return;
      }
      req.user = user;
      res.json({ user: { username: user.username } });
    });
  });

  app.post("/api/logout", (req, res, next) => {
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        next(destroyErr);
        return;
      }
      req.user = undefined;
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    res.json({ user: { username: req.user.username } });
  });
}
