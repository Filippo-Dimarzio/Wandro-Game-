// Extends app.json. EXPO_BASE_URL is set when the web build is hosted under a sub-path
// (GitHub Pages serves the app at /<repo-name>/).
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_BASE_URL || '',
  },
});
