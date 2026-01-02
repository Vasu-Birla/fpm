import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';
import * as url from 'url';
import * as path from 'path';
import fs from 'fs';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url)); // gets directory of current file
const keyFilePath = path.resolve(__dirname, '../config/sscl-recaptcha-file.json'); // resolves relative to recaptcha.js



// let keyFilePath = process.env.RECAPTCHA_KEYFILE;

// if (!keyFilePath || !fs.existsSync(keyFilePath)) {
//   // Fallback to local path if env path is missing or file does not exist
//   keyFilePath = path.resolve(__dirname, '../config/sscl-recaptcha-file.json');

//   if (!fs.existsSync(keyFilePath)) {
//     console.error('❌ Service account key file not found in either env path or fallback path.');
//     keyFilePath = null;
//   } else {
//     console.log('✅ Using fallback key file path:', keyFilePath);
//   }
// } else {
//   console.log('✅ Using RECAPTCHA_KEYFILE from environment:', keyFilePath);
// }



let client;
try {
  client = new RecaptchaEnterpriseServiceClient({
    keyFilename: keyFilePath
  });
} catch (e) {
  console.error('⚠️ Failed to initialize reCAPTCHA client:', e.message);
  client = null
}


    const PROJECT_ID = process.env.RECAPTCHA_PROJECT_ID || '';

    //const PROJECT_ID = await client.getProjectId();


export async function verifyRecaptchaEnterprise(req, res, next) {
  const token = req.body['recaptcha-response'];

  if (!token) {
    return res.status(400).render('recaptcha_failed', {
      message: 'Missing reCAPTCHA token.',
    });
  }

  try {
    if (!client || !PROJECT_ID) {
     // throw new Error('Invalid or Missing Service Account, reCAPTCHA client not configured properly');

    return res.status(500).render('recaptcha_failed', {
      message: `Invalid or Missing Service Account, reCAPTCHA client not configured properly . Contact support or try again.`,
    });

    }

    const [assessment] = await client.createAssessment({
      parent: `projects/${PROJECT_ID}`,
      assessment: {
        event: {
          token,
          siteKey: process.env.RECAPTCHA_ENTERPRISE_SITE_KEY,
        },
      },
    });

    const valid = assessment.tokenProperties?.valid;
    const score = assessment.riskAnalysis?.score;

    if (!valid || score < 0.5) {
      return res.status(403).render('recaptcha_failed', {
        message: 'Suspicious activity detected. Please try again.',
      });
    }

    next();
  } catch (err) {

    console.error('reCAPTCHA verification error:', err.message);
    return res.status(500).render('recaptcha_failed', {
      message: `Verification failed ${err.message} . Contact support or try again.`,
    });

  }
}