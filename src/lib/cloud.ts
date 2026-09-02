export type CloudSession={access_token:string;refresh_token:string;expires_at?:number;user:{id:string;email?:string;is_anonymous?:boolean}};
const url=import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/,"");
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SESSION="qaida-cloud-session";
const QUEUE="qaida-cloud-queue";
export const configured=Boolean(url&&key);
export function getSession():CloudSession|null{try{return JSON.parse(localStorage.getItem(SESSION)||"null")}catch{return null}}
function saveSession(s:CloudSession|null){if(s)localStorage.setItem(SESSION,JSON.stringify(s));else localStorage.removeItem(SESSION)}
async function request(path:string,init:RequestInit={},auth=true){
  const session=getSession(); const headers:Record<string,string>={apikey:key||"","Content-Type":"application/json",...(init.headers as Record<string,string>||{})};
  if(auth&&session)headers.Authorization=`Bearer ${session.access_token}`;
  const response=await fetch(`${url}${path}`,{...init,headers}); const text=await response.text(); const body=text?JSON.parse(text):null;
  if(!response.ok)throw new Error(body?.msg||body?.message||body?.error_description||body?.hint||`Cloud request failed (${response.status})`); return body;
}
export async function signUp(email:string,password:string){const s=await request("/auth/v1/signup",{method:"POST",body:JSON.stringify({email,password})},false);if(s.access_token)saveSession(s);return s}
export async function signIn(email:string,password:string){const s=await request("/auth/v1/token?grant_type=password",{method:"POST",body:JSON.stringify({email,password})},false);saveSession(s);return s as CloudSession}
export async function requestPasswordReset(email:string){return request(`/auth/v1/recover?redirect_to=${encodeURIComponent(location.origin)}`,{method:"POST",body:JSON.stringify({email})},false)}
export async function consumeAuthCallback(){
  const params=new URLSearchParams(location.hash.replace(/^#/,""));
  if(params.get("type")!=="recovery"||!params.get("access_token"))return false;
  const access_token=params.get("access_token")!,refresh_token=params.get("refresh_token")||"";
  const response=await fetch(`${url}/auth/v1/user`,{headers:{apikey:key||"",Authorization:`Bearer ${access_token}`}});
  const user=await response.json();if(!response.ok)throw new Error(user?.message||"Password-reset link is invalid or expired.");
  saveSession({access_token,refresh_token,user});history.replaceState(null,"",location.pathname+location.search);return true;
}
export async function updatePassword(password:string){return request("/auth/v1/user",{method:"PUT",body:JSON.stringify({password})})}
export async function signInChild(){const s=await request("/auth/v1/signup",{method:"POST",body:JSON.stringify({})},false);saveSession(s);return s as CloudSession}
export async function signOut(){try{await request("/auth/v1/logout",{method:"POST"})}finally{saveSession(null)}}
export async function rpc<T=unknown>(name:string,args:Record<string,unknown>){return request(`/rest/v1/rpc/${name}`,{method:"POST",body:JSON.stringify(args),headers:{Prefer:"return=representation"}}) as Promise<T>}
export async function select<T=unknown>(table:string,query="select=*"){return request(`/rest/v1/${table}?${query}`,{headers:{Accept:"application/json"}}) as Promise<T>}
export async function update(table:string,query:string,values:Record<string,unknown>){return request(`/rest/v1/${table}?${query}`,{method:"PATCH",body:JSON.stringify(values),headers:{Prefer:"return=representation"}})}
export async function insert<T=unknown>(table:string,values:Record<string,unknown>){return request(`/rest/v1/${table}`,{method:"POST",body:JSON.stringify(values),headers:{Prefer:"return=representation"}}) as Promise<T>}
export async function upsert<T=unknown>(table:string,values:Record<string,unknown>,onConflict:string){return request(`/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`,{method:"POST",body:JSON.stringify(values),headers:{Prefer:"resolution=merge-duplicates,return=representation"}}) as Promise<T>}
export async function uploadPrivateAudio(path:string,file:Blob){
  const session=getSession();if(!session)throw new Error("Sign in before uploading audio.");
  const response=await fetch(`${url}/storage/v1/object/qaida-audio/${path}`,{method:"POST",headers:{apikey:key||"",Authorization:`Bearer ${session.access_token}`,"Content-Type":file.type||"audio/webm","x-upsert":"false"},body:file});
  const body=await response.json().catch(()=>null);if(!response.ok)throw new Error(body?.message||body?.error||`Audio upload failed (${response.status})`);return body;
}
export async function privateAudioUrl(path:string,expiresIn=300){
  const body=await request(`/storage/v1/object/sign/qaida-audio/${path}`,{method:"POST",body:JSON.stringify({expiresIn})});
  if(!body?.signedURL)throw new Error("Could not create a private audio link.");return `${url}/storage/v1${body.signedURL}` as string;
}
export async function privateAudioBlobUrl(path:string){
  const cache=await caches.open("qaida-approved-audio-v1"),stable=new Request(`${location.origin}/__approved_audio__/${encodeURIComponent(path)}`);
  let response=await cache.match(stable);if(!response){response=await fetch(await privateAudioUrl(path));if(!response.ok)throw new Error("Approved recording could not be downloaded.");await cache.put(stable,response.clone())}
  return URL.createObjectURL(await response.blob());
}
export function queueSession(payload:Record<string,unknown>){const items=JSON.parse(localStorage.getItem(QUEUE)||"[]");items.push(payload);localStorage.setItem(QUEUE,JSON.stringify(items))}
export function pendingCount(){try{return JSON.parse(localStorage.getItem(QUEUE)||"[]").length}catch{return 0}}
export async function flushQueue(){const items:Record<string,unknown>[]=JSON.parse(localStorage.getItem(QUEUE)||"[]");const failed=[];for(const item of items){try{await rpc("record_learning_session",item)}catch{failed.push(item)}}localStorage.setItem(QUEUE,JSON.stringify(failed));return failed.length}
export async function recordOrQueue(payload:Record<string,unknown>){try{return await rpc("record_learning_session",payload)}catch(error){queueSession(payload);throw error}}
