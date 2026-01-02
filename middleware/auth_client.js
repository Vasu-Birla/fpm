// middleware/client_auth.js (ESM)
import sequelize from "../config/sequelize.js";

import ClientAccount from "../models/ClientAccount.js";
import FirmClient from "../models/FirmClient.js";
import ActiveSessionClient from "../models/ActiveSessionClient.js";

import { flashSet } from "../utils/flash.js";

import {
  readBearer,
  decodeToken,
  getIdFromDecoded,
  isActiveStatus,
  clearCookieSafe,
  forcePostRedirectHtml,
} from "./_auth_helpers.js";

const CLIENT_COOKIE = process.env.CLIENT_COOKIE_NAME || "elaw_client_token";

// ---------------------------
// membership resolver
// ---------------------------
async function resolveClientMembership(decoded, tx) {
  const activeFirmId = Number(decoded?.active_firm_id || 0) || null;
  const firmClientId = Number(decoded?.firm_client_id || 0) || null;

  // decoded id is usually client_account_id
  const clientAccountId = getIdFromDecoded(decoded, ["client_account_id"]);
  if (!activeFirmId || !firmClientId || !clientAccountId) return null;

  // NOTE: kept EXACTLY like your existing logic
  return await FirmClient.findOne({
    where: {
      client_id: firmClientId,
      client_account_id: clientAccountId,
      firm_id: activeFirmId,
      status: "active",
      portal_enabled: true,
    },
    transaction: tx,
  });
}

// ---------------------------
// locals setters (same style as customer_auth.js)
// ---------------------------
function setGuest(req, res) {
  delete req.client;
  delete req.client_account;
  delete req.firm_client;
  delete req.client_membership;
  delete req.active_firm_id;

  req.dashboard_type = "Guest";

  res.locals.loggeduser = null;
  res.locals.permissions = null;
  res.locals.client_account = null;
  res.locals.firm_client = null;
  res.locals.active_firm_id = null;

  res.locals.dashboard_type = "Guest";
  res.locals.is_client = false;

  res.locals.currentPath = req.baseUrl + req.path;
}

function setClient(req, res, client, membership) {
  req.client = client;
  req.client_account = client;
  req.firm_client = membership || null;
  req.client_membership = membership || null;
  req.active_firm_id = membership?.firm_id || null;

  req.dashboard_type = "client";

  res.locals.loggeduser = client;
  res.locals.client_account = client;
  res.locals.firm_client = membership || null;
  res.locals.active_firm_id = membership?.firm_id || null;

  res.locals.permissions = client?.permissions || null;
  res.locals.dashboard_type = "client";
  res.locals.is_client = true;

  // handy helper
  res.locals.me = { user_type: "ClientAccount", user_id: client.client_account_id };

  res.locals.currentPath = req.baseUrl + req.path;
}

async function validateClientAndSession({ token, clientAccountId, tx }) {
  const [active, client] = await Promise.all([
    ActiveSessionClient.findOne({
      where: { client_account_id: clientAccountId },
      transaction: tx,
    }),
    ClientAccount.findOne({
      where: { client_account_id: clientAccountId },
      transaction: tx,
    }),
  ]);

  if (!client) return { ok: false, code: 401, message: "Client not found" };

  if (client?.status && !isActiveStatus(client.status)) {
    return { ok: false, code: 403, message: `Account is ${client.status}` };
  }

  if (!active || active.token !== token) {
    return { ok: false, code: 401, message: "Session expired" };
  }

  return { ok: true, client };
}

