import './loadEnv.js';
import http from 'http';
import https from 'https';

import sequelize from "./config/sequelize.js";

import express from 'express';
import * as url from 'url';
import * as path from 'path';
import csurf from 'csurf';
import cookie from 'cookie-parser';
import dotenv from 'dotenv'
import fs from 'fs';
import helmet from 'helmet';
import { resolveTz } from './middleware/resolveTz.js';
import requestIp from "request-ip";

 import SuperAdminRouter from "./routes/superadminRoute.js";
import secureRoutes from "./routes/secureRoutes.js"
import apiRouter from "./routes/apiRoute.js";
import IndexRouter from "./routes/indexRoute.js"

import { initAuditLogging } from './utils/auditLogger.js';

import Location from './models/Location.js';
import { loadLocationCache } from './utils/killocations.js'
import { safeJson } from './helper/helper.js';


import { initSockets } from './sockets/index.js';

import { validateRedirectUrl } from './middleware/validateRedirect.js';
//import { signCfUrl } from './utils/cfSigner.js';



import { getRsaPublicKey } from './config/rsaKeys.js';


// Load RSA public key once (for EJS)
let RSA_PUBLIC_KEY = '';
try {
  RSA_PUBLIC_KEY = getRsaPublicKey();
} catch (e) {
  console.error('❌ RSA public key load error:', e.message);
  RSA_PUBLIC_KEY = '';
}




//---------------Import Section Finish ----------------
const app = express();


// 🔐 Audit logging: set up request context + rotation/retention
await initAuditLogging(app);

const __dirname = url.fileURLToPath(new URL('.',import.meta.url));

//----------------------  global  Middleware start ----------------

app.use(cookie());

app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));







//========== CSRF Start Middleware ======================   

// In app.js (top-level, can be imported)
const multipartCsrfRoutes = [
  // --=- 1. Superadmin ---

  '/superadmin/upload_asset'

  // ----- 2. Other Panels  ---
 
];

        // Apply CSRF protection only to non-API routes
  app.use((req, res, next) => {

      if ( req.path.startsWith('/api') || (req.method === 'POST' && multipartCsrfRoutes.includes(req.path)) ) 
      {
        // SKIP CSRF for /api and multipart POSTs
        return next();
      }
      csurf({ cookie: true })(req, res, next);

  });

    // Set CSRF token to ejs vriable  For all routes where global csurf applies
    app.use((req, res, next) => {
        res.locals.csrfToken = ''; // ALWAYS defined
        if (!req.path.startsWith('/api') && typeof req.csrfToken === 'function') {
          try { res.locals.csrfToken = req.csrfToken(); } catch {}
        }
        next();
      });
    

//========== CSRF End ======================

// must be after CSRF so that  view GETs always pass csurf and get a token
app.use(express.static(path.join(__dirname, 'public')));






//Configure HSTS -> Enforce the browser to use HTTPS:
// app.use((req, res, next) => {
//   res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
//   next();
// });




function getTitleFromUrl(url) {
  // 1. Safety checks
  if (!url || typeof url !== 'string') return 'Dashboard';

  // 2. Remove query string and trailing slash
  url = url.split('?')[0].replace(/\/+$/, '');

  // 3. Split into segments and remove empty
  const parts = url.split('/').filter(Boolean);

  // If nothing left, home/dashboard
  if (parts.length === 0) return 'Dashboard';

  // 4. Remove numeric or meaningless segments
  const filteredParts = parts.filter(p =>
    p && isNaN(p) && !['api', 'superadmin', 'client', 'user', 'sscl', 'admin', 'public', 'v1', 'v2', 'v3'].includes(p.toLowerCase())
  );

  // If no non-generic segment, fallback to dashboard
  if (!filteredParts.length) return 'Dashboard';

  // 5. Use last 1 or 2 segments for better context
  let slug = filteredParts.slice(-2).join(' ');

  // 6. Beautify: replace -/_/extra space, capitalize each word
  let title = slug
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, l => l.toUpperCase());

  // 7. Fallback for edge cases
  if (!title || title.toLowerCase() === 'Dashboard') return 'Dashboard';

  return title;
}



//====================== CSP START ================================= 



// At the last CSP will be Created here 



//=====================   CSP END ===================================





