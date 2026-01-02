// middleware/user_auth.js (ESM)
import sequelize from "../config/sequelize.js";
import User from "../models/User.js";
import ActiveSessionUser from "../models/ActiveSessionUser.js";
import jwt from "jsonwebtoken";

const COOKIE_NAME = process.env.USER_COOKIE_NAME || "app_user_token";
const REQUIRED_USER_TYPE = "User";

// ---------------------------
// helpers
// ---------------------------
function setGuest(req, res) {
  // request scope
  delete req.user;
  req.dashboard_type = "Guest";

  // view scope
  res.locals.user = null;
  res.locals.loggeduser = null;
  res.locals.permissions = null;
  res.locals.dashboard_type = "Guest";
  res.locals.is_user = false;

  // optional helper
  res.locals.me = null;
}

function setUser(req, res, user) {
  req.user = user;
  req.dashboard_type = "user";

  res.locals.user = user;
  res.locals.loggeduser = user;
  res.locals.permissions = user?.permissions || null; // optional
  res.locals.dashboard_type = "user";
  res.locals.is_user = true;

  // super handy everywhere
  res.locals.me = { user_type: REQUIRED_USER_TYPE, user_id: user.user_id };
}

function readBearer(req) {
  const auth = String(req.headers.authorization || "");
  const [typ, token] = auth.split(" ");
  if (typ?.toLowerCase() === "bearer" && token) return token.trim();
  return null;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing in env");
  return secret;
}

function decodeToken(token) {
  return jwt.verify(token, getJwtSecret());
}

/**
 * tolerant userId extraction:
 * - decoded.user_id
 * - decoded.id
 * - decoded.sub
 */
function getUserIdFromDecoded(decoded) {
  const v = decoded?.user_id ?? decoded?.id ?? decoded?.sub;
  if (v === undefined || v === null) return null;
  return String(v).trim() || null;
}

function isCorrectUserType(decoded) {
  const t = String(decoded?.user_type || "").trim();
  return t === REQUIRED_USER_TYPE;
}

async function validateUserAndSession({ token, userId, tx }) {
  const [active, user] = await Promise.all([
    ActiveSessionUser.findOne({ where: { user_id: userId }, transaction: tx }),
    User.findOne({ where: { user_id: userId }, transaction: tx }),
  ]);

  if (!user) return { ok: false, code: 401, message: "User not found" };

  // optional status enforcement (if you have user.status)
  if (user?.status && String(user.status).toLowerCase() !== "active") {
    return { ok: false, code: 403, message: `Account is ${user.status}` };
  }

  // enforce single-session token (recommended)
  if (!active || active.token !== token) {
    return { ok: false, code: 401, message: "Session expired" };
  }

  return { ok: true, user };
}

// ---------------------------
// Core resolve “user”
// returns {ok:true, user} or {ok:false, code, message}
// ---------------------------
async function resolveUser(req) {
  // 1) Bearer first
  const bearer = readBearer(req);
  if (bearer) {
    const tx = await sequelize.transaction();
    try {
      const decoded = decodeToken(bearer);

      if (!isCorrectUserType(decoded)) {
        await tx.commit();
        return { ok: false, code: 401, message: "Invalid user type" };
      }

      const userId = getUserIdFromDecoded(decoded);
      if (!userId) {
        await tx.commit();
        return { ok: false, code: 401, message: "Invalid token payload" };
      }

      const result = await validateUserAndSession({ token: bearer, userId, tx });
      await tx.commit();
      return result.ok ? { ok: true, user: result.user } : result;
    } catch (e) {
      try { await tx.rollback(); } catch {}
      return { ok: false, code: 401, message: "Invalid token" };
    }
  }

  // 2) Cookie fallback
  const cookieToken = req.cookies?.[COOKIE_NAME] || null;
  if (!cookieToken) return { ok: false, code: 401, message: "Login required" };

  const tx = await sequelize.transaction();
  try {
    const decoded = decodeToken(cookieToken);

    if (!isCorrectUserType(decoded)) {
      await tx.commit();
      return { ok: false, code: 401, message: "Invalid user type" };
    }

    const userId = getUserIdFromDecoded(decoded);
    if (!userId) {
      await tx.commit();
      return { ok: false, code: 401, message: "Invalid token payload" };
    }

    const result = await validateUserAndSession({ token: cookieToken, userId, tx });
    await tx.commit();
    return result.ok ? { ok: true, user: result.user } : result;
  } catch (e) {
    try { await tx.rollback(); } catch {}
    return { ok: false, code: 401, message: "Invalid session" };
  }
}

// ---------------------------
// Public middlewares
// ---------------------------

/**
 * identifyUserOrGuest
 * - never blocks
 * - sets req.user + res.locals if possible; else Guest
 */
export async function identifyUserOrGuest(req, res, next) {
  try {
    setGuest(req, res);

    const resolved = await resolveUser(req);
    if (resolved.ok && resolved.user) setUser(req, res, resolved.user);

    return next();
  } catch (e) {
    setGuest(req, res);
    return next();
  }
}

/**
 * requireUserApi
 * - blocks if not logged in
 * - returns JSON 401/403 (never redirects)
 */
export async function requireUserApi(req, res, next) {
  try {
    setGuest(req, res);

    const resolved = await resolveUser(req);
    if (!resolved.ok) {
      if (req.cookies?.[COOKIE_NAME]) res.clearCookie(COOKIE_NAME, { path: "/" });
      return res.status(resolved.code || 401).json({
        success: false,
        message: resolved.message || "Login required",
      });
    }

    setUser(req, res, resolved.user);
    return next();
  } catch (e) {
    if (req.cookies?.[COOKIE_NAME]) res.clearCookie(COOKIE_NAME, { path: "/" });
    setGuest(req, res);
    return res.status(401).json({ success: false, message: "Login required" });
  }
}

/**
 * requireUserPage
 * - blocks if not logged in
 * - redirects to /login
 */
export async function requireUserPage(req, res, next) {
  try {
    setGuest(req, res);

    const resolved = await resolveUser(req);
    if (!resolved.ok) {
      if (req.cookies?.[COOKIE_NAME]) res.clearCookie(COOKIE_NAME, { path: "/" });
      return res.redirect("/login");
    }

    setUser(req, res, resolved.user);
    return next();
  } catch (e) {
    if (req.cookies?.[COOKIE_NAME]) res.clearCookie(COOKIE_NAME, { path: "/" });
    setGuest(req, res);
    return res.redirect("/login");
  }
}
