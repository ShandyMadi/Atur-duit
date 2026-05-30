# Security Spec: AturDuit

## 1. Data Invariants
- A transaction must always belong to a valid authenticated user (`userId`).
- The `userId` of a transaction must match the `request.auth.uid`.
- Transaction amounts must be positive numbers.
- Types must be either 'income' or 'expense'.
- Dates must be valid ISO strings (validated as string + size check).

## 2. The "Dirty Dozen" Payloads
1. Create transaction with `userId` of another user. (Denied: identity mismatch)
2. Create transaction with negative amount. (Denied: schema validation)
3. Update `amount` of a transaction owned by another user. (Denied: ownership check)
4. Update `userId` of an existing transaction (Orphaned Write). (Denied: immutability check)
5. Create transaction without a `type` field. (Denied: required field)
6. Inject a 1MB string into the `category` field. (Denied: size check)
7. Create a transaction with an invalid `type` (e.g., 'stolen'). (Denied: enum check)
8. Update `createdAt` field. (Denied: immutability check)
9. Read all transactions without filtering by `userId`. (Denied: query enforcer)
10. Delete a transaction owned by another user. (Denied: ownership check)
11. Inject junk characters into document ID. (Denied: isValidId check)
12. Modify a user profile of another user. (Denied: ownership check)

## 3. Test Runner (Draft)
- `tests/firestore.rules.test.ts` will verify these.
