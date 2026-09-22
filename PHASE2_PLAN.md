# Phase 2 — Platform Portal API Completions

## Context & Scope

Phase 1 is complete. The `school-os-admin` portal works end-to-end but has three data
quality gaps because the backend API does not yet support the queries the frontend needs.
This document covers **only** what the architecture mandates for Phase 2. No speculative
additions.

### The three gaps

| # | Gap | Current behaviour | Target |
|---|-----|-------------------|--------|
| 1 | Audit log org filter | `organization_id` is derived from context; platform admins get `None`, so all logs are returned unscoped; client-side filter applied in `OrgAuditTab` | Server-side `?organization_id=` filtering |
| 2 | User list — empty for platform admins | `list_users` returns `[]` when `ctx.organization_id is None`; search is client-only on loaded items | Return all users for platform admins; add `?search=` server-side |
| 3 | Dashboard stat cards use paginated counts | Three list queries, `items.length + (has_more ? "+" : "")` — inaccurate over 100 rows | Dedicated `GET /platform/stats` aggregate endpoint |

### Codebase conventions to follow

The patterns below are derived from reading the live code. All changes must match them:

- **Repositories** contain `select()` + `where()` chains — no magic base class. Filters
  are explicit so a reader can see exactly what scope applies.
- **Permission codes** are registered in `permissions.py` once, referenced by a typed
  `Permission` object everywhere. `require()` validates against the registry at import
  time — a typo is a startup crash.
- **Pagination** uses `paginate_cursor(session, stmt, params, model=Model)` from
  `app.db.repository`. Keyset is on `(created_at DESC, id DESC)`.
- **`CursorPage`** constructor: `CursorPage(items=[], next_cursor=None, has_more=False)`.
- **Frontend services** use `apiClient` (school-scoped, auto-injects `X-School-ID`) or
  `platformApiClient` (no school header). Platform-admin routes use `platformApiClient`.
- **Query keys** follow `[scope, resource, params]` — see `lib/query-keys.ts`.
- **`useCursorPagination`** wraps `useInfiniteQuery`; plain `useQuery` for non-paginated
  single-response data.

---

## Change 1 — `GET /audit-logs`: add explicit `organization_id` query param

### Problem (detailed)

`app/modules/platform_/audit/router.py:42`:

```python
organization_id = None if effective_school_id else ctx.organization_id
```

Platform admins have `ctx.organization_id = None`. When no school is requested,
`organization_id` becomes `None`, so `repository.list_audit_logs` applies no filter and
returns every row across all orgs. `OrgAuditTab` works around this with
`clientFilter={{ organization_id: orgId }}`, which:

- Runs a platform-wide audit query on every tab open
- Filters in JS after the response — wrong when `has_more=true` (matched rows may be
  on pages 2–N, which were never fetched)
- Is documented with a TODO comment that must be removed

### Backend — `app/modules/platform_/audit/router.py`

Add `organization_id: str | None = None` as an explicit query parameter.

**Security rule**: platform-admin callers may supply any `organization_id` they choose
(they are cross-org by design). Non-platform callers are always scoped to their own org
from context — the param is ignored for them.

**Scoping precedence** (unchanged for non-platform):

1. If `school_id` resolves → scope to school, `organization_id` is NULL (school already
   implies an org).
2. Else if caller is a platform admin and `organization_id` is provided → use it.
3. Else → fall back to `ctx.organization_id` (handles org-scoped non-platform callers).

```python
# app/modules/platform_/audit/router.py

@router.get("", response_model=CursorPage[AuditLogRead])
async def list_audit_logs(
    school_id: str | None = None,
    organization_id: str | None = None,   # NEW — platform admin may supply this
    entity_type: str | None = None,
    entity_id: str | None = None,
    actor_user_id: str | None = None,
    created_from: datetime | None = None,
    created_to: datetime | None = None,
    params: CursorParams = Depends(),
    ctx: RequestContext = Depends(require(P_AUDIT_LOG_LIST)),
    session: SessionDep = None,
):
    if school_id is not None and school_id not in ctx.accessible_school_ids:
        return CursorPage(items=[], next_cursor=None, has_more=False)

    effective_school_id = school_id if school_id is not None else ctx.school_id

    # Derive the effective org filter.
    # School scope takes priority: a school implies an org, no explicit org needed.
    if effective_school_id:
        effective_org_id = None
    elif ctx.is_platform_admin and organization_id is not None:
        # Platform admins cross org boundaries; trust their explicit param.
        effective_org_id = organization_id
    else:
        # Org-scoped callers (non-platform) are always scoped to their own org.
        effective_org_id = ctx.organization_id

    return await repository.list_audit_logs(
        session,
        params,
        school_id=effective_school_id,
        organization_id=effective_org_id,
        entity_type=entity_type,
        entity_id=entity_id,
        actor_user_id=actor_user_id,
        created_from=created_from,
        created_to=created_to,
    )
```

