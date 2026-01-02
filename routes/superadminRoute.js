import express from "express";
import csurf from "csurf";

import * as supController from "../controllers/superadminController.js";
import * as notificationController from "../controllers/notificationController.js";
import * as auditController from "../controllers/audit-ai.controller.js";
import * as sp from "../controllers/superadminPlans.js";
import * as ticketCenterController from "../controllers/ticketCenterController.js";

// ✅ NEW: use split admin auth 
import { requireAdminPage } from "../middleware/auth_admin.js";



// S3 uploader
import { profileUpload, fileUpload } from "../middleware/s3bucketuploader_V4.js";
import { verifyRecaptchaEnterprise } from "../middleware/recaptcha.js";

import { ensureLoggedOut } from "../middleware/ensureLoggedOut.js";

const router = express.Router();

// routes/superadmin.js
router.get("/upload_asset", requireAdminPage, supController.upload_asset_page);
router.post(
  "/upload_asset",
  requireAdminPage,
  fileUpload.single("asset"),
  supController.upload_asset_post
);

router.route("/").get(requireAdminPage, supController.index);

// Notifications
router.get(
  "/notifications",
  requireAdminPage,
  notificationController.superadmin_notifications_page
);
router.post("/notifications/json", requireAdminPage, notificationController.notifications_json);
router.post("/notifications/read", requireAdminPage, notificationController.notifications_read);
router.post("/notifications/read_all", requireAdminPage, notificationController.notifications_read_all);

// Ticket Center (Superadmin)
router.get("/tickets", requireAdminPage, ticketCenterController.admin_ticket_center);
router.get("/tickets/view", requireAdminPage, ticketCenterController.admin_ticket_view);
router.post("/tickets/open", requireAdminPage, ticketCenterController.admin_open_ticket);
router.post("/tickets/json", requireAdminPage, ticketCenterController.admin_tickets_json);
router.post("/tickets/close", requireAdminPage, ticketCenterController.admin_close_ticket);
router.post("/tickets/priority", requireAdminPage, ticketCenterController.admin_set_priority);
router.post(
  "/tickets/upload",
  requireAdminPage,
  fileUpload.array("files", 6),
  ticketCenterController.ticket_upload
);

//========== Login Section superadmin =====================

router.route("/login").get(ensureLoggedOut, supController.login);

router.route("/logout").get(requireAdminPage, supController.logout);

// password login + optional 2FA (no page reload)
router.route("/login_password").post(ensureLoggedOut, supController.loginPasswordPost);

router
  .route("/login_password_2fa_verify")
  .post(ensureLoggedOut, supController.loginPassword2faVerifyPost);

// Forgot password (re-uses OtpCode + shared services)
router.route("/send_login_otp").post(supController.send_login_otp); // purpose from body: 'reset_password' | 'login_2fa'

router.route("/reset_password").post(ensureLoggedOut, supController.resetPasswordPost);

// (Optional) legacy helper kept if you still use it elsewhere:
router.route("/check_session").post(supController.check_session);

//========== Login Section superadmin ====================

// Middleware: reject attempts to pass a different target id
function denyMfaIdOverride(req, res, next) {
  if (req.body && typeof req.body.id !== "undefined") {
    const incoming = String(req.body.id);
    const selfId = String(req?.admin?.admin_id ?? "");
    if (!selfId || incoming !== selfId) {
      return res.status(403).json({ success: false, msg: "Forbidden target" });
    }
  }
  next();
}

router.route("/profile").get(requireAdminPage, supController.profile);
router.route("/profile").post(requireAdminPage, supController.profilePost);

router.route("/changepass").post(requireAdminPage, supController.changePassword);

router.post(
  "/on_off_multifactor",
  requireAdminPage,
  denyMfaIdOverride,
  supController.on_off_multifactor
);

router
  .route("/update_admin_pic")
  .post(requireAdminPage, profileUpload.single("image"), supController.update_admin_pic);


router.route("/generate_pdf_report").post(requireAdminPage, supController.generate_pdf_report);
router.route("/render_report_html/:id/:person_id").get(supController.render_report_html);

//------------ role_mgmt Sections ----------------
router.route("/role_mgmt").get(supController.role_mgmt);


router.route("/user_tandc").get(requireAdminPage, supController.user_tandc);
router.route("/user_tandc").post(requireAdminPage, supController.user_tandcPost);

router.route("/user_pandp").get(requireAdminPage, supController.user_pandp);
router.route("/user_pandp").post(requireAdminPage, supController.user_pandpPost);

//---------------- Lawfirm section ------------------------

// OTP for registration
router.post("/send_register_otp", requireAdminPage, supController.send_register_otp);
router.post("/verify_register_otp", requireAdminPage, supController.verify_register_otp);



//----------- Subscription Plans Section --------------------------

router.get("/plans", requireAdminPage, sp.plans_page);
router.get("/plans_json", requireAdminPage, sp.plans_json);
router.get("/features_registry_json", requireAdminPage, sp.features_registry_json);

router.post("/add_plan", requireAdminPage, sp.add_plan);
router.post("/update_plan", requireAdminPage, sp.update_plan);
router.post("/toggle_plan_active", requireAdminPage, sp.toggle_plan_active);
router.post("/delete_plan", requireAdminPage, sp.delete_plan);





//-------- elaw calendar ------------------

router.route("/elaw_calendar").get(requireAdminPage, supController.elaw_calendar);
router.post("/calendar/working-days/toggle", requireAdminPage, supController.calendar_toggleWorkingDay);
router.post("/calendar/holidays", requireAdminPage, supController.calendar_addHoliday);
router.delete("/calendar/holidays/:date", requireAdminPage, supController.calendar_deleteHoliday);
router.get("/calendar/events", requireAdminPage, supController.calendar_events);

//------------ Broadcast section ----
router.get("/broadcast", requireAdminPage, supController.broadcast);
router.post("/broadcast/preview", requireAdminPage, supController.broadcast_preview);
router.post("/broadcast/send", requireAdminPage, supController.broadcast_send);

//---------- Audit Logging Section
router.get("/get_logs", requireAdminPage, auditController.logs_page);
router.get("/logs", requireAdminPage, auditController.logs_page);
router.post("/logs/fetch", requireAdminPage, auditController.logs_fetch);
router.post("/logs/export", requireAdminPage, auditController.logs_export);

router.post("/logs/set_view_mode", requireAdminPage, auditController.logs_set_view_mode);

export default router;
