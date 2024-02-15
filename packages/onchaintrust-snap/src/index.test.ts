import { installSnap } from '@metamask/snaps-jest';
import { copyable, divider, heading, panel, text, image } from '@metamask/snaps-sdk';

describe('onTransaction handler tests', () => {
  const recipientAddress = '0xdac83f876ae50433a20363845f43042d8d81b1aa'; // A random address
  const apiUri = `https://app.onchaintrust.org/api/getAddressInfo?address=${recipientAddress}`;

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
    if (unmock) {
      await unmock();
    }
  });

  describe('when UI definition is returned by the frontend', () => {
    beforeEach(async () => {
      const responseBody = `[
        {"type": "panel", "value": [
          {"type": "heading", "value": "Title of the panel"},
          {"type": "image", "value": "<svg width='100' height='100'><circle cx='50' cy='50' r='40' stroke='black' stroke-width='3' fill='red' /></svg>"}
          {"type": "copyable", "value": "Text to be copied"},
          {"type": "text", "value": "Text before the divider"},
          {"type": "divider"},
          {"type": "text", "value": "Text after the divider"},
        ]}
      ]`;

      const setup = await setupTestEnvironment(responseBody);
      sendTransaction = setup.sendTransaction;
    });

    it('should display UI components correctly', async () => {
      const response = await sendTransaction({
        to: recipientAddress,
      });

      expect(response).toRender(
        panel([
          heading('Title of the panel'),
          image('<svg width="100" height="100"><circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" /></svg>'),
          copyable('Text to be copied'),
          text('Text before the divider'),
          divider(),
          text('Text after the divider'),
        ]),
      );
    });
  });
});
