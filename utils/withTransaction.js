// utils/withTransaction.js
import sequelize from '../config/sequelize.js';
export async function withTransaction(fn) {
  const t = await sequelize.transaction();
  try {
    const result = await fn(t);
    await t.commit();
    return result;
  } catch (e) {
    try { await t.rollback(); } catch {}
    throw e;
  }
}
