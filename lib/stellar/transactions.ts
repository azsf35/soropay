// ---------------------------------------------------------------------------
// Build + simulate Stellar transactions for "send" and "swap" intents, and
// submit signed transactions. Everything here is built client-side from the
// user's connected wallet address — no private keys ever touch this code.
// Every function takes an explicit `network` so testnet/mainnet is never
// ambiguous or mixed up mid-transaction.
// ---------------------------------------------------------------------------

import {
  TransactionBuilder,
  Operation,
  BASE_FEE,
  Asset,
} from "@stellar/stellar-sdk";
import { getHorizonServer } from "./horizon";
import { NetworkId, getNetworkConfig } from "./network";
import { resolveAssetCode, toStellarAsset } from "./assets";
import { TransactionPreview, PreviewDetail } from "@/types";

const TX_TIMEOUT_SECONDS = 60;

export class TransactionBuildError extends Error {}

/** Builds + simulates a plain payment ("send 20 USDC to Sara"). */
export async function buildSendPreview(params: {
  sourceAddress: string;
  destAddress: string;
  destLabel: string; // contact name or the raw address, for the human-readable preview
  assetCode: string;
  amount: number;
  network: NetworkId;
}): Promise<TransactionPreview> {
  const { network } = params;
  const known = resolveAssetCode(params.assetCode, network);
  if (!known) {
    throw new TransactionBuildError(
      `I don't recognize the asset "${params.assetCode}". Supported assets: XLM, USDC, EURC.`
    );
  }
  const asset = toStellarAsset(known);
  const server = getHorizonServer(network);
  const networkPassphrase = getNetworkConfig(network).networkPassphrase;

  const warnings: string[] = [];
  if (network === "mainnet") {
    warnings.push("This is Mainnet — this transaction uses real funds and cannot be reversed.");
  }

  // Validate destination account + trustline before building, so failures
  // surface as plain language instead of a raw Horizon error after signing.
  let destExists = true;
  try {
    const destAccount = await server.loadAccount(params.destAddress);
    if (asset.code !== "XLM") {
      const hasTrustline = destAccount.balances.some((b) => {
        const anyB = b as unknown as { asset_code?: string };
        return anyB.asset_code === asset.code;
      });
      if (!hasTrustline) {
        warnings.push(
          `${params.destLabel} does not have a ${asset.code} trustline yet — this payment will likely fail until they add one.`
        );
      }
    }
  } catch {
    destExists = false;
    warnings.push(
      `${params.destLabel}'s account (${params.destAddress.slice(0, 6)}...) does not exist on the network yet.`
    );
  }

  const sourceAccount = await server.loadAccount(params.sourceAddress);

  const builder = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  }).setTimeout(TX_TIMEOUT_SECONDS);

  if (destExists) {
    builder.addOperation(
      Operation.payment({
        destination: params.destAddress,
        asset,
        amount: params.amount.toFixed(7),
      })
    );
  } else {
    // Unfunded destination: createAccount only works when sending native XLM,
    // and only above the network's minimum reserve (currently 1 XLM base + fees).
    if (asset.code !== "XLM") {
      throw new TransactionBuildError(
        `${params.destLabel}'s account doesn't exist yet. You can only send XLM to create a new account — send ${asset.code} after they're funded.`
      );
    }
    if (params.amount < 1) {
      throw new TransactionBuildError(
        `Creating a new account needs at least 1 XLM (the network's minimum reserve). Try a larger amount.`
      );
    }
    builder.addOperation(
      Operation.createAccount({
        destination: params.destAddress,
        startingBalance: params.amount.toFixed(7),
      })
    );
  }

  const tx = builder.build();

  const details: PreviewDetail[] = [
    { label: "Network", value: network === "mainnet" ? "Mainnet (real funds)" : "Testnet" },
    { label: "Action", value: "Send" },
    { label: "Amount", value: `${params.amount} ${asset.code}` },
    { label: "To", value: params.destLabel },
    { label: "Estimated fee", value: "~0.00001 XLM" },
    { label: "Estimated time", value: "~5 seconds" },
  ];

  return {
    operation: "send",
    summary: `Send ${params.amount} ${asset.code} to ${params.destLabel}`,
    details,
    xdr: tx.toXDR(),
    networkPassphrase,
    estimatedFeeXlm: "0.00001",
    estimatedTimeSeconds: 5,
    warnings,
  };
}

