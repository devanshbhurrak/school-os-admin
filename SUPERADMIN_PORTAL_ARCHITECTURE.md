# School OS — Super Admin Portal

## The Platform Owner's Control Plane

The **Super Admin Portal** is the top-level administrative interface used exclusively by the product owner and platform operators of School OS.

This is not a school management interface. It is the nerve center of the entire platform: where organizations are provisioned, schools are monitored, the system is observed, and the business is operated.

> The school portal hides complexity from educators.
> The super admin portal reveals the full system to the people who run it.

---

## Who This Portal Serves

| Persona | What They Do | What They Need |
|---------|-------------|----------------|
| **Platform Owner** | Runs the business. Manages growth, pricing, and product direction. | Full visibility across all orgs. Revenue metrics. Strategic controls. |
| **Platform Operations** | Keeps the system running. Resolves incidents, monitors infrastructure. | System health. Job queues. Error rates. Quick access to any entity. |
| **Platform Support** | Helps customers resolve issues. | Deep read-only drill-down into any org, school, or user. Audit trails. |
| **Billing / Account Manager** | Manages subscriptions, plans, and invoicing. | Subscription status. Usage. Plan management. Invoice history. |

All personas authenticate via the same API. Access requires `is_platform_admin = true` on the user record, verified via `GET /auth/me` on every session.

---

## How It Differs from the School Portal

| Dimension | School Portal | Super Admin Portal |
|-----------|--------------|-------------------|
| Mental model | "My school" | "All schools on the platform" |
| Scope | Single org, single school, single academic year | Cross-org, cross-school, platform-wide |
| Context selectors | School + Academic Year | None |
| URL prefix | `/home`, `/people`, `/academics`, `/settings` | `/platform/dashboard`, `/platform/organizations`, etc. |
| `X-School-ID` header | Required on every request | Omitted by default; injected per-request when drilling into school-scoped data |
| Primary entities | Persons, Cohorts, Classes, Subjects | Organizations, Schools, Users, Memberships |
| Data posture | Full read + write (school data) | Platform-level read + write (provisioning, status, support) |
| Visual identity | Brand primary color, white sidebar | Indigo accent, dark sidebar, "PLATFORM ADMIN" badge |

---

## Application Shell

### Desktop Layout

```text
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  ◆ School OS    PLATFORM ADMIN    ⌘K Search                  🔔  [Admin User ▼]     │
├───────────────┬──────────────────────────────────────────────────────────────────────┤
│               │                                                                      │
│  OVERVIEW     │  Platform > Organizations > Greenfield Education Trust               │
│  Dashboard    │                                                                      │
│               │  Greenfield Education Trust                           [Edit]         │
│  ORGANIZATIONS│  greenfield · ACTIVE · 8 schools · 34 users                         │
│  Organizations│──────────────────────────────────────────────────────────────────────│
│  Schools      │                                                                      │
│               │  [Overview] [Schools] [Users] [Memberships] [Audit] [Settings]       │
│  IDENTITY     │                                                                      │
│  Users        │                         Tab Content                                  │
│  Roles        │                                                                      │
│               │                                                                      │
│  PLATFORM     │                                                                      │
│  Audit Log    │                                                                      │
│  System       │                                                                      │
│               │                                                                      │
│  BUSINESS     │                                                                      │
│  Billing      │                                                                      │
│               │                                                                      │
│  ─────────    │                                                                      │
│  Settings     │                                                                      │
│               │                                                                      │
└───────────────┴──────────────────────────────────────────────────────────────────────┘
```

### Shell Principles

- **Collapsible sidebar.** Icons-only collapsed mode for maximum workspace.
- **Grouped navigation.** Four named sections (OVERVIEW, ORGANIZATIONS, IDENTITY, PLATFORM, BUSINESS) provide structure. Settings sits below the separator.
- **Persistent "PLATFORM ADMIN" badge** in the header at all times — platform admins must never be confused about which portal they are in.
- **No school or year selectors** in the header. The platform admin operates above school context.
- **Global search (⌘K).** Searches organizations, schools, and users by name, email, slug, or code. Extends the existing school portal's command palette with platform entity types.
- **Breadcrumbs.** Shows the full path for deep navigation (Platform > Organizations > Org > Schools > School).

### Mobile

Desktop-first. On smaller viewports: sidebar collapses to a hamburger drawer, tables switch to card layouts, detail pages stack tabs vertically. No bottom tab bar.

---

## Information Architecture

```text
Dashboard
├── Platform health strip           ← API status (live); other indicators (future)
├── Key metrics                     ← org count, school count, user count
├── Needs Attention                 ← actionable alerts with links to remediation
├── Recent Audit Activity           ← last 10 entries from GET /audit-logs
├── Quick Actions                   ← Create Org, Create School, View Audit
└── Growth chart                    ← (future: requires time-series API)

Organizations
├── List (search, filter by status, sort, cursor pagination)
└── [Detail]
    ├── Overview                    ← identity, stats, entitlements
    ├── Schools                     ← schools in this org
    ├── Users                       ← users with any membership in this org
    ├── Memberships                 ← all memberships across all schools in this org
    ├── Audit                       ← org-scoped audit log
    └── Settings                   ← edit profile, status transitions, danger zone

Schools
├── List (search, filter by org/status/board, sort, cursor pagination)
└── [Detail]
    ├── Overview                    ← identity, at-a-glance stats
    ├── Academics                   ← read-only: years, terms, classes, subjects, cohorts
    ├── People                      ← read-only: persons list with search
    ├── Users & Roles               ← users and roles for this school
    ├── Data Quality                ← actionable issues (missing contacts, gaps, capacity)
    ├── Audit                       ← school-scoped audit log
    └── Settings                   ← edit profile, status transitions, danger zone

Users
├── List (search, filter by status/org/platform-admin flag, cursor pagination)
└── [Detail]
    ├── Profile                     ← identity, account actions
    ├── Memberships                 ← all org + school memberships
    └── Audit Trail                 ← all entries where actor = this user

Roles
├── List (search, filter by scope level / org / system flag)
└── [Detail]
    ├── Overview                    ← code, name, scope, data scope, permissions count
    ├── Permission Matrix           ← same component as school portal Settings > Roles
    └── Memberships Using This Role ← who has this role assigned

Audit Log
├── Platform-wide log               ← all orgs, all schools
├── Filters: org, school, actor, entity type, action, date range
├── Row expand: before/after snapshot diff (human-readable)
└── Export                          ← (future)

System
├── API Health                      ← GET /health + GET /ready (live)
├── Background Jobs                 ← (future)
├── Feature Flags                   ← (future)
└── Email / SMS Delivery            ← (future)

Billing                             ← (future: requires subscription model)
├── Subscriptions
├── Plans
├── Invoices
└── Usage Metrics

Settings
├── Platform Profile                ← product name, support contact, defaults
├── Default Roles                   ← system role templates (read-only view)
├── Security                        ← (future)
└── Email Templates                 ← (future)
```

---

## URL Structure

The platform portal lives under the `/platform` URL prefix — a real path segment, not a Next.js route group — to avoid URL conflicts with the school portal (which also has `/settings`, `/users`, etc.).

