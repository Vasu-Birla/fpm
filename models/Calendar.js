import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Calendar = sequelize.define('Calendar', {
  calendar_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  
  calendar_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  working_days: {
  type: DataTypes.JSON,
  allowNull: true,
  defaultValue: {
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: false,
    Sunday: false
  }
},

holidays: {
  type: DataTypes.JSON,
  allowNull: true,
  defaultValue: [
    {
      blackout_date: "2025-01-01",
      description: "New Year’s Day"
    }
  ]
},
// In Calendar model add:
extra_open_days: {
  type: DataTypes.JSON,
  allowNull: true, // ["2025-12-21","2025-12-28"]
  defaultValue: []
},

  timezone: {
  type: DataTypes.STRING(100),
  allowNull: true,
  defaultValue: 'America/Jamaica',
}
}, {
  tableName: 'tbl_calendar',
  timestamps: true,
});

export default Calendar;
