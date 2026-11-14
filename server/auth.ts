import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import sessionFileStore from "session-file-store";
import passport from "passport";
import bcrypt from "bcryptjs";
import cookie from "cookie";
import signature from "cookie-signature";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { storage } from "./storage";
import { blogUserRoleSchema, type BlogUserRole, type User } from "@shared/schema";

const FileStore = sessionFileStore(session);
const SESSION_COOKIE_NAME = "connect.sid";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Secure cookies only when explicitly enabled (Passenger HTTPS headers vary). */
function sessionCookieSecure(): boolean {
  return process.env.SESSION_COOKIE_SECURE === "true";
}

function sessionSecretValue(): string {
  return process.env.SESSION_SECRET || "dev-only-set-SESSION_SECRET-in-production";
}

/**
 * Force Set-Cookie. express-session skips the cookie when secure=true but
 * Passenger/Apache presents the app as HTTP (req.secure === false).
 */
function forceSessionCookie(res: Response, sessionId: string): void {
  const signed = `s:${signature.sign(sessionId, sessionSecretValue())}`;
  const serialized = cookie.serialize(SESSION_COOKIE_NAME, signed, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: sessionCookieSecure(),
    maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
  });
  const prev = res.getHeader("Set-Cookie");
  if (prev == null) {
    res.setHeader("Set-Cookie", serialized);
  } else if (Array.isArray(prev)) {
    res.setHeader("Set-Cookie", [...prev.filter(Boolean).map(String), serialized]);
  } else {
    res.setHeader("Set-Cookie", [String(prev), serialized]);
  }
}

function dashboardCredential(envKey: string, fallback: string): string {
  const raw = process.env[envKey];
  if (raw == null || raw.trim() === "") {
    return fallback;
  }
  return raw.trim();
}

function toPublicUser(u: User) {
  return {
    id: u.id,
    username: u.username,
    role: u.role as BlogUserRole,
    avatarUrl: u.avatarUrl ?? null,
  };
}

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      role: BlogUserRole;
      avatarUrl: string | null;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    passport?: { user?: number };
  }
}

const profilePatchSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8).max(200).optional(),
    avatarUrl: z.union([z.string().max(120_000), z.literal("")]).optional(),
    role: blogUserRoleSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const needsPassword = Boolean(data.newPassword || data.role !== undefined);
    if (needsPassword && (!data.currentPassword || data.currentPassword.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Current password is required to change password or role.",
        path: ["currentPassword"],
      });
    }
  });

export function configureAuth(app: Express): void {
  const cookieSecure = sessionCookieSecure();

  // File store so sessions survive Passenger multi-process / restarts (MemoryStore does not).
  const sessionsDir = path.resolve(process.cwd(), "tmp", "sessions");
  fs.mkdirSync(sessionsDir, { recursive: true });

  app.use(
    session({
      name: SESSION_COOKIE_NAME,
      secret: sessionSecretValue(),
      resave: false,
      saveUninitialized: false,
      proxy: true,
      store: new FileStore({
        path: sessionsDir,
        ttl: 7 * 24 * 60 * 60,
        retries: 1,
      }),
      cookie: {
        path: "/",
        secure: cookieSecure,
        httpOnly: true,
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE_MS,
      },
    }),
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id: number, done) => {
    const uid = typeof id === "string" ? Number(id) : id;
    if (Number.isNaN(uid)) {
      done(null, false);
      return;
    }
    void storage.getUser(uid).then(
      (row) => {
        if (!row) {
          done(null, false);
          return;
        }
        done(null, {
          id: row.id,
          username: row.username,
          role: row.role as BlogUserRole,
          avatarUrl: row.avatarUrl ?? null,
        });
      },
      (err) => done(err),
    );
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
  app.post("/api/login", async (req, res, next) => {
    try {
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

      let row = await storage.getUserByUsername(username);

      if (row) {
        const ok = await bcrypt.compare(password, row.password);
        if (!ok) {
          res.status(401).json({ message: "Invalid username or password." });
          return;
        }
      } else if (username === expectedUser && password === expectedPass) {
        const hash = await bcrypt.hash(password, 10);
        row = await storage.createUser({
          username,
          password: hash,
          role: "admin",
          avatarUrl: null,
        });
      } else {
        res.status(401).json({ message: "Invalid username or password." });
        return;
      }

      const publicUser = toPublicUser(row);
      // Ensure express-session will emit a cookie even behind HTTP→HTTPS proxies.
      req.session.cookie.secure = sessionCookieSecure();
      req.session.passport = { user: row.id };
      req.session.save((saveErr) => {
        if (saveErr) {
          next(saveErr);
          return;
        }
        req.user = publicUser;
        forceSessionCookie(res, req.sessionID);
        res.json({ user: publicUser });
      });
    } catch (e) {
      next(e);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        next(destroyErr);
        return;
      }
      req.user = undefined;
      res.clearCookie(SESSION_COOKIE_NAME, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: sessionCookieSecure(),
      });
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    res.json({ user: req.user });
  });

  app.patch("/api/auth/profile", requireAuth, async (req, res, next) => {
    try {
      const parsed = profilePatchSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
        return;
      }
      const body = parsed.data;
      const uid = req.user!.id;
      const row = await storage.getUser(uid);
      if (!row) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const needsPasswordVerify = Boolean(body.newPassword || body.role !== undefined);
      if (needsPasswordVerify) {
        const pwd = body.currentPassword ?? "";
        const currentOk = await bcrypt.compare(pwd, row.password);
        if (!currentOk) {
          res.status(401).json({ message: "Current password is incorrect." });
          return;
        }
      }

      const patch: Partial<Pick<User, "password" | "role" | "avatarUrl">> = {};

      if (body.newPassword) {
        patch.password = await bcrypt.hash(body.newPassword, 10);
      }
      if (body.avatarUrl !== undefined) {
        patch.avatarUrl = body.avatarUrl === "" ? null : body.avatarUrl;
      }
      if (body.role !== undefined) {
        if (req.user!.role !== "admin") {
          res.status(403).json({ message: "Only admins can change roles." });
          return;
        }
        patch.role = body.role;
      }

      if (Object.keys(patch).length === 0) {
        res.json({ user: toPublicUser(row) });
        return;
      }

      const updated = await storage.updateUser(uid, patch);
      if (!updated) {
        res.status(500).json({ message: "Failed to update profile" });
        return;
      }

      req.user = {
        id: updated.id,
        username: updated.username,
        role: updated.role as BlogUserRole,
        avatarUrl: updated.avatarUrl ?? null,
      };

      res.json({ user: toPublicUser(updated) });
    } catch (e) {
      next(e);
    }
  });
}

/** Writers cannot delete posts. */
export function forbidWriterDelete(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role === "writer") {
    res.status(403).json({ message: "Writers cannot delete posts." });
    return;
  }
  next();
}

/** Writers cannot set status to published or scheduled (drafts only). */
export function forbidWriterPublishOnBody(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.user?.role !== "writer") {
    next();
    return;
  }
  const status = req.body?.status as string | undefined;
  if (status === "published" || status === "scheduled") {
    res.status(403).json({ message: "Writers cannot publish or schedule posts." });
    return;
  }
  next();
}

export function forbidWriterPublishOnPatch(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.user?.role !== "writer") {
    next();
    return;
  }
  const status = req.body?.status as string | undefined;
  if (status === undefined) {
    next();
    return;
  }
  if (status === "published" || status === "scheduled") {
    res.status(403).json({ message: "Writers cannot publish or schedule posts." });
    return;
  }
  next();
}