```text
app/
├── (public)/
│   └── login/                            ← shared login
├── (auth)/
│   ├── password-reset/
│   ├── password-reset/confirm/
│   └── force-change-password/
├── (app)/                                ← school portal (existing routes: /home, /people, /academics, /settings, ...)
│   └── layout.tsx                        ← school auth guard + AppShell
└── platform/                             ← URL prefix: /platform/...
    ├── layout.tsx                         ← platform auth guard + PlatformShell
    ├── dashboard/
    │   └── page.tsx
    ├── organizations/
    │   ├── page.tsx                       ← org list
    │   ├── new/
    │   │   └── page.tsx                   ← create org wizard
    │   └── [orgId]/
    │       ├── page.tsx                   ← redirects to ./overview
    │       ├── overview/
    │       │   └── page.tsx
    │       ├── schools/
    │       │   └── page.tsx
    │       ├── users/
    │       │   └── page.tsx
    │       ├── memberships/
    │       │   └── page.tsx
    │       ├── audit/
    │       │   └── page.tsx
    │       └── settings/
    │           └── page.tsx
    ├── schools/
    │   ├── page.tsx                       ← all schools (cross-org)
    │   └── [schoolId]/
    │       ├── page.tsx                   ← redirects to ./overview
    │       ├── overview/
    │       │   └── page.tsx
    │       ├── academics/
    │       │   └── page.tsx               ← read-only
    │       ├── people/
    │       │   └── page.tsx               ← read-only
    │       ├── users/
    │       │   └── page.tsx
    │       ├── data-quality/
    │       │   └── page.tsx
    │       ├── audit/
    │       │   └── page.tsx
    │       └── settings/
    │           └── page.tsx
    ├── users/
    │   ├── page.tsx
    │   └── [userId]/
    │       ├── page.tsx                   ← redirects to ./profile
    │       ├── profile/
    │       │   └── page.tsx
    │       ├── memberships/
    │       │   └── page.tsx
    │       └── audit/
    │           └── page.tsx
    ├── roles/
    │   ├── page.tsx
    │   └── [roleId]/
    │       └── page.tsx
    ├── audit/
    │   └── page.tsx
    ├── system/
    │   └── page.tsx
    ├── billing/                           ← (future)
    │   ├── page.tsx
    │   ├── plans/
    │   ├── invoices/
    │   └── usage/
    └── settings/
        ├── page.tsx                       ← redirects to ./profile
        ├── profile/
        │   └── page.tsx
        ├── roles/
        │   └── page.tsx
        └── security/
            └── page.tsx                   ← (future)
```

Each detail route (`[orgId]`, `[schoolId]`, `[userId]`) redirects from its index to the default tab (`./overview`, `./profile`). This keeps deep links bookmarkable and the back button working correctly.

---

## Navigation Configuration

```text
/platform/dashboard           OVERVIEW    icon: LayoutDashboard
/platform/organizations       ORGANIZATIONS   icon: Building2
/platform/schools                             icon: GraduationCap
/platform/users               IDENTITY    icon: Users
/platform/roles                             icon: Shield
/platform/audit               PLATFORM    icon: ScrollText
/platform/system                            icon: Activity       badge: "Soon"
/platform/billing             BUSINESS    icon: CreditCard     badge: "Soon"
────────────────────────────  (separator)
/platform/settings                          icon: Settings
```

"Soon" badges indicate sections that are designed but not yet buildable due to missing API capabilities. They remain visible (not hidden) so the full product vision is always legible. They are not clickable until APIs are available.

---

## Page-by-Page Design

### Dashboard

The dashboard answers: **"Is the platform healthy? Is anything urgent? What happened recently?"**

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Platform Dashboard                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Organizations│  │ Schools      │  │ Users        │              │
│  │      12      │  │      47      │  │     203      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                     │
│  NEEDS ATTENTION ──────────────────────────────────────────────     │
│  ⚠  3 organizations with no schools                   [View →]     │
│  ⚠  2 organizations in TRIAL status > 30 days         [View →]     │
│  ⚠  7 schools in SETUP with no academic year          [View →]     │
│  ⚠  1 user SUSPENDED with active memberships          [View →]     │
│                                                                     │
│  RECENT ACTIVITY ──────────────────────────────────────────────     │
│  10:42  admin@schoolos.com   CREATED   Organization "Springfield"  │
│  10:38  admin@schoolos.com   UPDATED   School "Lincoln Elementary" │
│  10:15  support@schoolos.com CREATED   User for "Greenfield Ed"   │
│  09:51  admin@schoolos.com   DELETED   Membership                  │
│                                                           [All →]   │
│                                                                     │
│  QUICK ACTIONS ────────────────────────────────────────────────     │
│  [+ New Organization]    [+ New School]    [View Audit Log]         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Metric Cards

Counts are derived from existing list endpoints using `limit=1` to check `has_more`, or from the full list when the dataset is small. These are approximate totals — exact counts require a future aggregate API.

| Card | API Source | Phase |
|------|-----------|-------|
| Organizations | `GET /organizations` (iterate or count) | Phase 1 |
| Schools | `GET /schools` (no `X-School-ID` needed) | Phase 1 |
| Users | `GET /users` | Phase 1 |
| People (cross-school) | Requires future aggregate endpoint | Future |
| Growth trends (+X this month) | Requires future time-series endpoint | Future |

Do not show the People metric card or growth trend deltas until the aggregate API exists. Show 3 metric cards in Phase 1.

#### Needs Attention — Check List

All checks are client-side, derived from existing list endpoints. Each item links directly to the remediation screen.

| Check | Condition | Link To |
|-------|-----------|---------|
| Org with no schools | `GET /schools?organization_id=X` returns empty | Org detail → Schools tab → Create School |
| Org in TRIAL > 30 days | `status = TRIAL` and `created_at` > 30 days ago | Org detail → Settings → Status |
| School in SETUP with no academic year | `status = SETUP` and `GET /academic-years` (with `X-School-ID`) returns empty | School detail → Academics tab |
| Suspended user with active memberships | `status = SUSPENDED` and `/memberships?user_id=X` returns ACTIVE entries | User detail → Memberships tab |
| School with no users | `GET /memberships?school_id=X` returns empty | School detail → Users tab |
| Org with all schools suspended | All schools under org have `status = SUSPENDED` | Org detail → Schools tab |

#### Recent Audit Activity

`GET /audit-logs?limit=10` — latest 10 entries, platform-wide. Click "All →" navigates to `/platform/audit`.

---

### Organizations

#### Organization List

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Organizations                                    [+ New Organization]│
├─────────────────────────────────────────────────────────────────────┤
│  🔍 Search by name, slug, or code...                                │
│  [Status ▼]  [Sort: Created ▼]                                      │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Name               Slug          Status     Schools  Created │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ Greenfield Ed      greenfield    ● ACTIVE       8    Jan 15 │   │
│  │ Springfield Acad   springfield   ● ACTIVE       3    Feb 02 │   │
│  │ Riverside Group    riverside     ◐ TRIAL        1    Aug 01 │   │
│  │ Oakwood Schools    oakwood       ● SUSPENDED    5    Nov 20 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                          [Load More]                │
└─────────────────────────────────────────────────────────────────────┘
```

**Columns:** Name (linked to detail), Slug, Status badge, School count, Created date.  
**Search:** Client-side filter on loaded items (orgs tend to be a small list). Add API search when the list grows.  
**Status filter:** TRIAL / ACTIVE / SUSPENDED / CLOSED.  
**No "Users" column** — user count requires an extra query per org. Not worth the N+1 cost.

#### Organization Detail

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ← Organizations                                                    │
│  Greenfield Education Trust                              [Edit]     │
│  greenfield · ● ACTIVE · 8 schools                                  │
├─────────────────────────────────────────────────────────────────────┤
│  [Overview]  [Schools]  [Users]  [Memberships]  [Audit]  [Settings] │
├─────────────────────────────────────────────────────────────────────┤
```

##### Overview Tab

