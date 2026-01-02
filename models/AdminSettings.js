import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const AdminSettings = sequelize.define('AdminSettings', {
  setting_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  key_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('public', 'secret','single'),
    allowNull: false,
    defaultValue: 'public',
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  }
}, {
  tableName: 'tbl_admin_settings',
  timestamps: true,
});

export default AdminSettings;
