import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Language = sequelize.define('Language', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  native_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  icon: {
    type: DataTypes.STRING(255),
    allowNull: true, // Can be null if no icon is provided
    defaultValue: 'flag.png', // Default flag image
  },
}, {
  tableName: 'tbl_languages',
  timestamps: false,
});

export default Language;
