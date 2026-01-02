// models/IntakeTemplate.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const IntakeTemplate = sequelize.define('IntakeTemplate', {
  template_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },

  // NULL => platform/global template usable by all firms
  firm_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,

  },

  // One key for routing: "default", "family-law", "contact-us"
  template_key: { type: DataTypes.STRING(80), allowNull: false },

  name: { type: DataTypes.STRING(191), allowNull: false },
  description: { type: DataTypes.STRING(255), allowNull: true },

  schema_json: { type: DataTypes.JSON, allowNull: false },
  ui_json: { type: DataTypes.JSON, allowNull: true },

  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  version: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },

  deleted_at: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'tbl_intake_templates',
  paranoid: true,
  deletedAt: 'deleted_at',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['firm_id', 'template_key'] }, // works: multiple NULL allowed in MySQL
    { fields: ['template_key'] },
    { fields: ['is_active'] }
  ]
});

// helper: firm override > global fallback
export async function resolveTemplate({ firm_id, template_key = 'default', transaction } = {}) {
  if (firm_id) {
    const t1 = await IntakeTemplate.findOne({
      where: { firm_id, template_key, is_active: true },
      transaction
    });
    if (t1) return t1;
  }
  return IntakeTemplate.findOne({
    where: { firm_id: null, template_key, is_active: true },
    transaction
  });
}

export default IntakeTemplate;
