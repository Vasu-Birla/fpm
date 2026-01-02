// middleware/_auth_helpers.js (ESM)
import jwt from "jsonwebtoken";

export function readBearer(req) {
  const auth = String(req.headers.authorization || "");
  const [typ, token] = auth.split(" ");
  if (typ?.toLowerCase() === "bearer" && token) return token.trim();
  return null;
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing in env");
  return secret;
}

export function decodeToken(token) {
  return jwt.verify(token, getJwtSecret());
}

export function isActiveStatus(status) {
  return String(status || "").trim().toLowerCase() === "active";
}

/**
 * tolerant extractor:
 * - decoded.id
 * - decoded.sub
 * - decoded.<custom keys> you pass
 */
export function getIdFromDecoded(decoded, extraKeys = []) {
  const keys = ["id", "sub", ...extraKeys];
  for (const k of keys) {
    const v = decoded?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  return null;
}

export function clearCookieSafe(res, name) {
  try {
    res.clearCookie(name, { path: "/" });
  } catch {}
}

/**
 * used for your "force logout when disabled" flows
 */
export function forcePostRedirectHtml(action, hiddenFields = {}) {
  const inputs = Object.entries(hiddenFields)
    .map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v)}">`)
    .join("\n");

  return `
    <form id="logoutForm" method="POST" action="${action}">
      ${inputs}
    </form>
    <script>document.getElementById('logoutForm').submit();</script>
  `;
}
