// middlewares/secureUrlInjector.js

import url from 'url'

export const injectSecureUrls = (req, res, next) => {
  const rewriteFileFields = (modelName, record) => {
    const secureify = (field) => {
      if (!record[field]) return;
      if (!record[field].includes('s3.amazonaws.com')) return;
      record[field] = `/secure/file/${modelName}/${record[`${modelName}_id`]}/${field}`;
    };

    for (const field in record) {
      if (typeof record[field] === 'string' && record[field].includes('s3.amazonaws.com')) {
        secureify(field);
      }
    }
  };

  const patch = (locals) => {
    for (const key in locals) {
      const value = locals[key];
      if (!value || typeof value !== 'object') continue;

      if (value.constructor?.name === 'Model') {
        // Sequelize model — try to get model name
        const modelName = value.constructor.name.toLowerCase();
        rewriteFileFields(modelName, value);
      }
    }
  };

  patch(res.locals);
  next();
};
