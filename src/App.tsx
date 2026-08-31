"use client";

import { useEffect, useMemo, useState } from "react";

type Screen = "home" | "learn" | "practice" | "review" | "rewards" | "parent";
type Progress = {
  xp: number; coins: number; streak: number; completed: number[]; unlocked: number;
  correct: number; attempts: number; sessions: number; mistakes: Record<string, number>;
  owned: string[]; avatar: string; pin: string; lastPlayed: string;
};

const STORE = "humza-qaida-progress-v1";
const initial: Progress = { xp: 0, coins: 30, streak: 1, completed: [], unlocked: 0, correct: 0, attempts: 0, sessions: 0, mistakes: {}, owned: ["rookie"], avatar: "⚽", pin: "2468", lastPlayed: "" };
const letters = [
  ["ا","Alif"],["ب","Bā"],["ت","Tā"],["ث","Thā"],["ج","Jīm"],["ح","Ḥā"],["خ","Khā"],
  ["د","Dāl"],["ذ","Dhāl"],["ر","Rā"],["ز","Zā"],["س","Sīn"],["ش","Shīn"],["ص","Ṣād"],
  ["ض","Ḍād"],["ط","Ṭā"],["ظ","Ẓā"],["ع","ʿAyn"],["غ","Ghayn"],["ف","Fā"],["ق","Qāf"],
  ["ك","Kāf"],["ل","Lām"],["م","Mīm"],["ن","Nūn"],["ه","Hā"],["و","Wāw"],["ي","Yā"]
] as const;
const lessonGroups = ["ا ب ت ث","ج ح خ","د ذ","ر ز","س ش","ص ض","ط ظ","ع غ","ف ق","ك ل م ن ه و ي"];
const advanced = ["Similar letter families","Letter shapes","Fatḥah · َ","Kasrah · ِ","Ḍammah · ُ","Mixed short vowels","Join two letters","Join three letters","Sukoon · ْ","Tanween · ً ٍ ٌ","Shaddah · ّ","Long vowels · madd","Quranic word reading"];
const lessons = [...lessonGroups.map((arabic, i) => ({ title: `Letter Team ${i + 1}`, arabic, kind: "letters" })), ...advanced.map((title, i) => ({ title, arabic: ["بَ تَ ثَ","بِ تُ ثَ","مِنْ رَبِّ","قَالَ","رَبِّ"][Math.min(i,4)] || "بَ", kind: "skill" }))];
const games = [
  {id:"sound", icon:"🔊", name:"Sound Safari", blurb:"Listen and find the letter"},
  {id:"name", icon:"🔤", name:"Name Match", blurb:"Match letter to its name"},
  {id:"dots", icon:"🔎", name:"Dot Detective", blurb:"Spot the dot pattern"},
  {id:"build", icon:"🧱", name:"Word Builder", blurb:"Build an Arabic sound"},
  {id:"soccer", icon:"🥅", name:"Goalkeeper", blurb:"Save five penalty kicks"},
];
const shop = [
  {id:"star", icon:"⭐", name:"Star Striker", price:50}, {id:"lion", icon:"🦁", name:"Lion Captain", price:80},
  {id:"rocket", icon:"🚀", name:"Rocket Boots", price:110}, {id:"trophy", icon:"🏆", name:"Gold Cup", price:150},
];
function today(){ return new Date().toISOString().slice(0,10); }
function shuffle<T>(a:T[]){ return [...a].sort(()=>Math.random()-.5); }