**Why the repository needs no changes**: `repository.list_audit_logs` already accepts
`organization_id` and applies `.where(AuditLog.organization_id == organization_id)` when
it is not `None` (`app/modules/platform_/audit/repository.py:43–45`). The bug is
entirely in the router's derivation logic.

**Edge cases handled**:

- Platform admin calls with no `organization_id` param → `effective_org_id = None` →
  repository applies no org filter → returns all logs (correct: platform-wide view).
- Platform admin supplies `organization_id` → scoped to that org.
- Non-platform admin: `ctx.organization_id` is always set (their own org) → unchanged.
- `school_id` present and valid → org filter is never applied (school implies org).

### Frontend — `features/platform-organizations/org-audit-tab.tsx`

Switch from `clientFilter` to server-side `params`. Remove the workaround comment.

```tsx
// features/platform-organizations/org-audit-tab.tsx

"use client";

import { AuditLogTable } from "@/components/ui/audit-log-table";
import { platformKeys } from "@/lib/query-keys";

interface OrgAuditTabProps {
  orgId: string;
}

export function OrgAuditTab({ orgId }: OrgAuditTabProps) {
  return (
    <AuditLogTable
      queryKey={platformKeys.orgAudit(orgId)}
      params={{ organization_id: orgId }}
    />
  );
}
```

**What changed**:

- `clientFilter={{ organization_id: orgId }}` → `params={{ organization_id: orgId }}`
- The `<p>` workaround note is deleted
- The query key (`platformKeys.orgAudit(orgId)`) already incorporates `orgId` — no
  key change needed

**No type changes needed**: `AuditLogListParams` in `services/audit.ts` already declares
`organization_id?: string`. The `params` prop of `AuditLogTable` accepts
`AuditLogListParams`.

**No `services/audit.ts` changes needed**: `listAuditLogs` already forwards all params
to `GET /audit-logs`.

---

## Change 2 — `GET /users`: platform-admin scope + server-side `search`

### Problem (detailed)

`app/modules/iam/users/router.py:34–38`:

```python
if ctx.organization_id is None:
    from app.core.pagination import CursorPage as CP
    return CP(items=[], next_cursor=None, has_more=False)
return await repository.list_users_in_org(session, ctx.organization_id, params)
```

Platform admins always have `ctx.organization_id = None`, so this early-return fires
for them unconditionally — they see an empty user list. Additionally, the `search` filter
only exists in the frontend (`user-list-platform.tsx:104–107`, client-side `useMemo`)
and is lost whenever `has_more=true` because unfetched pages are never searched.

### Backend — `app/modules/iam/users/repository.py`

Add `search` to the existing `list_users_in_org` and add a new `list_all_users` for the
platform-admin cross-org case.

**Search matching**: lowercase `LIKE` on `email` and `phone`. Both columns are indexed
(`ix_users_phone`, `uq_users_email_lower`). The `func.lower(User.email).like(pattern)`
call is consistent with how `get_by_email` already normalises the lookup.

