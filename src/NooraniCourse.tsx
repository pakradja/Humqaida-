import { useEffect, useMemo, useState } from "react";
import { audioIdForArabic } from "./audioCatalog";
import { select, upsert } from "./lib/cloud";

type Mode="quarter"|"half"|"full";
type ProgressRow={page_number:number;segment_mode:Mode;segment_index:number;attempts:number;best_rating:number;completed_at:string|null};
type Assignment={page:number;mode:Mode;index:number};

const stages=[
  {from:2,to:3,title:"The Arabic alphabet",focus:"Recognise and pronounce each isolated letter."},
  {from:4,to:6,title:"Joined letters",focus:"Notice how letters change at the beginning, middle and end."},
  {from:7,to:8,title:"Movements",focus:"Read fatḥah, kasrah and ḍammah carefully."},
  {from:9,to:11,title:"Tanween",focus:"Read the doubled vowel endings with their n sound."},
  {from:12,to:12,title:"Standing vowels",focus:"Hold the standing vowel for the correct length."},
  {from:13,to:15,title:"Madd letters",focus:"Recognise and stretch long vowel sounds."},
  {from:16,to:18,title:"Soft letters",focus:"Read wāw and yā soft combinations smoothly."},
  {from:19,to:24,title:"Sukoon and jazm",focus:"Join a moving letter to a stopped letter."},
  {from:25,to:29,title:"Tashdeed",focus:"Double the consonant clearly without adding a vowel."},
  {from:30,to:32,title:"Combined rules",focus:"Apply movements, madd, sukoon and tashdeed together."},
  {from:33,to:33,title:"Completion chart",focus:"Review the complete rule map with a grown-up."},
] as const;
const isolatedLetters=["ا","ب","ت","ث","ج","ح","خ","د","ذ","ر","ز","س","ش","ص","ض","ط","ظ","ع","غ","ف","ق","ك","ل","م","ن","و","ه","ي"];
// The source scan places Lesson 1 on PDF page 3 and Lesson 2 on PDF page 2.
const coursePages=[3,2,...Array.from({length:30},(_,index)=>index+4)];
function stageFor(page:number){return stages.find(s=>page>=s.from&&page<=s.to)??stages[0]}
function key(page:number,mode:Mode,index:number){return `${page}:${mode}:${index}`}
function parts(mode:Mode){return mode==="quarter"?4:mode==="half"?2:1}
function nextAssignment(rows:ProgressRow[]):Assignment{
  const complete=new Set(rows.filter(r=>r.completed_at).map(r=>key(r.page_number,r.segment_mode,r.segment_index)));
  for(const page of coursePages){
    for(const mode of ["quarter","half","full"] as Mode[]){
      for(let index=0;index<parts(mode);index++)if(!complete.has(key(page,mode,index)))return{page,mode,index};
    }
  }
  return{page:33,mode:"full",index:0};
}
function label(a:Assignment){return a.mode==="quarter"?`Quarter ${a.index+1} of 4`:a.mode==="half"?`Half ${a.index+1} of 2`:"Full-page review"}
function studyBounds(page:number){if(page===2)return{top:.47,height:.47};if(page===3)return{top:.32,height:.62};if(page===4)return{top:.30,height:.64};return{top:0,height:1}}

export default function NooraniCourse({learnerId,onClose,preview=false}:{learnerId:string;onClose:()=>void;preview?:boolean}){
  const [rows,setRows]=useState<ProgressRow[]>([]),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState("");
  async function load(){try{setRows(preview?[]:await select<ProgressRow[]>("curriculum_progress",`select=page_number,segment_mode,segment_index,attempts,best_rating,completed_at&learner_id=eq.${learnerId}`))}finally{setLoading(false)}}
  useEffect(()=>{void load()},[learnerId]);
  const assignment=useMemo(()=>nextAssignment(rows),[rows]),stage=stageFor(assignment.page),count=parts(assignment.mode),bounds=studyBounds(assignment.page);
  const completedPages=useMemo(()=>coursePages.filter(page=>rows.some(r=>r.page_number===page&&r.segment_mode==="full"&&r.completed_at)).length,[rows]);
  async function rate(rating:number){setSaving(true);setMessage("");try{const existing=rows.find(r=>r.page_number===assignment.page&&r.segment_mode===assignment.mode&&r.segment_index===assignment.index),next={page_number:assignment.page,segment_mode:assignment.mode,segment_index:assignment.index,attempts:(existing?.attempts||0)+1,best_rating:Math.max(existing?.best_rating||0,rating),completed_at:rating>=2?new Date().toISOString():null};if(preview)setRows(current=>[...current.filter(r=>key(r.page_number,r.segment_mode,r.segment_index)!==key(assignment.page,assignment.mode,assignment.index)),next]);else{await upsert("curriculum_progress",{learner_id:learnerId,...next,last_activity_at:new Date().toISOString()},"learner_id,page_number,segment_mode,segment_index");await load()}setMessage(rating>=2?"Saved! Your next portion is ready.":"Saved for another try. This same portion will return tomorrow.")}catch(e){setMessage(e instanceof Error?e.message:"Progress could not be saved")}finally{setSaving(false)}}
  async function playLetter(letter:string){const id=audioIdForArabic(letter);if(!id)return;try{await new Audio(`/audio/letters/${id}.wav`).play()}catch{setMessage("That recording could not be played on this device.")}}
  if(loading)return <main className="loading">Preparing today’s Qaida lesson…</main>;
  return <main className="course-shell"><header className="course-top"><button className="course-close" onClick={onClose}>← Home</button><div><b>Today’s Noorani Qaida</b><small>{completedPages} of 32 pages mastered</small></div><span>Page {assignment.page}</span></header><div className="course-progress"><span style={{width:`${Math.max(2,completedPages/32*100)}%`}}/></div><section className="course-layout"><article className="study-panel"><span className="eyebrow">{stage.title} · {label(assignment)}</span><h1>{stage.focus}</h1><div className={`page-window ${assignment.mode}`}><img src={`/noorani/page-${String(assignment.page).padStart(2,"0")}.jpg`} alt={`Noorani Qaida page ${assignment.page}, ${label(assignment)}`} style={{height:`${100*count/bounds.height}%`,top:`-${(bounds.top*count/bounds.height+assignment.index)*100}%`}}/></div><p className="source-note">Study page from the free Noorani Qaida supplied by Taqwa Foundation. Read aloud with a grown-up or teacher.</p></article><aside className="coach-panel"><span className="coach-icon">☪</span><h2>Listen. Point. Repeat.</h2><ol><li>Grown-up reads the line once.</li><li>Humza points and repeats three times.</li><li>Read the portion once without help.</li></ol>{assignment.page<=3?<div className="letter-audio"><h3>Human letter audio</h3><p>Tap any letter to hear its licensed human recording.</p><div>{isolatedLetters.map(l=><button key={l} onClick={()=>playLetter(l)}>{l}</button>)}</div></div>:<p className="audio-scope">For this stage, use a teacher or grown-up. The available recording only contains isolated letter names, so the app will not pretend it teaches vowels or tajweed.</p>}<div className="rating"><h3>How did this portion go?</h3><button disabled={saving} onClick={()=>rate(1)}>↻ Needs practice</button><button disabled={saving} onClick={()=>rate(2)}>✓ Read with help</button><button disabled={saving} onClick={()=>rate(3)}>★ Read independently</button></div>{message&&<p className="course-message" role="status">{message}</p>}</aside></section></main>
}
