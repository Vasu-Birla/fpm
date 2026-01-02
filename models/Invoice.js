import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';



const Invoice = sequelize.define('Invoice', {
  invoice_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  invoice_number: { type: DataTypes.STRING(32), allowNull: true, unique: true },
  firm_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true},
  client_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  case_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, },
  created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true},
  status: { type: DataTypes.ENUM('draft','sent','paid','void'), allowNull: false, defaultValue: 'draft' },
  payment_status: { type: DataTypes.ENUM('pending','partial','paid'), allowNull: false, defaultValue: 'pending' },
  currency: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'USD' },
  subtotal: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
  tax_total: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
  due_date: { type: DataTypes.DATEONLY, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  pdf_key: { type: DataTypes.STRING(512), allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  deleted_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'tbl_invoices',
  paranoid: true,
  deletedAt: 'deleted_at',
  underscored: true,
});

export default Invoice;