export default function Home() {
  const [screen,setScreen]=useState<Screen>("home");
  const [p,setP]=useState<Progress>(initial);
  const [loaded,setLoaded]=useState(false);
  const [lesson,setLesson]=useState<number|null>(null);
  const [lessonStep,setLessonStep]=useState(0);
  const [game,setGame]=useState<string|null>(null);
  const [round,setRound]=useState(0);
  const [score,setScore]=useState(0);
  const [question,setQuestion]=useState(0);
  const [options,setOptions]=useState<number[]>([0,1,2,3]);
  const [feedback,setFeedback]=useState<"good"|"try"|null>(null);
  const [pin,setPin]=useState("");
  const [parentOpen,setParentOpen]=useState(false);
  const [showInstall,setShowInstall]=useState(false);

  useEffect(()=>{ try { const saved=localStorage.getItem(STORE); if(saved) setP({...initial,...JSON.parse(saved)}); } catch {} setLoaded(true); },[]);
  useEffect(()=>{ if(loaded) localStorage.setItem(STORE,JSON.stringify(p)); },[p,loaded]);
  useEffect(()=>{ if("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{}); },[]);
  const level=Math.floor(p.xp/100)+1;
  const accuracy=p.attempts?Math.round(p.correct/p.attempts*100):0;
  const currentLetter=letters[question%letters.length];

  function speak(text:string){ if(!("speechSynthesis" in window)) return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang="ar-SA"; u.rate=.62; speechSynthesis.speak(u); }
  function startLesson(i:number){ if(i>p.unlocked)return; setLesson(i); setLessonStep(0); setFeedback(null); }
  function finishLesson(){ if(lesson===null)return; setP(v=>({...v,xp:v.xp+40,coins:v.coins+15,completed:[...new Set([...v.completed,lesson])],unlocked:Math.max(v.unlocked,Math.min(lessons.length-1,lesson+1)),streak:v.lastPlayed===today()?v.streak:Math.max(1,v.streak+1),lastPlayed:today()})); setLesson(null); setScreen("home"); }
  function startGame(id:string, review=false){ const pool=review&&Object.keys(p.mistakes).length?letters.map((x,i)=>[i,p.mistakes[x[0]]||0] as const).sort((a,b)=>b[1]-a[1]).slice(0,8).map(x=>x[0]):letters.map((_,i)=>i); const q=pool[Math.floor(Math.random()*pool.length)]; setQuestion(q); setOptions(shuffle([q,...shuffle(letters.map((_,i)=>i).filter(i=>i!==q)).slice(0,3)])); setGame(review?"review":id); setRound(0); setScore(0); setFeedback(null); if(id==="sound") setTimeout(()=>speak(letters[q][0]),180); }
  function answer(i:number){ if(feedback)return; const ok=i===question; setFeedback(ok?"good":"try"); setScore(s=>s+(ok?1:0)); setP(v=>({...v,correct:v.correct+(ok?1:0),attempts:v.attempts+1,mistakes:{...v.mistakes,[letters[question][0]]:Math.max(0,(v.mistakes[letters[question][0]]||0)+(ok?-1:2))}})); setTimeout(()=>{ if(round===4){ setP(v=>({...v,xp:v.xp+score*5+(ok?5:0),coins:v.coins+score*2+(ok?2:0),sessions:v.sessions+1,lastPlayed:today()})); setGame(null); setScreen("practice"); } else { const next=Math.floor(Math.random()*letters.length); setQuestion(next); setOptions(shuffle([next,...shuffle(letters.map((_,n)=>n).filter(n=>n!==next)).slice(0,3)])); setRound(r=>r+1); setFeedback(null); if(game==="sound") setTimeout(()=>speak(letters[next][0]),150); } },700); }
  function buy(id:string,price:number,icon:string){ if(p.owned.includes(id)){setP(v=>({...v,avatar:icon}));return;} if(p.coins>=price)setP(v=>({...v,coins:v.coins-price,owned:[...v.owned,id],avatar:icon})); }
  function reset(){ if(confirm("Reset all of Humza’s progress? This cannot be undone.")){setP(initial);setParentOpen(false);setScreen("home");} }

  if(!loaded) return <main className="loading">Loading Humza’s quest…</main>;
  if(lesson!==null){ const l=lessons[lesson]; const group=l.arabic.split(" "); const target=group[lessonStep%group.length]; const steps=["Listen","Repeat","Recognize","Practice","Quick game","Complete"];
    return <main className="lesson-shell"><button className="close" onClick={()=>setLesson(null)}>✕</button><div className="lesson-progress"><span style={{width:`${(lessonStep+1)/6*100}%`}}/></div><div className="lesson-card"><span className="eyebrow">{steps[lessonStep]} · {lessonStep+1} of 6</span><h1>{lessonStep===0?"Listen carefully":lessonStep===1?"Now say it aloud":lessonStep===2?"Can you spot it?":lessonStep===3?"Tap the right letter":lessonStep===4?"One quick challenge!":"Lesson complete!"}</h1><div className="mega-arabic" dir="rtl">{lessonStep===5?"⭐":target}</div>{lessonStep<2&&<button className="audio-btn" onClick={()=>speak(target)}>🔊 Practice audio</button>}{lessonStep>=2&&lessonStep<5&&<div className="answer-grid">{shuffle(group).map((x,i)=><button key={i} className="arabic-choice" onClick={()=>setFeedback(x===target?"good":"try")}>{x}</button>)}</div>}{feedback&&lessonStep<5&&<p className={feedback==="good"?"success":"gentle"}>{feedback==="good"?"Brilliant! ⭐":"Nearly! Try the glowing sound again."}</p>}<button className="primary wide" disabled={lessonStep>=2&&lessonStep<5&&feedback!=="good"} onClick={()=>{setFeedback(null);lessonStep===5?finishLesson():setLessonStep(s=>s+1)}}>{lessonStep===5?"Collect 40 XP + 15 coins":"Continue"} →</button>{lessonStep<2&&<small>Device voice is a practice aid only. Ask a teacher to check makhārij.</small>}</div></main>;
  }
  if(game){ const isSoccer=game==="soccer"; return <main className={`game-shell ${isSoccer?"pitch":""}`}><button className="close" onClick={()=>setGame(null)}>✕</button><div className="round-row"><b>{isSoccer?"Saves":"Score"}: {score}</b><span>{round+1} / 5</span></div><div className="game-card"><div className="game-mascot">{isSoccer?"🥅⚽":"🎯"}</div><span className="eyebrow">{game==="sound"?"Listen & choose":game==="review"?"Smart review":"Choose the match"}</span><h2>{game==="name"?`Find ${currentLetter[1]}`:game==="dots"?`Dot Detective says: find ${currentLetter[0]}`:game==="build"?`Build ${currentLetter[0]} · ${currentLetter[1]}`:isSoccer?`Save the shot from ${currentLetter[1]}!`:"Which letter is it?"}</h2>{game==="sound"&&<button className="audio-btn" onClick={()=>speak(currentLetter[0])}>🔊 Play again</button>}<div className="answer-grid">{options.map(i=><button key={i} className={`arabic-choice ${feedback&&i===question?"right":""}`} onClick={()=>answer(i)}>{letters[i][0]}<small>{game==="name"?letters[i][1]:""}</small></button>)}</div>{feedback&&<p className={feedback==="good"?"success":"gentle"}>{feedback==="good"?(isSoccer?"Amazing save! 🧤":"Yes! Great work ⭐"):`That was ${currentLetter[0]} — keep going!`}</p>}</div></main>;
  }

  return <div className="app"><header><button className="brand" onClick={()=>setScreen("home")}><span>☪</span><b>Qaida Quest</b></button><div className="stats"><span>🔥 {p.streak}</span><span>⭐ {p.xp}</span><span>🪙 {p.coins}</span><span className="avatar">{p.avatar}</span></div></header><main className="content">
    {screen==="home"&&<><section className="hero"><div><span className="eyebrow">YOUR DAILY QUEST</span><h1>Assalamu Alaikum,<br/><em>Humza!</em></h1><p>Ready to unlock your next Arabic superpower?</p><button className="primary" onClick={()=>startLesson(p.unlocked)}>Continue learning <span>→</span></button></div><div className="hero-art"><div className="sun">⭐</div><div className="hill"><div className="goal">🥅</div><div className="kid">{p.avatar}</div><div className="ball">⚽</div></div></div></section><section className="today"><div className="section-title"><div><span className="eyebrow">TODAY’S TRAINING</span><h2>Small steps. Big progress.</h2></div><b>{Math.min(3,p.sessions%4)} of 3</b></div><div className="mission-row"><div className="mission done"><i>📖</i><span><b>Learn</b><small>Finish one lesson</small></span></div><div className="mission"><i>🎯</i><span><b>Practice</b><small>Answer 5 questions</small></span></div><div className="mission"><i>⚽</i><span><b>Play</b><small>Save 3 goals</small></span></div></div></section><section className="level-card"><span className="level-badge">{level}</span><div><b>Level {level} · Rising Reader</b><div className="bar"><span style={{width:`${p.xp%100}%`}}/></div><small>{p.xp%100} / 100 XP to next level</small></div><span>🏆</span></section><button className="install-tip" onClick={()=>setShowInstall(!showInstall)}>📲 {showInstall?"In Safari: tap Share, then Add to Home Screen.":"Put Qaida Quest on Humza’s iPad"}</button></>}
    {screen==="learn"&&<><div className="page-head"><span className="eyebrow">THE LEARNING JOURNEY</span><h1>Adventure Map</h1><p>Follow the path from first letters to Quranic words.</p></div><div className="map">{lessons.map((l,i)=>{const locked=i>p.unlocked,done=p.completed.includes(i);return <button key={l.title} className={`map-node n${i%3} ${locked?"locked":""} ${done?"done":""}`} onClick={()=>startLesson(i)}><span className="node-icon">{done?"✓":locked?"🔒":i<10?"أ":"✦"}</span><span><small>LESSON {i+1}</small><b>{l.title}</b><em dir="rtl">{l.arabic}</em></span></button>})}</div></>}
    {screen==="practice"&&<><div className="page-head"><span className="eyebrow">5-QUESTION ROUNDS</span><h1>Practice Playground</h1><p>Pick a game. Every round earns XP and coins.</p></div><div className="game-grid">{games.map(g=><button className="game-tile" key={g.id} onClick={()=>startGame(g.id)}><span>{g.icon}</span><div><b>{g.name}</b><small>{g.blurb}</small></div><i>Play →</i></button>)}</div></>}
    {screen==="review"&&<><div className="page-head"><span className="eyebrow">SMART PRACTICE</span><h1>Mistake Busters</h1><p>Qaida Quest remembers tricky letters and brings them back gently.</p></div><section className="review-card"><div className="review-art">🛡️</div><div><h2>{Object.values(p.mistakes).some(x=>x>0)?"Your review is ready!":"Nothing tricky yet!"}</h2><p>{Object.values(p.mistakes).some(x=>x>0)?"A quick round focused on the letters that need a little more practice.":"Play a practice game and we’ll build a smart review for you."}</p><div className="tricky">{Object.entries(p.mistakes).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k])=><span key={k}>{k}</span>)}</div><button className="primary" onClick={()=>startGame("review",true)}>Start quick review →</button></div></section></>}
    {screen==="rewards"&&<><div className="page-head"><span className="eyebrow">YOUR CLUBHOUSE</span><h1>Rewards</h1><p>Spend learning coins. No real money—ever.</p></div><section className="trophy-row"><div><span>🏅</span><b>First Steps</b><small>{p.completed.length?"Earned":"Complete a lesson"}</small></div><div><span>🔥</span><b>On Fire</b><small>{p.streak>=3?"Earned":"Reach a 3-day streak"}</small></div><div><span>⚽</span><b>Safe Hands</b><small>{p.sessions>=3?"Earned":"Play 3 rounds"}</small></div></section><div className="shop-head"><h2>Reward shop</h2><span>🪙 {p.coins} coins</span></div><div className="shop-grid">{shop.map(x=><button key={x.id} className={`shop-item ${p.owned.includes(x.id)?"owned":""}`} onClick={()=>buy(x.id,x.price,x.icon)}><span>{x.icon}</span><b>{x.name}</b><small>{p.owned.includes(x.id)?(p.avatar===x.icon?"Equipped":"Tap to equip"):`🪙 ${x.price}`}</small></button>)}</div></>}
    {screen==="parent"&&<>{!parentOpen?<section className="pin-card"><span>🔐</span><h1>Grown-ups only</h1><p>Enter your 4-digit parent PIN.<br/><small>First-time PIN: 2468</small></p><input inputMode="numeric" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,""))} aria-label="Parent PIN"/><button className="primary" onClick={()=>{if(pin===p.pin){setParentOpen(true);setPin("")}else alert("That PIN didn’t match.")}}>Open parent area</button></section>:<><div className="page-head"><span className="eyebrow">PARENT VIEW</span><h1>Humza’s progress</h1><p>Real activity saved on this device.</p></div><div className="parent-stats"><div><b>{p.completed.length}</b><small>Lessons complete</small></div><div><b>{accuracy}%</b><small>Accuracy</small></div><div><b>{p.sessions}</b><small>Practice rounds</small></div><div><b>{p.streak}</b><small>Day streak</small></div></div><section className="parent-panel"><h2>Learning snapshot</h2><p><b>Current lesson:</b> {lessons[p.unlocked]?.title}</p><p><b>Needs review:</b> {Object.entries(p.mistakes).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k])=>k).join(" · ")||"No patterns yet"}</p><label>Unlock through lesson <select value={p.unlocked} onChange={e=>setP(v=>({...v,unlocked:Number(e.target.value)}))}>{lessons.map((l,i)=><option key={i} value={i}>{i+1}. {l.title}</option>)}</select></label><label>Change parent PIN <input inputMode="numeric" maxLength={4} placeholder="4 digits" onBlur={e=>{if(/^\d{4}$/.test(e.target.value))setP(v=>({...v,pin:e.target.value}))}}/></label><button className="danger" onClick={reset}>Reset all progress</button></section></>}</>}
  </main><nav>{(["home","learn","practice","review","rewards","parent"] as Screen[]).map((x,i)=><button key={x} className={screen===x?"active":""} onClick={()=>setScreen(x)}><span>{["⌂","🗺️","⚽","↻","🏆","⚙"][i]}</span>{x[0].toUpperCase()+x.slice(1)}</button>)}</nav></div>;
}
