import { ethers, Contract } from 'ethers';
import { OnTransactionHandler } from '@metamask/snaps-types';
import { heading, panel, text, divider } from '@metamask/snaps-ui';

// Handle outgoing transactions.
export const onTransaction: OnTransactionHandler = async ({ transactionOrigin, transaction }) => {
  const abi = [
    "function getAddressInfo(address _address) view returns (string memory, string memory, string memory, string memory)",
  ]
  const provider = new ethers.BrowserProvider(ethereum);
  const contract = new Contract("0xb439B71fB05BC32325C542246De7563054820Ad4", abi, provider);
  const recipientInformation = await contract.getAddressInfo(transaction.to);

  const companyName = recipientInformation[0];
  const lei = recipientInformation[1];
  const email = recipientInformation[2];
  const message = recipientInformation[3];

  const panelContent = [];
  if (!companyName && !lei && !email && !message) {
    panelContent.push(text("⛔️ No information found for this address ⛔️"));
  } else {
    panelContent.push(text("⚠️ Information provided by the address owner was not verified. Make sure you trust this address"));
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
