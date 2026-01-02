// models/Conversation.js (ESM)
import { DataTypes } from "sequelize";
import sequelize from "../config/sequelize.js";

const Conversation = sequelize.define(
  "Conversation",
  {
    convo_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    conversation_type: {
      type: DataTypes.ENUM("direct", "group", "broadcast"),
      allowNull: false,
      defaultValue: "direct",
    },

    // ✅ Prevent duplicate 1-1 chats
    // Example: "Client:5__FirmStaff:22" (sorted)
    direct_key: { type: DataTypes.STRING(255), allowNull: true },

    // group info
    title: { type: DataTypes.STRING(255), allowNull: true },
    avatar: { type: DataTypes.STRING(255), allowNull: true },

    // who created this convo (polymorphic)
    created_by_type: { type: DataTypes.STRING(50), allowNull: true },
    created_by_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },

    // fast list sorting
    last_message_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    last_message_at: { type: DataTypes.DATE, allowNull: true },

    // optional flags
    is_client_channel: { type: DataTypes.BOOLEAN, defaultValue: false },

    meta: { type: DataTypes.JSON, allowNull: true },

    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "tbl_conversations",
    timestamps: true,
    paranoid: true,
    deletedAt: "deleted_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["conversation_type"] },
      { fields: ["last_message_at"] },
      { unique: true, fields: ["direct_key"], name: "uniq_direct_key" },
    ],
  }
);

export default Conversation;
