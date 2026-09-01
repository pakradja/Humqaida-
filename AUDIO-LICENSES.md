# Audio sources, rights, and review status

## Wikimedia Commons candidate source

- Work: “Arabic alphabets.ogg”
- Creator: Atef1975
- Date: 14 January 2016
- Source: https://commons.wikimedia.org/wiki/File:Arabic_alphabets.ogg
- License: Creative Commons Attribution-ShareAlike 4.0 International — https://creativecommons.org/licenses/by-sa/4.0/
- Published original SHA-1: `f025f94db5891f4fe4eebaa202fa544d51572644`
- Published original size/duration: 281,846 bytes / 22.776439909297054 seconds
- Intended scope: Arabic letter names only. It is not evidence of makharij accuracy and must not be reused as short-vowel, tanween, shaddah, madd, or Quranic-word audio.
- Adaptation notice: splitting, trimming, normalizing, or transcoding creates adapted files. Those derivatives must retain attribution, identify the changes, and be distributed under CC BY-SA 4.0 or a compatible license.
- Repository status: source metadata is recorded, but the binary could not be fetched in the restricted build environment. No derivative is shipped and nothing is marked approved.

## Other evaluated sources

- Mendeley “Arabic Letter Utterance”: CC BY 4.0, but only ten selected letters. It is not used because it is incomplete and has not been teacher-reviewed for this curriculum.
- Nahw fully diacritized speech dataset: CC BY 4.0 and useful for sentence-level research, but not isolated letter-name or makharij audio. It is not used.

## Teacher recordings

Teacher audio is stored in the private `qaida-audio` Supabase bucket. Each database record carries speaker, reviewer, permission, version, status, and optional source fields. Only an explicitly approved version is visible to Humza’s paired device. Recordings are private family content and are not relicensed by this repository.

The application never silently falls back to synthetic speech. Missing recordings show an unavailable state.
