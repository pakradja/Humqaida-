# Family privacy summary

Qaida Quest stores the parent's email through Supabase Auth and the minimum learning data needed for Humza's progress. It does not need Humza's full name, birth date, school, photograph, location, microphone, advertising identifiers, or analytics trackers. The parent owns the learner record and can revoke child devices.

Supabase is the authoritative progress store. The browser stores only the signed-in session, cached app/audio files, and temporary offline submissions waiting to sync. Never place a Supabase secret/service-role key in this app or GitHub.
