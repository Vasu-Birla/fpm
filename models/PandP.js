import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js'; // Adjust the path to your sequelize instance

const PandP = sequelize.define('PandP', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true, // Auto increment for primary key
  },
  policy: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
  policy_type: {
    type: DataTypes.ENUM('User', 'Driver'),
    allowNull: false,
    defaultValue: 'User', // Default value for policy_type
  },
}, {
  tableName: 'tbl_pandp', // Explicitly define the table name
  timestamps: false, // Disable automatic `createdAt` and `updatedAt` fields as we don't need them
});

export default PandP;
