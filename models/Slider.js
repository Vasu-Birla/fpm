import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Slider = sequelize.define('Slider', {
  slider_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  image: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'tbl_sliders',
  timestamps: true,
});

export default Slider;
