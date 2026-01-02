// config/kildb.js  // Ony For Table Sync

import sequelize from '../config/sequelize.js';
import '../models/index.js'; // Import all models to register with sequelize



// Drop duplicate unique indexes for a given table
const dropExtraIndexes = async (table) => {
  const [results] = await sequelize.query(`
    SELECT INDEX_NAME, TABLE_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = '${table}'
      AND NON_UNIQUE = 0
  `);

  if (results.length > 0) {
    console.log(`🔎 Checking indexes in ${table}:`, results.map(r => r.INDEX_NAME));
  }

  for (const row of results) {
    if (row.INDEX_NAME !== 'PRIMARY') {
      try {
        await sequelize.query(`ALTER TABLE \`${row.TABLE_NAME}\` DROP INDEX \`${row.INDEX_NAME}\``);
        console.log(`🗑 Dropped index: ${row.INDEX_NAME} from ${row.TABLE_NAME}`);
      } catch (e) {
        console.log(`⚠️ Could not drop index ${row.INDEX_NAME} from ${row.TABLE_NAME}:`, e.message);
      }
    }
  }
};


const syncModel = async () => {
  try {

    
        // loop through all Sequelize models and clean indexes
    for (const modelName of Object.keys(sequelize.models)) {
      const model = sequelize.models[modelName];
      if (model.getTableName) {
        const tableName = model.getTableName();
        await dropExtraIndexes(tableName);
      }
    }

    await sequelize.sync({ alter: true }); // Sync all models!
        console.log('✅ All tables synchronized with models.');

  } catch (error) {
    console.error('❌ Error syncing models:', error);
    process.exit(1); // Optional: stop app if sync fails
  }
};

syncModel();
