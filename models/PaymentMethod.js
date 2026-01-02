// models/PaymentMethod.js
 import { DataTypes, Op } from 'sequelize';
import sequelize from '../config/sequelize.js';

const PaymentMethod = sequelize.define('PaymentMethod', {
  pm_id:        { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },

  // Owner = FirmStaff
  staff_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false
 
  },

  // Gateway / vault info
  provider:     { type: DataTypes.STRING(32),  allowNull: false, defaultValue: 'amber' },
  token:        { type: DataTypes.STRING(255), allowNull: false }, // vaulted token / payment method id

  // Card fingerprint (optional; useful for display & de-dup)
  brand:        { type: DataTypes.STRING(32),  allowNull: true },
  last4:        { type: DataTypes.STRING(4),   allowNull: true },
  exp_month:    { type: DataTypes.INTEGER,     allowNull: true },
  exp_year:     { type: DataTypes.INTEGER,     allowNull: true },

  is_default:   { type: DataTypes.BOOLEAN,     allowNull: false, defaultValue: false },

  // Optional billing snapshot at time of save (prefer these over staff if present)
  billing_name:    { type: DataTypes.STRING(191), allowNull: true },
  bill_to_address: { type: DataTypes.STRING(255), allowNull: true },
  bill_to_city:    { type: DataTypes.STRING(128), allowNull: true },
  bill_to_state:   { type: DataTypes.STRING(128), allowNull: true },
  bill_to_zip:     { type: DataTypes.STRING(32),  allowNull: true },
  bill_to_country: { type: DataTypes.STRING(2),   allowNull: true }, // ISO-3166-1 alpha-2
  bill_to_phone:   { type: DataTypes.STRING(32),  allowNull: true },
  bill_to_email:   { type: DataTypes.STRING(191), allowNull: true },
}, {
  tableName: 'tbl_payment_methods',
  timestamps: true,
  indexes: [
    { fields: ['staff_id'] },
    { unique: true, fields: ['staff_id', 'provider', 'token'], name: 'uniq_staff_provider_token' },
    // soft match to detect "same card" if token rotates
    { fields: ['staff_id','provider','brand','last4','exp_month','exp_year'], name: 'idx_soft_card_fingerprint' },
  ],
});



// ----- Scopes (handy presets) -----
PaymentMethod.addScope('byStaff', (staff_id) => ({ where: { staff_id } }));
PaymentMethod.addScope('defaultFirst', {
  order: [
    ['is_default', 'DESC'],
    ['updatedAt', 'DESC'],
    ['pm_id', 'DESC']
  ]
});

// ----- Hooks: ensure only one default per staff+provider -----
PaymentMethod.addHook('beforeSave', async (pm, opts) => {
  if (pm.changed('is_default') && pm.is_default) {
    await PaymentMethod.update(
      { is_default: false },
      {
        where: {
          staff_id: pm.staff_id,
          provider: pm.provider,
          // pm_id: { [sequelize.Op.ne]: pm.pm_id || 0 },
          pm_id: { [Op.ne]: pm.pm_id || 0 }
        },
        transaction: opts?.transaction
      }
    );
  }
});


export default PaymentMethod;
