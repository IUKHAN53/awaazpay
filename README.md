# AwaazPay — آوازپے

Turns a shopkeeper's Android phone into a payment **soundbox**: announces every
Easypaisa / JazzCash / bank payment out loud in **Urdu or English** the moment it
arrives — no hardware, no merchant account.

> India-style "UPI soundbox app" (AawazPay, AlertPay) rebuilt for Pakistani wallets.
> Niche verified open in PK as of Jul 2026 — only competitor is Easypaisa's own
> hardware QR SoundBox (Easypaisa-only, paid device).

## How it detects payments

| Priority | Detector | Build | Why |
|---|---|---|---|
| 1 | **Notification Listener** (`NotificationListenerService`) reads wallet/bank app notifications | `store` (Play-safe) | No SMS permission → Play Store distributable |
| 2 | SMS receiver for bank credit alerts | `full` (sideload APK) | Google Play restricts `RECEIVE_SMS`; gated by `AWAAZPAY_FLAVOR=full` env at prebuild |
| 3 | Official JazzCash/Easypaisa IPN webhooks → FCM push | later (api/) | For onboarded merchants; same announce path |

## Repo layout

```
app/      Expo (SDK 57) React Native app — package id pk.awaazpay.app
  src/theme/tokens.ts          design tokens (navy #1a2e6e, gold #f0b429, cream #f7f5ef)
  src/data/                    store (AsyncStorage), types, Urdu number-to-words
  src/screens/                 9 screens implemented from design/AwaazPay.dc.html
  src/native/useNativeListener.ts   JS ↔ native glue (events, config, permissions)
  modules/payment-listener/    local Expo module (Kotlin)
    PaymentNotificationListener.kt  detects payments from notifications
    PaymentParser.kt                server-updatable regex templates per source
    Announcer.kt                    TTS ur-PK w/ English fallback (concat clips later)
    PaymentStore.kt                 config + dedupe + offline pending queue
  plugins/withPaymentListener.js    config plugin: manifest service + permissions
design/   AwaazPay.dc.html (Claude Design source) + screens/ extracted per-screen
audio/    (future) pre-recorded Urdu clips for concatenative announcements
api/      (future) Laravel backend: parser templates, staff FCM, IPN webhooks
```

## Run it

```powershell
cd app
npm install
npx expo start            # UI-only in Expo Go (native detection unavailable)

# Full dev build with the native listener:
npx expo prebuild --platform android
npx expo run:android      # or: cd android; .\gradlew.bat :app:assembleDebug

# Sideload flavor with SMS receiver:
$env:AWAAZPAY_FLAVOR = 'full'; npx expo prebuild --platform android --clean
```

### Build in WSL2 instead

```powershell
wsl -d Ubuntu -- bash /mnt/d/www/awaazpay/app/build-wsl.sh --clean
```

WSL needs: Java 17+ (`apt`), Android SDK at `~/Android/Sdk`, Node 22 extracted to
`~/node22` (official tarball from nodejs.org/dist). **Always pass `--clean` when the
previous build ran on Windows** (and clean the same dirs when switching back) —
Gradle/autolinking generated files embed absolute paths from the other OS.
`android/local.properties` is intentionally absent; both sides use `ANDROID_HOME`.

Dev tip: the gold **₨+** floating button (dev builds only) simulates an incoming
payment end-to-end (store → announce via expo-speech → overlay → history).

## Anti-scam: trusted senders

The SMS path is the one place a fake "you received Rs 5000" message could be
injected from an arbitrary number. Defenses (`SenderPolicy.kt`):

- An SMS is treated as a payment **only** when its sender is on the trusted
  allowlist for a source **and** passes `SenderPolicy` — i.e. it is an
  alphanumeric sender ID (`Easypaisa`, `JazzCash`) or a short code (3–6 digits).
- **Personal mobile numbers are rejected unconditionally** (`03xxxxxxxxx`,
  `+92…`, or any address with an 8+ digit run) — official financial alerts
  never come from an MSISDN, so a scammer texting from their own phone is
  dropped before parsing and can never announce.
- Official senders are built-in and read-only; the shopkeeper can add their
  bank's sender ID in **Settings → Trusted senders**, but the same validation
  blocks adding a personal number (enforced in both the RN UI and again in
  `PaymentStore.saveConfig`, so it can't be widened to "any number").
- The **notification path** (store flavor) is inherently safe: it trusts the
  wallet app's **package name**, which Android won't let another app forge.

## UI kit

- **Icons:** `@expo/vector-icons` (MaterialCommunityIcons / Ionicons), wrapped in
  `src/components/Icon.tsx` behind semantic names (`home`, `shield`, `voice`, …) so the
  whole app restyles from one map. All emoji were removed for cross-device consistency.
- **Toasts:** `react-native-toast-message`, branded in `src/components/Toast.tsx`
  (`toast.success/error/info`). SweetAlert2 was requested but is a **web/DOM library and
  cannot run in React Native** — this is the RN-idiomatic equivalent. Used for trusted-sender
  add/reject/remove, staff add/remove, and the test-announcement action.
- **Logo:** `src/components/Logo.tsx` renders "Rs" + gold sound bars (the ₨ glyph is drawn as
  a "Rs" ligature by Poppins and varies by device, so it's explicit now).

## Key implementation notes

- **Announcement works with the app dead** — detection, parsing, dedupe and TTS all
  live in the Kotlin service, not JS. Payments captured while JS is dead queue in
  SharedPreferences and drain into history on next launch.
- **Parser templates are data, not code** (`PaymentParser.DEFAULT_TEMPLATES`) — the
  same JSON shape will be served by the backend so wording changes in wallet apps
  never need an app release. ⚠️ Current regexes are best-guess: **capture real
  notification/SMS text from live wallets and update before shipping.**
- **Urdu numbers**: `src/data/urduNumbers.ts` (JS) and `UrduNumbers.kt` (native) must
  stay in sync. Idiomatic "بارہ سو" (12-hundred) style for clean hundreds < 10k.
- **Urdu TTS availability varies by device** — `Announcer` falls back to English when
  `ur-PK` is unsupported. The plan's endgame for budget phones is concatenative
  pre-recorded clips behind the same interface (`audio/`).
- **OEM battery killers** (Xiaomi/Infinix/Tecno/Oppo/Vivo) are the top reliability
  risk: onboarding requests the battery exemption, and the error screen deep-links
  fixes. Real-device soak test required.

## Verification checklist (hardware)

1. Install dev build on a real Android phone with the Easypaisa/JazzCash app + SIM.
2. Grant Notification Access in onboarding; battery exemption.
3. Send a small real transfer → phone announces in Urdu, payment appears on Home,
   today's total increments.
4. Lock screen, background 30+ min on a Xiaomi-class phone, pay again → must still
   announce.
5. Toggle language to English → announcement switches.
