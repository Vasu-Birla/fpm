import { kilError } from "../utils/kilError.js";
import {
  listNotificationsForActor,
  countNotificationsForActor,
  markReadForActor,
  markAllReadForActor,
} from "../utils/notificationService.js";

function resolveActor(req) {
  if (req.admin) {
    return { user_type: "Admin", user_id: Number(req.admin.admin_id) };
  }
  if (req.firmstaff) {
    return { user_type: "FirmStaff", user_id: Number(req.firmstaff.staff_id) };
  }
  if (req.client) {
    return { user_type: "ClientAccount", user_id: Number(req.client.client_account_id) };
  }
  return null;
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export const notifications_json = async (req, res) => {
  try {
    const actor = resolveActor(req);
    if (!actor?.user_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const status = req.body?.status || "";
    const type = req.body?.type || "";
    const category = req.body?.category || "";
    const search = req.body?.search?.value || req.body?.q || "";
    const start = toNumber(req.body?.start, 0);
    const length = Math.max(1, Math.min(toNumber(req.body?.length, 25), 200));
    const draw = toNumber(req.body?.draw, 1);

    const [total, filtered, rows] = await Promise.all([
      countNotificationsForActor(actor, {}),
      countNotificationsForActor(actor, { status, type, category, search }),
      listNotificationsForActor(actor, {
        status,
        type,
        category,
        search,
        offset: start,
        limit: length,
      }),
    ]);

    return res.json({
      draw,
      recordsTotal: total,
      recordsFiltered: filtered,
      data: rows,
      success: true,
    });
  } catch (error) {
    console.error("notifications_json error:", error);
    return res.status(500).json({ success: false, message: kilError(error) });
  }
};

export const notifications_read = async (req, res) => {
  try {
    const actor = resolveActor(req);
    if (!actor?.user_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [req.body?.id];
    const updated = await markReadForActor(actor, ids);
    return res.json({ success: true, updated });
  } catch (error) {
    console.error("notifications_read error:", error);
    return res.status(500).json({ success: false, message: "Read failed" });
  }
};

export const notifications_read_all = async (req, res) => {
  try {
    const actor = resolveActor(req);
    if (!actor?.user_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const updated = await markAllReadForActor(actor);
    return res.json({ success: true, updated });
  } catch (error) {
    console.error("notifications_read_all error:", error);
    return res.status(500).json({ success: false, message: "Read all failed" });
  }
};

export const superadmin_notifications_page = async (req, res) => {
  try {
    return res.render("superadmin/notifications", { output: "" });
  } catch (error) {
    console.error("superadmin_notifications_page error:", error);
    return res.render("errors/error500", { output: `Internal Server: ${kilError(error)}` });
  }
};