```python
# app/modules/iam/users/repository.py  (full file — replace existing)

"""User data access.

Users are intentionally NOT tenant-scoped (one account may span schools), so
listing within an organization joins `memberships` — RLS on that join is what
keeps the result scoped to the caller's tenant.
"""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import CursorPage, CursorParams
from app.db.repository import paginate_cursor
from app.modules.iam.models import Membership, User


async def get_by_id(session: AsyncSession, user_id: str) -> User | None:
    return await session.get(User, user_id)


async def get_by_email(session: AsyncSession, email: str) -> User | None:
    stmt = select(User).where(
        User.email.is_not(None),
        func.lower(User.email) == email.lower(),
        User.deleted_at.is_(None),
    )
    return (await session.scalars(stmt)).first()


async def get_by_phone(session: AsyncSession, phone: str) -> User | None:
    stmt = select(User).where(
        User.phone == phone,
        User.deleted_at.is_(None),
    )
    return (await session.scalars(stmt)).first()


async def list_users_in_org(
    session: AsyncSession,
    organization_id: str,
    params: CursorParams,
    *,
    search: str | None = None,           # NEW
) -> CursorPage[User]:
    stmt = (
        select(User)
        .join(Membership, Membership.user_id == User.id)
        .where(
            Membership.organization_id == organization_id,
            User.deleted_at.is_(None),
        )
        .distinct()
    )
    if search:
        pattern = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            func.lower(User.email).like(pattern)
            | func.lower(User.phone).like(pattern)
        )
    return await paginate_cursor(session, stmt, params, model=User)


async def list_all_users(                # NEW — platform-admin cross-org
    session: AsyncSession,
    params: CursorParams,
    *,
    search: str | None = None,
) -> CursorPage[User]:
    """Return all non-deleted users across every organization.

    Only callable by platform admins (enforced at the router layer).
    No RLS applies here because platform_admin routes bypass tenant context.
    """
    stmt = select(User).where(User.deleted_at.is_(None))
    if search:
        pattern = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            func.lower(User.email).like(pattern)
            | func.lower(User.phone).like(pattern)
        )
    return await paginate_cursor(session, stmt, params, model=User)


async def belongs_to_org(session: AsyncSession, user_id: str, organization_id: str) -> bool:
    stmt = select(Membership.id).where(
        Membership.user_id == user_id,
        Membership.organization_id == organization_id,
    )
    return (await session.scalars(stmt)).first() is not None
```

**Design notes**:

- `search.strip()` guards against accidental whitespace-only queries producing
  `%%` (matches everything) — strip before checking truthiness.
- `list_all_users` is a new top-level function, not a flag on `list_users_in_org`.
  Keeping them separate makes the security boundary obvious: different callers,
  different row-visibility.
- `DISTINCT` is preserved in `list_users_in_org` because a user may hold memberships
  at multiple schools within the same org.

### Backend — `app/modules/iam/users/router.py`

Add `search: str | None = None` and dispatch to the appropriate repository function
based on caller identity.

```python
# app/modules/iam/users/router.py  — only list_users changes

@router.get("", response_model=CursorPage[UserRead])
async def list_users(
    search: str | None = None,           # NEW
    params: CursorParams = Depends(),
    ctx: RequestContext = Depends(require(P_USER_LIST)),
    session: SessionDep = None,
):
    if ctx.is_platform_admin:
        return await repository.list_all_users(session, params, search=search)
    if ctx.organization_id is None:
        # Non-platform caller with no org context — should not happen in
        # practice but safe to return empty rather than crash.
        return CursorPage(items=[], next_cursor=None, has_more=False)
    return await repository.list_users_in_org(
        session, ctx.organization_id, params, search=search
    )
```

**Security**:

- `ctx.is_platform_admin` is populated by `resolve_principal` from the JWT/session and
  cannot be forged by an API caller.
- Non-platform admins who somehow have `organization_id = None` fall through to the
  safe empty return — no data leak.
- The inline `from app.core.pagination import CursorPage as CP` alias in the original
  is removed; `CursorPage` is already imported at the top of the file.

### Frontend — `services/iam.ts`

Add `search?: string` to `UserListParams`.

```typescript
export interface UserListParams extends CursorParams {
  status?: string;
  is_platform_admin?: boolean;
  search?: string;    // NEW
}
```

**No other frontend changes needed**: `user-list-platform.tsx` already wires
`search` state into a debounced input but currently only uses it for client-side
`useMemo` filtering. After the type addition, the `listUsers` call naturally forwards
`search` to the API because `useCursorPagination` passes `params` through to the
`queryFn`.

**However**, the component's `queryKey` currently does not include `search`:

```typescript
// Current (user-list-platform.tsx:94–98) — search not in key
queryKey: platformKeys.users({}),
queryFn: (params) => listUsers(params),
```

The `platformKeys.users` key factory accepts `CursorParams = {}` which does not include
`search`, so changing the search input does not bust the cache. Fix the query key to
include search so React Query re-fetches when it changes:

```typescript
// user-list-platform.tsx — update the useCursorPagination call

const debouncedSearch = useDebounce(search, 300);   // add debounce (see note)

const { items: allItems, ... } = useCursorPagination<User>({
  queryKey: platformKeys.users({ search: debouncedSearch || undefined }),
  queryFn: (params) => listUsers({ ...params, search: debouncedSearch || undefined }),
  limit: 50,
});
```

