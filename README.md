# wdoublesync_dapp

dApp for [EndlessVectorWalrus](https://github.com/FizzyFlow/endless_vector) + [WDoubleSync](https://github.com/FizzyFlow/wdoublesync) — decentralized file storage, versioning, and sync on **Sui + Walrus + Seal**.

**Live demo:** [doublesync.wal.app](https://doublesync.wal.app/)

---

## What it does

An abstract virtual filesystem accepts folders/files and synchronizes their state on-chain via Sui + Walrus. The sync engine uses **Content-Defined Chunking (CDC)** to compute minimal binary diffs between folder snapshots, then pushes only the changed chunks as compressed patches into an append-only **EndlessVector**. This enables efficient incremental sync with full state reconstruction at any version.

Files can optionally be **encrypted with Seal** before being uploaded to Walrus, so only authorized addresses can decrypt them.

### Key Features

- 📦 **Version history** — restore any previous snapshot of your folder
- 🔄 **Incremental sync** — only changed chunks uploaded on each push (efficient, low cost)
- 🔐 **Seal encryption** — end-to-end encrypted storage with address-scoped access
- 🌐 **Multi-network** — works on Sui mainnet, testnet
- 📱 **Web-based** — no installation required, runs entirely in the browser


## Running locally

### Prerequisites

- Node 22 + pnpm
- A running `seal_walrus_localnet` server (see [seal_walrus_localnet](https://github.com/FizzyFlow/seal_walrus_localnet))
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

## Localnet faucets

When connected to a `localnet` network, floating faucet buttons appear in the bottom-right corner of the Select and Vector pages:

- **SUI** — requests SUI from the local faucet
- **WAL** — requests WAL tokens from the local Walrus aggregator faucet (`/v1/wal-faucet`)

---