```text
  DETAILS ─────────────────────────────────────────────
  Name           Greenfield Education Trust
  Code           GRN-001
  Slug           greenfield
  Legal Name     Greenfield Education Trust Pvt. Ltd.
  Status         ● ACTIVE
  Plan           Standard
  Contact Email  admin@greenfield.edu
  Contact Phone  +91 98765 43210
  Timezone       Asia/Kolkata
  Locale         en-IN
  Created        2026-01-15

  STATISTICS ──────────────────────────────────────────
  Schools        8  (6 active · 1 setup · 1 suspended)
  Users          34
  Memberships    52

  ENTITLEMENTS ─── (from organization.entitlements JSONB — read-only)
  Max Schools    10
  Max Users      50
  Modules        Core, Academics
```

##### Schools Tab

```text
  ┌──────────────────────────────────────────────────────────────────┐
  │ Name                Short   Board   Status       Created        │
  ├──────────────────────────────────────────────────────────────────┤
  │ Lincoln Elementary  LES     CBSE    ● ACTIVE     Jan 15         │
  │ Washington High     WHS     ICSE    ● ACTIVE     Jan 15         │
  │ Jefferson Middle    JMS     CBSE    ◑ SETUP      Mar 01         │
  │ Roosevelt Primary   RPS     State   ● SUSPENDED  Jan 15         │
  └──────────────────────────────────────────────────────────────────┘

  [+ Add School to This Organization]
```

Each row links to `/platform/schools/[schoolId]/overview`. No People count column — cross-school person aggregation requires `X-School-ID` per school (N+1).

##### Users Tab

Users with any membership in this organization (org-wide or school-scoped).

```text
  🔍 Search by name or email...

  ┌──────────────────────────────────────────────────────────────────┐
  │ Name           Email                    Status    Scope          │
  ├──────────────────────────────────────────────────────────────────┤
  │ Rajesh Kumar   rajesh@greenfield.edu    ● ACTIVE  Org-wide      │
  │ Priya Sharma   priya@greenfield.edu     ● ACTIVE  Lincoln Elem  │
  │ Amit Patel     amit@greenfield.edu      ◐ INVITED Washington HS │
  └──────────────────────────────────────────────────────────────────┘
```

##### Memberships Tab

Flat view of every membership record across all schools in this org. Useful for support to see exactly who has access to what.

```text
  [School ▼]  [Role ▼]  [Status ▼]

  ┌────────────────────────────────────────────────────────────────────┐
  │ User           School            Role         Status    Start     │
  ├────────────────────────────────────────────────────────────────────┤
  │ Rajesh Kumar   — (org-wide)      Org Admin    ACTIVE    Jan 15   │
  │ Rajesh Kumar   Lincoln Elem      School Admin ACTIVE    Jan 15   │
  │ Priya Sharma   Lincoln Elem      School Admin ACTIVE    Jan 20   │
  │ Amit Patel     Washington HS     Teacher      ACTIVE    Feb 05   │
  └────────────────────────────────────────────────────────────────────┘
```

Source: `GET /memberships?organization_id={orgId}` — single request, no N+1.

##### Audit Tab

`GET /audit-logs?organization_id={orgId}` — all audit entries for this org.

> **API gap:** `organization_id` filter must be confirmed or added to the `/audit-logs` endpoint. The current filter list includes `school_id`, `actor_user_id`, `entity_type`, `entity_id`, `created_from`, `created_to`. If `organization_id` is not yet supported, filter client-side or request the backend to add it.

```text
  [Actor ▼]  [Entity Type ▼]  [Action ▼]  [From ──→ To]

  ┌────────────────────────────────────────────────────────────────────┐
  │ Timestamp         Actor           Action   Entity        Summary  │
  ├────────────────────────────────────────────────────────────────────┤
  │ Aug 19 10:42      rajesh@gf.edu   CREATE   School        "Jefferson Middle" │
  │ Aug 19 10:38      rajesh@gf.edu   UPDATE   School        Status SETUP→ACTIVE│
  │ Aug 18 16:20      priya@gf.edu    CREATE   Person        "Ananya Gupta"     │
  └────────────────────────────────────────────────────────────────────┘

  ▸ Click any row to expand → before/after diff
```

Uses the shared `AuditLogTable` component (see Components section).

##### Settings Tab

```text
  ORGANIZATION PROFILE ────────────────────────────────
  Name           [Greenfield Education Trust          ]
  Legal Name     [Greenfield Education Trust Pvt. Ltd.]
  Slug           [greenfield                          ]
  Contact Email  [admin@greenfield.edu                ]
  Contact Phone  [+91 98765 43210                     ]
  Timezone       [Asia/Kolkata                   ▼    ]
  Locale         [en-IN                          ▼    ]

                                             [Save Changes]

  STATUS ─────────────────────────────────────────────
  Current: ● ACTIVE

  Valid transitions shown based on current status:
  • TRIAL     → [Activate] [Suspend] [Close]
  • ACTIVE    → [Suspend] [Close]
  • SUSPENDED → [Reactivate] [Close]
  • CLOSED    → (no transitions — terminal state)

  DANGER ZONE ────────────────────────────────────────
  ┌─────────────────────────────────────────────────────────────┐
  │  Close this organization                                     │
  │                                                              │
  │  This will permanently close Greenfield Education Trust and  │
  │  all 8 schools under it. All users will lose access.         │
  │  This cannot be undone.                                      │
  │                                                              │
  │  Type "greenfield" to confirm:                               │
  │  [                              ]           [Close Org]      │
  │  (button disabled until slug matches)                        │
  └─────────────────────────────────────────────────────────────┘
```

Status change buttons are contextual — only valid next states are shown, derived from the entity's current `status`. The close action always requires typed confirmation using the org's slug.

---

### Schools

#### School List

Cross-organization. No `X-School-ID` header required for this list.

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Schools                                             [+ New School] │
├─────────────────────────────────────────────────────────────────────┤
│  🔍 Search by name, short name, or code...                          │
│  [Organization ▼]  [Status ▼]  [Board ▼]   Sort: [Name ▼]          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Name                Organization      Board  Status          │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ Central Academy     Springfield       CBSE   ● ACTIVE        │   │
│  │ Jefferson Middle    Greenfield Ed     CBSE   ◑ SETUP         │   │
│  │ Lincoln Elementary  Greenfield Ed     CBSE   ● ACTIVE        │   │
│  │ Washington High     Greenfield Ed     ICSE   ● ACTIVE        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                      [Load More]    │
└─────────────────────────────────────────────────────────────────────┘
```

**No People count column** — requires `X-School-ID` per school (N+1). Deferred.  
The Organization column links to `/platform/organizations/[orgId]/overview`.

#### School Detail

Platform admins use this for support, monitoring, and status management. Academic data (years, terms, classes, subjects, cohorts) and person data are **read-only** — school admins own that data.

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ← Schools                                                          │
│  Lincoln Elementary School                                [Edit]    │
│  Greenfield Education Trust · CBSE · ● ACTIVE                       │
│  ⓘ Platform view — school data is read-only except status and profile│
├─────────────────────────────────────────────────────────────────────┤
│  [Overview] [Academics] [People] [Users & Roles] [Data Quality] [Audit] [Settings]│
├─────────────────────────────────────────────────────────────────────┤
```

##### Overview Tab

