module.exports = {
  preset: '@metamask/snaps-jest',
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  testEnvironmentOptions: {
    server: {
      enabled: true,
      root: './',
    },
  },
};
