
// scripts/fresh_sync.js (ESM)
import sequelize from '../config/sequelize.js';
import '../models/index.js';

import Role from '../models/Role.js';
import Admin from '../models/Admin.js';
import Location from '../models/Location.js';
import { runUpAll as runMigrations } from './migrate.js';


const JAMAICA_PARISHES = [
  'Kingston',
  'Saint Andrew',
  'Saint Catherine',
  'Clarendon',
  'Manchester',
  'Saint Elizabeth',
  'Westmoreland',
  'Hanover',
  'Saint James',
  'Trelawny',
  'Saint Ann',
  'Saint Mary',
  'Portland',
  'Saint Thomas'
];

const COUNTRIES_WITH_STATES = {
  Jamaica: JAMAICA_PARISHES
};


const countries = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo (Congo-Brazzaville)',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States of America',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe'
];


const ENV = process.env.NODE_ENV || 'development';
const IS_PROD = ENV === 'production';
const IS_UAT  = ENV === 'uat';
const IS_DEV  = ENV === 'development';




// --- keep your existing helpers (dropExtraIndexes, constants, ensureJamaicaParishes) unchanged ---

// Drop duplicate unique indexes for a given table (That will drop each unique index once and avoid the repeated “Could not drop index …” spam.)
const dropExtraIndexes = async (table) => {
  const [results] = await sequelize.query(`
    SELECT INDEX_NAME, TABLE_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = '${table}'
      AND NON_UNIQUE = 0
  `);

  if (results.length > 0) {
    const indexNames = [...new Set(results.map(r => r.INDEX_NAME))]; // 🔹 dedupe
    console.log(`🔎 Checking indexes in ${table}:`, indexNames);

    for (const indexName of indexNames) {
      if (indexName === 'PRIMARY') continue;
      try {
        await sequelize.query(
          `ALTER TABLE \`${table}\` DROP INDEX \`${indexName}\``
        );
        console.log(`🗑 Dropped index: ${indexName} from ${table}`);
      } catch (e) {
        console.log(
          `⚠️ Could not drop index ${indexName} from ${table}:`,
          e.message
        );
      }
    }
  }
};


const ensureJamaicaParishes = async () => {
  for (const parish of JAMAICA_PARISHES) {
    await Location.findOrCreate({
      where: { country: 'Jamaica', state: parish, city: 'N/A' },
      defaults: {
        postal_code: '00000',
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  }
  await Location.destroy({ where: { country: 'Jamaica', state: 'N/A' } });
};

const tableExists = async (tableName) => {
  const [rows] = await sequelize.query(`SHOW TABLES LIKE ${sequelize.escape(tableName)}`);
  return Array.isArray(rows) && rows.length > 0;
};

const columnExists = async (tableName, columnName) => {
  const [rows] = await sequelize.query(
    `SHOW COLUMNS FROM \`${tableName}\` LIKE ${sequelize.escape(columnName)}`
  );
  return Array.isArray(rows) && rows.length > 0;
};

async function isDatabaseEmpty(sequelize) {
  const [rows] = await sequelize.query(`
    SELECT COUNT(*) AS cnt
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
  `);
  return Number(rows?.[0]?.cnt || 0) === 0;
}


// --- exportable function ---
export async function freshSync() {
  const logs = [];
  const log = (m) => { console.log(m); logs.push(m); };

  try {



    
    const dbEmpty = await isDatabaseEmpty(sequelize);

      if (dbEmpty) {
        log('🆕 Fresh DB detected (no tables). Creating base schema from models...');
        await sequelize.sync(); // ✅ create tables only
        log('✅ Base schema created from models.');
      }


      // 0) Run DB migrations first (DDL)
    log('🚀 Running migrations...');
    await runMigrations();
    log('✅ Migrations complete.');





        // 1) Dangerous ops ONLY in non-production
    if (!IS_PROD) {
   
      // Optional: drop dup unique indexes
      for (const modelName of Object.keys(sequelize.models)) {
        const model = sequelize.models[modelName];
        if (model.getTableName) {
          const tableName = model.getTableName();
          await dropExtraIndexes(tableName);
        }
      }


      if (!IS_PROD) {
  log('🛠️ Dev/UAT: sync alter...');
    // 2) Only dev/uat should use sync(alter)
      await sequelize.sync({ alter: true });
  log('✅ Alter sync done.');
} else {
  log('🛡️ Prod: skipped alter sync.');
}



       console.log('✅ All tables synchronized with models.')
      log('✅ All tables synchronized with models (alter).');
    } else {
      // In prod, **never** alter based on models. Just sanity check the connection.
      await sequelize.authenticate();
      console.log('🛡️ Production: skipped alter/sync & index drops. Migrations only.')
      log('🛡️ Production: skipped alter/sync & index drops. Migrations only.');
    }




    const now = new Date();
    const rolesOrdered = [
      { role_id: 1, role_name: 'superadmin', is_system: true, status: 'active', created_at: now },
      { role_name: 'subadmin',   is_system: true, status: 'active', created_at: now },
      { role_name: 'Support & Customer Service', is_system: false, status: 'active', created_at: now },
      { role_name: 'Finance Officer',            is_system: false, status: 'active', created_at: now },
      { role_name: 'IT Administrator',           is_system: false, status: 'active', created_at: now },
    ];

    // seed roles (if empty)
    const roleCount = await Role.count();
    if (roleCount === 0) {
      for (const r of rolesOrdered) {
        await Role.create(r);
        log(`🟢 Role "${r.role_name}"`);
      }
    }

    // seed admin (if empty)
    const adminCount = await Admin.count();
    if (adminCount === 0) {
      await Admin.create({
        admin_id: 1,
        role_id: 1,
        admin_type: 'superadmin',
        email: 'kilvishbirla@gmail.com',
        country_code: '+91',
        contact: '9039568219',
        full_contact: '+919039568219',
        username: 'admin',
        first_name: 'Kilvish',
        last_name: 'Birla',
        password: '$2a$10$4VoLapTgmal5/28mL6UAFO0tDSISbcpp.s1LgJAWtDzfYdJVe7IBm',        
        state: '',
        status: 'Active',
        two_step_verification: 'Off',
        timezone: 'Asia/Calcutta',
      });
      log('🟢 Admin account seeded with username "admin".');
    }

    // locations
    const locationCount = await Location.count();
    if (locationCount === 0) {
      for (const country of countries) {
        const states = COUNTRIES_WITH_STATES[country] || ['N/A'];
        for (const st of states) {
          await Location.create({
            country,
            state: st,
            city: 'N/A',
            postal_code: '00000',
            created_at: new Date(),
            updated_at: new Date(),
          });
        }
        log(`✅ Inserted location rows for ${country}${states[0] !== 'N/A' ? ' (with states)' : ''}.`);
      }
      log('🎉 Location table seeded successfully.');
    } else {
      await ensureJamaicaParishes();
      log('🟢 Ensured Jamaica parishes exist.');
    }





    return { ok: true, logs };
  } catch (error) {
    console.error('❌ Error syncing models:', error);
    return { ok: false, error: error.message || String(error), logs };
  } finally {
    // DO NOT close sequelize here when called via route (shared pool).
    // If you run this file directly (CLI), we will close below.
  }
}

// --- run if executed directly (CLI) ---
import { pathToFileURL } from 'url';
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const res = await freshSync();
  // close pool in CLI mode
  await sequelize.close().catch(() => {});
  if (!res.ok) process.exit(1);
}
export default freshSync;


