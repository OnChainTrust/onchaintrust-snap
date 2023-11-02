import { OnTransactionHandler } from '@metamask/snaps-types';
import { heading, panel, text } from '@metamask/snaps-ui';

// Handle outgoing transactions.
export const onTransaction: OnTransactionHandler = async ({ transaction }) => {
  return {
    content: panel([
      heading('ExampleRecipient Ltd'),
      text(
        `Country: **United States**`,
      ),
      text(
        `Email: example@example.com`,
      )
    ]),
  };
};
