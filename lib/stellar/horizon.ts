// ---------------------------------------------------------------------------
// Horizon reads: balances, account existence, payment history.
// All functions take an explicit `network` param so the app can switch
// between testnet/mainnet at runtime without a rebuild.
// ---------------------------------------------------------------------------

import { Horizon } from "@stellar/stellar-sdk";
import { NetworkId, getNetworkConfig } from "./network";
import { AssetBalance } from "@/types";

const servers: Partial<Record<NetworkId, Horizon.Server>> = {};

export function getHorizonServer(network: NetworkId): Horizon.Server {
  if (!servers[network]) {
    servers[network] = new Horizon.Server(getNetworkConfig(network).horizonUrl);
  }
  return servers[network]!;
}

export interface AccountInfo {
  exists: boolean;
  balances: AssetBalance[];
}

/** Fetch balances for an address. Returns exists:false for unfunded accounts. */
export async function fetchAccountInfo(
  address: string,
  network: NetworkId
): Promise<AccountInfo> {
  try {
    const server = getHorizonServer(network);
    const account = await server.loadAccount(address);
    const balances: AssetBalance[] = account.balances.map((b) => {
      if (b.asset_type === "native") {
        return { asset: "XLM", code: "XLM", balance: b.balance };
      }
      const anyB = b as unknown as {
        asset_code: string;
        asset_issuer: string;
        balance: string;
        limit?: string;
      };
      return {
        asset: anyB.asset_code,
        code: anyB.asset_code,
        issuer: anyB.asset_issuer,
        balance: anyB.balance,
        limit: anyB.limit,
      };
    });
    return { exists: true, balances };
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response
      ?.status;
    if (status === 404) {
      return { exists: false, balances: [] };
    }
    throw err;
  }
}

/** Funds a brand-new TESTNET account via Friendbot. Throws on mainnet — there
 *  is no faucet for real funds; mainnet accounts must be funded with real XLM. */
export async function fundTestnetAccount(
  address: string,
  network: NetworkId
): Promise<boolean> {
  const config = getNetworkConfig(network);
  if (!config.friendbotUrl) {
    throw new Error("Friendbot funding is only available on testnet.");
  }
  const res = await fetch(`${config.friendbotUrl}?addr=${encodeURIComponent(address)}`);
  return res.ok;
}

export interface PaymentHistoryItem {
  id: string;
  type: string;
  createdAt: string;
  amount?: string;
  assetCode?: string;
  from?: string;
  to?: string;
  transactionHash: string;
  successful: boolean;
}

/** Recent payments/path-payments involving this account, newest first. */
export async function fetchPaymentHistory(
  address: string,
  network: NetworkId,
  limit = 20
): Promise<PaymentHistoryItem[]> {
  const server = getHorizonServer(network);
  const page = await server
    .payments()
    .forAccount(address)
    .order("desc")
    .limit(limit)
    .call();

  return page.records.map((r) => {
    const rec = r as unknown as {
      id: string;
      type: string;
      created_at: string;
      amount?: string;
      asset_code?: string;
      asset_type?: string;
      from?: string;
      to?: string;
      transaction_hash: string;
    };
    return {
      id: rec.id,
      type: rec.type,
      createdAt: rec.created_at,
      amount: rec.amount,
      assetCode: rec.asset_type === "native" ? "XLM" : rec.asset_code,
      from: rec.from,
      to: rec.to,
      transactionHash: rec.transaction_hash,
      successful: true,
    };
  });
}

/** Poll Horizon until a submitted transaction hash is confirmed or times out. */
export async function waitForTransaction(
  hash: string,
  network: NetworkId,
  timeoutMs = 15000
): Promise<"success" | "failed" | "timeout"> {
  const server = getHorizonServer(network);
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const tx = await server.transactions().transaction(hash).call();
      return tx.successful ? "success" : "failed";
    } catch {
      // not yet ingested — wait and retry
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return "timeout";
}
