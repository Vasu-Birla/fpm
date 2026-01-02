const path = require('path');
const rootDir = __dirname;

module.exports = {
  apps: [
    {
      name: "elaw-dev",
      cwd: rootDir,
      script: "app.js",
      interpreter: "node",
      env: {
        NODE_ENV: "development",
        PORT: 3037
      }
    },
    {
      name: "elaw-uat",
      cwd: rootDir,
      script: "app.js",
      interpreter: "node",
      env: {
        NODE_ENV: "uat",
        PORT: 3038
      }
    },
    {
      name: "elaw-prod",
      cwd: rootDir,
      script: "app.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 3039
      }
    }
  ]
};
