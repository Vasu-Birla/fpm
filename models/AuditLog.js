// models/AuditLog.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const AuditLog = sequelize.define('AuditLog', {
  log_id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },

  actor_type: { // keep lowercase values: 'superadmin'|'subadmin'|'client'
    type: DataTypes.ENUM('superadmin', 'subadmin','client','guest','admin','Business Client','Individual Client'),
    allowNull: false
  },
  actor_id: { type: DataTypes.INTEGER, allowNull: true },

  candidate_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  client_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  report_id:   { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },

  action:      { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  url:         { type: DataTypes.STRING(255), allowNull: true },
  result:      { type: DataTypes.STRING(255), allowNull: true },

  // 🔽 New fields for better analytics
  severity:    { type: DataTypes.ENUM('info','warning','error','security'), allowNull: true },
  result_code: { type: DataTypes.INTEGER, allowNull: true },
  req_id:      { type: DataTypes.STRING(50), allowNull: true },
  event_id:    { type: DataTypes.STRING(50), allowNull: true },
  method:      { type: DataTypes.STRING(8), allowNull: true },
  ip:          { type: DataTypes.STRING(45), allowNull: true }, // IPv4/IPv6
  ua:          { type: DataTypes.TEXT, allowNull: true },
  latency_ms:  { type: DataTypes.DECIMAL(10,2), allowNull: true },
  hmac_sig:    { type: DataTypes.STRING(128), allowNull: true }, // optional

  timestamp:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'tbl_audit_logs',
  timestamps: false
});

export default AuditLog;