**Debounce note**: the component has no debounce today. Without it, every keystroke
fires a new paginated API request. Add a `useDebounce` hook (standard pattern) or use
the existing `useMemo` to delay until the user stops typing. The hook itself is a
3-line wrapper around `useState` + `useEffect` with `setTimeout`. If a shared hook
already exists elsewhere in the codebase, use it; otherwise create
`hooks/use-debounce.ts`:

```typescript
// hooks/use-debounce.ts
"use client";

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
```

**Update `platformKeys.users`** in `lib/query-keys.ts` to accept `search`:

```typescript
// lib/query-keys.ts — update the users key factory in platformKeys

users: (params: CursorParams & { search?: string } = {}) =>
  ["platform", "users", params] as const,
```

**Remove client-side filtering** from `user-list-platform.tsx` for `search`:
The `filtered` memo currently filters `allItems` by search string. Once server-side
search is in, the fetched items are already filtered — the `matchesSearch` check
in the memo becomes redundant for the debounced term. Keep `statusFilter`,
`platformFilter`, `orgFilter`, and `sort` as client-side because they have no
corresponding server-side support yet and operate on already-loaded data.

Also remove this misleading note on line 235:

```
{hasMore && filtered.length > 0 && <p>Filters apply to loaded items only. Load more to search further.</p>}
```

Replace it with:

```tsx
{hasMore && (
  <p className="text-center text-xs text-muted-foreground">
    Showing first {filtered.length} results. Load more or refine your search.
  </p>
)}
```

---

## Change 3 — New `GET /platform/stats` endpoint

### Problem (detailed)

`platform-dashboard.tsx:144–163` fires three separate `useQuery` calls:

```typescript
const orgsQuery  = useQuery({ queryFn: () => listOrganizations({ limit: 100 }) });
const schoolsQuery = useQuery({ queryFn: () => listSchools({ limit: 100 }) });
const usersQuery = useQuery({ queryFn: () => listUsers({ limit: 100 }) });
```

Stat cards are populated as:

```typescript
value={orgsQuery.data ? `${orgsQuery.data.items.length}${orgsQuery.data.has_more ? "+" : ""}` : "—"}
```

Problems:

1. Three round-trips for a single dashboard paint.
2. Counts are wrong whenever the platform has more than 100 orgs/schools/users — the
   `+` suffix is a UI hack, not a real count.
3. `limit: 100` still fetches 100 rows worth of data just to count them.

### Backend — new module `app/modules/platform_/stats/`

#### `app/modules/platform_/stats/__init__.py`

Empty file (marks the directory as a Python package).

#### `app/modules/platform_/stats/permissions.py`

Register a dedicated permission rather than reusing `P_AUDIT_LOG_LIST`. This is the
correct pattern — every protected resource declares its own permission code so access
control can be audited and role-assigned independently. The code is low-cost (one
`registry.register` call) and enables RBAC granularity in Phase 3.

```python
# app/modules/platform_/stats/permissions.py

"""Platform stats permission codes."""
from __future__ import annotations

from app.core.permissions import Action, registry

P_PLATFORM_STATS_READ = registry.register(
    "platform", "stats", Action.READ, "Read platform-wide aggregate statistics"
)
```

This produces the code `platform.stats.read`. The permission is platform-only by
nature — only a principal with `is_platform_admin=True` will ever hold it — but
declaring it explicitly keeps the permission registry as the single authoritative list
of what the API can do.

#### `app/modules/platform_/stats/schemas.py`

```python
# app/modules/platform_/stats/schemas.py

from __future__ import annotations

from pydantic import BaseModel


class PlatformStats(BaseModel):
    org_count: int
    school_count: int
    user_count: int
```

Schema lives in its own file to follow the `schemas.py` pattern in every other module.
It is not a response to a database row, so there is no ORM model counterpart.

#### `app/modules/platform_/stats/router.py`

