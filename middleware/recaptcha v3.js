// middlewares/recaptcha.js
import axios from 'axios';

export const verifyRecaptcha = async (req, res, next) => {
  try {
    const token = req.body['recaptcha-response'];
    const secret = process.env.RECAPTCHA_ENTERPRISE_SECRET_KEY;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Missing reCAPTCHA token' });
    }

    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify`;

    const params = new URLSearchParams();
    params.append('secret', secret);
    params.append('response', token);
    params.append('remoteip', req.ip);

    const response = await axios.post(verificationUrl, params);
    const data = response.data;

    // if (!data.success || data.score < 0.5) {
    //   return res.status(403).json({ success: false, message: 'Failed reCAPTCHA verification' });
    // }

    
    if (!data.success || (data.score !== undefined && data.score < 0.5)) {
      return res.status(403).render('recaptcha_failed', {
        message: 'Suspicious activity detected. Please try again.',
      });
    }

    next();
  } catch (error) {
    console.error('reCAPTCHA verification error:', error.message);
    return res.status(500).json({ success: false, message: 'reCAPTCHA verification failed' });
  }
};
