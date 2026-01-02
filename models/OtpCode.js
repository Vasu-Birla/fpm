// models/OtpCode.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const OtpCode = sequelize.define('OtpCode', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED, // room to grow
    primaryKey: true,
    autoIncrement: true,
  },

  // Who & what for
  purpose: {
    type: DataTypes.ENUM('login','register', 'reset_password', 'case_task', 'delete', 'other','login_2fa','change_password','intake_submission'),
    allowNull: false,
    defaultValue: 'login',
  },
  actor_type: { // superadmin | subadmin | customer | client | guest | api
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'customer',
  },



  client_account_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,

  },


  // Destination & channel
  channel: {
    type: DataTypes.ENUM('email', 'sms'),
    allowNull: false,
    defaultValue: 'email',
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  country_code: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: '+1',
  },
  contact: { // phone (digits only ideally)
    type: DataTypes.STRING(32),
    allowNull: true,
  },

  // Secure code storage
  otp_hash: {
    type: DataTypes.STRING(255), // bcrypt/argon2 hash
    allowNull: false,
  },

  // Lifecycle / abuse controls
  status: {
    type: DataTypes.ENUM('pending', 'verified', 'expired', 'revoked'),
    allowNull: false,
    defaultValue: 'pending',
    index: true,
  },
  attempts: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  max_attempts: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 5,
  },
  resend_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  last_sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  last_attempt_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  // Timing
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  expire_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },

  // Request context (for audit/forensics)
  req_id: { type: DataTypes.STRING(64), allowNull: true },
  ip:     { type: DataTypes.STRING(64), allowNull: true },
  ua:     { type: DataTypes.STRING(255), allowNull: true },

}, {
  tableName: 'tbl_otps',
  timestamps: false,
  indexes: [
    { fields: ['purpose', 'status'] },
    { fields: ['email'] },
    { fields: ['contact'] },
    { fields: ['expire_at'] },
  ],
});

export default OtpCode;
