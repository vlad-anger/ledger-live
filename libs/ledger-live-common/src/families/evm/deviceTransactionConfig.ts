import { AccountLike, Account } from "@ledgerhq/types-live";
import { DeviceTransactionField } from "../../transaction";
import { Transaction as EvmTransaction } from "./types";
import { TransactionStatus } from "../../generated/types";
import { getMainAccount } from "../../account";

/**
 * Method responsible for creating the summary of the screens visible on the nano
 */
function getDeviceTransactionConfig({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: EvmTransaction;
  status: TransactionStatus;
}): Array<DeviceTransactionField> {
  const mainAccount = getMainAccount(account, parentAccount);
  const { mode } = transaction;
  const fields: Array<DeviceTransactionField> = [];

  switch (mode) {
    default:
    case "send":
      fields.push(
        {
          type: "amount",
          label: "Amount",
        },
        {
          type: "address",
          label: "Address",
          address: transaction.recipient,
        },
        {
          type: "text",
          label: "Network",
          value: mainAccount.currency.name,
        }
      );
      break;
  }

  fields.push({
    type: "fees",
    label: "Max fees",
  });

  return fields;
}

export default getDeviceTransactionConfig;