```text
  SCHOOL PROFILE ─────────────────────────────────────
  Name             Lincoln Elementary School
  Short Name       LES
  Code             LES-001
  Organization     Greenfield Education Trust  [→]
  Board            CBSE
  Affiliation No.  2730456
  Status           ● ACTIVE
  Timezone         Asia/Kolkata
  Locale           en-IN
  Created          2026-01-15

  AT A GLANCE ────────────────────────────────────────
  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Users    │  │ Cohorts  │  │ Classes  │  │ Subjects │
  │    14    │  │    24    │  │    12    │  │    18    │
  └──────────┘  └──────────┘  └──────────┘  └──────────┘

  Current Year: 2026-27 (ACTIVE) · 2 Terms
```

No People count in the at-a-glance stats — requires `X-School-ID` call separate from the school detail fetch. Add in future when API supports aggregate counts.

##### Academics Tab

Read-only. Uses the school's `X-School-ID` header for all requests on this tab.

```text
  ⓘ Read-only view. School admins manage academic data.

  ACADEMIC YEARS ─────────────────────────────────────
  ┌──────────────────────────────────────────────────┐
  │ Code     Name        Status   Current   Terms    │
  ├──────────────────────────────────────────────────┤
  │ 2026-27  2026-2027   ACTIVE   ✓         2        │
  │ 2025-26  2025-2026   CLOSED   —         2        │
  └──────────────────────────────────────────────────┘

  CLASSES  12 total (all ACTIVE)
  Class 1, Class 2, Class 3 ... Class 12

  SUBJECTS  18 total
  Mathematics, Science, English, Hindi, ...

  COHORTS (2026-27)
  ┌──────────────────────────────────────────────────┐
  │ Name   Class      Capacity   Status              │
  ├──────────────────────────────────────────────────┤
  │ 1-A    Class 1    40         ACTIVE              │
  │ 1-B    Class 1    40         ACTIVE              │
  │ ...                                              │
  └──────────────────────────────────────────────────┘
```

##### People Tab

Read-only. Uses `X-School-ID` for the persons list query.

```text
  ⓘ Read-only view. School admins manage person records.

  🔍 Search persons...

  ┌──────────────────────────────────────────────────────┐
  │ Name              Gender    DOB          Status      │
  ├──────────────────────────────────────────────────────┤
  │ Rahul Sharma      Male      2015-06-12   ACTIVE      │
  │ Ananya Gupta      Female    2014-03-08   ACTIVE      │
  │ Vikram Singh      Male      —            ACTIVE      │
  └──────────────────────────────────────────────────────┘
                                              [Load More]
```

Clicking a person name navigates to their profile in the **school portal** (`/people/[personId]`) with the correct school context — not within the platform portal itself, since person editing belongs to school admins.

##### Users & Roles Tab

```text
  USERS WITH ACCESS ──────────────────────────────────
  ┌──────────────────────────────────────────────────────┐
  │ Name           Email                  Status   Roles │
  ├──────────────────────────────────────────────────────┤
  │ Priya Sharma   priya@greenfield.edu   ACTIVE   Admin │
  │ Ravi Kumar     ravi@greenfield.edu    ACTIVE   Teacher│
  │ Neha Verma     neha@greenfield.edu    INVITED  Staff  │
  └──────────────────────────────────────────────────────┘

  ROLES DEFINED IN THIS SCHOOL ── (read-only)
  ┌──────────────────────────────────────────────────────┐
  │ Name          Code           System   Permissions    │
  ├──────────────────────────────────────────────────────┤
  │ School Admin  SCHOOL_ADMIN   ✓        24             │
  │ Teacher       TEACHER        ✓        12             │
  │ Staff         STAFF          —         8             │
  └──────────────────────────────────────────────────────┘

  Role definitions are read-only from platform view.
  School admins manage roles in Settings > Roles.
```

##### Data Quality Tab

All checks are client-side, derived from data already fetched for this school. Uses `X-School-ID` for academic and person queries.

```text
  DATA QUALITY ────────────────────────────────────────

  Issues Found: 6

  ┌───────────────────────────────────────────────────────────────────┐
  │ ⚠  HIGH   12 persons without contact information      [View →]   │
  │ ⚠  HIGH    3 persons without an address               [View →]   │
  │ ⚠  MEDIUM  2 classes with no subject assignments      [View →]   │
  │ ⚠  MEDIUM  1 cohort at max capacity (40/40)           [View →]   │
  │ ⚠  LOW     8 persons missing date of birth            [View →]   │
  │ ⚠  LOW     4 persons missing gender                   [View →]   │
  └───────────────────────────────────────────────────────────────────┘

  Each [View →] link opens the school portal's relevant page with context set.
```

No health score percentage — the metric is arbitrary without a defined formula and misleads support teams into thinking a school is "fine" when critical data is missing.

##### Audit Tab

`GET /audit-logs?school_id={schoolId}` — uses the `AuditLogTable` component, filtered to this school.

##### Settings Tab

```text
  SCHOOL PROFILE ─────────────────────────────────────
  Name            [Lincoln Elementary School          ]
  Short Name      [LES                                ]
  Board           [CBSE                          ▼    ]
  Affiliation No. [2730456                            ]
  Contact Email   [info@les.greenfield.edu            ]
  Contact Phone   [+91 11 2345 6789                   ]

                                            [Save Changes]

  STATUS ─────────────────────────────────────────────
  Current: ● ACTIVE

  Valid transitions (contextual — shown based on current status):
  • SETUP      → [Mark as Active] [Suspend] [Close]
  • ACTIVE     → [Suspend] [Close]
  • SUSPENDED  → [Reactivate] [Close]
  • CLOSED     → (terminal — no transitions)

  DANGER ZONE ────────────────────────────────────────
  ┌──────────────────────────────────────────────────────────────┐
  │  Close this school                                            │
  │  Suspends all user access. Organization is not affected.      │
  │  This cannot be undone.                                       │
  │                                                               │
  │  Type "lincoln-elementary" to confirm:                        │
  │  [                                ]         [Close School]   │
  └──────────────────────────────────────────────────────────────┘
```

---

### Users

#### User List

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Users                                                [+ New User]  │
├─────────────────────────────────────────────────────────────────────┤
│  🔍 Search by email or phone...                                     │
│  [Status ▼]  [Platform Admin ▼]   Sort: [Created ▼]                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Email                    Status      PA    Memberships       │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ admin@schoolos.com       ● ACTIVE    ✓     —                 │   │
│  │ rajesh@greenfield.edu    ● ACTIVE    —     3                 │   │
│  │ head@springfield.edu     ● ACTIVE    —     2                 │   │
│  │ amit@greenfield.edu      ◐ INVITED   —     1                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                      [Load More]    │
└─────────────────────────────────────────────────────────────────────┘
```

**PA** = Platform Admin flag (✓ = `is_platform_admin: true`).  
**Search** is client-side until `GET /users?search=` is available in the API (see API gaps).  
**No Org column** — user-to-org mapping requires a memberships lookup per user (N+1). Use the Platform Admin filter and Status filter instead.

#### User Detail

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ← Users                                                            │
│  Rajesh Kumar                                                        │
│  rajesh@greenfield.edu · ● ACTIVE                                   │
├─────────────────────────────────────────────────────────────────────┤
│  [Profile]  [Memberships]  [Audit Trail]                            │
├─────────────────────────────────────────────────────────────────────┤
```

##### Profile Tab

