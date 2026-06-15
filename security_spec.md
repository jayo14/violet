# security_spec.md

## 1. Data Invariants and Relational Sync Rules
1. **Scope Separation**: A client can ONLY read, update, create, or delete records that explicitly reside under their `/users/{userId}` path (where `{userId}` match `request.auth.uid`).
2. **Identity Integrity**: For standard queries, no client can modify the parent or sub-collection identifiers or spoof another user's profile.
3. **Immutability Protection**: Timestamp `createdAt` must remain unchanged after document creation, and any update must renew `updatedAt` to `request.time`.
4. **Verified Credentials**: All writes must check that the requesting user's email is successfully verified (`request.auth.token.email_verified == true`).
5. **No Blind Escalation**: Critical role concepts or admin concept files (if any are present) are protected against self-assignment.

---

## 2. The "Dirty Dozen" Insecure Payloads (Threat Vectors)
Here are twelve payloads designed to test and try to bypass our Firestore security layers:

### Vector 1: Profile Shadow Field Injection (Shadow Update)
Attempt to inject a role attribute into the user model during registration:
```json
{
  "id": "user-abc",
  "fullName": "Alice Smith",
  "email": "alice@gmail.com",
  "isAdmin": true,
  "role": "SYSTEM_ADMIN"
}
```

### Vector 2: User Identity Spoofing (Owner Spoof)
An authenticated user `user-bob` attempts to create a profile under `/users/user-alice`:
```json
{
  "id": "user-alice",
  "fullName": "Alice Smith",
  "email": "alice@gmail.com"
}
```

### Vector 3: Orphaned Application Creation (Missing Parent Match)
Creating an application doc under a path belonging to another candidate:
```json
// POST to /users/user-attacker/applications/opp-1
{
  "id": "opp-1",
  "title": "Malicious Lead",
  "company": "Target Corp",
  "status": "SAVED",
  "createdAt": "2026-06-15T12:00:00Z"
}
```

### Vector 4: Arbitrary System Field Modification
Updating an application state with helper variables or unsupported fields ("Ghost fields"):
```json
{
  "title": "Junior SWE",
  "company": "Stripe",
  "status": "DELETED_BY_FORCE",
  "ghostField": "maliciousValue"
}
```

### Vector 5: Massive Content Injection (Denial of Wallet)
Attempting to save a 2MB string as a requirement list to blow up indexes and storage costs:
```json
{
  "id": "opp-99",
  "title": "Software Developer",
  "company": "Unbounded Corp",
  "requirements": ["A very long string exceeding safe limits...", "...repeated 10,000 times..."],
  "status": "SAVED",
  "createdAt": "2500-12-31T23:59:59Z"
}
```

### Vector 6: Mock System Timestamp Spoofing
Injecting a post-dated, client-constructed raw string for `createdAt`:
```json
{
  "id": "opp-5",
  "title": "Frontend Engineer",
  "company": "Figma",
  "status": "SAVED",
  "createdAt": "2099-01-01T00:00:00Z"
}
```

### Vector 7: Status Bypass / Terminal State Loophole
Attempting to re-open or downgrade a closed state once it reaches terminal ("REJECTED" or "ACCEPTED"):
```json
// Active application is 'REJECTED'
// Attempting update:
{
  "status": "SAVED",
  "updatedAt": "2026-06-15T12:00:00Z"
}
```

### Vector 8: Cross-Tenant Mail Scrape (Blanket Reads)
Bob attempts to trigger a bulk `get` query that reads all recruitment emails from multiple candidates' indices without strict path checks:
```json
// Bob queries /users/alice/emails/mail-1
{}
```

### Vector 9: Achievement Mimicry
Attacker injects a GitHub project achievement directly into their database under a falsified timestamp with `isAppliedToResume` set to true without doing any verification:
```json
{
  "id": "ach-hack",
  "title": "Spoofed Accomplishment",
  "source": "github",
  "description": "Malicious script",
  "detectedAt": "1970-01-01T00:00:00Z",
  "isAppliedToResume": true
}
```

### Vector 10: Modifying Outgoing Approvals Payload (Shadow Approval Bypass)
Attempting to set an approval status code directly from `pending` to `approved` inside a client-side call:
```json
{
  "id": "appr-123",
  "status": "approved",
  "payload": {
    "tailoredBullet": "Maliciously added skills that candidate doesn't have"
  }
}
```

### Vector 11: Spoofed Email Verification State (Verifications Spoofing)
Attempting reads or writes with `request.auth.token.email_verified == false` while pretending to operate safely.

### Vector 12: Invalid Path Parameter Injection
Attempt to submit junk special characters inside document path identifiers (e.g., `opp-%%%%$$$!!!` or `../badpath/etc`) to poison indexing queries.

---

## 3. Test Runner Design specifications
The accompanying Firestore rules test suites will guarantee that:
- Every scenario returning a permission-denied behaves correctly.
- Proper key schemas are applied matching our structural types.