// ---------------------------
// Core resolve client
// ---------------------------
async function resolveClient(req) {
  // 1) Bearer token first
  const bearer = readBearer(req);
  if (bearer) {
    const tx = await sequelize.transaction();
    try {
      const decoded = decodeToken(bearer);
      const clientAccountId = getIdFromDecoded(decoded, ["client_account_id"]);
      if (!clientAccountId) {
        await tx.commit();
        return { ok: false, code: 401, message: "Invalid token payload" };
      }

      const result = await validateClientAndSession({
        token: bearer,
        clientAccountId,
        tx,
      });

      if (!result.ok) {
        await tx.commit();
        return result;
      }

      const membership = await resolveClientMembership(decoded, tx);
      await tx.commit();
      return { ok: true, client: result.client, membership };
    } catch (e) {
      try { await tx.rollback(); } catch {}
      return { ok: false, code: 401, message: "Invalid token" };
    }
  }

  // 2) Cookie fallback
  const cookieToken = req.cookies?.[CLIENT_COOKIE] || null;
  if (!cookieToken) return { ok: false, code: 401, message: "Login required" };

  const tx = await sequelize.transaction();
  try {
    const decoded = decodeToken(cookieToken);
    const clientAccountId = getIdFromDecoded(decoded, ["client_account_id"]);
    if (!clientAccountId) {
      await tx.commit();
      return { ok: false, code: 401, message: "Invalid token payload" };
    }

    const result = await validateClientAndSession({
      token: cookieToken,
      clientAccountId,
      tx,
    });

    if (!result.ok) {
      await tx.commit();
      return result;
    }

    const membership = await resolveClientMembership(decoded, tx);
    await tx.commit();
    return { ok: true, client: result.client, membership };
  } catch (e) {
    try { await tx.rollback(); } catch {}
    return { ok: false, code: 401, message: "Invalid session" };
  }
}

// ---------------------------
// Public middlewares
// ---------------------------

/**
 * identifyClientOrGuest
 * - never blocks
 * - BUT if client is logged-in and gets disabled, force logout (kept like your old behavior)
 */
export async function identifyClientOrGuest(req, res, next) {
  try {
    setGuest(req, res);

    const resolved = await resolveClient(req);
    if (resolved.ok && resolved.client) {
      // If disabled while logged in => force logout
      if (resolved.client?.status && !isActiveStatus(resolved.client.status)) {
        flashSet(res, "elaw_msg", `Your Account is ${resolved.client.status} and can not be logged-in.`);
        return res.send(
          forcePostRedirectHtml("/logout_inactive", {
            client_account_id: resolved.client.client_account_id,
          })
        );
      }

      setClient(req, res, resolved.client, resolved.membership);
    }

    return next();
  } catch (e) {
    setGuest(req, res);
    return next();
  }
}

/**
 * requireClientApi
 * - blocks if not logged in (JSON)
 */
export async function requireClientApi(req, res, next) {
  try {
    setGuest(req, res);

    const resolved = await resolveClient(req);
    if (!resolved.ok) {
      if (req.cookies?.[CLIENT_COOKIE]) clearCookieSafe(res, CLIENT_COOKIE);
      return res.status(resolved.code || 401).json({
        success: false,
        message: resolved.message || "Login required",
      });
    }

    // disabled => force logout
    if (resolved.client?.status && !isActiveStatus(resolved.client.status)) {
      if (req.cookies?.[CLIENT_COOKIE]) clearCookieSafe(res, CLIENT_COOKIE);
      return res.status(403).json({
        success: false,
        message: `Your Account is ${resolved.client.status} and can not be logged-in.`,
      });
    }

    setClient(req, res, resolved.client, resolved.membership);
    return next();
  } catch (e) {
    if (req.cookies?.[CLIENT_COOKIE]) clearCookieSafe(res, CLIENT_COOKIE);
    setGuest(req, res);
    return res.status(401).json({ success: false, message: "Login required" });
  }
}

/**
 * requireClientPage
 * - blocks if not logged in (redirect)
 */
export async function requireClientPage(req, res, next) {
  try {
    setGuest(req, res);

    const resolved = await resolveClient(req);
    if (!resolved.ok) {
      if (req.cookies?.[CLIENT_COOKIE]) clearCookieSafe(res, CLIENT_COOKIE);
      return res.redirect("/login");
    }

    // disabled => force logout (same as your previous behavior)
    if (resolved.client?.status && !isActiveStatus(resolved.client.status)) {
      flashSet(res, "elaw_msg", `Your Account is ${resolved.client.status} and can not be logged-in.`);
      return res.send(
        forcePostRedirectHtml("/logout_inactive", {
          client_account_id: resolved.client.client_account_id,
        })
      );
    }

    setClient(req, res, resolved.client, resolved.membership);
    return next();
  } catch (e) {
    if (req.cookies?.[CLIENT_COOKIE]) clearCookieSafe(res, CLIENT_COOKIE);
    setGuest(req, res);
    return res.redirect("/login");
  }
}
