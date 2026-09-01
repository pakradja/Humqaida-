export const audioCatalog = [
  ["letter_alif","ا","Alif"],["letter_ba","ب","Bā"],["letter_ta","ت","Tā"],["letter_tha","ث","Thā"],
  ["letter_jim","ج","Jīm"],["letter_ha_emphatic","ح","Ḥā"],["letter_kha","خ","Khā"],["letter_dal","د","Dāl"],
  ["letter_dhal","ذ","Dhāl"],["letter_ra","ر","Rā"],["letter_zay","ز","Zā"],["letter_sin","س","Sīn"],
  ["letter_shin","ش","Shīn"],["letter_sad","ص","Ṣād"],["letter_dad","ض","Ḍād"],["letter_ta_emphatic","ط","Ṭā"],
  ["letter_za_emphatic","ظ","Ẓā"],["letter_ayn","ع","ʿAyn"],["letter_ghayn","غ","Ghayn"],["letter_fa","ف","Fā"],
  ["letter_qaf","ق","Qāf"],["letter_kaf","ك","Kāf"],["letter_lam","ل","Lām"],["letter_mim","م","Mīm"],
  ["letter_nun","ن","Nūn"],["letter_ha","ه","Hā"],["letter_waw","و","Wāw"],["letter_ya","ي","Yā"]
] as const;

export function audioIdForArabic(arabic:string){return audioCatalog.find(x=>x[1]===arabic)?.[0]}