```python
# app/modules/platform_/stats/router.py

"""Platform aggregate statistics — single query, platform-admin only."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select

from app.core.authz import require
from app.core.context import RequestContext
from app.db.session import SessionDep
from app.modules.iam.models import Organization, School, User
from app.modules.platform_.stats.permissions import P_PLATFORM_STATS_READ
from app.modules.platform_.stats.schemas import PlatformStats

router = APIRouter(prefix="/platform/stats", tags=["platform"])


@router.get("", response_model=PlatformStats)
async def get_platform_stats(
    ctx: RequestContext = Depends(require(P_PLATFORM_STATS_READ)),
    session: SessionDep = None,
) -> PlatformStats:
    """Return exact totals for the platform dashboard stat cards.

    Three scalar subqueries — no full row fetching. Each hits a filtered index
    (ix_organizations_status, ix_schools_status, ix_users_status) on deleted_at IS NULL.
    """
    org_count = (await session.scalar(
        select(func.count()).select_from(Organization)
        .where(Organization.deleted_at.is_(None))
    )) or 0

    school_count = (await session.scalar(
        select(func.count()).select_from(School)
        .where(School.deleted_at.is_(None))
    )) or 0

    user_count = (await session.scalar(
        select(func.count()).select_from(User)
        .where(User.deleted_at.is_(None))
    )) or 0

    return PlatformStats(
        org_count=org_count,
        school_count=school_count,
        user_count=user_count,
    )
```

**Performance**: three `SELECT COUNT(*)` statements on soft-delete-indexed tables.
PostgreSQL evaluates these against the index directly (index-only scan on `deleted_at`)
rather than a sequential table scan. At thousands of rows this is effectively instant.
If the platform ever scales to millions of rows, these can be memoised with a short TTL
cache at the service layer without changing the API contract.

**No service layer**: a service.py is not created because this endpoint has no business
logic — it is a direct aggregate read. The service layer exists in other modules to
orchestrate cross-table writes, not reads.

#### Register the router — `app/api/v1/router.py`

```python
# app/api/v1/router.py — add one import and one include

from app.modules.platform_.stats.router import router as platform_stats_router

# inside the file, after the other includes:
api_router.include_router(platform_stats_router)
```

The import goes after the existing `audit_logs_router` import, before the
`api_router = APIRouter()` line, to maintain alphabetical grouping within the
`platform_` namespace.

#### Register the permission in the database

The new permission `platform.stats.read` must be synced to the `permissions` table:

```bash
# After deploying the code change:
python scripts/sync_permissions.py
```

This is the existing process for every new permission (established in Phase 1). No
migration is needed — `sync_permissions.py` upserts the registry into the existing
`permissions` table.

Assign `platform.stats.read` to the platform-admin role in the seed/fixture if one
exists. Platform admins who have `is_platform_admin=True` already bypass the permission
check via `ctx.effective_scope_for` returning `DataScope.PLATFORM` — so the permission
grant is only needed for non-platform principals you might want to give read-only stats
to in the future.

### Frontend — `services/iam.ts`

Add the `PlatformStats` type and `getPlatformStats` function. Use `platformApiClient`
(not `apiClient`) because the endpoint has no school context.

```typescript
// services/iam.ts — append to the bottom of the file

export interface PlatformStats {
  org_count: number;
  school_count: number;
  user_count: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const { data } = await platformApiClient.get<PlatformStats>("/platform/stats");
  return data;
}
```

**Import**: `platformApiClient` is already imported in `services/platform-api-client.ts`
and re-exported. Check `services/index.ts` — if `platform-api-client.ts` is not already
in the barrel, add it. If `iam.ts` currently only imports `apiClient`, add:

```typescript
import { platformApiClient } from "./platform-api-client";
```

### Frontend — `lib/query-keys.ts`

Add `platformStats` to the `platformKeys` object:

```typescript
// lib/query-keys.ts — inside platformKeys object, at the end

platformStats: () => ["platform", "stats"] as const,
```

No params — the endpoint always returns the same aggregate. If org-scoped or
school-scoped stats are needed in a future phase, params can be added then.

### Frontend — `features/platform-dashboard/platform-dashboard.tsx`

Replace the three list queries that feed stat cards with one stats query. The list
queries inside `NeedsAttention` (which fetch items to compute cross-table alerts)
stay — they serve a different purpose and cannot be replaced by aggregate counts.

```typescript
// features/platform-dashboard/platform-dashboard.tsx — import additions
import { listOrganizations, listSchools, listMemberships, getPlatformStats } from "@/services/iam";
// remove: listUsers (still used in NeedsAttention — keep it there, just remove from
// the top-level PlatformDashboard query set)
```

Inside `PlatformDashboard`:

