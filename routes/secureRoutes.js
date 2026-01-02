// route: secureRoutes.js
import express from "express";
import csurf from "csurf";

import * as secureController from "../controllers/secureController.js";

// ✅ NEW: use split admin auth instead of kilauth.js
import { requireAdminApi } from "../middleware/auth_admin.js";

const router = express.Router();

// Public/Protected depending on your choice
// If you want this protected, uncomment requireAdminApi
router.get("/file_stream", /* requireAdminApi, */ secureController.file_stream);

// super simple guard; replace with real auth/role check
function assertAdmin(req, res, next) {
  if (!req.admin || req.admin.admin_type !== "superadmin") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  next();
}

// These are API-style endpoints (JSON) so ✅ requireAdminApi is correct
router.get("/export_db_data", requireAdminApi, assertAdmin, secureController.export_db_data);
router.get("/import_db_data", requireAdminApi, assertAdmin, secureController.import_db_data);

router.get("/fresh_sync", secureController.fresh_sync);

export default router;
