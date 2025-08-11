import { installSnap } from '@metamask/snaps-jest';
import { heading, panel, text } from '@metamask/snaps-sdk';

describe('onTransaction handler tests', () => {
  describe('when no information is found for the address', () => {
    it('should display UI components correctly', async () => {
      const { onTransaction } = await installSnap();
      const recipientAddress = '0xdac83f876ae50433a20363845f43042d8d81b1aa';
      const response = await onTransaction({
        to: recipientAddress,
        origin: 'https://example.com',
      });

      const screen = response.getInterface();

      expect(screen).toRender(
        panel([text('⚠️ No information found for this address')]),
      );
    });
  });

  describe('when address is verified', () => {
    it('should display UI components correctly', async () => {
      const { onTransaction } = await installSnap();
      const recipientAddress = '0x00000000000000000000000000000000f0cacc1a';
      const response = await onTransaction({
        to: recipientAddress,
        origin: 'https://example.com',
      });

      const screen = response.getInterface();

      expect(screen).toRender(
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
    it('should display UI components correctly', async () => {
      const { onTransaction } = await installSnap();
      const recipientAddress = '0x00000000000000000000000000000000f00dbabe';
      const response = await onTransaction({
        to: recipientAddress,
        origin: 'https://example.com',
      });

      const screen = response.getInterface();

      expect(screen).toRender(
        panel([
          heading('Security Alert: Potentially Unsafe Action Detected!'),
          text(
            '🚫 STOP: Your transaction is directed towards an address that has been flagged for suspicious activity. Engaging with this address may result in the loss of your digital assets or compromise your personal security.',
          ),
        ]),
      );
    });
  });
});
