import { OnTransactionHandler } from '@metamask/snaps-types';
import { heading, panel, text, divider } from '@metamask/snaps-ui';

// Handle outgoing transactions.
export const onTransaction: OnTransactionHandler = async ({
  // transactionOrigin,
  transaction,
}) => {
  const uri = `https://onchaintrust.vercel.app/api/getAddressInfo?address=${transaction.to}`;
  const recipientInformation: { [key: string]: string } = await global
    .fetch(uri)
    .then((res) => {
      if (!res.ok) {
        throw new Error('Bad response from server');
      }
      return res.json();
    })
    .catch((err) => console.error(err));

  const companyName = recipientInformation.name;
  const { lei } = recipientInformation;
  const { email } = recipientInformation;
  const { message } = recipientInformation;
  const { isVerified } = recipientInformation;

  const panelContent = [];
  if (!companyName && !lei && !email && !message) {
    panelContent.push(text('⛔️ No information found for this address ⛔️'));
  } else {
    if (isVerified) {
      panelContent.push(text('✅ Verified address ✅'));
    } else {
      panelContent.push(
        text(
          '⚠️ Information provided by the address owner was not verified. Make sure you trust this address.',
        ),
      );
    }
    panelContent.push(divider());
    if (companyName) {
      panelContent.push(heading(companyName));
    }

    if (lei) {
      panelContent.push(text(`LEI: **${lei}**`));
    }

    if (email) {
      panelContent.push(text(`Email: **${email}**`));
    }

    if (message) {
      panelContent.push(text(`Message: **${message}**`));
    }
  }
  return {
    content: panel(panelContent),
  };
};
