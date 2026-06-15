# wdoublesync_dapp

Demo dApp for [EndlessVectorWalrus](https://github.com/FizzyFlow/endless_vector) + [WDoubleSync](https://github.com/FizzyFlow/wdoublesync) — decentralized file storage, versioning, and sync on **Sui + Walrus + Seal**.

**Live demo:** [doublesync.wal.app](https://doublesync.wal.app/)

---

## What it does

An abstract virtual filesystem accepts folders/files and synchronizes their state on-chain via Sui + Walrus. The sync engine uses **Content-Defined Chunking (CDC)** to compute minimal binary diffs between folder snapshots, then pushes only the changed chunks as compressed patches into an append-only **EndlessVector**. This enables efficient incremental sync with full state reconstruction at any version.

Files can optionally be **encrypted with Seal** before being uploaded to Walrus, so only authorized addresses can decrypt them.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vue 3 + [Quasar](https://quasar.dev), Vite |
| Blockchain | [@mysten/sui](https://github.com/MystenLabs/sui), [suidouble](https://github.com/suidouble/suidouble) |
| Storage | [@mysten/walrus](https://github.com/MystenLabs/walrus) |
| Encryption | [@mysten/seal](https://github.com/MystenLabs/seal) |
| Vector SDK | [@fizzyflow/endless-vector](https://github.com/FizzyFlow/endless_vector) |
| Sync engine | [wdoublesync](https://github.com/FizzyFlow/wdoublesync) + [doublesync](https://github.com/FizzyFlow/doublesync) |

---

## Pages

- **Home** — intro and wallet connection; create or open a Vector
- **Select** — create a new `EndlessVectorWalrus` on-chain object, or load one by object ID
- **Vector** — main workspace: file browser (upload/download/version history) + status panel showing on-chain health

### Vector status panel

| Field | Description |
|---|---|
| Package ID | Deployed Move package |
| Vector ID | On-chain object ID |
| WAL balance | Sender's WAL token balance |
| Walrus epoch | Current Walrus system epoch |
| Walrus end epoch | Minimum blob end epoch across all stored blobs |

The **Extend** button (next to Walrus end epoch) lets you pick how many epochs to extend all blobs, shows the live WAL cost estimate, and executes the transaction automatically sourcing WAL from your wallet.

---

## Running locally

### Prerequisites

- Node 22 + pnpm
- A running `seal_walrus_localnet` server (see [../seal_walrus_localnet](../seal_walrus_localnet))
- The server started with the `endless_vector` Move package as the contract:

```bash
cd ../endless_vector/scripts
bash start_localnet.sh
```

### Install & dev

```bash
pnpm install
pnpm dev        # starts Vite dev server on http://localhost:8090
```

### Production build

```bash
pnpm build      # output to frontend/dist
```

### Deploy to Walrus Sites

```bash
pnpm deploywalrus     # first deploy — prints the site object ID
pnpm updatewalrus     # subsequent deploys — update existing site object
```

---

## Localnet faucets

When connected to a `localnet` network, floating faucet buttons appear in the bottom-right corner of the Select and Vector pages:

- **SUI** — requests SUI from the local faucet
- **WAL** — requests WAL tokens from the local Walrus aggregator faucet (`/v1/wal-faucet`)

---

## Local dependencies

The project uses `pnpm file:` links — changes to the local packages are reflected immediately without reinstalling:

| Package | Source |
|---|---|
| `@fizzyflow/endless-vector` | `../endless_vector/js` |
| `wdoublesync` | `../wdoublesync` |
| `doublesync` | `../doublesync` |
| `walrus-seal-client-with-local` | `../seal_walrus_localnet` |
