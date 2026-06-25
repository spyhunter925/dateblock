# Dateblock — Product Specification

> A Progressive Web App (PWA) for groups of users to block dates on a shared calendar so that the group can identify common free dates.

---

## 1. Overview

Dateblock lets users create and manage personal blocked dates inside **forums** (groups). Each user has a personal calendar, and members of a forum can:

- See their own blocked dates.
- See a **forum aggregate calendar** that combines all members' blocked dates and only highlights dates that are free for *everyone*.
- View other individual members' personal calendars (only within the same forum; members cannot see users from other forums).

Forums are managed through an **admin portal**. New users choose a forum during signup and can also be invited via email.

---

## 2. Goals

- Make blocking/unblocking dates frictionless (tap or drag-select → confirm → done).
- Provide clear distinction between personal, per-member, and aggregated forum views.
- Support multiple forums with isolated membership and data.
- Work reliably as a PWA on mobile and desktop.
- Be simple to self-host with Docker.

---

## 3. User Roles

| Role | Description |
|------|-------------|
| **Admin** | Creates/deletes forums, manages users, sends invites. Single global admin for MVP; schema allows multi-layer admin/permissions later. |
| **Forum Member** | Signs up into a forum. Blocks/unblocks personal dates. Can view personal, forum-aggregate, and other members' calendars within the same forum. |

---

## 4. Core Features

### 4.1 Authentication & Onboarding

1. Users sign up with:
   - Display name
   - Email
   - Password
   - Forum selection (dropdown populated by admin-created forums)
2. Users log in with email/password.
3. Password reset flow.
4. No email verification required for MVP.

### 4.2 Admin Portal

- Admin login.
- Create a forum with a name and optional description.
- List forums and members per forum.
- Delete or archive forums.
- View/add/remove members from forums.
- **Send email invites** to a forum during creation or afterward.
- Single global admin for MVP; role/permission architecture left open for expansion.

### 4.3 Personal Calendar

- Month grid view.
- Tap individual dates to select; **drag to select a consecutive range**.
- Tap a **Block** button → confirmation dialog → dates are marked blocked.
- Tap an **Unblock** button → confirmation dialog → selected blocked dates are cleared.
- **Undo snackbar** after block/unblock to reverse the action quickly.
- Past dates are visible but disabled/read-only.
- No limit to how far in advance dates can be blocked.
- Visual distinction between selected, blocked, and free dates.

### 4.4 Forum Aggregate Calendar

- Month grid view for the entire forum.
- Shows dates that are **common free dates** (not blocked by any member) as the primary highlight.
- Also renders **blocked dates** in a muted/different colour so the full month context is visible.
- Tapping a blocked date opens a panel/list showing which forum members have blocked that date.
- Includes today's date highlight.

### 4.5 Other Members' Calendars

- Member list within the forum.
- Selecting a member shows their personal blocked/free calendar (read-only).
- Only members of the same forum appear in the member list.
- Exact blocked dates are visible (no privacy toggle in MVP).

### 4.6 Blocking / Unblocking Flow

```
1. User opens calendar (personal view by default).
2. User taps dates or drags to select a range.
3. User taps Block or Unblock.
4. Confirmation dialog appears: "Block the selected 5 dates?" / "Unblock the selected 3 dates?"
5. On confirm, changes are persisted; snackbar with Undo appears.
6. Calendar updates instantly; forum aggregate recalculates; notifications sent to forum members.
```

### 4.7 Notifications

- When a member adds or removes blocked dates, other forum members receive a notification (in-app badge/list; email notification optional/future).

### 4.8 Email Invites

- Admin can send an invite email containing a signup link with a token.
- Token is tied to a forum and optionally an email address.
- On signup with a valid token, the user is automatically joined to the forum.
- Invites expire after a configurable period (default 7 days).

---

## 5. Data Model

### Forum
- `id`
- `name`
- `description`
- `createdAt`
- `archivedAt` (optional)

### User
- `id`
- `email` (unique)
- `passwordHash`
- `displayName`
- `role` (`global_admin` | `forum_member`) — single admin for MVP, schema open to multi-layer roles later
- `createdAt`

### ForumMembership
- `id`
- `userId`
- `forumId`
- `joinedAt`
- Unique index on (`userId`, `forumId`)

