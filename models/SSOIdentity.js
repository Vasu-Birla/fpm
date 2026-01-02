import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';
// import FirmStaff from './FirmStaff.js';

const SSOIdentity = sequelize.define('SSOIdentity', {
  id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
  staff_id: {
    type: DataTypes.BIGINT.UNSIGNED, allowNull: false,
    // references: { model: FirmStaff, key: 'staff_id' }, onDelete: 'CASCADE'
  },
  provider: { type: DataTypes.ENUM('google','microsoft'), allowNull: false },
  provider_staff_id: { type: DataTypes.STRING(191), allowNull: false },
  access_token: { type: DataTypes.TEXT, allowNull: true },
  refresh_token: { type: DataTypes.TEXT, allowNull: true },
  token_expires_at: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'tbl_sso_identities',
  timestamps: true,
  indexes: [{ unique: true, fields: ['provider','provider_staff_id'] }]
});

export default SSOIdentity;
