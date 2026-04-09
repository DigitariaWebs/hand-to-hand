# Hand to Hand — TestFlight Submission Guide

## Prerequisites

| Tool | Status |
|------|--------|
| EAS CLI | ✅ Installed (`eas-cli@18.0.3`) |
| EAS Account | ✅ Logged in as `achrefdev` |
| Apple Developer | ✅ Connected to EAS |
| Bundle ID | ✅ `com.handtohand.app` |

---

## Step 1 — Upgrade EAS CLI (recommended)

```bash
npm install -g eas-cli
```

---

## Step 2 — Initialize EAS Project

This links your local project to your EAS account and writes the `expo.extra.eas.projectId` into `app.json`.

```bash
eas init
```

- Choose account: **achrefdev**
- It will auto-create the project on expo.dev

---

## Step 3 — Create App in App Store Connect

> You must do this manually in the browser **once**.

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: Hand to Hand
   - **Primary Language**: French (or English)
   - **Bundle ID**: `com.handtohand.app`
   - **SKU**: `handtohand`
4. Click **Create**
5. Copy the **App ID** from the URL: `https://appstoreconnect.apple.com/apps/XXXXXXXXXX/...`

---

## Step 4 — Build for iOS (Production)

EAS builds your app in the cloud. No Xcode required.

```bash
eas build --platform ios --profile production
```

What happens automatically:
- ✅ Asks you to sign in to Apple (first time only)
- ✅ Creates/fetches Distribution Certificate
- ✅ Creates/fetches App Store Provisioning Profile for `com.handtohand.app`
- ✅ Builds the `.ipa` file on EAS servers (~15–25 min)
- ✅ Gives you a download link + build ID when done

---

## Step 5 — Submit to TestFlight

Once the build is done, run:

```bash
eas submit --platform ios --latest
```

EAS will prompt you for:
- **Apple ID**: your Apple Developer email
- **App Store Connect App ID**: the numeric ID from Step 3 (e.g. `1234567890`)

Alternatively, you can fill these into `eas.json` once and never be asked again:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      }
    }
  }
}
```

Find your **Team ID** at:  
[developer.apple.com/account](https://developer.apple.com/account) → Membership Details → Team ID

---

## Step 6 — Add Testers in TestFlight

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Select **Hand to Hand** → **TestFlight**
3. Wait for build processing (~10 min after upload)
4. Click the build → **Add Testers**
   - **Internal**: up to 100 Apple Developer team members (instant)
   - **External**: anyone with an email (requires Apple review ~1–2 days)

---

## One-Command Flow (after Step 1–3 are done)

```bash
# Build + submit in sequence
eas build --platform ios --profile production --auto-submit
```

The `--auto-submit` flag builds AND submits to TestFlight in a single command.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `EAS project not configured` | Run `eas init` first |
| `Bundle ID not found` | Create app in App Store Connect first (Step 3) |
| `Certificate already exists` | EAS handles this automatically |
| Build fails on native module | Check `eas.json` and `app.json` are valid |

---

## Current `eas.json`

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  }
}
```

---

## Summary of Commands

```bash
# 1. Upgrade CLI
npm install -g eas-cli

# 2. Link project to EAS
eas init

# 3. Build for App Store
eas build --platform ios --profile production

# 4. Submit to TestFlight
eas submit --platform ios --latest

# OR do both in one step
eas build --platform ios --profile production --auto-submit
```
