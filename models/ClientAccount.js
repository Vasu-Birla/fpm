import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const ClientAccount = sequelize.define('ClientAccount', {
  client_account_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },

  type: { type: DataTypes.ENUM('Individual','Business'), allowNull: false, defaultValue: 'Individual' },
  trn_number: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },

  first_name: { type: DataTypes.STRING(80), allowNull: true },
  last_name: { type: DataTypes.STRING(80), allowNull: true },
  business_name: { type: DataTypes.STRING(100), allowNull: true },

  email: { type: DataTypes.STRING(191), allowNull: true, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: true },

  country_code: { type: DataTypes.STRING(10), allowNull: true, defaultValue: '+1' },
  contact: { type: DataTypes.STRING(40), allowNull: true },
  full_contact: { type: DataTypes.STRING(40), allowNull: true, unique: true },

  address: { type: DataTypes.TEXT, allowNull: true },
  parish: { type: DataTypes.STRING(255), allowNull: true },
  postal_zone: { type: DataTypes.STRING(255), allowNull: true },
  postal_code: { type: DataTypes.STRING(255), allowNull: true },

  profile_pic: { type: DataTypes.STRING(255), defaultValue: 'user.png' },
  gender: { type: DataTypes.ENUM('Male','Female','Other'), allowNull: false, defaultValue: 'Male' },
  dob: { type: DataTypes.DATEONLY, allowNull: true },
  language: { type: DataTypes.STRING(50), defaultValue: 'English' },

  email_verified: { type: DataTypes.ENUM('Yes','No'), defaultValue: 'No' },
  contact_verified: { type: DataTypes.ENUM('Yes','No'), defaultValue: 'No' },

  two_step_verification: { type: DataTypes.ENUM('On','Off'), allowNull: false, defaultValue: 'Off' },

  timezone: { type: DataTypes.STRING(100), allowNull: true, defaultValue: 'America/Jamaica' },

  status: { type: DataTypes.ENUM('active','admin_disabled','self_disabled'), defaultValue: 'active' },

  deleted_at: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'tbl_client_accounts',
  paranoid: true,
  deletedAt: 'deleted_at',
  indexes: [
    { fields: ['email'] },
    { fields: ['full_contact'] },
  ]
});

export default ClientAccount;
