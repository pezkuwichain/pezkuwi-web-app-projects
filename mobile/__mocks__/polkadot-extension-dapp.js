module.exports = {
  web3FromAddress: jest.fn(() => Promise.resolve({
    signer: {
      signRaw: jest.fn(),
      signPayload: jest.fn(),
    },
  })),
  web3Enable: jest.fn(() => Promise.resolve([
    {
      name: 'Polkadot.js Extension',
      version: '1.0.0',
    },
  ])),
  web3Accounts: jest.fn(() => Promise.resolve([])),
  web3ListRpcMethods: jest.fn(() => Promise.resolve([])),
};
