// validation/lawFirmSchemas.js
import { validateBody, v } from '../middleware/validate.js';

export const addLawFirmSchema = {
  firm_name: {
    label: 'Firm Name',
    required: true,
    sanitize: (r) => v.collapseSpaces(v.stripTags(r)),
    validate: (val) => {
      if (!val) throw new Error('Firm name is required.');
      if (val.length > 191) throw new Error('Firm name must be ≤ 191 chars.');
    }
  },
  registration_number: {
    label: 'Registration Number',
    required: true,
    sanitize: (r) => v.collapseSpaces(v.stripTags(r)),
    validate: (val) => {
      if (!val) throw new Error('Registration number is required.');
      if (val.length > 191) throw new Error('Registration number must be ≤ 191 chars.');
    }
  },
  email: {
    label: 'Email',
    required: true,
    sanitize: (r) => v.collapseSpaces(String(r ?? '').toLowerCase()),
    validate: (val) => {
      if (!val) throw new Error('Email is required.');
      if (val.length > 255) throw new Error('Email must be ≤ 255 chars.');
      if (!v.isEmail(val)) throw new Error('Email is not valid.');
    }
  },
  country_code: {
    label: 'Country Code',
    sanitize: (r) => v.collapseSpaces(v.stripTags(r)),
    validate: (val) => {
      if (!val) throw new Error('Country code is required.');
      if (!/^\+?[0-9]{1,6}$/.test(val)) throw new Error('Country code must be + and digits (1–6).');
    }
  },
  contact: {
    label: 'Contact',
    sanitize: (r) => v.toNull(v.normalizePhone(r)),
    validate: (val) => {
      if (!val) throw new Error('Contact is required.');
      if (!v.isPhone(val)) throw new Error('Contact must be a valid phone number.');
    }
  },
  locations_json: {
    label: 'Locations JSON',
    sanitize: (r) => v.toNull(r),
    validate: (val) => {
      try {
        const arr = JSON.parse(val || '[]');
        if (!Array.isArray(arr) || !arr.length) throw new Error();
        const ok = arr.every(x => x?.parish && x?.address);
        if (!ok) throw new Error();
      } catch {
        throw new Error('At least one service location (parish + address) is required.');
      }
    }
  },
  practice_area_ids: {
    label: 'Practice Area IDs',
    sanitize: (r) => (r ?? '[]'),
    validate: () => {}
  },
  password: {
    label: 'Password',
    sanitize: (r) => v.toNull(r),
    validate: (val) => {
      if (!val) return;
      if (val.length < 8 || val.length > 200) throw new Error('Password must be 8–200 chars.');
    }
  },
  confirm_password: {
    label: 'Confirm Password',
    sanitize: (r) => v.toNull(r),
    validate: () => {}
  },
  otp: {
    label: 'OTP',
    sanitize: (r) => v.toNull(v.collapseSpaces(String(r ?? ''))),
    validate: () => {}
  },
  otp_id: {
    label: 'OTP ID',
    sanitize: (r) => v.toNull(v.collapseSpaces(String(r ?? ''))),
    validate: () => {}
  },
  description: {
    label: 'Firm Description',
    sanitize: (r) => v.toNull(v.collapseSpaces(v.stripTags(r))),
    validate: (val) => { if (val && val.length > 2000) throw new Error('Description too long.'); }
  }
};

export const validateAddLawFirm = (opts = {}) =>
  validateBody(addLawFirmSchema, { as: 'lawfirm', ...opts });
