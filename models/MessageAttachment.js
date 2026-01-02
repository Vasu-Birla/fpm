// models/MessageAttachment.js (ESM)
import { DataTypes } from "sequelize";
import sequelize from "../config/sequelize.js";
import Message from "./Message.js";

const MessageAttachment = sequelize.define(
  "MessageAttachment",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },

    message_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: Message, key: "message_id" },
      onDelete: "CASCADE",
    },

    file_type: {
      type: DataTypes.ENUM("image", "file", "audio", "video"),
      allowNull: false,
      defaultValue: "file",
    },

    file_name: { type: DataTypes.STRING(255), allowNull: true },
    mime_type: { type: DataTypes.STRING(120), allowNull: true },
    file_size: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },

    // store S3 key / local file path / CDN URL
    url: { type: DataTypes.TEXT, allowNull: false },

    meta: { type: DataTypes.JSON, allowNull: true },
  },
  {
    tableName: "tbl_message_attachments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ fields: ["message_id"] }],
  }
);

export default MessageAttachment;
