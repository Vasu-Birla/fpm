import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js'; // Adjust the path to your sequelize instance

const ActiveSessionClient = sequelize.define('ActiveSessionClient', {
  client_account_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    field: 'client_id',
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  expires_at: {
    type: DataTypes.DATE(3), // For precision of milliseconds
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'active_sessions_client', // Explicitly define the table name
  timestamps: false, // Disable automatic `createdAt` and `updatedAt` fields
});

export default ActiveSessionClient;
