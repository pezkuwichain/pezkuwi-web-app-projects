// Mock for sonner (web-only toast library)
module.exports = {
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    promise: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
  Toaster: () => null,
};
