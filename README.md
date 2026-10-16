# CivicConnect — civic issue reporting for Sri Lanka

Android app (Expo / React Native) where citizens report potholes, garbage, broken streetlights, blocked drains and more. They track each report until it's fixed. Officers and admins manage the reports from inside the same app.

Everything runs on **free tiers**, with no credit card:

| Need | Service | Why |
|---|---|---|
| Login, database | **Firebase Spark** (Auth + Firestore) | Free tier; no Cloud Functions or Storage needed |
| Photos / videos | **Cloudinary free** (unsigned upload preset) | Firebase Storage needs the paid Blaze plan |
| Map tiles | **OpenStreetMap** via Leaflet in a WebView | No API key, works in Expo Go |
| Address search | **Nominatim** (OpenStreetMap) | Free; we respect its usage policy (see below) |

The design reference is `../HCI_test_frontend` (Vite web prototype). This app follows its screens, colours and text.

---

## 1. Setup (about 15 minutes)

### 1.1 Firebase (project `civic-connect-29dab`)
1. [Firebase console](https://console.firebase.google.com) → your project → ⚙ **Project settings** → **Your apps** → **Add app → Web** (`</>`). Any nickname works, and you don't need hosting.
   Copy the `firebaseConfig` values. *(The `google-services.json` file is for native Android builds; Expo Go uses the Web config.)*
2. **Build → Authentication → Sign-in method**: enable **Email/Password** and **Anonymous**.
3. **Build → Firestore Database → Create database**. Choose production mode and the region `asia-south1` (Mumbai, closest to Sri Lanka).

### 1.2 Cloudinary (photos)
1. Sign up at [cloudinary.com](https://cloudinary.com) (free).
2. **Settings → Upload → Upload presets → Add upload preset**. Set **Signing mode: Unsigned** and, optionally, Folder: `civicconnect`. Save it.
3. Note your **Cloud name** (shown on the Dashboard) and the **preset name**.

### 1.3 `.env`
Copy `.env.example` to `.env` and fill it in:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=civic-connect-29dab.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=civic-connect-29dab
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=civic-connect-29dab.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=944076240729
EXPO_PUBLIC_FIREBASE_APP_ID=1:944076240729:web:xxxxxxxx   # from the WEB app
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
EXPO_PUBLIC_SUPPORT_EMAIL=           # optional (Help → Contact support)
EXPO_PUBLIC_NOMINATIM_EMAIL=         # optional (sent to Nominatim as contact)
```

`EXPO_PUBLIC_*` values end up inside the app. That's normal for Firebase web config, and the data is protected by `firestore.rules`, not by hiding keys. **Never commit `.env` or `serviceAccount.json`** (both are git-ignored).

### 1.4 Deploy security rules and indexes
```bash
npx firebase-tools login          # once
npm run deploy:rules              # deploys firestore.rules + firestore.indexes.json
```
No CLI? Paste `firestore.rules` into **Firestore → Rules → Publish**. No indexes need to be created.

### 1.5 Demo data and staff accounts
1. **Firebase console → Project settings → Service accounts → Generate new private key**. Save the file as `civicconnect-app/serviceAccount.json`.
2. Load the categories, departments and 10 sample reports around Colombo, Kandy and Galle (the photos upload to your Cloudinary):
   ```bash
   npm run seed                  # or: npm run seed -- --catalog-only
   ```
3. **Create an officer or admin.** Sign up in the app first (normal sign-up), then run:
   ```bash
   npm run set-role -- officer@example.com officer
   npm run set-role -- admin@example.com admin
   npm run set-role -- someone@example.com citizen    # demote
   ```
   Close and reopen the app. Officers and admins land in the **Authority** section.

   You can also set it by hand: Firestore → `users/{uid}` → set the `role` field to `officer` or `admin`. The app itself can never change a role; the rules block it.

## 2. Run

```bash
npm install
npx expo start            # scan the QR with Expo Go (Android)
npx expo start --clear    # after changing .env
```
You need the current **Expo Go** from the Play Store (SDK 57). Everything used here works in Expo Go; no custom dev build is needed.

Checks: `npm run typecheck` (app + scripts).

### Build an installable APK (EAS, free tier)
```bash
npm run build:apk     # preview profile → .apk you can install on any Android phone
npm run build:aab     # production profile → .aab for Google Play
npm run update -- "what changed"   # JS-only fix → installed APKs update on next restart
```
The project is linked to **@awantha/civicconnect** on expo.dev. Cloud builds read the `EXPO_PUBLIC_*` values from **EAS environment variables**, not from `.env` (which isn't uploaded). Check them with `npx eas-cli env:list --environment preview`, and update one with `npx eas-cli env:create --name X --value Y --environment preview --environment production --force`.
The script sets `EAS_PROJECT_ROOT` because the surrounding git repo is the whole user folder.

**Cloudinary:** the app uses only the cloud name and the unsigned preset `civicconnect_unsigned`. **Never put the Cloudinary API secret** in `.env`, EAS or the app.

## 3. What's in the app

**Citizens:** Splash → Language (සිංහල / தமிழ் / English) → 3 onboarding slides → Login / Sign up (+94 phone, password strength) / Forgot password (reset link by email) / **Continue anonymously**.

- **Home**: greeting, unread bell, search, "Report an Issue", emergency strip, quick categories, my active reports, nearby map preview.
- **Map**: OSM map with pins coloured by status, landmark search, category chips, "search this area", a bottom-sheet list. Tapping a pin opens a preview with **Support (+1)** (with Undo) and **Add info / photo**, and links to a full issue page.
- **Report (4 steps)**: Category (search, emergency banner, suggestions, grouped list) → Details (description 0/500, up to 5 photos or ≤30 s videos, severity, date and time) → Location (centre-fixed pin, GPS, Nominatim search, reverse-geocoded address, a fallback when permission is denied) → Review (Edit links, anonymous toggle, **duplicate check within 100 m**) → Success (#CC1024, copy, what happens next). The draft auto-saves to the phone.
- **My Reports**: filters, skeleton loading, empty state, and offline drafts waiting to send.
- **Report status**: photos, mini map, timeline with plain-language steps and officer remarks, department call/email, and **"Is this issue fixed?" → Yes / Not fixed** (reopens it).
- **Notifications**: realtime, grouped Today / Earlier, unread highlight, mark all read.
- **Profile**: stats, edit profile, language, **text size (Default / Large / Extra large)**, notification preferences, emergency contacts, Help & FAQ, logout.

**Officers and admins** (Authority tabs):
- **Queue**: KPIs, plus filters by status, category and area. Sorted by priority: citizen-reopened first, then severity, support count and age.
- **Report**: status, department and a remark for the citizen. One save **writes the status, a timeline entry and a notification to the reporter** in a single atomic batch.
- **Analytics**: counts by status and category, using Firestore count queries.
- **Manage** (admin): add, edit and delete categories and departments, plus "Load default catalogue".

**Everywhere:**
- loading, empty and error states
- an offline banner, plus a **queue that sends saved reports automatically** when the connection returns
- friendly error messages mapped from Firebase error codes
- accessibility labels on icon-only buttons
- 48 px touch targets
- Inter / Noto Sans Sinhala / Noto Sans Tamil fonts

## 4. Project structure

```
src/
  app/                    expo-router screens (file = route)
    (auth)/               language, onboarding, login, signup, forgot, forgot-sent
    (tabs)/               index (Home), map, my-reports, profile   — citizens
    (authority)/          queue, analytics, manage, account        — officer/admin
    report/               category → details → location → review → success
    report-status/[id]    issue/[id]   add-info/[id]   officer/[id]
    profile/              edit, settings, help
    admin/                category, department editors
    notifications, emergency, setup, index (splash + role routing)
  components/ui/          Txt (scaled text), Button, TextField, Chip, Toggle, Toast, Segmented, States…
  components/map/         OSMMap (Leaflet in WebView), PlaceSearch (Nominatim)
  components/reports/     ReportCard, StatusTimeline, ConfirmFixedCard, MediaPicker, PhotoCarousel…
  features/               zustand stores: auth, settings, report-draft, offline queue, notifications, catalog
  services/               firebase, auth, reports, users, notifications, catalog, cloudinary, geocoding, errors
  i18n/                   en.ts (complete), si.ts, ta.ts
  constants/              theme, statuses, categoryGroups, defaultCatalog, emergency, fonts
scripts/seed.ts           demo data + set-role (Admin SDK)
firestore.rules  firestore.indexes.json  firebase.json
```

## 5. Data model and indexes

```
users/{uid}            name, email, phone, role, language, textSize, notifyPush/Sms/Email, createdAt
categories/{id}        group, name_en/si/ta, subtitle_en/si/ta, suggested, departmentId, isEmergency, order
departments/{id}       name, phone, email, area
counters/reports       next                          → readable IDs CC1000, CC1001…
reports/{CC1024}       reporterId, reporterName|null, isAnonymous, categoryId, group, description,
                       severity, seenAt, media[{url,type}], location{lat,lng,address}, geohash, area,
                       status, departmentId, supportCount, supporters[uid], createdAt, updatedAt,
                       resolvedConfirmed (null|true|false)
  /timeline/{id}       status, remark, byRole, byName, createdAt
  /additions/{id}      userId, text, media, createdAt
notifications/{id}     userId, reportId, title, body, type, status, read, createdAt
```

**No composite indexes are needed.** Every query is either a single filter (sorted newest-first in the app) or uses Firestore's automatic single-field indexes:
- My Reports: `reporterId ==`
- Notifications: `userId ==`
- Nearby and the duplicate check: `geohash` ranges
- The "Supported" stat: `supporters array-contains`
- Analytics: `status` / `categoryId` counts
- The officer queue: `createdAt`

`firestore.indexes.json` is kept (empty) so `npm run deploy:rules` still works.

## 6. Design decisions

- **`reporterId` is always stored, even for anonymous reports.** The spec suggested `null`. The app needs the id so the reporter can track their report, get notifications and confirm the fix, and so the rules can tell who the owner is. Anonymity is kept by **not storing `reporterName`**. Officers can't read `users/*` (the rules only allow your own doc), so they never see who sent an anonymous report.
- **No Cloud Functions** (that needs the Blaze plan). The officer's app writes the status update, timeline entry and notification in **one atomic batch**, and the rules allow that only for officers and admins.
- **Notifications are in-app (realtime Firestore).** Remote push needs FCM plus a custom dev build, which doesn't work in Expo Go. The SMS and email toggles are saved as preferences for a future server.
- **Password reset uses Firebase's email link.** The design's OTP and New Password screens need paid SMS.
- **"Not fixed" sets `resolvedConfirmed: false`** instead of letting a citizen change `status` (the rules forbid that). The report then jumps to the top of the officer queue as **Reopened**.
- **Nominatim usage policy**:
  - requests are serialised, at most 1 per second
  - typing is debounced by 700 ms
  - an app User-Agent and Referer are sent
  - searches use `countrycodes=lk`
  - results are cached in memory
  - reverse lookups are rounded to about 10 m so map drags hit the cache

  For heavy production use, host your own geocoder.
- **OSM tiles**: the attribution "© OpenStreetMap contributors" is shown on every map, and the WebView sends an app User-Agent. For high traffic, use a tile provider with a free key (e.g. MapTiler) by changing the URL in `src/components/map/leafletHtml.ts`.
- **Counts avoid i18next plural suffixes** (e.g. "Supporters: 12"), because Hermes doesn't guarantee `Intl.PluralRules` on every Android device.
- **Department phone numbers and emails in `defaultCatalog.ts` are placeholders**, apart from the public hotlines (1987, 1939). Edit them in **Manage → Departments**.

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| "Firebase is not configured" screen | Fill in `.env`, then `npx expo start --clear` |
| `permission-denied` | Deploy `firestore.rules` (step 1.4) |
| Photo upload fails | Check the Cloudinary cloud name, and that the preset is **Unsigned** |
| Map is blank | The device needs internet (tiles and Leaflet load from the web) |
| `npm install` fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE` | Antivirus or the network is intercepting HTTPS: turn off HTTPS scanning, or `setx NODE_OPTIONS "--use-system-ca"` |
| Officer still sees citizen tabs | Close and reopen the app after `set-role` |
