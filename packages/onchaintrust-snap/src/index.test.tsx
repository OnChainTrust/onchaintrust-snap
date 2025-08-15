import { installSnap } from '@metamask/snaps-jest';
import { Box, Text, Heading } from '@metamask/snaps-sdk/jsx';

describe('onTransaction handler tests (JSX UI, live server)', () => {
  describe('when address is verified', () => {
    it('should display UI components correctly', async () => {
      const snap: any = await installSnap();
      const recipientAddress = '0x00000000000000000000000000000000f0cacc1a';

      const response = await snap.onTransaction({
        to: recipientAddress,
        origin: 'https://example.com',
      });

      const screen = response.getInterface();

      expect(screen).toRender(
        <Box>
          <Text key="el-0">✅ Verified address</Text>
          <Heading key="el-1">Example Corp LTD</Heading>
          <Text key="el-2">LEI: 1234567890</Text>
          <Text key="el-3">Email: example@example.com</Text>
          <Text key="el-4">Message: Hello there</Text>
        </Box>,
      );
    });
  });

  describe('when address is malicious', () => {
    it('should display UI components correctly', async () => {
      const snap: any = await installSnap();
      const recipientAddress = '0x00000000000000000000000000000000f00dbabe';

      const response = await snap.onTransaction({
        to: recipientAddress,
        origin: 'https://example.com',
      });

      const screen = response.getInterface();

      expect(screen).toRender(
        <Box>
          <Heading key="el-0">Security Alert: Potentially Unsafe Action Detected!</Heading>
          <Text key="el-1">
            🚫 STOP: Your transaction is directed towards an address that has been flagged for
            suspicious activity. Engaging with this address may result in the loss of your digital
            assets or compromise your personal security.
          </Text>
        </Box>,
      );
    });
  });
});
