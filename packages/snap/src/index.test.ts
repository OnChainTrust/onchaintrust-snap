import { installSnap } from '@metamask/snaps-jest';
// import { onTransaction } from './index';
// import { expect } from '@jest/globals';
import { panel, text } from '@metamask/snaps-ui';

describe('onTransaction handler tests', () => {
  //   beforeAll(async () => {
  //     if (typeof global.window === 'undefined') {
  //       global.window = global as any;
  //     }
  //   });

  // afterEach(() => {
  //     // Reset mock after each test
  //     jest.resetAllMocks();
  // });

  // afterAll(() => {
  //     // Cleanup: remove the mock from window
  //     delete global.window.ethereum;
  // });

  it('should handle outgoing transactions', async () => {
    const { sendTransaction } = await installSnap();

    // Call the onTransaction handler
    // const response = await sendTransaction({});
    const response = await sendTransaction({
      value: '0x0',
      data: '0x',
      gasLimit: '0x5208',
      maxFeePerGas: '0x5208',
      maxPriorityFeePerGas: '0x5208',
      nonce: '0x0',
    });

    // Add your assertions here
    // For example, you can use expect statements to verify the behavior of the function
    // expect(...).toBe(...);
    expect(response).toRender(panel([text('Hello, world!')]));
    // expect(response).toEqual({});
  });
});
