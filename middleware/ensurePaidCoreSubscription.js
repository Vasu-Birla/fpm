// middleware/ensurePaidCoreSubscription.js
import { Op } from 'sequelize';
import FirmSubscription from '../models/FirmSubscription.js';
import Plan from '../models/Plan.js';

export async function ensurePaidCoreSubscription(req, res, next) {
  try {
    const firm = req.firm || req.lawfirm || req.firmstaff?.firm;
    const firm_id = firm?.firm_id || req.firmstaff?.firm_id;
    if (!firm_id) return res.redirect('/firmstaff/logout');

    const active = await FirmSubscription.findOne({
      where: { firm_id, solution_key: 'core', status: 'active' },
      include: [{
        model: Plan,
        as: 'plan',
        required: true,
        where: {
          is_active: true,
          solution_key: 'core',
          plan_key: { [Op.ne]: 'free' },        // 👈 exclude free
          // or plan_key: { [Op.in]: ['pro','business','enterprise'] }
        },
        attributes: ['plan_id','plan_key'],
      }],
    });

    if (!active) return res.redirect('/firmstaff/subscribe');
    return next();
  } catch (e) {
    console.log('ensurePaidCoreSubscription error:', e);
    return res.redirect('/firmstaff/subscribe');
  }
}
