import { installSnap } from '@metamask/snaps-jest';
import { panel, text } from '@metamask/snaps-ui';

describe('onTransaction handler tests', () => {
  it('should handle outgoing transactions', async () => {
    const { sendTransaction } = await installSnap();

    const response = await sendTransaction({
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
  });
});
