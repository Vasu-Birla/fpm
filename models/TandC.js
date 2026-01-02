import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js'; // Adjust the path to your sequelize instance

const TandC = sequelize.define('TandC', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true, // Auto increment for primary key
  },
  terms: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
  tandc_type: {
    type: DataTypes.ENUM('User', 'Driver'),
    allowNull: false,
  },
}, {
  tableName: 'tbl_tandc', // Explicitly define the table name
  timestamps: false, // Disable automatic `createdAt` and `updatedAt` fields as we don't need them
});

export default TandC;
