import {
  OnTransactionHandler,
  heading,
  panel,
  text,
  divider,
  copyable,
  image,
  Panel,
} from '@metamask/snaps-sdk';
import { UiElement } from './types/ui-elements';

type ElementDefinition = { type: string; value: string | undefined };

const requestUiDefinition = async (
  address: string,
  transactionOrigin: string,
  chainId: string,
): Promise<{ ui: ElementDefinition[]; severity?: string }> => {
  const baseUrl = 'https://app.onchaintrust.org/api/getAddressInfo';
  const uri = new URL(baseUrl);
  uri.searchParams.append('address', address);
  uri.searchParams.append('origin', transactionOrigin);
  uri.searchParams.append('chain_id', chainId);
  uri.searchParams.append('client', 'metamask');
  console.log('Fetching UI definition from:', uri.toString());
  return await global
    .fetch(uri)
    .then((res) => {
      if (!res.ok) {
        throw new Error('Bad response from server');
      }
      return res.json();
    })
    .catch((err) => {
      console.error(err);
      return {
        ui: [
          { type: 'heading', value: 'Error' },
          {
            type: 'text',
            value: 'An error occurred, please try again later',
          },
        ],
      };
    });
}

// Handle outgoing transactions.
export const onTransaction: OnTransactionHandler = async ({
  transactionOrigin,
  chainId,
  transaction,
}) => {
  const apiResponse: { ui: ElementDefinition[]; severity?: string } = await requestUiDefinition(
    transaction.to || '',
    transactionOrigin || '',
    chainId,
  )

  const uiElements: UiElement[] = apiResponse.ui.reduce(
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

  const result: { content: Panel; severity?: 'critical' | undefined } = {
    content: panel(uiElements),
  };

  if (apiResponse.severity === 'critical') {
    result.severity = apiResponse.severity;
  }

  return result;
};
