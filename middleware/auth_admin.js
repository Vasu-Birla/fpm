// middleware/admin_auth.js (ESM)
import sequelize from "../config/sequelize.js";

import Admin from "../models/Admin.js";
import ActiveSessionAdmin from "../models/ActiveSessionAdmin.js";
import Role from "../models/Role.js";

import {
  readBearer,
  decodeToken,
  getIdFromDecoded,
  isActiveStatus,
  clearCookieSafe,
} from "./_auth_helpers.js";

const ADMIN_COOKIE = process.env.ADMIN_COOKIE_NAME || "elaw_admin_token";

// ---------------------------
// locals setters (same style as customer_auth.js)
// ---------------------------
function setGuest(req, res) {
  delete req.admin;
  req.dashboard_type = "Guest";

  res.locals.admin = null;
  res.locals.loggeduser = null;
  res.locals.permissions = null;
  res.locals.perms = null;
  res.locals.isSystemRole = false;

  res.locals.dashboard_type = "Guest";
  res.locals.is_admin = false;

  // useful for active-path detection in EJS
  res.locals.currentPath = req.baseUrl + req.path;
}

async function attachAdminPerms(req, res, admin) {
  res.locals.admin = admin;
  res.locals.loggeduser = admin;

  // dashboard_type for admin can be admin.admin_type
  res.locals.dashboard_type = admin?.admin_type || "admin";
  res.locals.is_admin = true;

  // Default: keep admin.permissions if you store it
  res.locals.permissions = admin?.permissions || null;
  res.locals.perms = null;
  res.locals.isSystemRole = false;

  // If your system uses Role permissions, prefer that:
  if (admin?.role_id) {
    const role = await Role.findByPk(admin.role_id);
    if (role) {
      const isSystem = !!role.is_system;
      res.locals.isSystemRole = isSystem;
      const perms = isSystem ? null : (role.permissions || {});
      res.locals.perms = perms;
      res.locals.permissions = perms; // keep one consistent output
    }
  }

  // useful for active-path detection in EJS
  res.locals.currentPath = req.baseUrl + req.path;
}

function setAdmin(req, res, admin) {
  req.admin = admin;
  req.dashboard_type = admin?.admin_type || "admin";
}

async function validateAdminAndSession({ token, adminId, tx }) {
  const [active, admin] = await Promise.all([
    ActiveSessionAdmin.findOne({ where: { admin_id: adminId }, transaction: tx }),
    Admin.findOne({ where: { admin_id: adminId }, transaction: tx }),
  ]);

  if (!admin) return { ok: false, code: 401, message: "Admin not found" };

  // If Admin has status field and you want to enforce:
  if (admin?.status && !isActiveStatus(admin.status)) {
    return { ok: false, code: 403, message: `Account is ${admin.status}` };
  }

  if (!active || active.token !== token) {
    return { ok: false, code: 401, message: "Session expired" };
  }

  return { ok: true, admin };
}

// ---------------------------
// Core resolve admin
// ---------------------------
async function resolveAdmin(req) {
  // 1) Bearer token first
  const bearer = readBearer(req);
  if (bearer) {
    const tx = await sequelize.transaction();
    try {
      const decoded = decodeToken(bearer);
      const adminId = getIdFromDecoded(decoded, ["admin_id"]);
      if (!adminId) {
        await tx.commit();
        return { ok: false, code: 401, message: "Invalid token payload" };
      }

      const result = await validateAdminAndSession({ token: bearer, adminId, tx });
      await tx.commit();
      return result.ok ? { ok: true, admin: result.admin } : result;
    } catch (e) {
      try { await tx.rollback(); } catch {}
      return { ok: false, code: 401, message: "Invalid token" };
    }
  }

  // 2) Cookie fallback
  const cookieToken = req.cookies?.[ADMIN_COOKIE] || null;
  if (!cookieToken) return { ok: false, code: 401, message: "Login required" };

  const tx = await sequelize.transaction();
  try {
    const decoded = decodeToken(cookieToken);
    const adminId = getIdFromDecoded(decoded, ["admin_id"]);
    if (!adminId) {
      await tx.commit();
      return { ok: false, code: 401, message: "Invalid token payload" };
    }

    const result = await validateAdminAndSession({ token: cookieToken, adminId, tx });
    await tx.commit();
    return result.ok ? { ok: true, admin: result.admin } : result;
  } catch (e) {
    try { await tx.rollback(); } catch {}
    return { ok: false, code: 401, message: "Invalid session" };
  }
}

// ---------------------------
// Public middlewares
// ---------------------------

/**
 * identifyAdminOrGuest
 * - never blocks
 */
export async function identifyAdminOrGuest(req, res, next) {
  try {
    setGuest(req, res);

    const resolved = await resolveAdmin(req);
    if (resolved.ok && resolved.admin) {
      setAdmin(req, res, resolved.admin);
      await attachAdminPerms(req, res, resolved.admin);
    }
    return next();
  } catch (e) {
    setGuest(req, res);
    return next();
  }
}

/**
 * requireAdminApi
 * - blocks if not logged in (JSON)
 */
export async function requireAdminApi(req, res, next) {
  try {
    setGuest(req, res);

    const resolved = await resolveAdmin(req);
    if (!resolved.ok) {
      if (req.cookies?.[ADMIN_COOKIE]) clearCookieSafe(res, ADMIN_COOKIE);
      return res.status(resolved.code || 401).json({
        success: false,
        message: resolved.message || "Login required",
      });
    }

    setAdmin(req, res, resolved.admin);
    await attachAdminPerms(req, res, resolved.admin);
    return next();
  } catch (e) {
    if (req.cookies?.[ADMIN_COOKIE]) clearCookieSafe(res, ADMIN_COOKIE);
    setGuest(req, res);
    return res.status(401).json({ success: false, message: "Login required" });
  }
}

/**
 * requireAdminPage
 * - blocks if not logged in (redirect)
 */
export async function requireAdminPage(req, res, next) {
  try {
    setGuest(req, res);

    const resolved = await resolveAdmin(req);
    if (!resolved.ok) {
      if (req.cookies?.[ADMIN_COOKIE]) clearCookieSafe(res, ADMIN_COOKIE);
      return res.redirect("/superadmin/login");
    }

    setAdmin(req, res, resolved.admin);
    await attachAdminPerms(req, res, resolved.admin);
    return next();
  } catch (e) {
    if (req.cookies?.[ADMIN_COOKIE]) clearCookieSafe(res, ADMIN_COOKIE);
    setGuest(req, res);
    return res.redirect("/superadmin/login");
  }
}