```text
  IDENTITY ───────────────────────────────────────────
  Email              rajesh@greenfield.edu
  Phone              +91 98765 43210
  Linked Person      Rajesh Kumar  [→ school portal]
  Status             ● ACTIVE
  Platform Admin     No
  Must Change Pwd    No
  Created            2026-01-15

  ACCOUNT ACTIONS ────────────────────────────────────
  [Send Password Reset]       POST /auth/password-reset (sends email)
  [Force Password Change]     PATCH /users/{id} → must_change_password: true
  [Suspend User]              PATCH /users/{id} → status: SUSPENDED
  [Reactivate User]           PATCH /users/{id} → status: ACTIVE
  (contextual — shown based on current status)

  DANGER ZONE ────────────────────────────────────────
  ┌──────────────────────────────────────────────────────────────┐
  │  Grant Platform Admin access                                  │
  │                                                               │
  │  This gives full unrestricted access to all organizations,    │
  │  schools, and users on the platform.                          │
  │                                                               │
  │  [Grant Platform Admin]     [Remove Platform Admin]           │
  │  (each requires a confirmation dialog before executing)        │
  └──────────────────────────────────────────────────────────────┘
```

"Linked Person" links to the school portal's person profile page — not within the platform portal — because person records are school-scoped. The link includes the school context for the navigation.

Account action buttons are contextual: a SUSPENDED user shows [Reactivate User] instead of [Suspend User]. All actions call `PATCH /users/{id}` with the `version` field to handle optimistic locking.

##### Memberships Tab

```text
  ┌──────────────────────────────────────────────────────────────────┐
  │ Organization     School           Role          Status    Start  │
  ├──────────────────────────────────────────────────────────────────┤
  │ Greenfield Ed    — (org-wide)     Org Admin     ACTIVE    Jan 15 │
  │ Greenfield Ed    Lincoln Elem     School Admin  ACTIVE    Jan 15 │
  │ Greenfield Ed    Washington HS    Viewer        ACTIVE    Mar 01 │
  └──────────────────────────────────────────────────────────────────┘

  [+ Add Membership]
  [End Selected Membership]  (requires version — shows STALE_RESOURCE dialog if stale)
```

##### Audit Trail Tab

`GET /audit-logs?actor_user_id={userId}` — everything this user has done, platform-wide.

```text
  [Entity Type ▼]  [Action ▼]  [From ──→ To]

  ┌──────────────────────────────────────────────────────────────────┐
  │ Timestamp        Action    Entity          Summary               │
  ├──────────────────────────────────────────────────────────────────┤
  │ Aug 19 10:42     CREATE    School          Created "Jefferson Middle"│
  │ Aug 19 10:38     UPDATE    School          Status SETUP → ACTIVE │
  │ Aug 18 09:15     CREATE    Person          Added "Ravi Mehta"    │
  │ Aug 17 14:30     UPDATE    AcademicYear    Set 2026-27 as current│
  └──────────────────────────────────────────────────────────────────┘
```

Uses the shared `AuditLogTable` component with `actorUserId` pre-filtered.

---

### Roles

Cross-org read-only view of all role definitions. Platform admins can view any role to understand what permissions are granted, but cannot modify school-scoped roles (those belong to school admins) or system roles (those are platform-defined).

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Roles                                                              │
├─────────────────────────────────────────────────────────────────────┤
│  [Scope Level ▼]  [System Only ▼]  [Organization ▼]                 │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Name           Code           Org           System  Permissions│ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ Org Admin      ORG_ADMIN      —             ✓       36         │ │
│  │ School Admin   SCHOOL_ADMIN   —             ✓       24         │ │
│  │ Teacher        TEACHER        —             ✓       12         │ │
│  │ Staff          STAFF          —             ✓        8         │ │
│  │ Custom Role    CUSTOM_01      Greenfield Ed —        8         │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

System roles (`is_system = true`) have `—` in the Org column — they are platform-defined and shared. Custom roles belong to a specific organization.

Role detail shows the permission matrix using the same component as the school portal's Settings → Roles page. No edit capability from the platform view for school-scoped roles.

---

### Audit Log

The most powerful diagnostic tool. Full visibility into every mutation across the entire platform.

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Audit Log                                             [Export ▼]   │
│  Platform-wide activity                                             │
├─────────────────────────────────────────────────────────────────────┤
│  [Organization ▼] [School ▼] [Actor ▼] [Entity Type ▼]             │
│  [Action ▼]   [From: ──────]  [To: ──────]                         │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Timestamp        Actor               Action   Entity    Org    │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ Aug 19 10:42:15  admin@schoolos.com  CREATE   Org       —      │ │
│  │ Aug 19 10:38:01  rajesh@gf.edu       UPDATE   School    GF     │ │
│  │ Aug 19 10:15:44  priya@gf.edu        CREATE   Person    GF     │ │
│  │ Aug 18 16:20:02  head@sf.edu         DELETE   Cohort    SF     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                      [Load More]    │
└─────────────────────────────────────────────────────────────────────┘
```

Clicking any row expands inline:

```text
  ┌────────────────────────────────────────────────────────────────────┐
  │  UPDATE · School · "Lincoln Elementary" (id: abc-123)             │
  │  By: rajesh@greenfield.edu · IP: 203.0.113.42 · req_7f3a2b1c     │
  │                                                                    │
  │  Field             Before          After                          │
  │  ─────────────────────────────────────────────────────────────    │
  │  status            SETUP           ACTIVE                         │
  │  contact_email     —               info@les.gf.edu                │
  │                                                                    │
  │  [Raw JSON ▼]                                                     │
  └────────────────────────────────────────────────────────────────────┘
```

The diff view renders `before_snapshot` and `after_snapshot` JSONB fields as a flat field→before→after table. Changed fields only — unchanged fields are hidden. Raw JSON is available behind a toggle for debugging.

Export is future (requires backend streaming support).

---

### System

```text
┌─────────────────────────────────────────────────────────────────────┐
│  System Health                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  API STATUS ────────────────────────────────────────────────────    │
│  ● API is healthy    Last checked: 10 seconds ago     [Refresh]    │
│  ● Database ready                                                   │
│  Checked via GET /health and GET /ready                             │
│                                                                     │
│  BACKGROUND JOBS ─── (future) ─────────────────────────────────    │
│  Requires job queue monitoring API                                  │
│                                                                     │
│  FEATURE FLAGS ─── (future) ───────────────────────────────────    │
│  Requires feature flag model + API                                  │
│                                                                     │
│  DELIVERY ─── (future) ────────────────────────────────────────    │
│  Requires email/SMS delivery provider integration                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

Phase 1 builds only the API health section using `GET /health` (liveness) and `GET /ready` (includes DB check). The page is structured with placeholders for future sections — not hidden, but clearly labeled as future.

---

### Billing (Future)

Deferred until a subscription model exists in the API. The page renders a "Coming Soon" state with a brief description of what will be here.

When available:

```text
  [Subscriptions]  [Plans]  [Invoices]  [Usage]

  Subscriptions
  ┌──────────────────────────────────────────────────────────────┐
  │ Organization    Plan       Status     Renews      MRR        │
  ├──────────────────────────────────────────────────────────────┤
  │ Greenfield Ed   Standard   Active     Sep 15      ₹15,000   │
  │ Springfield     Premium    Active     Sep 01      ₹25,000   │
  │ Riverside       Trial      Trial      Aug 31      —          │
  └──────────────────────────────────────────────────────────────┘
```

The Organization model already has `plan_code` and `entitlements` JSONB fields — billing extends these with a subscription lifecycle, invoicing, and usage tracking.

---

### Settings

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Platform Settings                                                  │
├─────────────────────────────────────────────────────────────────────┤
│  [Profile]  [Default Roles]  [Security]  [Email Templates]          │
├─────────────────────────────────────────────────────────────────────┤
```

Platform settings are **not** stored in an Organization record. They are platform-level configuration managed separately (a dedicated settings store or environment configuration). Phase 1 settings are largely informational.

##### Profile Tab

```text
  PLATFORM IDENTITY ──────────────────────────────────
  Product Name      [School OS                       ]
  Support Email     [support@schoolos.com            ]
  Support Phone     [+91 11 0000 0000                ]
  Default Timezone  [Asia/Kolkata              ▼     ]
  Default Locale    [en-IN                     ▼     ]

                                           [Save Changes]
