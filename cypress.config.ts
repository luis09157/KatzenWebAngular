import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:4200',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    video: false,
    viewportWidth: 1366,
    viewportHeight: 768,
    retries: 1,
    defaultCommandTimeout: 15000,
    requestTimeout: 20000,
  },
});