*Reasoning: Many-to-many join table keeps the door open for multi-forum users while MVP enforces one membership in app logic.*

### BlockedDate
- `id`
- `userId`
- `date` (YYYY-MM-DD)
- `createdAt`
- Unique index on (`userId`, `date`)

### ForumInvite
- `id`
- `forumId`
- `email`
- `token` (unique, URL-safe)
- `usedAt` (nullable)
- `expiresAt`
- `createdAt`

### Notification
- `id`
- `userId`
- `type` (e.g. `BLOCKS_CHANGED`)
- `title`
- `message`
- `readAt` (nullable)
- `createdAt`

---

## 6. UI/UX Notes

- PWA-aware: installable, responsive, online-only shell.
- Touch-first calendar component.
- Confirmation dialog prevents accidental bulk blocks/unblocks.
- Undo snackbar after block/unblock.
- Tap to select; drag/swipe to select a consecutive date range.
- Past dates are visible but disabled/read-only.
- Clear navigation between: My Calendar -> Forum Calendar -> Member Calendars.
- Loading/error states for network operations.
- Notification bell/badge for schedule changes.

---

## 7. Tech Stack

Chosen for minimal operational fuss, strong TypeScript support, and easy self-hosting:

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **Next.js 15 (App Router)** | Full-stack React; API routes, SSR/SSG, and PWA support in one codebase. |
| Language | **TypeScript** | Type safety across frontend and backend. |
| Styling | **Tailwind CSS** | Rapid, responsive UI. |
| ORM | **Prisma** | Type-safe database access and migrations. |
| Database | **PostgreSQL** | Relational data with room to scale; self-hosted via Docker. |
| Auth | **Auth.js (NextAuth v5) with credentials provider** | Email/password out of the box, with the option to add OAuth later. |
| State / API | **Server Actions + REST API routes** | Server Actions for mutations, API routes for reads. |
| Date logic | **date-fns** | Lightweight, tree-shakeable date utilities. |
| Calendar UI | **Custom React component** | Tailored to tap-to-select and drag-range selection. |
| Email | **Nodemailer** | Send invite emails and availability notifications via SMTP. |
| Hosting | **Self-hosted (Docker + docker-compose)** | On-premise deployment as requested. |
| PWA manifest | **Custom `manifest.json`** | Installable app shell. |

---

## 8. Design Decisions

| # | Topic | Final Decision |
|---|-------|----------------|
| 1 | Auth | Email/password only; no email verification for MVP. |
| 2 | Admin | Single global admin for now. Schema and role field kept open for multi-layer admin/permissions later. |
| 3 | Forum membership | One forum per user for MVP. Schema uses `ForumMembership` join table so multi-forum support can be added later. |
| 4 | Signup dropdown | All active forums visible in signup dropdown. |
| 5 | Privacy | Members within the same forum can see each other's exact blocked dates. In the forum aggregate view, blocked dates are shown in a muted colour and tapping them reveals which members blocked that date. Members cannot see any users or calendars outside their own forum. |
| 6 | Date granularity | Whole-day blocks only. |
| 7 | Recurring blocks | Not supported in MVP. |
| 8 | Email invites | Supported. Admin can send invites during forum creation or afterward. |
| 9 | Notifications | Supported: notify forum members when a member's blocked dates change. |
| 10 | Offline support | Online-only for MVP. PWA installable shell only. |
| 11 | Selection | Tap individual dates; drag to select a date range. |
| 12 | Undo | Confirmation dialog plus undo snackbar after block/unblock. |
| 13 | Past/future dates | Past dates disabled/read-only. No future date limit. |
| 14 | Blocked-date notes | Not supported. |

---

## 9. Milestones

1. Project scaffolding, Docker setup, Prisma schema, and database seeding.
2. Auth (login/signup) with forum dropdown.
3. Admin portal: forum CRUD and member management.
4. Email invite system.
5. Personal calendar with block/unblock, range selection, confirm, and undo.
6. Forum aggregate calendar.
7. Per-member calendar visibility.
8. Notification system.
9. PWA manifest, icons, and service worker shell.
10. Self-hosting documentation and deployment scripts.
