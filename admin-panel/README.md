# admin-panel

React + Vite admin dashboard for the Jawab platform. Runs on **port 5173**.

## Prerequisites

- Node.js 18+
- `backend-admin` running on port 3001 (handles both API and file uploads)

## Setup

```bash
npm install
npm run dev
```

Open **http://localhost:5173**

## Environment Switch (Local vs Production)

Edit `src/config/app.js`:

```javascript
export const hostType = "local"; // "local" | "live"
```

| Value | Backend API | Media | Frontend |
|---|---|---|---|
| `"local"` | http://localhost:3001/api | http://localhost:3001/api | http://localhost:5173 |
| `"live"` | https://jawab.jantrah.io/backend/api | https://jawab.jantrah.io/jawab-media/api **(different host/path than the API — not a typo)** | https://jawab.jantrah.io |

All URLs in the app derive from this single flag — do not hardcode URLs elsewhere. Consumed by `src/api/axiosClient.js` (API base), `src/utils/mediaUtils.js` (media base), and `src/App.jsx` (router `basename`, logout redirect).

## Login

The admin panel requires a user with `role = 'admin'` or `role = 'sub_admin'` in `db_jawab`. Run `npm run seed` in `backend-admin/` to create one see `backend-admin/README.md` for the seeded credentials.

Auth tokens are stored in `localStorage` (or `sessionStorage` for session-only login). A 401 response on any protected endpoint automatically clears tokens and redirects to `/login`.

**No role-based UI gating exists** — every authenticated session (admin or sub_admin) sees the identical sidebar and every route; route guards only check "is a token present," not role or expiry.

## Tech Stack

React 19 + Vite 7, Tailwind CSS 4 (CSS-first `@theme` config in `src/index.css`, no `tailwind.config.js`), `react-router-dom` 7, TanStack Query 5 (server state — one hook file per domain in `src/hooks/`, `staleTime: 0`), `axios` (single instance, see below), shadcn/ui-style primitives (`class-variance-authority`), `lucide-react` icons, `react-quill-new` (Privacy Policy editor only). No i18n library — UI strings are hardcoded English.

## Pages / Routes (`src/App.jsx`)

All routes below sit inside the protected `DashboardLayout` (Sidebar + Header + Outlet) except `/login`, `/forgot`, `/reset-password`.

| Route | Page | Notes |
|---|---|---|
| `/dashboard` | `DashboardOverview` | Stat cards, time-range selector, hand-rolled SVG growth chart, trending topics, top posts/users, recent activity |
| `/users`, `/users/deleted` | `UsersTable`, `DeletedUsersPage` | CRUD, grid/list, CSV/Excel export, restore/hard-delete (content-gated) |
| `/posts` | `PostsList` | CRUD, media upload, status/featured actions |
| `/comments` | `CommentsView` | Approve/unapprove, delete |
| `/topics` | `TopicsPage` | Parent topics (image upload allowed) |
| `/sub-topics` | `SubTopicsPage` | Child topics (no image) |
| `/communities` | `CommunitiesPage` | CRUD, topic multi-select, members tab |
| `/polls` | `PollsPage` | Dynamic option editor, vote breakdown |
| `/subscriptions` | `SubscriptionsPage` | Plan CRUD only — user-subscriptions are read-only, nested in plan detail |
| `/payments` | `PaymentsPage` | List + manual record; no status-update UI |
| `/banners` | `BannersPage` | CRUD, targeting/exclusion, scheduling |
| `/currencies` | `CurrenciesPage` | CRUD + set-default |
| `/settings` | `AppSettingsPage` | Fixed-tab UI over the generic `app_settings` API |
| `/privacy-policy` | `PrivacyPolicyPage` | Quill editor over a singleton record |
| `/support` | `SupportPage` | Contact-info form over a singleton record |
| `/profile` | `ProfileSettings` | Own profile + change password |
| `/notifications` | `NotificationsPage` | Subscription/payment notifications only |

Every list page follows the same template: header (search/filter/sort/export/add) → list/grid toggle → paginated footer, backed by a `{page, limit, search, sort_by, sort_order}` + domain-filter query shape and a matching unpaginated `export<X>` call. 

## API Layer (`src/api/`)

One file per domain (`userApi.js`, `postsApi.js`, `topicsApi.js`, …), each wrapping the shared `axiosClient.js` instance — components never call `axios` directly. `axiosClient.js` attaches `Authorization: Bearer <token>` from storage on every request (skipped for the auth endpoints themselves), strips `Content-Type` for `FormData` bodies so the browser sets the multipart boundary, and on any `401` runs a debounced logout (best-effort `POST /admin/logout` via a separate interceptor-free axios instance, clears both storages except `darkMode`, redirects to `/login`).

## Project Structure

```
src/
├── api/                  # One file per domain (axiosClient.js, userApi.js, postsApi.js, ...)
├── components/
│   ├── auth/             # Login, ForgotPassword, ResetPassword
│   ├── dashboard/        # All page-level components (users, posts, polls, etc.)
│   ├── common/           # Shared UI components
│   └── ui/               # Primitive UI components (buttons, inputs, etc.)
├── config/
│   └── app.js            # Single source of truth for all URLs (hostType switch here)
├── contexts/
│   └── DarkModeContext.jsx
└── hooks/                # Custom React hooks
```

## Commands

```bash
npm run dev           # Vite dev server (port 5173, hot reload)
npm run build         # Production build to dist/
npm run lint          # ESLint
```

## Adding a New Page

1. Create component in `src/components/dashboard/<section>/`
2. Add API calls in `src/api/<section>Api.js` using `axiosClient`
3. Register route in `src/App.jsx` inside the `<DashboardLayout>` routes
4. Add sidebar link in `src/components/dashboard/layout/Sidebar.jsx`
