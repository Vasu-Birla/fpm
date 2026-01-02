// models/FAQ.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const FAQ = sequelize.define('FAQ', {
  faq_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  faq: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  faq_type: {
    type: DataTypes.ENUM('User', 'Driver'),
    allowNull: false,
    defaultValue: 'User',
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'tbl_faqs',
  timestamps: false,
});

export default FAQ;
