# Wallet Ledger (NestJS + React + PostgreSQL)

A small peer-to-peer wallet: register, get demo funds, send money to another user and see your history. The point of the project is **how the money is handled**, not the UI.

> Demo project

## What it demonstrates
- **Safe money handling:** amounts are integers in minor units (cents), never floats.
- **Atomic transfers:** debit, credit, transfer record and ledger entries are written in one PostgreSQL transaction, so there are no half-applied transfers.
- **Double-entry ledger:** every transfer writes a debit and a credit that sum to zero, which gives an audit trail.
- **Idempotency:** the client sends an `Idempotency-Key`. A retried or double-clicked request returns the original transfer instead of paying twice. A unique constraint covers the race where two identical requests arrive at once.
- **Concurrency control:** both accounts are locked (`SELECT ... FOR UPDATE`) in a consistent order, which prevents overdrafts under parallel requests and avoids deadlocks between opposite transfers.
- **Auth:** JWT, bcrypt password hashing, protected routes.
- **Tests:** business rules are isolated in `ledger.rules.ts` and unit tested.

## Stack
NestJS · TypeORM · PostgreSQL · JWT · React · Vite · TanStack Query · TypeScript · Jest

## Data model
```
User 1──1 Account (balance, currency)
Account 1──* Transfer (from / to, amount, idempotencyKey)   unique(fromAccountId, idempotencyKey)
Transfer 1──2 LedgerEntry (one debit -amount, one credit +amount)
```

## Run locally
```bash
docker compose up -d                          # PostgreSQL
cd api && npm install && npm run start:dev    # http://localhost:3001
cd web && npm install && npm run dev          # http://localhost:5173
cd api && npm test                            # unit tests
```
Register two users in the UI; each starts with 100.00 in demo funds.

## API
| Method | Route | Notes |
|---|---|---|
| POST | `/auth/register`, `/auth/login` | Returns `{ accessToken }` |
| GET | `/accounts/me` | Balance in minor units |
| POST | `/transfers` | Header `Idempotency-Key` required. Body `{ toEmail, amount }` |
| GET | `/transfers` | Last 50, with `sent` / `received` |

```bash
curl -X POST localhost:3001/transfers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"toEmail":"friend@example.com","amount":1050}'
```
Sending the same request twice with the same key returns the same transfer and moves money once.

## Decisions and trade-offs
- **Balance column plus ledger:** the `balance` column makes reads fast and is updated inside the same transaction as the ledger entries. The ledger is the source of truth if the two ever need reconciling.
- **Pessimistic locking over optimistic:** for money, waiting briefly on a row lock is simpler and safer than retrying on version conflicts.
- **Rules as pure functions:** easy to test without a database.
- **`bigint` as Number:** fine for this demo (below 2^53). A real system would use a decimal library or BigInt end to end.

