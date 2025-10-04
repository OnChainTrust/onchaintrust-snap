import type { OnTransactionHandler, OnHomePageHandler } from '@metamask/snaps-sdk';
import { SeverityLevel } from '@metamask/snaps-sdk';

import { requestUiDefinition } from './api';
import { renderUI, errorElements } from './ui';

import { Box, Link, Text, Divider, Section } from "@metamask/snaps-sdk/jsx";

export const onTransaction: OnTransactionHandler = async ({
  transactionOrigin,
  chainId,
  transaction,
}) => {
  const result = await requestUiDefinition(
    transaction.to ?? '',
    transactionOrigin ?? '',
    chainId,
  );

  const ui = result.ok
    ? result.data.ui
    : errorElements('Unable to load data. Please try again later.');

  const content = renderUI(ui);

  return result.ok && result.data.severity === 'critical'
    ? { content, severity: SeverityLevel.Critical }
    : { content };
};

export const onHomePage: OnHomePageHandler = async () => {
  return {
    content: (
      <Box>
        <Section>
        <Text>Make your web3-interactions safer and more transparent.</Text>
        <Text>Protect your assets with advanced security checks and real-time insights before every transaction.</Text>
        <Link href="https://onchaintrust.org">Learn more</Link>
        </Section>
        <Divider />
        <Section>
          <Text>Do you run a Web3 application? Keep your users safe with OnChainTrust.</Text>
          <Link href="https://app.onchaintrust.org/protection">Verify your domain and enable protection</Link>
        </Section>
      </Box>
    ),
  };
};
