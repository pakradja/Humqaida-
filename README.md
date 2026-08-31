# Humza’s Qaida Quest

A polished, device-local Noorani Qaida PWA for Humza. It includes 23 progressive lessons, five short practice games, smart mistake review, XP and coins, a reward shop, device speech practice, a protected parent dashboard, offline caching, and iPad Home Screen support.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local address shown in the terminal. Production verification:

```bash
npm run build
npm test
```

## Deploy with GitHub and Vercel

1. Push the project to the `humqaida` GitHub repository.
2. In Vercel, choose **Add New → Project** and import `humqaida`.
3. Leave the detected framework and build settings at their defaults.
4. Choose **Deploy**. No environment variables or database are needed.
5. Every later push to the repository will create a fresh deployment automatically.

## Install on Humza’s iPad

1. Open the Vercel address in Safari.
2. Tap the Share button.
3. Choose **Add to Home Screen**, then **Add**.

Progress stays only in that Safari/Home Screen app’s local storage. Clearing Safari website data or using a different device does not transfer progress.

## Parent area

The initial parent PIN is `2468`. Change it in the Parent area after first use. The parent dashboard can unlock lessons and reset progress.

## Audio note

The app uses the device’s Arabic speech voice as a clearly labeled practice aid. It is not a substitute for a teacher or human Qari recording when learning makhārij. The `speak` function in `app/page.tsx` is the single replacement point for future recordings.
