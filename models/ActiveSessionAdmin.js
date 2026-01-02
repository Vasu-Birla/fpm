import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js'; // Adjust the path to your sequelize instance

const ActiveSessionAdmin = sequelize.define('ActiveSessionAdmin', {
  admin_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
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
  tableName: 'active_sessions_admin', // Explicitly define the table name
  timestamps: false, // Disable automatic `createdAt` and `updatedAt` fields
});

export default ActiveSessionAdmin;
