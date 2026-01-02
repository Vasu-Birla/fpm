import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js'; // Adjust the path to your sequelize instance

const LoginAttemptClient = sequelize.define('LoginAttemptClient', {
  client_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    allowNull: false,
  },
  client_account_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  attempts: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0, // Default value of 0 for the number of attempts
  },
  last_attempt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
  lockout_until: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  },
}, {
  tableName: 'login_attempts_client', // Explicitly define the table name
  timestamps: false, // Disable automatic `createdAt` and `updatedAt` fields
  indexes: [
    { unique: true, fields: ['client_account_id'] },
  ],
});

export default LoginAttemptClient;