/** Builds + simulates a swap ("swap 50 XLM to USDC") via the native Stellar DEX. */
export async function buildSwapPreview(params: {
  sourceAddress: string;
  sourceAssetCode: string;
  destAssetCode: string;
  amount: number;
  network: NetworkId;
}): Promise<TransactionPreview> {
  const { network } = params;
  const srcKnown = resolveAssetCode(params.sourceAssetCode, network);
  const dstKnown = resolveAssetCode(params.destAssetCode, network);
  if (!srcKnown || !dstKnown) {
    throw new TransactionBuildError(
      `I don't recognize one of those assets. Supported: XLM, USDC, EURC.`
    );
  }
  const sendAsset = toStellarAsset(srcKnown);
  const destAsset = toStellarAsset(dstKnown);
  const server = getHorizonServer(network);
  const networkPassphrase = getNetworkConfig(network).networkPassphrase;

  const warnings: string[] = [];
  if (network === "mainnet") {
    warnings.push("This is Mainnet — this transaction uses real funds and cannot be reversed.");
  }

  // Find the best path across the Stellar Classic DEX (this is the same
  // liquidity Soroswap aggregates — swap in a Soroswap SDK call here later
  // for multi-AMM routing once NEXT_PUBLIC_SOROSWAP_API_KEY is configured).
  const paths = await server
    .strictSendPaths(sendAsset, params.amount.toFixed(7), [destAsset])
    .call();

  if (!paths.records.length) {
    throw new TransactionBuildError(
      `No swap route found from ${srcKnown.code} to ${dstKnown.code} right now — try a smaller amount or check back later.`
    );
  }

  const bestPath = paths.records[0];
  const destMin = (parseFloat(bestPath.destination_amount) * 0.99).toFixed(7); // 1% slippage tolerance

  const sourceAccount = await server.loadAccount(params.sourceAddress);
  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset,
        sendAmount: params.amount.toFixed(7),
        destination: params.sourceAddress,
        destAsset,
        destMin,
        path: bestPath.path.map((p) =>
          p.asset_type === "native" ? Asset.native() : new Asset(p.asset_code!, p.asset_issuer!)
        ),
      })
    )
    .setTimeout(TX_TIMEOUT_SECONDS)
    .build();

  const details: PreviewDetail[] = [
    { label: "Network", value: network === "mainnet" ? "Mainnet (real funds)" : "Testnet" },
    { label: "Action", value: "Swap" },
    { label: "You send", value: `${params.amount} ${srcKnown.code}` },
    {
      label: "You receive (est.)",
      value: `~${parseFloat(bestPath.destination_amount).toFixed(4)} ${dstKnown.code}`,
    },
    { label: "Minimum received (1% slippage)", value: `${destMin} ${dstKnown.code}` },
    { label: "Route", value: "Stellar DEX (best available path)" },
    { label: "Estimated fee", value: "~0.00001 XLM" },
  ];

  return {
    operation: "swap",
    summary: `Swap ${params.amount} ${srcKnown.code} for ~${parseFloat(bestPath.destination_amount).toFixed(4)} ${dstKnown.code}`,
    details,
    xdr: tx.toXDR(),
    networkPassphrase,
    estimatedFeeXlm: "0.00001",
    estimatedTimeSeconds: 5,
    warnings,
  };
}

/** Submits an already-signed transaction XDR to Horizon on the given network. */
export async function submitSignedTransaction(
  signedXdr: string,
  network: NetworkId
): Promise<{ hash: string; successful: boolean }> {
  const server = getHorizonServer(network);
  const networkPassphrase = getNetworkConfig(network).networkPassphrase;
  const tx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
  const result = await server.submitTransaction(tx);
  return { hash: result.hash, successful: result.successful };
}
