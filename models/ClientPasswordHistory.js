import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const ClientPasswordHistory = sequelize.define('ClientPasswordHistory', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  client_account_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,

  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  changed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'client_password_history',
  timestamps: false
});

export default ClientPasswordHistory;
