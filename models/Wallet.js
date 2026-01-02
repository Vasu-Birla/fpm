import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';

const Wallet = sequelize.define('Wallet', {
  wallet_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  user_type: {
    type: DataTypes.ENUM('user', 'driver'),
    allowNull: false,
  },
  staff_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  transaction_type: {
    type: DataTypes.ENUM('credit', 'debit'),
    allowNull: false,
  },
  purpose: {
    type: DataTypes.STRING(100), // e.g., 'ride_payment', 'top_up', 'bonus', 'refund'
    allowNull: false,
  },
  reference_id: {
    type: DataTypes.STRING(100),
    allowNull: true, // Could be ride_id, payment_id, etc.
  },
  balance_after: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  remarks: {
    type: DataTypes.STRING(255),
    allowNull: true,
  }
}, {
  tableName: 'tbl_wallets',
  timestamps: true,
});

export default Wallet;
