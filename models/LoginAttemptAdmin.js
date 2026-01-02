import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js'; // Adjust the path to your sequelize instance

const LoginAttemptAdmin = sequelize.define('LoginAttemptAdmin', {
  admin_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
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
  tableName: 'login_attempts_admin', // Explicitly define the table name
  timestamps: false, // Disable automatic `createdAt` and `updatedAt` fields
});

export default LoginAttemptAdmin;
