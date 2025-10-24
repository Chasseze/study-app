# Firebase setup & deployment

This document describes how to configure Firebase Realtime Database and deploy this app to Firebase Hosting.

## 1) Create or use an existing Firebase project
- Visit https://console.firebase.google.com
- Create a new project or choose an existing one.

## 2) Enable Realtime Database
- In the console, open "Realtime Database" → Create database.
- Choose a location and (for testing) start in test mode — for production update rules later.

Example development rules (not for production):
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}

For open test usage you can temporarily use:
{
  "rules": {
    ".read": true,
    ".write": true
  }
}

## 3) Enable Authentication providers
- In Auth → Sign-in method, enable:
  - Email/Password
  - Google (if you want Google OAuth)
- Add your local dev domain (http://localhost:3000) to "Authorized domains" for OAuth providers.

## 4) Provide environment variables
- You can provide either a full Firebase config JSON or just the Realtime Database URL.
- Local development: create `.env.local` in the project root with one of the following:

Option A (preferred - full config):
REACT_APP_FIREBASE_CONFIG='{"apiKey":"...","authDomain":"...","databaseURL":"https://<project>.firebaseio.com","projectId":"..."}'

Option B (simple DB URL):
REACT_APP_FIREBASE_DB_URL=https://<project>.firebaseio.com

**Note:** keep secrets out of source control. Use environment variables in your CI or hosting provider.

## 5) Test locally
- Install deps and start dev server:

```bash
npm install
npm start
```

- Use the header Sign in / Email flow to authenticate and verify data appears under `/users/{uid}/topics` in the Realtime Database.

## 6) Deploy to Firebase Hosting
- Install Firebase CLI:

```bash
npm install -g firebase-tools
```

- Login and initialize (one-time):

```bash
firebase login
firebase init hosting
# When asked, select the Firebase project you created and set `build` as the public directory.
# Configure as a single-page app (rewrite all urls to /index.html)
```

- Build and deploy:

```bash
npm run build
firebase deploy --only hosting
```

- Configure environment variables for your hosting provider (if using Vercel/Netlify) or set them in your CI pipeline.

## 7) CI / automated deploy (optional)
- You can add a GitHub Actions workflow to build and deploy to Firebase on push to `main`. Example:

```yaml
name: Deploy
on:
  push:
    branches: [ main ]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
```

## 8) Production security
- Turn off open DB rules and require `auth.uid == $uid` for per-user access.
- Consider using Firestore for richer, indexed queries if your data grows.

If you want, I can:
- Add this `docs/FIREBASE.md` to the repo (done), and update the README with a short link to it.
- Create a GitHub Actions workflow for automatic deploys (I can scaffold it and add it to `.github/workflows/deploy.yml`).
