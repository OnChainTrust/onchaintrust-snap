import {
  OnTransactionHandler,
  heading,
  panel,
  text,
  divider,
  copyable,
  image,
} from '@metamask/snaps-sdk';
import { UiElement } from './ui-elements';

// Handle outgoing transactions.
export const onTransaction: OnTransactionHandler = async ({
  transactionOrigin,
  transaction,
}) => {
  const uri = `https://app.onchaintrust.org/api/getAddressInfo?address=${transaction.to}&origin=${transactionOrigin}`;

  type ElementDefinition = { type: string; value: string | undefined };

  const uiDefinition: ElementDefinition[] = await global
    .fetch(uri)
    .then((res) => {
      if (!res.ok) {
        throw new Error('Bad response from server');
      }
      return res.json();
    })
    .catch((err) => console.error(err));

  const uiElements: UiElement[] = uiDefinition.reduce(
    (acc: UiElement[], element: ElementDefinition) => {
      switch (element.type) {
        case 'heading':
          if (element.value) {
            acc.push(heading(element.value));
          }
          break;
        case 'text':
          if (element.value) {
            acc.push(text(element.value));
          }
          break;
        case 'divider':
          acc.push(divider());
          break;
        case 'copyable':
          if (element.value) {
            acc.push(copyable(element.value));
          }
          break;
        case 'image':
          if (element.value) {
            acc.push(image(element.value || ''));
          }
          break;
        default:
          break;
      }
      return acc;
    },
    [],
  );

  return {
    content: panel(uiElements),
  };
};
