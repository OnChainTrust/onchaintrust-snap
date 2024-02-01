import { installSnap } from '@metamask/snaps-jest';
import { divider, heading, panel, text } from '@metamask/snaps-ui';

describe('onTransaction handler tests', () => {
  const recipientAddress = '0xdac83f876ae50433a20363845f43042d8d81b1aa';
  const apiUri = `https://onchaintrust.vercel.app/api/getAddressInfo?address=${recipientAddress}`;

  /**
   * Sets up the test environment for the onTransaction handler.
   *
   * @param responseBody - The response body to return from the mock.
   */
  async function setupTestEnvironment(responseBody: string) {
    const { mock, sendTransaction: localSendTransaction } = await installSnap();

    const mockSetup = await mock({
      url: apiUri,
      response: {
        status: 200,
        body: responseBody,
      },
    });

    return { sendTransaction: localSendTransaction, unmock: mockSetup.unmock };
  }

  let sendTransaction: (transaction: any) => Promise<any>;
  let unmock: () => Promise<void>;

  afterEach(async () => {
    // Clean up the mock after each test.
    if (unmock) {
      await unmock();
    }
  });

  describe('when the address is not found', () => {
    beforeEach(async () => {
      const responseBody = '{}';

      const setup = await setupTestEnvironment(responseBody);
      sendTransaction = setup.sendTransaction;
    });

    it('should handle outgoing transactions', async () => {
      const response = await sendTransaction({
        to: recipientAddress,
      });

      expect(response).toRender(
        panel([text('⛔️ No information found for this address ⛔️')]),
      );
    });
  });

  describe('when the address is found and is not verified', () => {
    beforeEach(async () => {
      const responseBody = `{
        "name":"MetaMask",
        "lei":"254900OPPU84GM83MG36",
        "email":"example@example.com",
        "message":"This is a test message",
        "isVerified":false
      }`;

      const setup = await setupTestEnvironment(responseBody);
      sendTransaction = setup.sendTransaction;
    });

    it('should handle outgoing transactions', async () => {
      const response = await sendTransaction({
        to: recipientAddress,
      });

      await expect(response).toRender(
        panel([
          text(
            '⚠️ Information provided by the address owner was not verified. Make sure you trust this address.',
          ),
          divider(),
          heading('MetaMask'),
          text('LEI: **254900OPPU84GM83MG36**'),
          text('Email: **example@example.com**'),
          text('Message: **This is a test message**'),
        ]),
      );
    });
  });

  describe('when the address is found and is verified', () => {
    beforeEach(async () => {
      const responseBody = `{
        "name":"MetaMask",
        "lei":"254900OPPU84GM83MG36",
        "email":"example@example.com",
        "message":"This is a test message",
        "isVerified":true
      }`;

      const setup = await setupTestEnvironment(responseBody);
      sendTransaction = setup.sendTransaction;
    });

    it('should handle outgoing transactions', async () => {
      const response = await sendTransaction({
        to: recipientAddress,
      });

      expect(response).toRender(
        panel([
          text('✅ Verified address ✅'),
          divider(),
          heading('MetaMask'),
          text('LEI: **254900OPPU84GM83MG36**'),
          text('Email: **example@example.com**'),
          text('Message: **This is a test message**'),
        ]),
      );
    });
  });
});
