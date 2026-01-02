
import https from 'https';
import axios from 'axios';

import * as url from 'url';
import * as path from 'path';
// import fs from 'fs/promises';
import fsextra from "fs-extra";

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import readline from 'node:readline';
import * as crypto from 'node:crypto';

import os from 'os';
import moment from 'moment-timezone';
import ejs from "ejs";


const __dirname = url.fileURLToPath(new URL('.', import.meta.url));



// controllers/chatController.js (ESM) — FULL FILE
import { Op } from "sequelize";
import {
  sequelize,
  Conversation,
  ConversationParticipant,
  Message,
  MessageAttachment,
  ChatBlock,
  ClientAccount,
  FirmClient,
  Admin,
} from "../models/index.js";

import { getIo } from "../sockets/io.js";
import { roomChat, roomUser } from "../sockets/rooms.js";



import { flashSet ,flashPop } from '../utils/flash.js';
import { kilError  } from '../utils/kilError.js';
import { Socket } from 'node:dgram'

function toastOkJson(res, message, extra={}) {
  return res.json({ success: true, message, ...extra });
}
function toastFailJson(res, code, msg) {
  return res.status(code).json({ success: false, message: msg });
}




export function getChatActor(req) {
  // ✅ ClientAccount (your current chat page is for client dashboard)
  if (req.client_account) {
    return {
      user_type: "ClientAccount",
      user_id: Number(req.client_account.client_account_id),
      name: req.client_account.full_name || req.client_account.name || req.client_account.email || "Client",
    };
  }

  // Optional: FirmStaff support (future)
  if (req.firm_staff) {
    return {
      user_type: "FirmStaff",
      user_id: Number(req.firm_staff.firm_staff_id),
      name: req.firm_staff.full_name || req.firm_staff.email || "Staff",
    };
  }

  // Optional: Admin support (future)
  if (req.admin) {
    return {
      user_type: "Admin",
      user_id: Number(req.admin.admin_id),
      name: req.admin.full_name || req.admin.email || "Admin",
    };
  }

  return null;
}




//============= Start =======================


// render chat page 
export const chatPage = async (req, res) => {
  const output = flashPop(req, res, "kwe_msg");
  try {
    const me = getChatActor(req);

    if (!me) {
      console.error("❌ chatPage: actor missing, req.client_account=", !!req.client_account);
      return res.redirect("/login");
    }

    return res.render("client/chat", { output, me });
  } catch (error) {
    console.error("❌ chatPage error:", error);
    return res.render("errors/error500", { output: `Internal Server: ${kilError(error)}` });
  }
};

export const chatUsers = async (req, res) => {
  try {
    const me = getChatActor(req);
    if (!me) return toastFailJson(res, 401, "Not authenticated");

    const firmId = Number(req.active_firm_id || req.firm_client?.firm_id || 0) || null;
    let users = [];

    if (firmId) {
      const rows = await FirmClient.findAll({
        where: {
          firm_id: firmId,
          status: "active",
          portal_enabled: true,
        },
        include: [
          {
            model: ClientAccount,
            as: "account",
            attributes: [
              "client_account_id",
              "first_name",
              "last_name",
              "business_name",
              "email",
              "profile_pic",
            ],
          },
        ],
        order: [[{ model: ClientAccount, as: "account" }, "first_name", "ASC"]],
      });

      users = rows
        .map((row) => row.account)
        .filter(Boolean)
        .filter((row) => Number(row.client_account_id) !== me.user_id)
        .map((row) => ({
          user_type: "ClientAccount",
          user_id: row.client_account_id,
          name: [row.first_name, row.last_name].filter(Boolean).join(" ").trim()
            || row.business_name
            || row.email
            || "Client",
          email: row.email || "",
          avatar: row.profile_pic || null,
        }));
    } else {
      const rows = await ClientAccount.findAll({
        where: {
          status: "active",
          client_account_id: { [Op.ne]: me.user_id },
        },
        attributes: [
          "client_account_id",
          "first_name",
          "last_name",
          "business_name",
          "email",
          "profile_pic",
        ],
        order: [["first_name", "ASC"]],
      });

      users = rows.map((row) => ({
        user_type: "ClientAccount",
        user_id: row.client_account_id,
        name: [row.first_name, row.last_name].filter(Boolean).join(" ").trim()
          || row.business_name
          || row.email
          || "Client",
        email: row.email || "",
        avatar: row.profile_pic || null,
      }));
    }

    return toastOkJson(res, "ok", { users });
  } catch (error) {
    console.error("chatUsers error:", error);
    return toastFailJson(res, 500, "Failed to load users");
  }
};

export const chatUpload = async (req, res) => {
  try {
    const me = getChatActor(req);
    if (!me) return toastFailJson(res, 401, "Not authenticated");

    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) return toastFailJson(res, 400, "No files uploaded");

    const attachments = files.map((file) => {
      const mime = file.mimetype || "";
      let fileType = "file";
      if (mime.startsWith("image/")) fileType = "image";
      else if (mime.startsWith("audio/")) fileType = "audio";
      else if (mime.startsWith("video/")) fileType = "video";

      const s3Key = file.s3Key || "";
      return {
        file_type: fileType,
        file_name: file.originalname || "file",
        mime_type: mime || null,
        file_size: file.size || null,
        s3_key: s3Key,
        url: s3Key ? `/secure/file_stream?s3key=${encodeURIComponent(s3Key)}` : "",
      };
    });

    return toastOkJson(res, "ok", { attachments });
  } catch (error) {
    console.error("chatUpload error:", error);
    return toastFailJson(res, 500, "Upload failed");
  }
};
