// middleware/firmstaff_auth.js (ESM)
import sequelize from "../config/sequelize.js";

import FirmStaff from "../models/FirmStaff.js";
import ActiveSessionFirmStaff from "../models/ActiveSessionFirmStaff.js";

import { flashSet } from "../utils/flash.js";

import {
  readBearer,
  decodeToken,
  getIdFromDecoded,
  isActiveStatus,
  clearCookieSafe,
  forcePostRedirectHtml,
} from "./_auth_helpers.js";

const FIRMSTAFF_COOKIE = process.env.FIRMSTAFF_COOKIE_NAME || "elaw_firmstaff_token";

// ---------------------------
// locals setters (same style as customer_auth.js)
// ---------------------------
function setGuest(req, res) {
  delete req.firmstaff;
  req.dashboard_type = "Guest";

  res.locals.firmstaff = null;
  res.locals.loggeduser = null;
  res.locals.permissions = null;

  res.locals.dashboard_type = "Guest";
  res.locals.is_firmstaff = false;

  res.locals.currentPath = req.baseUrl + req.path;
}

function setFirmStaff(req, res, staff) {
  req.firmstaff = staff;
  req.dashboard_type = "firmstaff";

  res.locals.firmstaff = staff;
  res.locals.loggeduser = staff;
  res.locals.permissions = staff?.permissions || null;

  res.locals.dashboard_type = "firmstaff";
  res.locals.is_firmstaff = true;

  res.locals.currentPath = req.baseUrl + req.path;
}

async function validateFirmStaffAndSession({ token, staffId, tx }) {
  const [active, staff] = await Promise.all([
    ActiveSessionFirmStaff.findOne({
      where: { staff_id: staffId },
      transaction: tx,
    }),
    FirmStaff.findOne({
      where: { staff_id: staffId },
      transaction: tx,
    }),
  ]);

  if (!staff) return { ok: false, code: 401, message: "Firm staff not found" };

  // normalize "Active" vs "active"
  if (staff?.status && !isActiveStatus(staff.status)) {
    return { ok: false, code: 403, message: `Account is ${staff.status}` };
  }

  if (!active || active.token !== token) {
    return { ok: false, code: 401, message: "Session expired" };
  }

  return { ok: true, staff };
}

// ---------------------------
// Core resolve firmstaff
// ---------------------------
async function resolveFirmStaff(req) {
  // 1) Bearer token first
  const bearer = readBearer(req);
  if (bearer) {
    const tx = await sequelize.transaction();
    try {
      const decoded = decodeToken(bearer);
      const staffId = getIdFromDecoded(decoded, ["staff_id"]);
      if (!staffId) {
        await tx.commit();
        return { ok: false, code: 401, message: "Invalid token payload" };
      }

      const result = await validateFirmStaffAndSession({ token: bearer, staffId, tx });
      await tx.commit();
      return result.ok ? { ok: true, staff: result.staff } : result;
    } catch (e) {
      try { await tx.rollback(); } catch {}
      return { ok: false, code: 401, message: "Invalid token" };
    }
  }

  // 2) Cookie fallback
  const cookieToken = req.cookies?.[FIRMSTAFF_COOKIE] || null;
  if (!cookieToken) return { ok: false, code: 401, message: "Login required" };

  const tx = await sequelize.transaction();
  try {
    const decoded = decodeToken(cookieToken);
    const staffId = getIdFromDecoded(decoded, ["staff_id"]);
    if (!staffId) {
      await tx.commit();
      return { ok: false, code: 401, message: "Invalid token payload" };
    }

    const result = await validateFirmStaffAndSession({ token: cookieToken, staffId, tx });
    await tx.commit();
    return result.ok ? { ok: true, staff: result.staff } : result;
  } catch (e) {
    try { await tx.rollback(); } catch {}
    return { ok: false, code: 401, message: "Invalid session" };
  }
}

// ---------------------------
// Public middlewares
// ---------------------------

/**
 * identifyFirmStaffOrGuest
 * - never blocks
 * - BUT if logged in and gets disabled, force logout (kept similar to your logic)
 */
export async function identifyFirmStaffOrGuest(req, res, next) {
  try {
    setGuest(req, res);

    const resolved = await resolveFirmStaff(req);
    if (resolved.ok && resolved.staff) {
      if (resolved.staff?.status && !isActiveStatus(resolved.staff.status)) {
        flashSet(res, "elaw_msg", `Your Account is ${resolved.staff.status} and can not be logged-in.`);
        return res.send(
          forcePostRedirectHtml("/firmstaff/logout_inactive", {
            staff_id: resolved.staff.staff_id,
          })
        );
      }

      setFirmStaff(req, res, resolved.staff);
    }

    return next();
  } catch (e) {
    setGuest(req, res);
    return next();
  }
}

/**
 * requireFirmStaffApi
 * - blocks if not logged in (JSON)
 */
export async function requireFirmStaffApi(req, res, next) {
  try {
    setGuest(req, res);

    const resolved = await resolveFirmStaff(req);
    if (!resolved.ok) {
      if (req.cookies?.[FIRMSTAFF_COOKIE]) clearCookieSafe(res, FIRMSTAFF_COOKIE);
      return res.status(resolved.code || 401).json({
        success: false,
        message: resolved.message || "Login required",
      });
    }

    if (resolved.staff?.status && !isActiveStatus(resolved.staff.status)) {
      if (req.cookies?.[FIRMSTAFF_COOKIE]) clearCookieSafe(res, FIRMSTAFF_COOKIE);
      return res.status(403).json({
        success: false,
        message: `Your Account is ${resolved.staff.status} and can not be logged-in.`,
      });
    }

    setFirmStaff(req, res, resolved.staff);
    return next();
  } catch (e) {
    if (req.cookies?.[FIRMSTAFF_COOKIE]) clearCookieSafe(res, FIRMSTAFF_COOKIE);
    setGuest(req, res);
    return res.status(401).json({ success: false, message: "Login required" });
  }
}

/**
 * requireFirmStaffPage
 * - blocks if not logged in (redirect)
 */
export async function requireFirmStaffPage(req, res, next) {
  try {
    setGuest(req, res);

    const resolved = await resolveFirmStaff(req);
    if (!resolved.ok) {
      if (req.cookies?.[FIRMSTAFF_COOKIE]) clearCookieSafe(res, FIRMSTAFF_COOKIE);
      return res.redirect("/firmstaff/login");
    }

    if (resolved.staff?.status && !isActiveStatus(resolved.staff.status)) {
      flashSet(res, "elaw_msg", `Your Account is ${resolved.staff.status} and can not be logged-in.`);
      return res.send(
        forcePostRedirectHtml("/firmstaff/logout_inactive", {
          staff_id: resolved.staff.staff_id,
        })
      );
    }

    setFirmStaff(req, res, resolved.staff);
    return next();
  } catch (e) {
    if (req.cookies?.[FIRMSTAFF_COOKIE]) clearCookieSafe(res, FIRMSTAFF_COOKIE);
    setGuest(req, res);
    return res.redirect("/firmstaff/login");
  }
}
