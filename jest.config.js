module.exports = {
  roots: [
    "<rootDir>/test"
  ],
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.*/__mocks__/",
    "<rootDir>/.cursor/",
    "<rootDir>/.vscode/",
    "<rootDir>/.nvm/"
  ],
  modulePathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.*/__mocks__/",
    "<rootDir>/.cursor/",
    "<rootDir>/.vscode/",
    "<rootDir>/.nvm/"
  ],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/test/",
    "/server-old.js/",
    "/database.js/",
    "/utils/AppError.js/",
    "/utils/notificationService.js/",
    "/utils/whatsappService.js/"
  ]
};