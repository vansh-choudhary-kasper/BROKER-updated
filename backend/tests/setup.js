// Increase timeout for all tests
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  // Uncomment to silence specific console methods during tests
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Suppress specific warnings during tests
process.on('unhandledRejection', (reason, promise) => {
  // Uncomment to suppress unhandled rejection warnings
  // console.warn('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Clean up any test files after all tests complete
afterAll(() => {
  // Additional cleanup can be added here if needed
});