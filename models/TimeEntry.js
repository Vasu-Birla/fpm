import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';


const TimeEntry = sequelize.define('TimeEntry', {
  time_entry_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
 
  activity: { type: DataTypes.STRING(191), allowNull: false }, // e.g., "Draft motion"
  minutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  rate_cents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, // snapshot
  currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'USD' },
  billable: { type: DataTypes.BOOLEAN, defaultValue: true },
  billed: { type: DataTypes.BOOLEAN, defaultValue: false },
  work_date: { type: DataTypes.DATEONLY, allowNull: false }
}, {
  tableName: 'tbl_time_entries',
  timestamps: true,
});

export default TimeEntry;
