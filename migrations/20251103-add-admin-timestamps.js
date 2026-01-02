// migrations/20251103-add-admin-timestamps.js
// ESM migration: adds created_at, updated_at, deleted_at to tbl_admin with safe defaults
// Uses information_schema to avoid errors if columns already exist.

export default {
  name: '20251103-add-admin-timestamps',

  /**
   * @param {{ sequelize: import('sequelize').Sequelize }} ctx
   */
  async up({ sequelize }) {
    const [rows] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tbl_admin'
        AND COLUMN_NAME IN ('created_at','updated_at','deleted_at')
    `);

    const have = new Set(rows.map(r => r.COLUMN_NAME));
    const parts = [];

    if (!have.has('created_at')) {
      parts.push(`ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    }
    if (!have.has('updated_at')) {
      parts.push(`ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
    }
    if (!have.has('deleted_at')) {
      parts.push(`ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL`);
    }

    if (parts.length) {
      const sql = `ALTER TABLE tbl_admin ${parts.join(', ')};`;
      await sequelize.query(sql);
    } // else nothing to do (already in place)
  },

  /**
   * @param {{ sequelize: import('sequelize').Sequelize }} ctx
   */
  async down({ sequelize }) {
    const [rows] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tbl_admin'
        AND COLUMN_NAME IN ('created_at','updated_at','deleted_at')
    `);

    const have = new Set(rows.map(r => r.COLUMN_NAME));
    const drops = [];

    if (have.has('created_at')) drops.push(`DROP COLUMN created_at`);
    if (have.has('updated_at')) drops.push(`DROP COLUMN updated_at`);
    if (have.has('deleted_at')) drops.push(`DROP COLUMN deleted_at`);

    if (drops.length) {
      const sql = `ALTER TABLE tbl_admin ${drops.join(', ')};`;
      await sequelize.query(sql);
    }
  }
};
