import type { OnTransactionHandler } from '@metamask/snaps-sdk';
import { SeverityLevel } from '@metamask/snaps-sdk';
import { Box, Heading, Text, Divider, Copyable, Image } from '@metamask/snaps-sdk/jsx';

type ElementDefinition = { type: string; value?: string };

const requestUiDefinition = async (
  address: string,
  transactionOrigin: string,
  chainId: string,
): Promise<{ ui: ElementDefinition[]; severity?: 'critical' | string }> => {
  const baseUrl = 'https://app.onchaintrust.org/api/getAddressInfo';
  const uri = new URL(baseUrl);
  uri.searchParams.append('address', address);
  uri.searchParams.append('origin', transactionOrigin);
  uri.searchParams.append('chain_id', chainId);
  uri.searchParams.append('client', 'metamask');

  try {
    const res = await fetch(uri);
    if (!res.ok) {
      throw new Error('Bad response from server');
    }
    return await res.json();
  } catch (error) {
    console.error('UI fetch failed:', error);
    return {
      ui: [
        { type: 'heading', value: 'Error' },
        { type: 'text', value: 'An error occurred, please try again later' },
      ],
    };
  }
};

const renderElement = (el: ElementDefinition, idx: number) => {
  const k = `el-${idx}`;
  switch (el.type) {
    case 'heading':
      return el.value ? <Heading key={k}>{el.value}</Heading> : null;
    case 'text':
      return el.value ? <Text key={k}>{el.value}</Text> : null;
    case 'divider':
      return <Divider />;
    case 'copyable':
      return el.value ? <Copyable key={k} value={el.value} /> : null;
    case 'image':
      return el.value ? <Image key={k} src={el.value} alt="" /> : null;
    default:
      return null;
  }
};

// Handle outgoing transactions (Transaction Insights)
export const onTransaction: OnTransactionHandler = async ({
  transactionOrigin,
  chainId,
  transaction,
}) => {
  const apiResponse = await requestUiDefinition(
    transaction.to ?? '',
    transactionOrigin ?? '',
    chainId,
  );

  const content = (
    <Box>
      {apiResponse.ui?.map((el, i) => renderElement(el, i))}
    </Box>
  );
  const result = apiResponse.severity === 'critical' ? { content, severity: SeverityLevel.Critical } : { content };

  return result;
};
