// utils/respond.js
// Assumes you already have: flashSet, toastOkJson, toastFailJson, isAjax (optional)

function isAjaxLike(req) {
  // robust: works for fetch, axios, jquery, etc.
  const xrw = (req.get('X-Requested-With') || '').toLowerCase();
  const accept = (req.get('Accept') || '').toLowerCase();
  const ctype = (req.get('Content-Type') || '').toLowerCase();

  // prefer your own isAjax(req) if you already have it
  if (typeof isAjax === 'function') {
    try { if (isAjax(req)) return true; } catch {}
  }

  return (
    xrw === 'xmlhttprequest' ||
    accept.includes('application/json') ||
    ctype.includes('application/json')
  );
}

function redirectSmart(req, res, to) {
  if (!to || to === 'back') return res.redirect(req.get('Referrer') || '/');
  return res.redirect(to);
}

export function respond(req, res, opts = {}) {
  const {
    ok = true,

    // messages
    message = ok ? 'Done' : 'Request failed',
    flashKey = 'elaw_msg',

    // non-ajax behavior
    redirectTo = 'back', // 'back' | '/somewhere'

    // ajax behavior
    statusCode = ok ? 200 : 400,
    extra = {},

    // advanced
    force = null, // 'ajax' | 'page' | null
  } = opts;

  const ajax = force === 'ajax' ? true : force === 'page' ? false : isAjaxLike(req);

  if (ajax) {
    // keep your existing toast helpers as the single source of truth
    return ok
      ? toastOkJson(res, message, extra)
      : toastFailJson(res, statusCode, message);
  }

  flashSet(res, flashKey, message);
  return redirectSmart(req, res, redirectTo);
}

// sugar helpers (optional)
export const respondOk = (req, res, opts = {}) =>
  respond(req, res, { ...opts, ok: true, statusCode: 200 });

export const respondFail = (req, res, opts = {}) =>
  respond(req, res, { ...opts, ok: false, statusCode: opts.statusCode ?? 400 });
