// ---------------------------------------------------------------------------
// Known asset issuers, per network. XLM is native and needs no issuer.
// All mainnet addresses below are verified directly against Circle's
// official contract-address registry (developers.circle.com/stablecoins).
// ---------------------------------------------------------------------------

import { Asset } from "@stellar/stellar-sdk";
import { NetworkId } from "./network";

export interface KnownAsset {
  code: string;
  issuer?: string; // undefined => native XLM
}

const TESTNET_ASSETS: Record<string, KnownAsset> = {
  XLM: { code: "XLM" },
  USDC: {
    code: "USDC",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  },
  EURC: {
    code: "EURC",
    issuer: "GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO",
  },
};

// Verified against https://developers.circle.com/stablecoins/usdc-contract-addresses
// and https://developers.circle.com/stablecoins/eurc-contract-addresses
const MAINNET_ASSETS: Record<string, KnownAsset> = {
  XLM: { code: "XLM" },
  USDC: {
    code: "USDC",
    issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  },
  EURC: {
    code: "EURC",
    issuer: "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2",
  },
};

export function getKnownAssets(network: NetworkId): Record<string, KnownAsset> {
  return network === "mainnet" ? MAINNET_ASSETS : TESTNET_ASSETS;
}

export function resolveAssetCode(codeRaw: string, network: NetworkId): KnownAsset | null {
  const code = codeRaw.trim().toUpperCase();
  const assets = getKnownAssets(network);
  return assets[code] || null;
}

export function toStellarAsset(known: KnownAsset): Asset {
  if (!known.issuer) return Asset.native();
  return new Asset(known.code, known.issuer);
}

export function assetDisplayName(known: KnownAsset): string {
  return known.code;
}
