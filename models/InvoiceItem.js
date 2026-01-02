import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';
import Invoice from './Invoice.js';


const InvoiceItem = sequelize.define('InvoiceItem', {
  item_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  invoice_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, references: { model: Invoice, key: 'invoice_id' }, onDelete: 'CASCADE' },
  service_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  description: { type: DataTypes.STRING(255), allowNull: false },
  type: { type: DataTypes.ENUM('service','product'), allowNull: false, defaultValue: 'service' },
  quantity: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 1 },
  unit_price: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
  line_total: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
}, {
  tableName: 'tbl_invoice_items',
  timestamps: false,   // table currently lacks created_at/updated_at
  paranoid: false,
  underscored: true,
});

export default InvoiceItem;
