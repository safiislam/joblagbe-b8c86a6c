# Performance Improvement Plan

The current homepage measures **FCP ~7.9s** with **741KB / 66 scripts** loading on first paint. Below are the highest-impact, lowest-risk fixes — UI/behavior is not changed, only loading strategy.

> Note: the dev preview is always slower than production. These changes target real production bottlenecks visible in the bundle and code structure.

## What we will do

### 1. Split heavy vendors into their own chunks
`lucide-react` (156KB) and `date-fns` are currently bundled into shared chunks loaded on first paint. Add them to `manualChunks` in `vite.config.ts` so they are cached separately and don't block the main bundle:
- `vendor-icons` → `lucide-react`
- `vendor-dates` → `date-fns`
- `vendor-radix-extra` → less-used radix primitives (accordion, sheet, drawer, etc.)

### 2. Lazy-load components that aren't needed for first paint
- `JobBoard` is `lazy()` already, but it eagerly imports `ApplyJobDialog`, `ShareJobButton`, `SaveJobButton`, `JobFraudWarning`, `VerifiedBadge`. Convert these to `React.lazy` inside JobBoard so they only download when a card is opened/clicked.
- `Header` likely imports `NotificationBell` and dropdown menus eagerly — defer the bell + auth menu behind a `lazy` boundary.
- Defer `AIChatWidget`, `AffiliatePopup`, `TutorialVideoButton`, `PopupBannerModal` until the browser is idle (`requestIdleCallback`) instead of mounting immediately. They already use `lazy()` but currently start downloading right after first render.

### 3. Don't block sections on CMS content
`useAllSiteContent()` returns a `cmsContentLoading` flag passed to `AnnouncementBanner`, `HeroSection`, `QuickLinks`, `CategoryGrid`, `ServicesSection`, `EmployerCTA`, `Footer`. If those components show skeletons while loading, FCP/LCP suffers. Render them with their default/fallback content immediately, then hydrate when CMS data arrives. This removes the homepage's dependency on a network round-trip before showing real content.

### 4. Smaller AuthContext startup
`AuthProvider` runs `getSession` + `fetchProfile` + `checkAdmin` (3 sequential queries) before `loading=false`. Components reading `useAuth().loading` block until then. Two improvements:
- Run `fetchProfile` and `checkAdmin` in parallel (`Promise.all`).
- Set `loading=false` as soon as the session is known; let profile/admin stream in afterwards via separate state. Components that only need "is this user logged in" no longer wait for profile fetch.

### 5. Preconnect + DNS prefetch for storage CDN
The Supabase render-image domain is the same as the API but image responses are large. Already preconnected. Verify and add `dns-prefetch` for any other third-party origins (gpteng, fonts already covered).

### 6. Service Worker pre-cache for return visits
PWA already caches built assets. No change needed, but confirm `runtimeCaching` for `*.supabase.co` storage images uses `CacheFirst` for images (currently `NetworkFirst` for everything Supabase, which slows image loads). Add a separate rule:
- `^https:\/\/.*\.supabase\.co\/storage\/v1\/render\/image\/.*` → `CacheFirst` (30 days).

## Technical details

Files to edit:
- `vite.config.ts` — extend `manualChunks`, add storage-image runtime cache rule.
- `src/App.tsx` — wrap `GlobalOverlays` mount in `requestIdleCallback`.
- `src/contexts/AuthContext.tsx` — parallelize profile/admin fetch, unblock `loading` earlier.
- `src/pages/Index.tsx` — remove `cmsContentLoading` gating; let sections render immediately.
- `src/components/JobBoard.tsx` — `lazy()` the apply/share/save/fraud-warning child components.
- `src/components/Header.tsx` — `lazy()` the notification bell and auth dropdown.

## Out of scope
- No visual/UI changes.
- No backend/RLS changes.
- No removal of features.

## Expected impact
- Initial JS shipped on `/` should drop ~30–40%.
- FCP/LCP improves by hundreds of ms on production (dev preview will still feel slow — that's normal).
- Repeat visits feel near-instant due to better chunk caching.
