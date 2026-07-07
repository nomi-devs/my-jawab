# Jawab API Postman Collection

`Jawab-API.postman_collection.json` covers the full backend: everything the (not-yet-built) mobile app would call under `ma/*`, plus the full `admin/*` flow used by `admin-panel`.

## Import & run

1. Postman → Import → select `Jawab-API.postman_collection.json`.
2. Make sure `backend-admin` is running (`npm run start:dev`) and seeded (`npm run seed`).
3. Collection variable `base_url` defaults to `http://localhost:3001/api` change it if your server runs elsewhere.

## Simulate the full new-user experience

**MOBILE APP → 0. NEW USER JOURNEY (ordered walkthrough)** is ordered by *screen*, not by API resource — it's a straight-line simulation of a brand-new user's first session, matching the actual onboarding mockups: Sign Up → Verify → Complete Profile → Choose Topics → Join Communities → Home Feed → Polls → Ask a Question → Profile → Logout, plus a separate Forgot Password mini-flow. Step 01 generates a fresh random username/email/phone via a pre-request script, so you can hit **Run** on this folder repeatedly without hitting "already taken" conflicts (username/email/phone are unique-constrained in the DB). Just run **0. NEW USER JOURNEY** top to bottom via Collection Runner — no manual edits needed.

## Simulate real feature usage (post, comments, likes, polls, subscription purchase)

**MOBILE APP → 0B. CONTENT, POLLS & SUBSCRIPTION JOURNEY** is the companion to folder 0: instead of onboarding, it drives the seeded `prouser@jawab.com` account through the actual features end to end — create a post, comment on it, reply to that comment, like the post and the comment, edit the post, then hit the poll-creation paywall as a free-tier user (expect 403), buy a subscription for real (admin creates a plan with `can_create_polls` enabled, the user subscribes, a completed payment activates it), and finally create/vote/like a poll now that it's unlocked. Run it top to bottom via Collection Runner, same as folder 0 every "create" step timestamps its own slug/plan name so the whole folder is re-runnable without unique-constraint conflicts. Section F is optional cleanup (cancel the subscription, delete the test post) if you want to reset state for a repeat run of the paywall demo in section C.

## Mobile app flow (by domain)

For testing a specific resource in isolation, run **MOBILE APP → 1. Auth** top to bottom:

1. **Register** creates an account (starts inactive/unverified).
2. Check the **backend-admin terminal** for a line like `Verification code for john@example.com: 123456` (SMTP is usually unconfigured locally, so the code is logged instead of emailed).
3. **Verify Email** paste that code in.
4. **Login** auto-saves `user_access_token` into the collection variables.

Every other mobile folder (Posts, Polls, Communities, etc.) uses `{{user_access_token}}` automatically and most "create"/"list" requests auto-capture IDs (`post_id`, `topic_id`, ...) via test scripts, so you can run a whole folder with Postman's Collection Runner without manual copy-pasting.

## Admin flow

Run **ADMIN → 1. Auth → Admin Login** first uses the seeded `admin@jawab.com` / `Admin@123` credentials and saves `admin_access_token`. Everything else follows the same auto-capture pattern.

## Notes

- Requests with a file field (e.g. Create Post, Create Community, Upload Media) have that field disabled by default so the request runs without one enable it and attach a real file in Postman if you want to test uploads.
- `Delete My Account` and `Hard Delete User` are destructive they're included for completeness but aren't meant to run as part of a normal pass through the collection.
- `media.controller.ts` has no JWT guard actually enforced in the current code despite Swagger showing bearer auth flagged inline in that request's description.
