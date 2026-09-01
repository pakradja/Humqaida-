# Humza’s Qaida Quest — cloud edition

A private Noorani Qaida PWA with a child learning experience, secure parent account, Supabase-backed progress, one-time iPad pairing, offline submission queue, rewards, and a private teacher recording/review workflow.

## What is intentionally not faked

The repository does not contain teacher-approved recordings. The verified metadata for a CC BY-SA 4.0 Wikimedia candidate is included, but the source binary could not be downloaded in the restricted build environment and no timestamps were guessed. The app never falls back to synthetic speech. Follow `public/audio/README.md` and `AUDIO-LICENSES.md` before Humza uses audio lessons.

The app also requires a real Supabase project. Without environment values it shows a connection screen and does not pretend progress is being saved.

## 1. Create the free Supabase project

1. Create a Supabase project.
2. In the SQL Editor, run `supabase/migrations/00000000000000_qaida_cloud.sql`.
3. In **Authentication → Providers**, enable email/password and anonymous sign-ins. Anonymous sign-in is used only for a parent-authorized child device.
4. In the project **Connect** panel, copy the project URL and publishable key. Never use a secret or service-role key in this application.
5. Confirm the Data API exposes the `public` schema. The migration revokes default access, grants only required operations, enables RLS on every table, and adds ownership policies.
6. Confirm Storage contains the private `qaida-audio` bucket created by the migration. Never make this bucket public.

Current Supabase guidance recommends publishable keys for browser apps and emphasizes that database grants and RLS policies are separate security layers. Recheck the official Supabase security documentation before production use.

## 2. Configure locally

Copy `.env.example` to `.env.local` and fill in:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Then run:

```bash
pnpm install
pnpm dev
```

## 3. First family setup

1. Open the app and choose **Create account**.
2. Confirm the parent email if Supabase email confirmation is enabled.
3. Sign in. A private Humza learner record is created.
4. Open **Parent**, then **Create device code**.
5. On Humza’s iPad, open the app, choose **Humza’s device**, and enter the six-digit code within 15 minutes.

The iPad receives an anonymous Supabase Auth identity mapped to Humza’s learner record. It cannot open the parent dashboard. The parent can revoke that device in the database; a full device management screen is the next required production increment.

## Teacher recording and approval

1. Sign in as the parent and open **Parent → Teacher Audio Studio**.
2. Select a sound, enter the teacher’s name, then record or choose an audio file. Safari requires a tap before microphone access and may offer an audio-file capture fallback.
3. Confirm the teacher gave permission, listen to the clip, and upload it. Uploads enter `in_review`; they are private and unavailable in child mode.
4. Enter the reviewer’s name, listen again, and choose **Approve** or **Reject**. Approval is recorded against that exact version.
5. Pair Humza’s device and test the sound online. Successfully downloaded approved clips are cached privately in the browser for later offline playback.

The Wikimedia source is limited to letter names. Do not approve it for makharij claims, vowels, tanween, shaddah, madd, or Quranic word reading. Mendeley’s ten-letter dataset and Nahw’s sentence dataset were evaluated but are not used; see `AUDIO-LICENSES.md`.

## 4. Deploy on Vercel

1. Push this folder to the GitHub `humqaida` repository.
2. Import the repository into Vercel as a Vite project.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel project environment variables.
4. Deploy. No server or paid Vercel feature is required.
5. Add the production URL to Supabase Authentication URL configuration.

## 5. Install on iPhone or iPad

Open the Vercel URL in Safari, tap **Share → Add to Home Screen → Add**. Sign in or pair the device before going offline. The service worker caches the app shell; completed sessions that cannot reach Supabase are queued locally and retried on the next connected launch.

## Verification

```bash
pnpm build
pnpm test
```

Database security still must be verified against a real project with separate parent, child, and unrelated-user accounts before release. Do not call the system production-complete until those live allow/deny tests pass and the teacher-reviewed recording pack is installed.

Required release checks:

- Parent can upload and review; an unrelated account cannot list or fetch the file.
- Child can query and play only `approved` versions for their paired learner.
- Rejected, draft, and in-review versions never play in child mode.
- Microphone and file-upload fallback work on the target iPhone and iPad.
- Approved clips play once online and again after airplane mode is enabled.
- Every approved source has permission/license, speaker, reviewer, and version metadata.

## Free-tier limitation

Supabase and Vercel free plans have usage limits and may change. This family-scale app is designed to fit within free usage, but no repository can guarantee that a third-party service will remain free indefinitely.