```

##### Default Roles Tab

System role templates inherited by all new organizations. Read-only — system roles cannot be edited through the UI.

```text
  ┌──────────────────────────────────────────────────────────────┐
  │ Role          Scope   System   Permissions   Actions         │
  ├──────────────────────────────────────────────────────────────┤
  │ Org Admin     ORG     ✓        36            [View →]        │
  │ School Admin  SCHOOL  ✓        24            [View →]        │
  │ Teacher       SCHOOL  ✓        12            [View →]        │
  │ Staff         SCHOOL  ✓         8            [View →]        │
  └──────────────────────────────────────────────────────────────┘

  [View →] opens the role detail in the Roles section.
```

##### Security Tab (Future)

```text
  PASSWORD POLICY, SESSION POLICY, 2FA REQUIREMENTS
  — Deferred until security policy API is available —
```

---

## Create Organization Wizard

The primary provisioning flow. Accessible from the dashboard and the organization list.

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Create Organization                                   Step 1 of 4  │
│  ① Organization → ② First School → ③ Admin User → ④ Review         │
│  ●               ○                ○               ○                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ORGANIZATION DETAILS                                               │
│  Name *          [                                    ]             │
│  Slug            [auto-generated-from-name            ] ← editable  │
│  Legal Name      [                                    ]             │
│  Contact Email * [                                    ]             │
│  Contact Phone   [                                    ]             │
│  Plan            [Standard                       ▼   ]             │
│  Timezone        [Asia/Kolkata                   ▼   ]             │
│  Locale          [en-IN                          ▼   ]             │
│                                                                     │
│                                     [Cancel]  [Next: School →]      │
└─────────────────────────────────────────────────────────────────────┘
```

**Step 2: First School** (optional — toggle to skip)

```text
  ☐ Skip — I'll add schools later

  School Name *    [                                    ]
  Short Name       [                                    ]
  Board            [CBSE                          ▼    ]
  Affiliation No.  [                                    ]

                                   [← Back]  [Next: Admin User →]
```

**Step 3: Admin User**

```text
  This user will be the first administrator for the organization.

  Email *          [                                    ]
  Phone            [                                    ]
  First Name *     [                                    ]
  Last Name *      [                                    ]

  Password         [auto-generated: Xk9#mP2v] [Copy] [Regenerate]
  ☐ Email credentials to the user on creation

                                   [← Back]  [Next: Review →]
```

**Step 4: Review & Create**

```text
  Organization     Greenfield Education Trust (greenfield)
  Plan             Standard · Asia/Kolkata · en-IN

  First School     Lincoln Elementary School (CBSE)

  Admin User       rajesh@greenfield.edu · Rajesh Kumar
                   Credentials will be emailed on creation

  ─────────────────────────────────────────────────────

  This will create:
  ● 1 organization
  ● 1 school (if not skipped)
  ● 1 person record linked to the admin user
  ● 1 user account
  ● 1 org-wide membership (Org Admin role)
  ● 1 school membership (School Admin role, if school created)

                              [← Back]  [Create Organization]
```

#### API Sequence

All calls use the platform admin's token. The API allows these operations because `is_platform_admin = true`.

```text
1. POST /organizations                      → { org_id }
2. POST /schools                            → { school_id }   (if not skipped)
3. POST /persons                            → { person_id }
   Header: X-School-ID: {school_id}         ← persons are school-scoped; must attach
                                              the newly created school's ID here.
                                              If school was skipped, defer person
                                              creation or create person under the
                                              first school separately.
4. POST /users  { person_id, email, ... }   → { user_id }
5. POST /memberships { school_id: null }    → org-wide membership
6. POST /memberships { school_id }          → school membership (if school created)
7. POST /memberships/{id}/roles             → grant Org Admin role
8. POST /memberships/{id}/roles             → grant School Admin role (if school)
```

> **Note on step 3:** Person creation requires `X-School-ID`. If the school step was skipped, the wizard must either (a) skip person creation and prompt the org admin to set up their person record on first login, or (b) require the school step when creating an admin user. The simplest Phase 1 approach: make "First School" required when creating an admin user. Show a validation error if the user attempts to skip the school step but has filled in user details.

If any step fails, surface the error clearly with the completed steps listed so support can manually complete the remaining steps.

---

## Global Search (⌘K)

Extends the existing school portal command palette with platform entity types.

```text
┌─────────────────────────────────────────────────────┐
│  🔍  Search...                                       │
├─────────────────────────────────────────────────────┤
│  ORGANIZATIONS                                       │
│  🏢 Greenfield Education Trust          ACTIVE       │
│  🏢 Springfield Academy                ACTIVE       │
│                                                      │
│  SCHOOLS                                             │
│  🏫 Lincoln Elementary School           ACTIVE       │
│  🏫 Washington High School              ACTIVE       │
│                                                      │
│  USERS                                               │
│  👤 rajesh@greenfield.edu               ACTIVE       │
│  👤 priya@greenfield.edu                ACTIVE       │
│                                                      │
│  ACTIONS                                             │
│  ＋  Create Organization                              │
│  ＋  Create School                                    │
│  📋  View Platform Audit Log                         │
│  ⚙   Platform Settings                               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Search strategy:**
- Organizations: client-side filter on loaded list (typically small)
- Schools: client-side filter on loaded list
- Users: client-side filter until `GET /users?search=` is available (see API gaps)
- Audit entries: not searched via command palette — use the Audit Log page directly

---

## Code Structure

### Directory Layout

The platform portal shares the school portal's codebase. Platform-specific code lives in dedicated subdirectories.

```text
app/
├── platform/                              ← URL: /platform/...
│   └── layout.tsx                         ← PlatformShell + admin guard
│   ... (routes as defined above)
│
components/
├── ui/
│   ├── audit-log-table.tsx                ← NEW: reusable audit log table + row expansion
│   ├── audit-diff-viewer.tsx              ← NEW: before/after snapshot diff renderer
│   ├── stat-card.tsx                      ← NEW: metric card (value, label, optional trend)
│   ├── needs-attention-list.tsx           ← NEW: actionable alert list with remediation links
│   ├── wizard-stepper.tsx                 ← NEW: multi-step progress indicator
│   ├── danger-zone.tsx                    ← NEW: red-bordered danger section with typed confirm
│   └── ... (existing: data-table, status-badge, permission-gate, etc.)
├── layout/
│   ├── platform-shell.tsx                 ← NEW: sidebar + header wrapper for platform portal
│   ├── platform-sidebar.tsx               ← NEW: grouped nav (OVERVIEW / ORGANIZATIONS / ...)
│   ├── platform-header.tsx                ← NEW: logo + PLATFORM ADMIN badge + search + user menu
│   └── ... (existing: app-shell, sidebar, header, command-palette, etc.)
└── patterns/
    └── ... (existing: page-header, empty-state, error-state, confirm-dialog, stale-resource-dialog, form-section)

