# DATABASE_AGENT

## Meta

```yaml
version: 1.0
last_updated: 2026-04-09
created_by: committee
triggers:
  files:
    - "**/*.sql"
    - "migrations/**"
    - "schema/**"
    - "database/**"
  keywords:
    - migration
    - schema
    - RLS
    - foreign key
    - index
    - soft delete
    - PITR
    - supabase
  exclusions:
    - "*.test.sql"
    - "test_migrations/**"
    - "schema.generated.ts"
    - "*.dbml"
related:
  - agent: architecture
    type: consult
    boundary: "Database owns schema design and migration discipline. Architecture owns folder structure for migrations."
  - agent: security
    type: consult
    boundary: "Database owns RLS policy structure. Security owns authentication and authorization patterns."
  - agent: observability
    type: overlaps
    boundary: "Database and Observability both touch query logging; Database owns schema correctness, Observability owns log format and retention."
  - agent: security
    type: delegates
    boundary: "Database delegates authentication and authorization pattern decisions to Security."
  - agent: architecture
    type: delegates
    boundary: "Database delegates migration folder structure to Architecture."
```

## Purpose

This agent ensures database integrity, performance, and maintainability through proper schema design, migration discipline, and access patterns. Without it, databases become slow, inconsistent, and impossible to evolve safely.

This agent contains 3 types of rules:
- **Hard boundaries** (R1, R2, R3) — mechanically enforceable
- **Structural heuristics** (R4, R5, R6) — judgment-based
- **Governance** (R7, R8, R9) — process discipline

## Applicability

- Creating or modifying database schemas
- Writing migration scripts
- Configuring database access or RLS policies
- Defining indexes or constraints
- Excluded: Application-level ORM queries, test database fixtures

---

## Rules

### HARD BOUNDARIES

### R1 — Migration Versioning and Reversibility [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure migration tool (e.g., Flyway, Prisma) to require sequential versioning and down-migrations -->

**Why:** Unversioned or irreversible migrations break deployment rollbacks and make database state unpredictable across environments.

**Bad → Good:**
```
// Bad: No version, no rollback
ALTER TABLE users ADD email VARCHAR(255);

// Good: Versioned with rollback
-- V001__add_user_email.sql
ALTER TABLE users ADD email VARCHAR(255);
-- V001__add_user_email.down.sql
ALTER TABLE users DROP COLUMN email;
```

**Enforced by:** Migration Tool (BLOCKED, coverage: strong)

---

### R2 — Foreign Key Indexing [BLOCKER] [BLOCKED]

<!-- GUIDE: Enable foreign key constraint checking and index validation in database configuration -->

**Why:** Unindexed foreign keys cause table-scan joins and cascade operation locks, leading to severe performance degradation.

**Bad → Good:**
```
// Bad: FK without index
ALTER TABLE orders ADD COLUMN customer_id INT REFERENCES customers(id);

// Good: FK with explicit index
ALTER TABLE orders ADD COLUMN customer_id INT REFERENCES customers(id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
```

**Enforced by:** Database Linter (BLOCKED, coverage: strong)

---

### R3 — BaaS Service Role Key Isolation [BLOCKER] [BLOCKED]

<!-- GUIDE: Configure environment variable validation to reject service role keys in frontend bundles -->

**Why:** Service role keys in frontend code bypass all RLS policies and expose full database access to end users.

**Bad → Good:**
```
// Bad: Service role in frontend
const supabase = createClient(url, SERVICE_ROLE_KEY);

// Good: Anonymous key only
const supabase = createClient(url, ANON_KEY);
```

**Enforced by:** Bundle Analyzer (BLOCKED, coverage: strong)

---

### STRUCTURAL HEURISTICS

### R4 — Row Level Security on All Tables [CRITICAL] [PREVENTED]

<!-- GUIDE: Configure Supabase/PostgreSQL to require RLS policies before table creation -->

**Why:** Tables without RLS policies expose all data to authenticated users, violating data access boundaries.

**Bad → Good:**
```
// Bad: Table without RLS
CREATE TABLE sensitive_data (id, user_id, secret);

// Good: Table with RLS policy
CREATE TABLE sensitive_data (id, user_id, secret);
ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own data" ON sensitive_data FOR SELECT USING (user_id = auth.uid());
```

**Enforced by:** Database Policy Check (PREVENTED, coverage: strong)

---

### R5 — Third Normal Form Compliance [CRITICAL] [PREVENTED]

<!-- GUIDE: Enable database schema linter with normalization rules -->

**Why:** Denormalized schemas create update anomalies, data inconsistencies, and storage waste that compound over time.

