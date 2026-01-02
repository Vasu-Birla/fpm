// models/ChatBlock.js (ESM)
import { DataTypes } from "sequelize";
import sequelize from "../config/sequelize.js";

const ChatBlock = sequelize.define(
  "ChatBlock",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },

    blocker_type: { type: DataTypes.STRING(50), allowNull: false },
    blocker_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },

    blocked_type: { type: DataTypes.STRING(50), allowNull: false },
    blocked_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },

    reason: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: "tbl_chat_blocks",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["blocker_type", "blocker_id", "blocked_type", "blocked_id"],
        name: "uniq_block",
      },
      { fields: ["blocked_type", "blocked_id"] },
    ],
  }
);

export default ChatBlock;
