// models/Role.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Role = sequelize.define('Role', {
  role_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  role_name: {
    type: DataTypes.STRING(191), // or any appropriate length,
    allowNull: false,
    unique:true
  },
  is_system: { 
    type: DataTypes.BOOLEAN,
    allowNull: false, 
    defaultValue: false 
  }, // true for only superadmin/subadmin Full Permission No Need of column permissions
  permissions: { 
    type: DataTypes.JSON,
     allowNull: true 
    },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'tbl_roles',
  timestamps: false,
});

export default Role;
