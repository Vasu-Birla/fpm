import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize.js';


const AIJob = sequelize.define('AIJob', {
  ai_job_id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  type: { type: DataTypes.ENUM('draft','research','summarize','translate','predict'), allowNull: false },
  case_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  document_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  prompt: { type: DataTypes.TEXT, allowNull: true },
  params: { type: DataTypes.JSON, allowNull: true }, // temperature, language, etc.
  requested_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  status: { type: DataTypes.ENUM('queued','running','succeeded','failed'), defaultValue: 'queued' },
  output_s3_key: { type: DataTypes.STRING(512), allowNull: true },
  result_json: { type: DataTypes.JSON, allowNull: true },
  error_message: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'tbl_ai_jobs',
  timestamps: true
});

export default AIJob;
