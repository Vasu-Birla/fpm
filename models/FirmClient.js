import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

import ClientAccount from './ClientAccount.js';

const FirmClient = sequelize.define('FirmClient', {
  client_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },

  firm_id: {
    type: DataTypes.BIGINT.UNSIGNED, allowNull: false
  },

  client_account_id: {
    type: DataTypes.BIGINT.UNSIGNED, allowNull: false,
    references: { model: ClientAccount, key: 'client_account_id' }, onDelete: 'CASCADE'
  },

  portal_enabled: { type: DataTypes.BOOLEAN, defaultValue: true },

  status: {
    type: DataTypes.ENUM('active','admin_disabled','self_disabled'),
    defaultValue: 'active',
  },

  notes: { type: DataTypes.TEXT, allowNull: true },

  deleted_at: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'tbl_firm_clients',
  paranoid: true,
  deletedAt: 'deleted_at',
  indexes: [
    { unique: true, fields: ['firm_id', 'client_account_id'] },
    { fields: ['firm_id','status'] }
  ]
});

export default FirmClient;
