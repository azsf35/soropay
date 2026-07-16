# SoroPay — Talk to your wallet

Chat-style natural-language assistant for Stellar payments and swaps.

## Networks: Testnet AND Mainnet, switchable at runtime

SoroPay isn't locked to one network at build time — there's a **Testnet/Mainnet
switch right in the header**. Flip it live in the app, no redeploy needed.

- **Testnet** (default) — safe, fake money, Friendbot funding available.
- **Mainnet** — real XLM/USDC/EURC. Switching to it requires an explicit
  confirmation dialog ("real funds, no undo"), and any connected wallet is
  automatically disconnected so you reconnect against the correct network.
  There is no faucet on mainnet — fund accounts with real XLM from an
  exchange or another wallet.
- Transaction history is tagged per-network and filtered so testnet and
  mainnet activity never mix in the same list.
- Asset issuer addresses (USDC, EURC) are verified directly against Circle's
  official contract-address registry for both networks — see
  `lib/stellar/assets.ts`.

## What works right now, with zero external accounts

- Connect wallet: **Freighter** (desktop extension) **and** **WalletConnect**
  (mobile wallets like Lobstr), **and** Albedo/xBull — one "Connect Wallet"
  button, works on desktop and phone, on either network.
- Natural-language commands: `send 20 USDC to Sara`, `swap 50 XLM to USDC`,
  `balance` — parsed by a **free local rule-based parser** (no API key, no cost).
- Builds + previews the real transaction (plain-language summary, fee,
  warnings) in an in-app confirmation dialog **before** any wallet signature.
  On mainnet, the preview explicitly flags "real funds, no undo."
- On confirm, asks the connected wallet for exactly **one signature**, submits
  to Horizon (testnet or mainnet, whichever is active), and polls for status.
- Contacts (name → address) and transaction history, persisted locally.

## Running it

```bash
npm install
npm run dev
```

Open the printed local URL. No `.env.local` is required to try the full flow
on testnet with the local parser. Use the Testnet/Mainnet switch in the header
to try mainnet once you're ready (with a real funded account).

## Upgrading later (all optional, all drop-in)

Copy `.env.local.example` to `.env.local` and fill in only what you're ready
to add:

| Feature | Env vars | What changes |
|---|---|---|
| Mobile WalletConnect wallets | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Free ID from cloud.reown.com — adds WalletConnect to the wallet picker |
| Claude-powered NL parsing | `NEXT_PUBLIC_USE_CLAUDE_PARSER=true`, `ANTHROPIC_API_KEY` | Swaps the free rule-based parser for Claude via a server-side route (key never reaches the browser) |
| Soroswap multi-AMM routing | `NEXT_PUBLIC_SOROSWAP_API_KEY` | Upgrade swap routing beyond the native Stellar DEX path used today |
| Cloud contacts/history | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Swap localStorage for Supabase (wire the TODOs in `lib/storage/contacts.ts`) |
| Default starting network | `NEXT_PUBLIC_STELLAR_NETWORK=mainnet` | Changes which network the app starts on before the user touches the in-app switch |

## Security notes

- The AI/parsing layer is **advisory only** — it never signs or submits
  anything. It only returns structured intent that the app converts into a
  transaction and shows to the user.
- No private keys or seed phrases ever touch this app — signing always
  happens inside the connected wallet (Freighter / WalletConnect / etc.).
- Every send/swap is simulated and shown in plain language, with explicit
  warnings (missing trustlines, unfunded destination accounts, and "real
  funds" on mainnet) before the user is asked to sign.
- Switching to mainnet requires explicit, unmissable confirmation — it is
  never a silent default.
