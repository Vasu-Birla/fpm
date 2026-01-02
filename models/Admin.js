import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js'; // Adjust the path to your sequelize instance
import Role from './Role.js';

const Admin = sequelize.define('Admin', {
  admin_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },

  role_id: {
    type: DataTypes.INTEGER,
    allowNull: true,                        // for ON DELETE SET NULL
    references: { model: 'tbl_roles', key: 'role_id' }, // use table name to avoid circular import
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  },
  
  admin_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'superadmin',
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'admin@gmail.com', // Default email
    unique:true
  },
  country_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '+91', // Default country code
  },
  contact: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '1234567890', // Default contact number  
  },
    full_contact: {
    type: DataTypes.STRING(20),
    defaultValue: '',
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique:true
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: '',
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: '',
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: false,
   // defaultValue: 'user.png', // Default image
    defaultValue: 'images/profiles/user.png', // Default image for S3 bucket Key name will be there 
  },
  state: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: '', // Default image
  },
    // Audit Logs per-admin view mode
  current_view_mode: {
    type: DataTypes.ENUM('Basic','Advance'),
    allowNull: false,
    defaultValue: 'Basic'
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Active', 'Inactive'),
    allowNull: false,
    defaultValue: 'Active', // Default status
  },
    two_step_verification: {
      type: DataTypes.ENUM(     
        'On',
        'Off'
      ), // Updated ENUM values
      allowNull: false,
      defaultValue: 'Off',
    },
    timezone: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
      },
}, {
  tableName: 'tbl_admin',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at',
});

export default Admin;
