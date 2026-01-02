// middleware/ensureLoggedOut.js
import jwt from 'jsonwebtoken';
import ActiveSessionAdmin from '../models/ActiveSessionAdmin.js';
import ActiveSessionClient from '../models/ActiveSessionClient.js';


//===================== For Admin '/superadmin' =============================================
 async function checkAdminLoggedIn(req, res) {


  const token = req.cookies?.elaw_admin_token;
  if (!token) return { loggedIn: false };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Confirm token is still active (revocation / single-session)
    const row = await ActiveSessionAdmin.findOne({ where: { admin_id: decoded.id, token } });
    if (!row) throw new Error('revoked');
    if (row.expires_at && row.expires_at.getTime() < Date.now()) throw new Error('expired');
    return { loggedIn: true, adminId: decoded.id, token };
  } catch(err) {
    console.log('error in checking AdminLogin OR NOT --> ', err)
    // Clear stale cookie
    res.clearCookie('elaw_admin_token', { path: '/superadmin' });
    return { loggedIn: false };
  }
}


export async function ensureLoggedOut(req, res, next) {
  const s = await checkAdminLoggedIn(req, res);

//   if (s.pending)  return res.redirect('/superadmin/two_step_verification');
  if (s.loggedIn) return res.redirect('/superadmin');
  next();
}

//========================= END ADmin  =====================================================








//================= For Client '/' ========================================




async function checkClientLoggedIn(req, res) {
  // 1) If 2FA is pending via cookie, prefer redirect to verification
  const pending = req.cookies?.pending_client_token;
  if (pending) {
    try {
      jwt.verify(pending, process.env.JWT_SECRET);
      return { pending: true, loggedIn: false };
    } catch {
      // token invalid/expired -> clear stale pending cookie
      res.clearCookie('pending_client_token', { path: '/' });
    }
  }

  // 2) Normal cookie session
  const token = req.cookies?.elaw_client_token;
  if (!token) return { loggedIn: false };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Confirm token is still active (revocation / single-session)
    const row = await ActiveSessionClient.findOne({
      where: { client_account_id: decoded.id, token },
    });
    if (!row) throw new Error('revoked');
    if (row.expires_at && row.expires_at.getTime() < Date.now()) throw new Error('expired');
    return { loggedIn: true, clientId: decoded.id, token };
  } catch {
    // Clear stale cookie
    res.clearCookie('elaw_client_token', { path: '/' });
    return { loggedIn: false };
  }
}

export async function ensureClientLoggedOut(req, res, next) {
  const s = await checkClientLoggedIn(req, res);

  // If you want to redirect clients with pending 2FA:
  // if (s.pending) return res.redirect('//two_step_verification');

  if (s.loggedIn) return res.redirect('/');
  next();
}




//=============== end client ===================================
