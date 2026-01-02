import express from "express";

import * as indexController from "../controllers/indexController.js";
import * as otpController from "../controllers/otpController.js";
import { ensureClientLoggedOut } from "../middleware/ensureLoggedOut.js";

import * as supportController from "../controllers/supportController.js";

import * as chatController from "../controllers/chatController.js";
import { profileUpload, fileUpload } from "../middleware/s3bucketuploader.js";

import {
  identifyClientOrGuest,
  requireClientPage, // ✅ replacement for isAuthenticatedClient
} from "../middleware/auth_client.js";

import * as notificationController from "../controllers/notificationController.js";

const router = express.Router();

//================ Routing Start =========================================

router.route("/").get(identifyClientOrGuest, indexController.home);

//---------- Chat Section Start ----------
router.get("/chat", requireClientPage, chatController.chatPage);
router.get("/chat/users", requireClientPage, chatController.chatUsers);
router.post(
  "/chat/upload",
  requireClientPage,
  fileUpload.array("files", 6),
  chatController.chatUpload
);
//---------- Chat Section End ----------

// --- Shared Signup OTP API (email OR phone) ---
router.post("/send_register_otp", otpController.send_register_otp);
router.post("/verify_register_otp", otpController.verify_register_otp);

router.route("/home").get(identifyClientOrGuest, indexController.website);

router.route("/logout").get(requireClientPage, indexController.logout);

// same will be as logout but without isAuth to avoid loop again and again
router.route("/logout_inactive").post(indexController.logout_inactive);

//============ LOGIN SECTION ================
router.route("/login").get(identifyClientOrGuest, indexController.login);

router.route("/login").post(identifyClientOrGuest, indexController.loginPost);

router.route("/login_password").post(
  identifyClientOrGuest,
  indexController.loginPasswordPost
);

router.route("/login_password_2fa_verify").post(
  identifyClientOrGuest,
  indexController.loginPassword2faVerifyPost
);



router.route("/send_login_otp").post(indexController.send_login_otp);
router.route("/verify_login_otp").post(indexController.verify_login_otp);

router.route("/reset_password").post(
  identifyClientOrGuest,
  indexController.resetPasswordPost
);

//============ LOGIN SECTION ================


router.route("/profile").get(requireClientPage, indexController.profile);
router.post("/profile", requireClientPage, indexController.profilePost);

// Password & 2FA under customer account
router.post(
  "/send_password_otp",
  requireClientPage,
  indexController.sendPasswordChangeOtp
);
router.post(
  "/change_password",
  requireClientPage,
  indexController.changePasswordPost
);
router.post(
  "/two_step_toggle",
  requireClientPage,
  indexController.twoStepTogglePost
);



router.route("/dashboard").get(requireClientPage, indexController.dashboard);





router.route("/notifications").get(requireClientPage, indexController.notifications);
router.post(
  "/notifications/json",
  requireClientPage,
  notificationController.notifications_json
);
router.post(
  "/notifications/read",
  requireClientPage,
  notificationController.notifications_read
);
router.post(
  "/notifications/read_all",
  requireClientPage,
  notificationController.notifications_read_all
);

router
  .route("/support")
  .get(requireClientPage, supportController.support)
  .post(requireClientPage, supportController.create_ticket);

router.post("/support/reply", requireClientPage, supportController.reply_ticket);
router.post("/support/json", requireClientPage, supportController.tickets_json);

router.post(
  "/support/upload",
  requireClientPage,
  fileUpload.array("files", 6),
  supportController.ticket_upload
);

router.get("/support/view", requireClientPage, supportController.support_view);

router.get("/terms_conditions", fileUpload.none(), indexController.terms_conditions);
router.get("/privacy_policy", fileUpload.none(), indexController.privacy_policy);

//================ Routing End =========================================
export default router;