```typescript
// Replace the three useQuery calls for orgsQuery / schoolsQuery / usersQuery
// that feed stat cards with a single stats query.

const statsQuery = useQuery({
  queryKey: platformKeys.platformStats(),
  queryFn: getPlatformStats,
  staleTime: STALE_TIME.frequent,   // 30 s — same cadence as HealthStrip refetch
});
```

Update the three `<PlatformStatCard>` components:

```tsx
<div className="grid gap-4 sm:grid-cols-3">
  <PlatformStatCard
    label="Organizations"
    value={statsQuery.data?.org_count ?? null}
    isLoading={statsQuery.isLoading}
  />
  <PlatformStatCard
    label="Schools"
    value={statsQuery.data?.school_count ?? null}
    isLoading={statsQuery.isLoading}
  />
  <PlatformStatCard
    label="Users"
    value={statsQuery.data?.user_count ?? null}
    isLoading={statsQuery.isLoading}
  />
</div>
```

**`PlatformStatCard` value prop**: currently accepts `string`. Change its `value` prop
to `number | string | null` so it can receive the raw count. The card renders `"—"` when
`value` is null/undefined, a formatted number otherwise. Remove the `+` suffix logic
from the card — it no longer applies.

```tsx
// features/platform-dashboard/platform-stat-card.tsx — update value prop type

interface PlatformStatCardProps {
  label: string;
  value: number | string | null;
  isLoading?: boolean;
}

// Inside the render, replace the value display:
<p className="text-3xl font-bold">
  {isLoading
    ? <Skeleton className="h-9 w-16" />
    : value === null || value === undefined
      ? "—"
      : typeof value === "number"
        ? value.toLocaleString()     // "1,234" not "1234"
        : value
  }
</p>
```

**Remove stale queries from `PlatformDashboard`**: after adding `statsQuery`, remove
the three queries (`orgsQuery`, `schoolsQuery`, `usersQuery`) that were only used for
stat cards. Confirm `NeedsAttention` is a separate component with its own queries
that are not affected.

---

## Implementation Order

Implement in this order to keep the system releasable at each step:

### Step 1: Backend — Audit filter (lowest risk, isolated)

- Edit `app/modules/platform_/audit/router.py` — add `organization_id` param, update
  scoping logic
- Start server, hit `GET /audit-logs?organization_id=<real-id>` as platform admin,
  confirm filtered result

### Step 2: Backend — User list + search

- Edit `app/modules/iam/users/repository.py` — add `search` param to
  `list_users_in_org`, add `list_all_users`
- Edit `app/modules/iam/users/router.py` — add `search` param, dispatch on
  `ctx.is_platform_admin`
- Start server, confirm `GET /users` as platform admin returns all users (not `[]`);
  confirm `GET /users?search=test` filters correctly

### Step 3: Backend — Stats endpoint

- Create `app/modules/platform_/stats/__init__.py` (empty)
- Create `app/modules/platform_/stats/permissions.py`
- Create `app/modules/platform_/stats/schemas.py`
- Create `app/modules/platform_/stats/router.py`
- Edit `app/api/v1/router.py` — import and include `platform_stats_router`
- Run `python scripts/sync_permissions.py`
- Start server, hit `GET /platform/stats`, confirm `{ org_count, school_count, user_count }`

### Step 4: Frontend — Audit org filter

- Edit `features/platform-organizations/org-audit-tab.tsx` — swap `clientFilter` for
  `params`, remove workaround comment/note
- Open org detail → Audit tab, confirm logs load scoped to that org only

### Step 5: Frontend — User search

- Edit `services/iam.ts` — add `search?: string` to `UserListParams`
- Create `hooks/use-debounce.ts` (if not already present)
- Edit `lib/query-keys.ts` — update `platformKeys.users` signature to include `search`
- Edit `features/platform-users/user-list-platform.tsx`:
  - Add `useDebounce` around `search` state
  - Update `useCursorPagination` `queryKey` and `queryFn` to include debounced search
  - Remove `matchesSearch` from client-side `filtered` memo
  - Update the "load more" note text

### Step 6: Frontend — Stats endpoint

- Edit `services/iam.ts` — add `PlatformStats` interface and `getPlatformStats`
- Edit `lib/query-keys.ts` — add `platformStats` to `platformKeys`
- Edit `features/platform-dashboard/platform-stat-card.tsx` — widen `value` type,
  add `toLocaleString()`, remove `+` suffix logic
