import { installSnap } from '@metamask/snaps-jest';
import { heading, panel, text, SeverityLevel } from '@metamask/snaps-sdk';

describe('onTransaction handler tests', () => {
  let recipientAddress = '0xdac83f876ae50433a20363845f43042d8d81b1aa'; // A random address

  /**
   * Sets up the test environment for the onTransaction handler.
   *
   * @returns The sendTransaction function.
   */
  async function setupTestEnvironment() {
    const { sendTransaction: localSendTransaction } = await installSnap();

    return { sendTransaction: localSendTransaction };
  }

  let sendTransaction: (transaction: any) => Promise<any>;

  describe('when no information is found for the address', () => {
    beforeEach(async () => {
      const setup = await setupTestEnvironment();
      sendTransaction = setup.sendTransaction;
    });

    it('should display UI components correctly', async () => {
      const response = await sendTransaction({
        to: recipientAddress,
        origin: 'https://example.com',
      });

      expect(response).toRender(
        panel([text('⚠️ No information found for this address')]),
      );
    });
  });

  describe('when address is verified', () => {
    beforeEach(async () => {
      recipientAddress = '0x00000000000000000000000000000000f0cacc1a';

      const setup = await setupTestEnvironment();
      sendTransaction = setup.sendTransaction;
    });

    it('should display UI components correctly', async () => {
      const response = await sendTransaction({
        to: recipientAddress,
        origin: 'https://example.com',
      });

      expect(response).toRender(
        panel([
          text('✅ Verified address'),
          heading('Example Corp LTD'),
          text('LEI: 1234567890'),
          text('Email: example@example.com'),
          text('Message: Hello there'),
        ]),
      );
    });
  });

  describe('when address is malicious', () => {
    beforeEach(async () => {
      recipientAddress = '0x00000000000000000000000000000000f00dbabe';

      const setup = await setupTestEnvironment();
      sendTransaction = setup.sendTransaction;
    });

    it('should display UI components correctly', async () => {
      const response = await sendTransaction({
        to: recipientAddress,
        origin: 'https://example.com',
      });

      expect(response).toRender(
        panel([
          heading('Security Alert: Potentially Unsafe Action Detected!'),
          text(
            '🚫 STOP: Your transaction is directed towards an address that has been flagged for suspicious activity. Engaging with this address may result in the loss of your digital assets or compromise your personal security.',
          ),
        ]),
      );

      expect(response.response.result.severity).toBe(
        'critical' as SeverityLevel,
      );
    });
  });
});
