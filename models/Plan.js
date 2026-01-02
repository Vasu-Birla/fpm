// models/Plan.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Plan = sequelize.define('Plan', {
  plan_id:       { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },

  // catalog keys
  solution_key:  { type: DataTypes.STRING(100), allowNull: false }, // e.g. 'core','billing','bgcheck'
  plan_key:      { type: DataTypes.STRING(100), allowNull: false },  // e.g. 'free','pro','business','enterprise'
  name:          { type: DataTypes.STRING(191), allowNull: false },

  // billing & price (minor units + ISO currency)
  billing_period:{ type: DataTypes.ENUM('monthly','yearly','one_time'), allowNull: false, defaultValue: 'monthly' },
  price_currency:{ type: DataTypes.STRING(3), allowNull: false, defaultValue: (process.env.CURRENCY || 'JMD') },
  price_minor:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },

  // virtual (computed) major unit amount for UI; not persisted
  price_amount: {
    type: DataTypes.VIRTUAL,
    get() {
      const cur   = this.getDataValue('price_currency') || 'JMD';
      const minor = this.getDataValue('price_minor') ?? 0;
      const exp   = ({ JPY:0, KRW:0, VND:0, KWD:3, BHD:3, JOD:3, OMR:3, TND:3 }[cur] ?? 2);
      return Number(minor) / Math.pow(10, exp);
    }
  },

  // feature flags/limits
  features_json: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },

  // lifecycle
  is_active:     { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  metadata:      { type: DataTypes.JSON, allowNull: true },

  // soft delete
  deleted_at:    { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'tbl_plans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at',
 indexes: [
    { name: 'ix_plan_solution', fields: ['solution_key'] },
    { name: 'ux_plan_solution_key', unique: true, fields: ['solution_key','plan_key'] },
    { name: 'ix_plan_active', fields: ['is_active'] },
  ],
  hooks: {
    beforeValidate(plan) {
      if (plan.solution_key) plan.solution_key = String(plan.solution_key).trim().toLowerCase();
      if (plan.plan_key)     plan.plan_key     = String(plan.plan_key).trim().toLowerCase();
    }
  }
});

export default Plan;
