// middleware/clientPortalGuard.js
import { getEntitlement } from '../utils/entitlements_lean.js';

export async function clientPortalGuard(req, res, next) {
  try {
    // derive firm_id from the request context (your auth/session)
    const firm_id = req.firm?.firm_id || req.active_firm_id || req.firmStaff?.firm_id;
    if (!firm_id) return res.status(403).send('Firm not resolved');

    const ent = await getEntitlement({
      firm_id,
      solutionKey: 'core',
      featureKey: 'client_portal.enabled'
    });

    if (!ent.ok || !ent.value) {
      // block if feature is off
      return res.status(403).send('Client Portal is not enabled for your subscription.');
    }
    next();
  } catch (e) {
    next(e);
  }
}
