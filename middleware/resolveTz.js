// middleware/resolveTz.js
import moment from 'moment-timezone';

export function resolveTz(req, res, next) {
  const q = req.query?.tz || req.body?.tz;                            // explicit override
  const hdr = req.get('x-timezone') || req.get('x-tz');               // optional header
  const cookieTz = req.cookies?.tz;                                   // client-set cookie
  const userTz = req.admin?.timezone || req.customer?.timezone;       // stored on login/profile
  const guess = moment.tz.guess();                                    // last resort (server guess)

  const tz = q || hdr || cookieTz || userTz || guess || 'America/Jamaica';
  req.userTz = tz;
  res.locals.userTz = tz; // handy in EJS if needed
  next();
}
