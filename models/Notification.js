import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';


import Admin from './Admin.js';


const Notification = sequelize.define('Notification', {
  notification_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  recipient_type: {
    type: DataTypes.ENUM('Admin', 'FirmStaff', 'Client', 'All'),
    allowNull: false,
    defaultValue: 'All',
  },
  // client_account_id: {
  //   type: DataTypes.BIGINT.UNSIGNED,
  //   allowNull: true,
  //   references: {
  //     model: ClientAccount,
  //     key: 'client_account_id',
  //   },
  //   onDelete: 'CASCADE'
  // },

    // firm_staff_id: { 
    //   type: DataTypes.BIGINT.UNSIGNED, 
    //   allowNull: true, 
    //   references: {
    //      model: FirmStaff, 
    //      key: 'staff_id' 
    //     }, 
    //   onDelete: 'CASCADE' 
    // },   

  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Admin,
      key: 'admin_id',
    },
  },
  type: {
    type: DataTypes.ENUM(
      'login',
      'register',
      'reset_password',
      'booking',
      'case_update',
      'task_assigned',
      'event_reminder',
      'invoice',
      'system',
      'ticket_created',
      'ticket_assigned',
      'ticket_reply',
      'other'
    ),
    allowNull: false,
  },
  category: { type: DataTypes.STRING(80), allowNull: true },
  level: {
    type: DataTypes.ENUM('info', 'success', 'warning', 'danger'),
    allowNull: false,
    defaultValue: 'info',
  },
  firm_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  entity_type: { type: DataTypes.STRING(80), allowNull: true },
  entity_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  group_key: { type: DataTypes.STRING(120), allowNull: true },
  delivered_at: { type: DataTypes.DATE, allowNull: true },
  read_at: { type: DataTypes.DATE, allowNull: true },
  archived_at: { type: DataTypes.DATE, allowNull: true },
  expires_at: { type: DataTypes.DATE, allowNull: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: true },
  data: { type: DataTypes.JSON, allowNull: true },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,  
  },
  action_link: {
    type: DataTypes.TEXT,
    allowNull: true, // link will be there 
  },

  action_request_method: {
    type: DataTypes.ENUM('POST', 'GET'),
    allowNull: true,
    defaultValue: 'GET',
  },
   
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'tbl_notifications',
  timestamps: true,
});

export default Notification;