**Bad → Good:**
```
// Bad: Denormalized (customer data repeated)
CREATE TABLE orders (
  id, customer_name, customer_email, product_name, price
);

// Good: Normalized to 3NF
CREATE TABLE customers (id, name, email);
CREATE TABLE products (id, name, price);
CREATE TABLE orders (id, customer_id, product_id);
```

**Enforced by:** Schema Linter (PREVENTED, coverage: partial)

---

### R6 — Query Performance Index Strategy [CRITICAL] [REVIEWED]

<!-- GUIDE: Require EXPLAIN ANALYZE for queries in performance-critical paths -->

**Why:** Missing indexes on WHERE, ORDER BY, and JOIN columns cause full table scans that don't scale beyond development data sizes.

**Bad → Good:**
```
// Bad: Query without supporting index
SELECT * FROM orders WHERE created_at > '2024-01-01' ORDER BY total_amount;

// Good: Index supports the query pattern
CREATE INDEX idx_orders_created_total ON orders(created_at, total_amount);
```

**Enforced by:** Query Analyzer (REVIEWED, coverage: advisory)

---

### GOVERNANCE

### R7 — Schema Design Before Implementation [WARNING] [REVIEWED]

<!-- GUIDE: Require schema documentation (ERD or dbml) in PR description for new tables -->

**Why:** Schema changes without design review lead to denormalized, inconsistent data models that are expensive to refactor later.

**Bad → Good:**
```
// Bad: Table creation without design review
CREATE TABLE user_orders (
  user_name TEXT,
  order_items TEXT, -- JSON blob
  total_price TEXT
);

// Good: Normalized design with review
CREATE TABLE orders (id, user_id, created_at);
CREATE TABLE order_items (id, order_id, product_id, quantity);
```

**Enforced by:** PR Review Bot (REVIEWED, coverage: partial)

---

### R8 — Soft Delete for Append-Only Tables [WARNING] [ADVISORY]

<!-- GUIDE: Document soft delete pattern in database style guide -->

**Why:** Hard deletes in audit-critical tables eliminate forensic capability and break referential integrity for historical data.

**Bad → Good:**
```
// Bad: Hard delete destroys audit trail
DELETE FROM financial_transactions WHERE id = 123;

// Good: Soft delete preserves history
UPDATE financial_transactions SET deleted_at = NOW() WHERE id = 123;
```

**Enforced by:** Code Review (ADVISORY, coverage: advisory)

---

### R9 — Point-in-Time Recovery Configuration [WARNING] [REVIEWED]

<!-- GUIDE: Verify PITR settings in database infrastructure configuration -->

**Why:** Without PITR, data corruption or accidental deletions result in permanent data loss beyond the last backup.

**Bad → Good:**
```
# Bad: No PITR configuration
database:
  backup_frequency: daily

# Good: PITR enabled
database:
  backup_frequency: daily
  point_in_time_recovery: enabled
  wal_retention: 7d
```

**Enforced by:** Infrastructure Review (REVIEWED, coverage: partial)

---

## Exceptions

**BLOCKER/CRITICAL:**
```
Override: R3
Scope:    supabase/functions/ (Edge Functions)
Reason:   Edge Functions run server-side and may legitimately use service role key
Approved: @[who]
Expires:  permanent — re-evaluate at 2027-01-01
Control:  Edge Functions are not bundled into the client; key never reaches browser
```

**WARNING — solo/small team:**
```
Override: R9 — PITR verify pending manual check — @[who] — expires 2026-05-01
```

## Checklist

```
□ All migrations versioned sequentially with down-migration?  (R1)
□ Every foreign key has an explicit index?  (R2)
□ Service role key absent from any frontend bundle?  (R3)
□ Every new table has RLS enabled and policies defined?  (R4)
□ Schema normalized to 3NF (no repeating groups or transitive deps)?  (R5)
□ Performance-critical queries have supporting indexes (EXPLAIN reviewed)?  (R6)
□ ERD or dbml included in PR for new tables?  (R7)
□ Audit-critical tables use soft delete (deleted_at) instead of hard DELETE?  (R8)
□ PITR enabled and last restore tested?  (R9)
```

Status: ✅ yes | ❌ no | — n/a

## Tool Integration

| Rule | Tool | When | Level | Coverage |
|------|------|------|-------|----------|
| R1 | Migration Tool | pre-commit | BLOCKED | strong |
| R2 | Database Linter | CI | BLOCKED | strong |
| R3 | Bundle Analyzer | CI | BLOCKED | strong |
| R4 | Database Policy Check | CI | PREVENTED | strong |
| R5 | Schema Linter | CI | PREVENTED | partial |
| R6 | Query Analyzer | PR | REVIEWED | advisory |
| R7 | PR Review Bot | PR | REVIEWED | partial |
| R8 | Code Review | PR | ADVISORY | advisory |
| R9 | Infrastructure Review | deploy | REVIEWED | partial |
