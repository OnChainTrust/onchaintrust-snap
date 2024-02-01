import { installSnap } from '@metamask/snaps-jest';
import { divider, heading, panel, text } from '@metamask/snaps-ui';

describe('onTransaction handler tests', () => {
  describe('when the address is not found', () => {
    it('should handle outgoing transactions', async () => {
      const { mock, sendTransaction } = await installSnap();

      const { unmock } = await mock({
        url: 'https://onchaintrust.vercel.app/api/getAddressInfo?address=0xdac83f876ae50433a20363845f43042d8d81b1aa',
        response: {
          status: 200,
          body: '{}',
        }
      });

      const response = await sendTransaction({
        to: '0xdac83f876ae50433a20363845f43042d8d81b1aa',
        value: '0x0',
        data: '0x',
        gasLimit: '0x5208',
        maxFeePerGas: '0x5208',
        maxPriorityFeePerGas: '0x5208',
        nonce: '0x0',
      });

      expect(response).toRender(
        panel([text('⛔️ No information found for this address ⛔️')]),
      );

      unmock();
    });
  });

  describe('when the address is found and is not verified', () => {
    it('should handle outgoing transactions', async () => {
      const { mock, sendTransaction } = await installSnap();

      const { unmock } = await mock({
        url: 'https://onchaintrust.vercel.app/api/getAddressInfo?address=0xdac83f876ae50433a20363845f43042d8d81b1aa',
        response: {
          status: 200,
          body: '{"name":"MetaMask","lei":"254900OPPU84GM83MG36","email":"example@example.com","message":"This is a test message","isVerified":false}',
        }
      });

      const response = await sendTransaction({
        to: '0xdac83f876ae50433a20363845f43042d8d81b1aa',
        value: '0x0',
        data: '0x',
        gasLimit: '0x5208',
        maxFeePerGas: '0x5208',
        maxPriorityFeePerGas: '0x5208',
        nonce: '0x0',
      });

      expect(response).toRender(
        panel([
          text('⚠️ Information provided by the address owner was not verified. Make sure you trust this address.'),
          divider(),
          heading('MetaMask'),
          text('LEI: **254900OPPU84GM83MG36**'),
          text('Email: **example@example.com**'),
          text('Message: **This is a test message**')
        ]),
      );

      unmock();
    });
  });

  describe('when the address is found and is verified', () => {
    it('should handle outgoing transactions', async () => {
      const { mock, sendTransaction } = await installSnap();

      const { unmock } = await mock({
        url: 'https://onchaintrust.vercel.app/api/getAddressInfo?address=0xdac83f876ae50433a20363845f43042d8d81b1aa',
        response: {
          status: 200,
          body: '{"name":"MetaMask","lei":"254900OPPU84GM83MG36","email":"example@example.com","message":"This is a test message","isVerified":true}',
        }
      });

      const response = await sendTransaction({
        to: '0xdac83f876ae50433a20363845f43042d8d81b1aa',
        value: '0x0',
        data: '0x',
        gasLimit: '0x5208',
        maxFeePerGas: '0x5208',
        maxPriorityFeePerGas: '0x5208',
        nonce: '0x0',
      });

      expect(response).toRender(
        panel([
          text('✅ Verified address ✅'),
          divider(),
          heading('MetaMask'),
          text('LEI: **254900OPPU84GM83MG36**'),
          text('Email: **example@example.com**'),
          text('Message: **This is a test message**')
        ])
      );

      unmock();
    });
  });
});
