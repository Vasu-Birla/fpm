// models/IntakeTicket.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

export const INTAKE_TICKET_STATUS = [
  'new',
  'in_review',
  'assigned',
  'consult_scheduled',
  'accepted',
  'rejected',
  'spam',
  'closed'
];

const IntakeTicket = sequelize.define('IntakeTicket', {
  intake_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },

  // ✅ firm selected? set firm_id. Direct contact? can be NULL and routed later.
  firm_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,

  },

  // helps your “service→firm→form” flow and also routing for contact-us
  practice_area_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,

  },

  template_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,

  },

  status: { type: DataTypes.ENUM(...INTAKE_TICKET_STATUS), allowNull: false, defaultValue: 'new' },
  priority: { type: DataTypes.ENUM('low','normal','high','urgent'), allowNull: false, defaultValue: 'normal' },

  // Snapshot for search
  full_name: { type: DataTypes.STRING(191), allowNull: true },
  email: { type: DataTypes.STRING(191), allowNull: true },
  country_code: { type: DataTypes.STRING(10), allowNull: true, defaultValue: '+1' },
  phone: { type: DataTypes.STRING(40), allowNull: true },
  full_phone: { type: DataTypes.STRING(60), allowNull: true },

  // ✅ main form payload (dynamic fields)
  payload_json: { type: DataTypes.JSON, allowNull: false },

  // ✅ “single table advanced” fields
  assigned_staff_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // current owner
  notes_json: { type: DataTypes.JSON, allowNull: true },    // array of notes
  history_json: { type: DataTypes.JSON, allowNull: true },  // array of events/status changes

  // metadata
  channel: { type: DataTypes.ENUM('service_page','contact_us','phone','email','walk_in','referral','other'), allowNull: false, defaultValue: 'contact_us' },
  source_label: { type: DataTypes.STRING(120), allowNull: true },

  ip_address: { type: DataTypes.STRING(64), allowNull: true },
  user_agent: { type: DataTypes.TEXT, allowNull: true },

  submitted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },

  deleted_at: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'tbl_intake_tickets',
  paranoid: true,
  deletedAt: 'deleted_at',
  timestamps: true,
  indexes: [
    { fields: ['firm_id', 'status'] },
    { fields: ['practice_area_id'] },
    { fields: ['template_id'] },
    { fields: ['email'] },
    { fields: ['full_phone'] },
    { fields: ['submitted_at'] }
  ]
});

// Default arrays
IntakeTicket.addHook('beforeValidate', (t) => {
  if (!t.notes_json) t.notes_json = [];
  if (!t.history_json) t.history_json = [];
});

export default IntakeTicket;