features/
├── platform-dashboard/
│   ├── platform-dashboard.tsx             ← dashboard composition
│   ├── platform-metrics.tsx               ← 3 stat cards (orgs, schools, users)
│   ├── platform-needs-attention.tsx       ← alert derivation + NeedsAttentionList
│   └── platform-recent-activity.tsx       ← audit log preview (last 10)
├── platform-organizations/
│   ├── org-list.tsx
│   ├── org-detail.tsx                     ← tab layout + shared header
│   ├── org-overview-tab.tsx
│   ├── org-schools-tab.tsx
│   ├── org-users-tab.tsx
│   ├── org-memberships-tab.tsx
│   ├── org-audit-tab.tsx                  ← AuditLogTable pre-filtered by org
│   ├── org-settings-tab.tsx
│   ├── create-org-wizard.tsx
│   └── org-schemas.ts                     ← Zod schemas for wizard steps
├── platform-schools/
│   ├── school-list-platform.tsx
│   ├── school-detail-platform.tsx
│   ├── school-overview-tab.tsx
│   ├── school-academics-tab.tsx
│   ├── school-people-tab.tsx
│   ├── school-users-tab.tsx
│   ├── school-data-quality-tab.tsx
│   ├── school-audit-tab.tsx               ← AuditLogTable pre-filtered by school
│   └── school-settings-tab.tsx
├── platform-users/
│   ├── user-list-platform.tsx
│   ├── user-detail-platform.tsx
│   ├── user-profile-tab.tsx
│   ├── user-memberships-tab.tsx
│   └── user-audit-tab.tsx                 ← AuditLogTable pre-filtered by actor
├── platform-roles/
│   ├── role-list-platform.tsx
│   └── role-detail-platform.tsx
├── platform-audit/
│   └── audit-log-page.tsx                 ← full platform-wide log (no pre-filter)
├── platform-system/
│   └── system-health.tsx
└── platform-settings/
    ├── platform-profile.tsx
    └── platform-default-roles.tsx
```

**Why `AuditLogTable` is in `components/ui/`:** It is used in four separate contexts — org audit tab, school audit tab, user audit trail tab, and the platform-wide audit page. It is not specific to any feature. It accepts filter props and delegates the API call to the parent.

**Why feature directories are prefixed `platform-`:** Keeps platform features visually distinct from school portal features (`people/`, `academics/`, `settings/`) in the same `features/` root. No nested `platform/` subdirectory — avoids import paths like `features/platform/organizations/...`.

### API Client

The platform portal uses a thin wrapper over the existing API client that omits the `X-School-ID` header by default:

```text
// services/platform-api-client.ts
// Wraps the base api-client but never attaches X-School-ID automatically.
// For school-scoped calls (people, academics on a specific school),
// pass schoolId explicitly — the client attaches it only for that request.

platformApiClient.get('/persons', { schoolId: 'abc-123' })
// → sets X-School-ID: abc-123 for this request only
```

This avoids leaking school context across platform queries and makes it explicit when a school-scoped call is being made.

### Services

```text
services/
├── api-client.ts          ← base HTTP client (existing, school portal)
├── platform-api-client.ts ← NEW: platform client (no X-School-ID by default)
├── auth.ts                ← shared (existing)
├── organizations.ts       ← shared: platform admins see all orgs; school portal sees own org
├── schools.ts             ← shared: platform admins see all schools; school portal uses X-School-ID
├── users.ts               ← shared: platform admins see all users; school portal sees school users
├── memberships.ts         ← shared: filterable by org, school, or user
├── roles.ts               ← shared: platform admins see all roles across orgs
├── audit.ts               ← shared: accepts optional org/school/actor filters
├── persons.ts             ← existing (school-scoped; used in school-people-tab with X-School-ID)
└── academics.ts           ← existing (school-scoped; used in school-academics-tab with X-School-ID)
```

The distinction between "platform admin sees all" and "school admin sees own" is enforced by the API backend based on `is_platform_admin`. The frontend uses the same service functions — the API returns broader results for platform admins without any frontend changes to query params.

### Hooks

```text
hooks/
├── use-platform-guard.ts     ← reads MeResponse; redirects if is_platform_admin ≠ true
├── use-platform-stats.ts     ← fetches org/school/user counts for dashboard
├── use-platform-alerts.ts    ← derives Needs Attention items from loaded data
├── use-audit-log.ts          ← cursor-paginated audit log with filter params
└── ... (existing: use-auth, use-permissions, use-cursor-pagination, use-school-context)
```

### Query Keys

Platform queries use the `"platform"` namespace to prevent cache collisions with the school portal:

```text
School portal:    ["persons",       schoolId, params]
                  ["academic-years", schoolId, params]
                  ["cohorts",        schoolId, params]

Platform portal:  ["platform", "organizations",  params]
                  ["platform", "organizations",  orgId]
                  ["platform", "organizations",  orgId, "schools"]
                  ["platform", "schools",        params]
                  ["platform", "schools",        schoolId]
                  ["platform", "users",          params]
                  ["platform", "users",          userId]
                  ["platform", "memberships",    params]
                  ["platform", "roles",          params]
                  ["platform", "audit",          params]
