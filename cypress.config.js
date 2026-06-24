const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://dummyjson.com",
    supportFile: false,
    env: {
      username: "emilys",
      password: "emilyspass"
    }
  },
  pageLoadTimeout: 120000,
  video: false,
  screenshotOnRunFailure: false
});
