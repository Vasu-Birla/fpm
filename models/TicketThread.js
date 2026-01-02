// models/TicketThread.js (ESM)
import { DataTypes } from "sequelize";
import sequelize from "../config/sequelize.js";


// Actor/ownership links (keep what you actually have)

const TicketThread = sequelize.define(
  "TicketThread",
  {
    ticket_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    ticket_number: { type: DataTypes.STRING(10), allowNull: true, unique: true },

    // Multi-tenant (recommended)
    firm_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,

    },

    // Optional: ticket can be linked to a case
    case_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
 
    },

    // Who is the ticket about (can be null for internal-only tickets)
    client_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
   
    },

    // Core ticket fields
    subject: { type: DataTypes.STRING(255), allowNull: false },
    status: {
      type: DataTypes.ENUM("open", "pending", "on_hold", "resolved", "closed"),
      allowNull: false,
      defaultValue: "open",
    },
    priority: {
      type: DataTypes.ENUM("low", "normal", "high", "urgent"),
      allowNull: false,
      defaultValue: "normal",
    },
    channel: {
      type: DataTypes.ENUM("portal", "email", "phone", "internal"),
      allowNull: false,
      defaultValue: "portal",
    },

    // Assignment (optional)
    assigned_staff_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
  
    },

    // Created by (union: staff/client/system)
    created_by_type: {
      type: DataTypes.ENUM("FirmStaff", "Client", "System"),
      allowNull: false,
      defaultValue: "Client",
    },
    created_by_staff_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
 
    },
    created_by_client_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,

    },

    // Fast list/sort + UX
    last_message_at: { type: DataTypes.DATE, allowNull: true },
    last_message_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    closed_at: { type: DataTypes.DATE, allowNull: true },

    meta: { type: DataTypes.JSON, allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "tbl_ticket_threads",
    paranoid: true,
    deletedAt: "deleted_at",
    timestamps: true,
    indexes: [
      { fields: ["firm_id", "status", "priority"] },
      { fields: ["firm_id", "createdAt"] },
      { unique: true, fields: ["ticket_number"] },
      { fields: ["case_id"] },
      { fields: ["client_id"] },
      { fields: ["assigned_staff_id"] },
      { fields: ["last_message_at"] },
    ],
    validate: {
      createdByUnion() {
        const t = this.created_by_type;
        if (t === "FirmStaff" && !this.created_by_staff_id) {
          throw new Error("created_by_staff_id is required when created_by_type=FirmStaff");
        }
        if (t === "Client" && !this.created_by_client_id) {
          throw new Error("created_by_client_id is required when created_by_type=Client");
        }
      },
    },
  }
);

export default TicketThread;
