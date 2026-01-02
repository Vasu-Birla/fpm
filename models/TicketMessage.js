// models/TicketMessage.js (ESM)
import { DataTypes } from "sequelize";
import sequelize from "../config/sequelize.js";

import TicketThread from "./TicketThread.js";



const TicketMessage = sequelize.define(
  "TicketMessage",
  {
    message_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },

    ticket_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: TicketThread, key: "ticket_id" },
      onDelete: "CASCADE",
    },

    // Who sent the message (union: staff/client/system)
    sender_type: { type: DataTypes.ENUM("FirmStaff", "Client", "System"), allowNull: false },
    sender_staff_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,

    },
    sender_client_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,

    },

    // Message content
    body: { type: DataTypes.TEXT("long"), allowNull: false },

    // Attachments if you need (S3 keys, filenames, mime, size)
    attachments_json: { type: DataTypes.JSON, allowNull: true },

    // Internal note: visible to staff only (not to client)
    is_internal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

    meta: { type: DataTypes.JSON, allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "tbl_ticket_messages",
    paranoid: true,
    deletedAt: "deleted_at",
    timestamps: true,
    indexes: [
      { fields: ["ticket_id"] },
      { fields: ["ticket_id", "createdAt"] },
      { fields: ["sender_staff_id"] },
      { fields: ["sender_client_id"] },
    ],
    validate: {
      senderUnion() {
        const t = this.sender_type;
        if (t === "FirmStaff" && !this.sender_staff_id) {
          throw new Error("sender_staff_id is required when sender_type=FirmStaff");
        }
        if (t === "Client" && !this.sender_client_id) {
          throw new Error("sender_client_id is required when sender_type=Client");
        }
      },
    },
  }
);

export default TicketMessage;
