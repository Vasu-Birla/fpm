
import Admin from '../models/Admin.js'

import sequelize from '../config/sequelize.js'





const syncModel = async () => {
  try {
    await Admin.sync({ alter: true }); // Sync only the Membership model
    console.log(' table synchronized');
  } catch (error) {
    console.error('Error syncing Membership model:', error);
  } finally {
    await sequelize.close(); // Close connection after syncing
  }
};

syncModel();
