// Payment
import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Invoice from './Invoice.js';

const Payment = sequelize.define('Payment', {
  payment_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  invoice_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: Invoice, key: 'invoice_id' }, onDelete: 'CASCADE' },
  provider: { type: DataTypes.ENUM('stripe','paypal','manual'), allowNull: false, defaultValue: 'manual' },
  provider_payment_id: { type: DataTypes.STRING(191), allowNull: true },
  amount_cents: { type: DataTypes.INTEGER, allowNull: false },
  currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'USD' },
  status: { type: DataTypes.ENUM('Pending','Succeeded','Failed','Refunded'), allowNull: false, defaultValue: 'Succeeded' },
  paid_at: { type: DataTypes.DATE, allowNull: true },
  meta: { type: DataTypes.JSON, allowNull: true }
}, {
  tableName: 'tbl_payments',
  timestamps: true
});
export default Payment;