```

---

## Access Control

### Guard

The `platform/layout.tsx` runs on every render:

```text
1. Check auth state (AuthProvider)
2. If not authenticated → redirect to /login
3. Check MeResponse.is_platform_admin (cached from login, re-verified on TTL)
4. If false → redirect to /home (school portal)
5. If true → render PlatformShell
```

The guard never relies on client-side role names or permissions arrays — only the `is_platform_admin` boolean from the API.

### Phase 1: Binary Access

All platform admins see everything. No granular platform roles yet.

### Future: Platform-Scoped Roles

The Role model supports `scope_level = PLATFORM`. When platform roles are introduced:

| Platform Role | Access |
|--------------|--------|
| Platform Owner | Full read + write |
| Platform Support | Read-only across all entities and audit |
| Billing Admin | Read orgs + subscriptions; write subscription changes |
| Platform Engineer | Read system health + feature flags only |

---

## API Endpoints Used

### Available Now

| Endpoint | Used For |
|----------|---------|
| `GET /auth/me` | Verify `is_platform_admin`, load user identity |
| `GET /organizations` | Org list, org count |
| `GET /organizations/{id}` | Org detail |
| `POST /organizations` | Create org (wizard step 1) |
| `PATCH /organizations/{id}` | Edit org profile, change status |
| `GET /schools` | School list (no `X-School-ID` needed) |
| `GET /schools/{id}` | School detail |
| `POST /schools` | Create school (wizard step 2, org detail) |
| `PATCH /schools/{id}` | Edit school profile, change status |
| `GET /users` | User list |
| `GET /users/{id}` | User detail |
| `POST /users` | Create user (wizard step 3) |
| `PATCH /users/{id}` | Suspend, reactivate, force password change, toggle platform admin |
| `GET /memberships` | Filter by org, school, or user |
| `POST /memberships` | Create membership |
| `PATCH /memberships/{id}` | Update membership |
| `DELETE /memberships/{id}` | End membership |
| `POST /memberships/{id}/roles` | Grant role to membership |
| `DELETE /memberships/{id}/roles/{roleId}` | Revoke role |
| `GET /roles` | Role list (all orgs) |
| `GET /roles/{id}` | Role detail + permissions |
| `GET /audit-logs` | Platform-wide audit, org-scoped, school-scoped, actor-scoped |
| `GET /audit-logs/{id}` | Full audit entry detail |
| `GET /persons` | School people tab (with `X-School-ID`) |
| `GET /academic-years` | School academics tab (with `X-School-ID`) |
| `GET /academic-classes` | School academics tab |
| `GET /subjects` | School academics tab |
| `GET /cohorts` | School academics tab |
| `GET /health` | System page — API liveness |
| `GET /ready` | System page — readiness + DB check |
| `POST /auth/password-reset` | Trigger password reset email for a user |

### API Gaps

| Gap | What It Blocks | Suggested Change |
|-----|---------------|-----------------|
| `organization_id` filter on `GET /audit-logs` | Org audit tab must filter client-side | Add `organization_id` query param to `/audit-logs` |
| No aggregate counts endpoint | Dashboard can't show total person count or growth trends | `GET /platform/stats` → `{ org_count, school_count, user_count, person_count }` |
| No `search` param on `GET /users` | User list search is client-side only | Add `?search=` to `/users` endpoint |
| No time-series data | Growth trend charts on dashboard | `GET /platform/stats/timeseries?period=month&range=12` |
| No session management endpoints | User active session view + revocation | `GET /sessions`, `DELETE /sessions/{id}` |
| No impersonation endpoint | Support team workflows | `POST /auth/impersonate/{userId}` (audit-logged, time-limited) |
| No subscription/plan model | Entire Billing section | New billing domain: plans, subscriptions, invoices |
| No feature flag model | Feature Flags in System page | New domain: flags per platform + per org overrides |
| No cross-school person search | Platform-wide person search without school context | Relax `X-School-ID` requirement for platform admins on `GET /persons` |

---

## Write Operations and Versioning

All `PATCH` and `DELETE` operations on versioned resources require the `version` field. The platform portal will encounter `STALE_RESOURCE` (409) errors just like the school portal.

**Versioned resources used in the platform portal:** Organization, School, User, Membership, Role.

The platform portal must:
1. Always include `version` from the last-fetched entity in every PATCH/DELETE body.
2. Show `StaleResourceDialog` on 409 `STALE_RESOURCE` — offering to reload and retry.
3. Invalidate the cached entity after any successful write.

---

## Visual Identity

| Element | School Portal | Platform Portal |
|---------|--------------|-----------------|
| Accent color | Blue-600 (brand) | Indigo-600 |
| Sidebar background | White / neutral-50 | Slate-900 (dark) |
| Header badge | School name dropdown | "PLATFORM ADMIN" monospace label |
| Favicon / tab title | "School OS" | "School OS · Admin" |
| Context selectors | School + Academic Year | None |
| Data posture indicator | None needed | "ⓘ Platform view — read-only" banner on school/people tabs |

The dark sidebar is the primary visual cue. It immediately signals a different operational context. Platform admins must never be confused about which portal they are in.

### Status Badge Colors

Applied consistently across all entities:

| Status | Color | Entity |
|--------|-------|--------|
| ACTIVE | Green | Org, School, User, Membership |
| TRIAL | Blue | Organization |
| SETUP | Amber | School |
| INVITED | Blue | User |
| SUSPENDED | Orange | Org, School, User |
| INACTIVE | Gray | Membership |
| CLOSED | Red | Org, School |
| DISABLED | Red | User |
| ENDED | Gray | Membership |
| DRAFT | Gray | Academic Year |

---

## Loading, Empty, and Error States

The platform portal reuses all existing patterns from the school portal:

| State | Component | When Used |
|-------|-----------|----------|
| Loading list | `DataTable` skeleton rows | Any list page while fetching |
| Loading detail | Skeleton fields | Any detail tab while fetching |
| Empty list | `EmptyState` | Org with no schools, platform with no users yet |
| API error | `ErrorState` | Failed fetch — shows error code + retry |
| 404 | `not-found.tsx` | Invalid org/school/user ID in URL |
| Stale resource | `StaleResourceDialog` | 409 on any write — reload + retry |
| Confirm destructive | `ConfirmDialog` or `DangerZone` | Status change, close org/school |
| Typed confirmation | `DangerZone` | Close org, close school, toggle platform admin |

---

## Security

1. **Every mutation is audited.** The API writes audit log entries on all successful mutations server-side. The platform portal does not need to implement additional logging.
2. **Read is unrestricted, write requires intent.** Browsing any entity is always allowed. Mutations require an explicit button click — never on navigation or hover.
3. **Destructive actions require typed confirmation.** Closing an org or school requires typing the entity's slug. Granting/removing platform admin requires a confirmation dialog.
4. **No bulk destructive operations.** Organizations and schools are managed one at a time. There is no "select all → delete" action.
5. **Grant Platform Admin is a danger zone action.** It is separated from normal account actions with clear visual framing. It is not a casual toggle.
6. **Impersonation (future) is logged, time-limited, and visible.** The impersonated session shows a banner: "Platform support is currently viewing your session." The session auto-expires. The impersonating admin cannot clear the audit entry.
7. **Platform admin sessions should have a shorter access token TTL** than regular sessions. Configurable when the security policy API is available.

---

## Implementation Phases

### Phase 1 — Build Now

| # | Feature | Priority | Key APIs |
|---|---------|----------|---------|
| 1 | Platform layout: shell, sidebar, header, guard | P0 | `GET /auth/me` |
| 2 | Dashboard: 3 metric cards, needs attention, recent activity | P0 | `/organizations`, `/schools`, `/users`, `/audit-logs` |
| 3 | Organization list + create button | P0 | `GET /organizations` |
| 4 | Organization detail: overview + schools tab | P0 | `GET /schools?organization_id=` |
| 5 | Create Organization wizard (4 steps) | P0 | `POST /organizations`, `/schools`, `/persons`, `/users`, `/memberships` |
| 6 | Organization detail: users + memberships tabs | P1 | `GET /memberships?organization_id=` |
| 7 | Organization detail: audit + settings tabs | P1 | `GET /audit-logs`, `PATCH /organizations` |
| 8 | School list (cross-org) | P1 | `GET /schools` |
| 9 | School detail: overview + users & roles tabs | P1 | `GET /memberships?school_id=`, `GET /roles` |
| 10 | School detail: academics + people tabs (read-only) | P1 | `GET /academic-years`, `/cohorts`, `/persons` (with `X-School-ID`) |
| 11 | School detail: data quality + audit + settings tabs | P1 | `GET /audit-logs?school_id=`, `PATCH /schools` |
| 12 | User list | P1 | `GET /users` |
| 13 | User detail: profile + memberships + audit trail | P1 | `GET /audit-logs?actor_user_id=`, `PATCH /users` |
| 14 | Role list + role detail (read-only) | P2 | `GET /roles`, `GET /roles/{id}` |
| 15 | Platform-wide audit log with filters | P2 | `GET /audit-logs` |
| 16 | Global search (⌘K) — platform entities | P2 | Client-side + existing API search |
| 17 | System page — API health only | P2 | `GET /health`, `GET /ready` |
| 18 | Platform settings — profile + default roles view | P2 | Static / future settings API |

### Phase 2 — When Audit Filter Lands

- Add `organization_id` filter to audit log endpoint
- Add `search` param to `GET /users`
- Add `GET /platform/stats` aggregate endpoint
- Dashboard: complete with people count metric
- Org audit tab: use org filter instead of client-side filtering

### Phase 3 — Operational Maturity

- System page: background jobs, feature flags, delivery health
- User sessions management
- Impersonation (with full audit trail)

### Phase 4 — Business Operations

- Billing: subscriptions, plans, invoices, usage
- Platform-wide person search (relax `X-School-ID` for platform admins)
- Growth trend charts on dashboard

---

## Final Principles

> **Platform admins manage the platform, not the schools.**

The super admin portal is a control plane. School admins own their school data. The platform admin owns the infrastructure, tenant lifecycle, and operational health around it.

> **Read everything, write carefully.**

Broad read access is the default — for diagnosis, support, and awareness. Writes are deliberate, explicit, and always audited.

> **Every screen answers four questions:**

1. What scope am I looking at? (platform / org / school / user)
2. What is the current state?
3. What can I do here?
4. What needs my attention?
