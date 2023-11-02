import { AbiCoder, BytesLike } from 'ethers';
import { OnTransactionHandler } from '@metamask/snaps-types';
import { heading, panel, text } from '@metamask/snaps-ui';

// Handle outgoing transactions.
export const onTransaction: OnTransactionHandler = async ({ transaction }) => {
  const companyInformation = await ethereum.request({
    method: 'eth_call',
    params: [
      {
        from: transaction.from,
        to: "0xb439B71fB05BC32325C542246De7563054820Ad4",
        // Hardcoded Address 0x876182C9669E48CEff1F942C7acB5bB98Ea79753
        data: "0xebb00796000000000000000000000000876182c9669e48ceff1f942c7acb5bb98ea79753"
      },
      "latest"
    ]
  });

  const decodedCompanyInformation = AbiCoder.defaultAbiCoder().decode(
    ['string', 'string', 'string', 'string'],
    companyInformation as BytesLike
  );

  const companyName = decodedCompanyInformation[0];
  const lei = decodedCompanyInformation[1];
  const email = decodedCompanyInformation[2];
  const message = decodedCompanyInformation[3];

  return {
    content: panel([
      heading(companyName),
      text(
        `LEI: ${lei}`,
      ),
      text(
        `Email: ${email}`,
      ),
      text(
        `Message: ${message}`,
      )
    ]),
  };
};
