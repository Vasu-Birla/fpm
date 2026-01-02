import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const AdminPasswordHistory = sequelize.define('AdminPasswordHistory', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tbl_admin', // table name, not model name!
      key: 'admin_id'
    },
    onDelete: 'CASCADE'
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  changed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'admin_password_history',
  timestamps: false
});

export default AdminPasswordHistory;
