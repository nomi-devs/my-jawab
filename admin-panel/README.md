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
| `"live"` | https://jawab.jantrah.io/backend/api | https://jawab.jantrah.io/backend/api | https://jawab.jantrah.io |

All URLs in the app derive from this single flag — do not hardcode URLs elsewhere.

## Login

The admin panel requires a user with `role = 'admin'` or `role = 'sub_admin'` in `db_jawab`. Run `npm run seed` in `backend-admin/` to create one — see `backend-admin/README.md` for the seeded credentials.

Auth tokens are stored in `localStorage` (or `sessionStorage` for session-only login). A 401 response on any protected endpoint automatically clears tokens and redirects to `/login`.

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
