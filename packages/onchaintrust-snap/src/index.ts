import type { OnTransactionHandler } from '@metamask/snaps-sdk';
import { SeverityLevel } from '@metamask/snaps-sdk';
import { requestUiDefinition } from './api';
import { renderUI, errorElements } from './ui';

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
