// models/Message.js (ESM)
import { DataTypes } from "sequelize";
import sequelize from "../config/sequelize.js";
import Conversation from "./Conversation.js";

const Message = sequelize.define(
  "Message",
  {
    message_id: {
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

    // polymorphic sender
    sender_type: { type: DataTypes.STRING(50), allowNull: false },
    sender_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },

    message_type: {
      type: DataTypes.ENUM("text", "image", "file", "audio", "video", "system"),
      allowNull: false,
      defaultValue: "text",
    },

    body: { type: DataTypes.TEXT("long"), allowNull: true },

    // reply / thread
    reply_to_message_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },

    // forwarding
    forward_from_message_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },

    // edit marker
    edited_at: { type: DataTypes.DATE, allowNull: true },

    meta: { type: DataTypes.JSON, allowNull: true },

    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "tbl_messages",
    timestamps: true,
    paranoid: true,
    deletedAt: "deleted_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      // fastest chat load
      { fields: ["convo_id", "message_id"] },
      // sender history/search
      { fields: ["sender_type", "sender_id"] },
      { fields: ["reply_to_message_id"] },
      { fields: ["created_at"] },
    ],
  }
);

export default Message;
