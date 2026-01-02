// models/ConversationParticipant.js (ESM)
import { DataTypes } from "sequelize";
import sequelize from "../config/sequelize.js";
import Conversation from "./Conversation.js";

const ConversationParticipant = sequelize.define(
  "ConversationParticipant",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    convo_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: Conversation, key: "convo_id" },
      onDelete: "CASCADE",
    },

    // ✅ Polymorphic user reference (fits every project)
    user_type: { type: DataTypes.STRING(50), allowNull: false }, // "Client" | "FirmStaff" | "Admin" | "User"...
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },

    // group roles
    role: {
      type: DataTypes.ENUM("owner", "admin", "member"),
      allowNull: false,
      defaultValue: "member",
    },

    // settings
    muted_until: { type: DataTypes.DATE, allowNull: true },
    pinned: { type: DataTypes.BOOLEAN, defaultValue: false },

    // membership state
    joined_at: { type: DataTypes.DATE, allowNull: true },
    left_at: { type: DataTypes.DATE, allowNull: true },

    // ✅ DELIVERY POINTER (achieves "delivered" without MessageReceipt table)
    last_delivered_message_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    delivered_at: { type: DataTypes.DATE, allowNull: true },

    // ✅ READ POINTER (achieves unread count + read ticks)
    last_read_message_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    read_at: { type: DataTypes.DATE, allowNull: true },

    meta: { type: DataTypes.JSON, allowNull: true },
  },
  {
    tableName: "tbl_conversation_participants",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["convo_id"] },
      { fields: ["user_type", "user_id"] },
      {
        unique: true,
        fields: ["convo_id", "user_type", "user_id"],
        name: "uniq_convo_user",
      },
      // Helpful for queries that filter "active members"
      { fields: ["convo_id", "left_at"] },
    ],
  }
);

export default ConversationParticipant;