- Edit `features/platform-dashboard/platform-dashboard.tsx`:
  - Add `statsQuery` using `getPlatformStats`
  - Remove the three per-entity list queries that were only used for stat cards
  - Update `<PlatformStatCard>` props to use `statsQuery.data?.{field}`

### Step 7: TypeScript check

```bash
cd school-os-admin
npx tsc --noEmit
```

Zero errors expected.

---

## Verification Checklist

### Backend

```
[ ] uvicorn starts with no import errors and no registry errors
[ ] GET /platform/stats → { org_count: N, school_count: N, user_count: N }
    - Counts match SELECT COUNT(*) FROM organizations/schools/users WHERE deleted_at IS NULL
[ ] GET /audit-logs?organization_id=<org_a_id> → returns only org A logs
    (test with two separate orgs; verify org B logs are absent)
[ ] GET /audit-logs (no param, platform admin) → returns all logs unscoped (unchanged)
[ ] GET /audit-logs?school_id=<id> → school-scoped as before (no regression)
[ ] GET /users (platform admin, no search) → all non-deleted users, not []
[ ] GET /users?search=test (platform admin) → only users with 'test' in email or phone
[ ] GET /users?search=test (non-platform) → filtered within their org only
[ ] GET /users (non-platform, valid org) → unchanged behaviour
```

### Frontend

```
[ ] Platform dashboard stat cards show exact integer counts, no "+" suffix
[ ] Stat cards show "—" while loading, formatted number once loaded (e.g. "1,234")
[ ] Org detail → Audit tab: loads scoped to that org; note/warning is gone
[ ] Platform users page: typing in search fires API call with ?search=<term>
    (check Network tab — new request on each debounce flush)
[ ] Platform users page: clearing search returns full list (or debounced empty)
[ ] npx tsc --noEmit → 0 errors
[ ] No console errors or warnings related to the three changed components
```

---

## Files Changed Summary

### New files

| File | Purpose |
|------|---------|
| `app/modules/platform_/stats/__init__.py` | Package marker |
| `app/modules/platform_/stats/permissions.py` | `P_PLATFORM_STATS_READ` registration |
| `app/modules/platform_/stats/schemas.py` | `PlatformStats` Pydantic schema |
| `app/modules/platform_/stats/router.py` | `GET /platform/stats` handler |
| `school-os-admin/hooks/use-debounce.ts` | Debounce hook (if not already present) |

### Modified backend files

| File | Change |
|------|--------|
| `app/modules/platform_/audit/router.py` | Add `organization_id` query param; update scoping logic (5 lines) |
| `app/modules/iam/users/repository.py` | Add `search` param to `list_users_in_org`; add `list_all_users` |
| `app/modules/iam/users/router.py` | Add `search` param; dispatch on `ctx.is_platform_admin` |
| `app/api/v1/router.py` | Import and include `platform_stats_router` |

### Modified frontend files

| File | Change |
|------|--------|
| `services/iam.ts` | Add `search?: string` to `UserListParams`; add `PlatformStats` + `getPlatformStats` |
| `lib/query-keys.ts` | Update `platformKeys.users` signature; add `platformKeys.platformStats` |
| `features/platform-organizations/org-audit-tab.tsx` | `clientFilter` → `params`; remove workaround comment |
| `features/platform-users/user-list-platform.tsx` | Add debounce; server-side search in query key + fn; remove `matchesSearch` from memo |
| `features/platform-dashboard/platform-dashboard.tsx` | Replace three list queries for stat cards with single `statsQuery` |
| `features/platform-dashboard/platform-stat-card.tsx` | Widen `value` type to `number \| string \| null`; add `toLocaleString()`; remove `+` suffix |

---

## Non-changes (explicitly out of scope)

- No Alembic migration — no new tables or columns are added
- No changes to `AuditLog`, `User`, `Organization`, or `School` models
- No changes to `AuditLogListParams` type in `services/audit.ts` — `organization_id`
  already exists there
- No changes to existing school-scoped audit or user routes
- No changes to `NeedsAttention` — it intentionally fetches lists for cross-table alert
  logic, not counts
- No changes to `HealthStrip`
- `search` is not added to org-scoped `list_users` (non-platform) beyond what's in the
  repository — the existing `list_users_in_org` now accepts it, so it's available if
  the org user tab ever needs it in Phase 3