app.use(async (req, res, next) => {

    try {

    
      app.locals.host  =  process.env.Host;
      app.locals.currentUrl = req.originalUrl;
       res.locals.pageTitle = getTitleFromUrl(req.path || req.originalUrl);
      app.locals.showModal = true;    
      app.locals.dashboard_type = 'Guest';
      req.dashboard_type = 'Guest';
      
      app.locals.encrypt_key =  process.env.ENCRYPTION_SECRET_KEY;
      app.locals.RECAPTCHA_ENTERPRISE_SITE_KEY =  process.env.RECAPTCHA_ENTERPRISE_SITE_KEY;

             // 🔐 Make RSA public key available to EJS
    app.locals.RSA_PUBLIC_KEY = RSA_PUBLIC_KEY;
     

      //--------- For Secure AWS bucket file URL ------------------
      //res.locals.cfSign = signCfUrl;
      
      // res.locals.csrfToken = 'csrfkil'

      app.locals.currency  =  process.env.currency;
      req.currency = process.env.currency;


      //====== Set Locations Gloably in Local Variables  =============== 
            await loadLocationCache(app);
         // console.log('=== countries====>>>', app.locals.countries )
          //console.log('=== countryStates====>>>', app.locals.countryStates )

        //====== Set Locations Gloably in Local Variables  =============== 

    const baseUrl = req.protocol + '://' + req.get('host');

    req.base_url =   baseUrl 
    app.locals.base_url = baseUrl

     app.locals.output = ''
     app.locals.is_client = false
     res.set('Cache-Control', 'no-cache, must-revalidate');
     
      next();
    } catch (error) {
      console.error('Global Variables Error ->> :', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
    
  });


app.use(resolveTz);
   //app.use(validateRedirectUrl);

// Guard against locals shadowing EJS include helper
app.use((req, res, next) => {
  const origRender = res.render.bind(res);
  res.render = (view, options, callback) => {
    if (options && Object.prototype.hasOwnProperty.call(options, 'include') && typeof options.include !== 'function') {
      delete options.include;
    }
    if (res.locals && Object.prototype.hasOwnProperty.call(res.locals, 'include') && typeof res.locals.include !== 'function') {
      delete res.locals.include;
    }
    if (req.app?.locals && Object.prototype.hasOwnProperty.call(req.app.locals, 'include') && typeof req.app.locals.include !== 'function') {
      delete req.app.locals.include;
    }
    return origRender(view, options, callback);
  };
  next();
});



  

app.use('/secure',secureRoutes)
app.use('/superadmin',SuperAdminRouter);
app.use('/',IndexRouter);
 app.use('/api', apiRouter); 

 




app.set("view engine","ejs");
app.set("views",[
    path.join(__dirname,"./views"),
    path.join(__dirname,"./views/superadmin"),
    path.join(__dirname,"./views/client"),  
    path.join(__dirname,"./views/lawyer"),
])






// ========================  SERVER START PROCESS  START  ==========================

const port = Number(process.env.PORT || 3042);

/**
 * Environment-aware SSL resolver (dev / uat / production)
 *
 * From provided ssl.zip:
 *   ssl/                          (also contains PROD files as fallback)
 *     ca-chain.crt
 *     kwljmsystems.crt
 *     kwljmsystems.key
 *     kwljmsystems.pem
 *
 *   ssl/prod/
 *     ca-chain.crt
 *     kwljmsystems.crt
 *     kwljmsystems.key
 *     kwljmsystems.pem
 *
 *   ssl/uat/
 *     ca-cert-chain.pem
 *     kwlazgatetestv2.key
 *     kwlazgatetestv2.pem
 *
 * DEV keeps generic:
 *   ssl/ (dev)
 *     key.pem, cert.pem, [domain.crt], [ca-chain.crt]
 *
 * NOTE: If the env dir is missing files, we will fallback to base ./ssl
 *       (your zip includes PROD files in both locations).
 *
 * Optional overrides (filenames only; dirs fixed): SSL_KEY, SSL_CERT, SSL_CA, SSL_CERT_FALLBACK
 */

function getEnv() {
  const v = String(process.env.NODE_ENV || 'development').toLowerCase();
  if (v === 'production' || v === 'prod') return 'prod';
  if (v === 'uat' || v === 'staging' || v === 'test') return 'uat';
  return 'dev';
}

function resolveSslDirs() {
  const base = path.join(__dirname, 'ssl');
  const env = getEnv();
  if (env === 'prod') return { env, primary: path.join(base, 'prod'), fallback: base };
  if (env === 'uat')  return { env, primary: path.join(base, 'uat'),  fallback: base };
  return { env, primary: base, fallback: null }; // dev
}

function tryRead(p) {
  try { if (p && fs.existsSync(p)) return fs.readFileSync(p); } catch (e) {
    console.error(`⚠️ Failed reading ${p}:`, e.message);
  }
  return null;
}

function firstExistingPathMulti(dirs, names) {
  for (const d of dirs.filter(Boolean)) {
    for (const name of names) {
      if (!name) continue;
      const full = path.join(d, name);
      if (fs.existsSync(full)) return full;
    }
  }
  return null;
}

function loadSSLOptionsEnvAware() {
  const { env, primary, fallback } = resolveSslDirs();
  const searchDirs = fallback ? [primary, fallback] : [primary];

  // Exact candidates from your zip + sensible generics for dev
  const CANDIDATES = {
    dev: {
      key:           ['key.pem', 'server.key', 'kwljmsystems.key'],
      cert:          ['cert.pem', 'server.crt', 'server.pem', 'kwljmsystems.crt', 'kwljmsystems.pem'],
      ca:            ['ca-chain.crt', 'chain.pem', 'ca-cert-chain.pem', 'fullchain.pem'],
      cert_fallback: ['domain.crt', 'fullchain.pem', 'kwljmsystems.pem']
    },
    uat: {
      key:           ['kwlazgatetestv2.key'],
      cert:          ['kwlazgatetestv2.pem'],
      ca:            ['ca-cert-chain.pem'],
      cert_fallback: [] // not needed for UAT
    },
    prod: {
      key:           ['kwljmsystems.key', 'server.key', 'key.pem'],
      cert:          ['kwljmsystems.crt', 'server.crt', 'server.pem', 'cert.pem'],
      ca:            ['ca-chain.crt', 'fullchain.pem', 'ca-cert-chain.pem', 'chain.pem'],
      cert_fallback: ['kwljmsystems.pem', 'fullchain.pem', 'domain.crt']
    }
  };

  const set = CANDIDATES[env] || CANDIDATES.dev;

  // Optional filename overrides (if you keep them)
  const keyNameOverride  = process.env.SSL_KEY || null;
  const certNameOverride = process.env.SSL_CERT || null;
  const caNameOverride   = process.env.SSL_CA || null;
  const certFallbackOverride = process.env.SSL_CERT_FALLBACK || null;

  const keyPath = keyNameOverride
    ? path.join(primary, keyNameOverride)
    : firstExistingPathMulti(searchDirs, set.key);

  let certPath = certNameOverride
    ? path.join(primary, certNameOverride)
    : firstExistingPathMulti(searchDirs, set.cert);

  if (!certPath) {
    const fbList = certFallbackOverride ? [certFallbackOverride] : set.cert_fallback;
    certPath = firstExistingPathMulti(searchDirs, fbList);
  }

  const caPath = caNameOverride
    ? path.join(primary, caNameOverride)
    : firstExistingPathMulti(searchDirs, set.ca);

  const key  = tryRead(keyPath);
  const cert = tryRead(certPath);
  const ca   = tryRead(caPath);

  if (!key || !cert) {
    console.warn(
`⚠️ SSL disabled for env="${env}". Missing required files.
Searched in:
 - ${searchDirs.join(' , ')}

Required (key + cert):
 - key : ${keyPath || '(not found)'}
 - cert: ${certPath || '(not found)'}
Optional chain:
 - ca  : ${caPath || '(not found)'}
`
    );
    return null;
  }

  console.log(`🔑 SSL enabled for NODE_ENV="${env}".`);
  console.log(`   • key : ${keyPath}`);
  console.log(`   • cert: ${certPath}`);
  if (ca) console.log(`   • ca  : ${caPath}`);

  const httpsOptions = { key, cert };
  if (ca) httpsOptions.ca = ca; // Buffer or array of Buffers
  return httpsOptions;
}

const sslOptions = loadSSLOptionsEnvAware();

if (sslOptions) {
  const httpsServer = https.createServer(sslOptions, app);
   // ✅ attach sockets once
        initSockets(httpsServer);
  httpsServer.listen(port, () => {
    app.locals.httpsPort = httpsServer.address().port;
    console.log(`🔐 HTTPS Server running at https://127.0.0.1:${app.locals.httpsPort}`);
  });
} else {
  const httpServer = http.createServer(app);

     // ✅ attach sockets once
        initSockets(httpServer);

  httpServer.listen(port, () => {
    app.locals.httpPort = httpServer.address().port;
    console.log(`🌐 HTTP Server running at http://127.0.0.1:${app.locals.httpPort}`);
  });
}

// ========================  SERVER START PROCESS END   ==========================
