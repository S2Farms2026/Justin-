"use client";
import{useEffect,useMemo,useState}from"react";
import InstallApp from "./install-app";
type Task={id:number;title:string;description:string;assignee:string;category:string;location:string;priority:string;status:string;due_date:string;created_at:string;latest_messages?:Message[];checklist_progress?:{total:number;done:number}};
type Member={id:number;name:string;phone:string;sms_enabled:boolean};
type Identity={member_id:number;name:string;role:string;team_name:string};
type LoginMember={id:number;name:string;role:string;has_pin:boolean;team_name:string};
type Message={id:number;author_name:string;body:string;created_at:string};
type Attachment={id:number;author_name:string;file_name:string;content_type:string;byte_size:number;created_at:string};
type ChecklistItem={id:number;body:string;is_complete:boolean;created_by_name:string;completed_by_name:string|null;completed_at:string|null;created_at:string};
type GuestShare={id:number;url:string;pin:string;expires_at:string};
const cats=["Planting","Spraying","Fertility","Irrigation","Harvest","Trucking","Repairs","Purchasing","Office"],statuses=["New","In Progress","Waiting","Completed"];
export default function App(){
 const[auth,setAuth]=useState<boolean|null>(null),[admin,setAdmin]=useState(false),[identity,setIdentity]=useState<Identity|null>(null),[code,setCode]=useState(""),[err,setErr]=useState(""),[tasks,setTasks]=useState<Task[]>([]),[members,setMembers]=useState<Member[]>([]),[busy,setBusy]=useState(false),[open,setOpen]=useState(false),[teamOpen,setTeamOpen]=useState(false),[filter,setFilter]=useState("Open"),[search,setSearch]=useState(""),[view,setView]=useState("mine");
 const[loginMode,setLoginMode]=useState<"member"|"admin"|"bootstrap">("member"),[teamCode,setTeamCode]=useState(""),[loginMembers,setLoginMembers]=useState<LoginMember[]>([]),[memberId,setMemberId]=useState(""),[pin,setPin]=useState(""),[setupCode,setSetupCode]=useState(""),[pins,setPins]=useState<Record<number,string>>({});
 const[activeTask,setActiveTask]=useState<Task|null>(null),[messages,setMessages]=useState<Message[]>([]),[attachments,setAttachments]=useState<Attachment[]>([]),[checklist,setChecklist]=useState<ChecklistItem[]>([]),[checklistText,setChecklistText]=useState(""),[message,setMessage]=useState(""),[discussionBusy,setDiscussionBusy]=useState(false),[editingTitle,setEditingTitle]=useState(false),[titleDraft,setTitleDraft]=useState(""),[shareOpen,setShareOpen]=useState(false),[sharePin,setSharePin]=useState(""),[shareDays,setShareDays]=useState("30"),[guestShare,setGuestShare]=useState<GuestShare|null>(null);
 const[newMember,setNewMember]=useState({name:"",phone:"",smsEnabled:false}),[form,setForm]=useState({title:"",description:"",assignee:"Justin",category:"Repairs",location:"",priority:"Normal",dueDate:""});
 async function load(){const[t,m]=await Promise.all([fetch("/api/tasks",{cache:"no-store"}),fetch("/api/members",{cache:"no-store"})]);if(t.ok)setTasks((await t.json()).tasks);if(m.ok)setMembers((await m.json()).members)}
 useEffect(()=>{fetch("/api/access").then(r=>r.json()).then(d=>{setAuth(d.authorized);setIdentity(d.identity||null);setAdmin(Boolean(d.admin));if(d.authorized)load()}).catch(()=>setAuth(false))},[]);
 async function unlock(e:React.FormEvent){e.preventDefault();setBusy(true);setErr("");const r=await fetch("/api/access",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({code})});setBusy(false);if(!r.ok){setErr("That code is not correct.");return}setAuth(true);load()}
 async function findTeam(e:React.FormEvent){e.preventDefault();setBusy(true);setErr("");const r=await fetch("/api/member-auth",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"members",teamCode})});setBusy(false);if(!r.ok){setErr("Team code not found.");return}const d=await r.json();if(!d.members?.length){setErr("Team code not found.");return}setLoginMembers(d.members);setMemberId(String(d.members[0].id))}
 async function memberLogin(e:React.FormEvent){e.preventDefault();setBusy(true);setErr("");const r=await fetch("/api/member-auth",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"login",teamCode,memberId,pin})});setBusy(false);const d=await r.json();if(!r.ok){setErr(d.error||"Login failed.");return}setIdentity(d.identity);setAuth(true);setView("mine");load()}
 async function bootstrap(e:React.FormEvent){e.preventDefault();setBusy(true);setErr("");const r=await fetch("/api/member-auth",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"bootstrap",setupCode,pin})});setBusy(false);const d=await r.json();if(!r.ok){setErr(d.error||"Activation failed.");return}setIdentity(d.identity);setAuth(true);setView("mine");load()}
 async function add(e:React.FormEvent){e.preventDefault();setBusy(true);const r=await fetch("/api/tasks",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(form)});setBusy(false);if(!r.ok){alert("Task could not be saved.");return}const d=await r.json();setTasks(x=>[d.task,...x]);setOpen(false);setForm({title:"",description:"",assignee:members[0]?.name||"Justin",category:"Repairs",location:"",priority:"Normal",dueDate:""})}
 async function move(t:Task,status:string){
  const previous=t.status;
  setTasks(x=>x.map(y=>y.id===t.id?{...y,status}:y));
  setActiveTask(x=>x?.id===t.id?{...x,status}:x);
  setDiscussionBusy(true);
  try{
   const r=await fetch(`/api/tasks/${t.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status})});
   if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.error||"Status could not be updated.")}
  }catch(error){
   setTasks(x=>x.map(y=>y.id===t.id?{...y,status:previous}:y));
   setActiveTask(x=>x?.id===t.id?{...x,status:previous}:x);
   alert(error instanceof Error?error.message:"Status could not be updated.");
  }finally{setDiscussionBusy(false)}
 }
 async function saveTaskTitle(e:React.FormEvent){e.preventDefault();if(!activeTask)return;const title=titleDraft.trim();if(!title){alert("Enter a task title.");return}if(title===activeTask.title){setEditingTitle(false);return}setDiscussionBusy(true);const r=await fetch(`/api/tasks/${activeTask.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({title})});setDiscussionBusy(false);const d=await r.json();if(!r.ok){alert(d.error||"Task title could not be updated.");return}setTasks(x=>x.map(y=>y.id===activeTask.id?{...y,title:d.task.title}:y));setActiveTask(x=>x?.id===activeTask.id?{...x,title:d.task.title}:x);setEditingTitle(false)}
 async function addMember(e:React.FormEvent){e.preventDefault();setBusy(true);const r=await fetch("/api/members",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(newMember)});setBusy(false);if(!r.ok){alert("Team member could not be added.");return}const d=await r.json();setMembers(x=>[...x,d.member].sort((a,b)=>a.name.localeCompare(b.name)));setNewMember({name:"",phone:"",smsEnabled:false})}
 async function saveMember(m:Member){const r=await fetch(`/api/members/${m.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(m)});if(!r.ok)alert("Changes could not be saved.")}
 async function removeMember(m:Member){if(!confirm(`Remove ${m.name} from future task assignments?`))return;const r=await fetch(`/api/members/${m.id}`,{method:"DELETE"});if(r.ok)setMembers(x=>x.filter(y=>y.id!==m.id));else alert("Team member could not be removed.")}
 async function setMemberPin(m:Member){const newPin=pins[m.id]||"";const r=await fetch(`/api/members/${m.id}`,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({pin:newPin})});const d=await r.json();if(!r.ok){alert(d.error||"PIN could not be saved.");return}setPins(x=>({...x,[m.id]:""}));alert(`${m.name}'s PIN is ready.`)}
 async function signOut(){await fetch("/api/member-auth",{method:"DELETE"});location.reload()}
 async function openDiscussion(t:Task){setTitleDraft(t.title);setEditingTitle(false);setShareOpen(false);setSharePin("");setGuestShare(null);setActiveTask(t);setDiscussionBusy(true);const r=await fetch(`/api/tasks/${t.id}/discussion`,{cache:"no-store"});setDiscussionBusy(false);if(!r.ok){alert("Task details could not be opened.");setActiveTask(null);return}const d=await r.json();setMessages(d.messages||[]);setAttachments(d.attachments||[]);setChecklist(d.checklist||[])}
 async function createGuestShare(e:React.FormEvent){e.preventDefault();if(!activeTask)return;if(!/^\d{4,6}$/.test(sharePin)){alert("Choose a 4–6 digit PIN.");return}setDiscussionBusy(true);const r=await fetch("/api/guest-shares",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({taskId:activeTask.id,pin:sharePin,days:Number(shareDays)})}),d=await r.json();setDiscussionBusy(false);if(!r.ok){alert(d.error||"Guest link could not be created.");return}setGuestShare({id:d.share.id,url:d.url,pin:sharePin,expires_at:d.share.expires_at})}
 function shareText(){return guestShare&&activeTask?`S2 Farms shared the NEXTASX task “${activeTask.title}” with you.\n\nOpen: ${guestShare.url}\nAccess PIN: ${guestShare.pin}`:""}
 async function sendGuestShare(){if(!guestShare)return;const text=shareText();if(navigator.share){try{await navigator.share({title:`NEXTASX: ${activeTask?.title}`,text});return}catch{}}await navigator.clipboard.writeText(text);alert("The link and PIN were copied. You can paste them into a text message or email.")}
 async function revokeGuestShare(){if(!guestShare||!confirm("Revoke this guest link? The outside person will no longer be able to open it."))return;const r=await fetch(`/api/guest-shares/${guestShare.id}`,{method:"DELETE"});if(!r.ok){alert("Guest access could not be revoked.");return}setGuestShare(null);setSharePin("");setShareOpen(false);alert("Guest access was revoked.")}
 async function postMessage(e:React.FormEvent){e.preventDefault();if(!activeTask||!message.trim())return;setDiscussionBusy(true);const r=await fetch(`/api/tasks/${activeTask.id}/discussion`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({body:message})});setDiscussionBusy(false);const d=await r.json();if(!r.ok){alert(d.error||"Message could not be posted.");return}setMessages(x=>[...x,d.message]);setTasks(x=>x.map(t=>t.id===activeTask.id?{...t,latest_messages:[...(t.latest_messages||[]),d.message].slice(-3)}:t));setMessage("")}
 async function uploadFile(e:React.ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];if(!activeTask||!file)return;if(file.size>4*1024*1024){alert("Please choose a photo or document smaller than 4 MB.");e.target.value="";return}setDiscussionBusy(true);const data=new FormData();data.append("file",file);const r=await fetch(`/api/tasks/${activeTask.id}/attachments`,{method:"POST",body:data});setDiscussionBusy(false);const d=await r.json();if(!r.ok){alert(d.error||"File could not be uploaded.");return}setAttachments(x=>[...x,d.attachment]);e.target.value=""}
 async function addChecklistItem(e:React.FormEvent){e.preventDefault();if(!activeTask||!checklistText.trim())return;setDiscussionBusy(true);const r=await fetch(`/api/tasks/${activeTask.id}/checklist`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({body:checklistText})});setDiscussionBusy(false);const d=await r.json();if(!r.ok){alert(d.error||"Checklist item could not be added.");return}setChecklist(x=>[...x,d.item]);setTasks(x=>x.map(t=>t.id===activeTask.id?{...t,checklist_progress:{total:(t.checklist_progress?.total||0)+1,done:t.checklist_progress?.done||0}}:t));setChecklistText("")}
 async function toggleChecklistItem(item:ChecklistItem,complete:boolean){setChecklist(x=>x.map(y=>y.id===item.id?{...y,is_complete:complete,completed_by_name:complete?(identity?.name||"Administrator"):null,completed_at:complete?new Date().toISOString():null}:y));setTasks(x=>x.map(t=>t.id===activeTask?.id?{...t,checklist_progress:{total:t.checklist_progress?.total||0,done:Math.max(0,(t.checklist_progress?.done||0)+(complete?1:-1))}}:t));const r=await fetch(`/api/checklist/${item.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({complete})});if(!r.ok){alert("Checklist could not be updated.");openDiscussion(activeTask!)}}
 async function deleteChecklistItem(item:ChecklistItem){if(!confirm(`Remove “${item.body}” from this checklist?`))return;const r=await fetch(`/api/checklist/${item.id}`,{method:"DELETE"});if(!r.ok){alert("Checklist item could not be removed.");return}setChecklist(x=>x.filter(y=>y.id!==item.id));setTasks(x=>x.map(t=>t.id===activeTask?.id?{...t,checklist_progress:{total:Math.max(0,(t.checklist_progress?.total||0)-1),done:Math.max(0,(t.checklist_progress?.done||0)-(item.is_complete?1:0))}}:t))}
 const canManage=admin||identity?.role==="owner"||identity?.role==="manager";
 const shown=useMemo(()=>tasks.filter(t=>(!identity||view==="team"||t.assignee===identity.name||t.assignee==="Everyone")&&(filter==="All"||filter==="Open"&&t.status!=="Completed"||t.status===filter)&&(t.title+" "+t.assignee+" "+t.location+" "+t.category).toLowerCase().includes(search.toLowerCase())),[tasks,filter,search,identity,view]);
 if(auth===null)return <main className="splash">
<div className="brandIcon">NX</div>
<b>Opening NEXTASX…</b>
</main>;
 if(!auth)return <main className="splash">
<section className="login">
<div className="brandIcon">NX</div>
<h1>NEXTASX</h1>{loginMode==="member"&&<>{!loginMembers.length?<form onSubmit={findTeam}>
<p>Enter your company or team code.</p>
<label>Team code<input autoFocus inputMode="numeric" value={teamCode} onChange={e=>setTeamCode(e.target.value)}/>
</label>{err&&<div className="error">{err}</div>}<button disabled={busy}>{busy?"Finding…":"Find my team"}</button>
</form>:<form onSubmit={memberLogin}>
<p>{loginMembers[0].team_name}</p>
<label>Your name<select value={memberId} onChange={e=>setMemberId(e.target.value)}>{loginMembers.map(m=>
<option value={m.id} key={m.id}>{m.name}{!m.has_pin?" — PIN not set":""}</option>)}</select>
</label>
<label>Your PIN<input inputMode="numeric" pattern="[0-9]*" maxLength={6} value={pin} onChange={e=>setPin(e.target.value)}/>
</label>{err&&<div className="error">{err}</div>}<button disabled={busy}>{busy?"Opening…":"Open My Tasks"}</button>
<button type="button" className="linkButton" onClick={()=>{setLoginMembers([]);setErr("")}}>Use another team</button>
</form>}</>}{loginMode==="admin"&&<form onSubmit={unlock}>
<p>Temporary administrator access during setup.</p>
<label>Company access code<input autoFocus inputMode="numeric" pattern="[0-9]*" maxLength={6} value={code} onChange={e=>setCode(e.target.value)}/>
</label>{err&&<div className="error">{err}</div>}<button disabled={busy}>{busy?"Checking…":"Open team board"}</button>
</form>}{loginMode==="bootstrap"&&<form onSubmit={bootstrap}>
<p>First owner activation for Justin.</p>
<label>Activation code<input autoFocus value={setupCode} onChange={e=>setSetupCode(e.target.value)}/>
</label>
<label>Create your PIN<input inputMode="numeric" pattern="[0-9]*" maxLength={6} value={pin} onChange={e=>setPin(e.target.value)}/>
</label>{err&&<div className="error">{err}</div>}<button disabled={busy}>{busy?"Activating…":"Activate owner login"}</button>
</form>}<div className="loginModes">{loginMode!=="member"&&<button onClick={()=>{setLoginMode("member");setErr("")}}>Team member login</button>}{loginMode!=="admin"&&<button onClick={()=>{setLoginMode("admin");setErr("")}}>Administrator access</button>}{loginMode!=="bootstrap"&&<button onClick={()=>{setLoginMode("bootstrap");setErr("")}}>First owner setup</button>}</div>
</section>
</main>;
 return <>
<header>
<div className="head">
<div className="mini">NX</div>
<div>
<h1>NEXTASX</h1>
<span>{identity?`${identity.name} · ${identity.team_name}`:"Team task manager"}</span>
</div><InstallApp/>{canManage&&<button className="teamButton" onClick={()=>setTeamOpen(true)}>Manage team</button>}{identity&&<button className="signOut" onClick={signOut}>Sign out</button>}</div>
</header>
<main className="shell">
<section>{identity&&<div className="viewSwitch">
<button className={view==="mine"?"active":""} onClick={()=>setView("mine")}>My Tasks</button>
<button className={view==="team"?"active":""} onClick={()=>setView("team")}>Team Board</button>
</div>}<div className="titlebar">
<div>
<h2>{identity&&view==="mine"?`${identity.name}'s tasks`:"Work to do"}</h2>
<p>Keep every job and update in one place.</p>
</div>
<button onClick={()=>setOpen(true)}>＋ Add task</button>
</div>
<input className="search" placeholder="Search jobs, fields, people" value={search} onChange={e=>setSearch(e.target.value)}/>
<div className="filters">{["Open","New","In Progress","Waiting","Completed","All"].map(x=>
<button className={filter===x?"active":""} onClick={()=>setFilter(x)} key={x}>{x}</button>)}</div>
<div className={filter==="Open"?"tasks compactTasks":"tasks"}>{shown.length?shown.map(t=>filter==="Open"?
<button className="compactTask" key={t.id} onClick={()=>openDiscussion(t)}><span aria-hidden="true">•</span><b>{t.title}</b></button>:
<article key={t.id}>
<div className={`dot ${t.priority.toLowerCase()}`}/>
<div className="taskbody">
<div className="tasktop">
<h3>{t.title}</h3>
<span>{t.category}</span>
</div>{t.description&&<p>{t.description}</p>}<div className="meta">
<span>👤 {t.assignee}</span>{t.location&&<span>📍 {t.location}</span>}{t.due_date&&<span>🗓 {t.due_date}</span>}</div>
{Boolean(t.checklist_progress?.total)&&<button className="checklistProgress" onClick={()=>openDiscussion(t)}>☑ {t.checklist_progress!.done} of {t.checklist_progress!.total} checklist items complete</button>}
{t.latest_messages&&t.latest_messages.length>0&&<div className="messagePreview">{t.latest_messages.map(m=><div key={m.id}><b>{m.author_name}:</b> <span>{m.body}</span></div>)}</div>}
<div className="taskfoot">
<button className="updatesButton" onClick={()=>openDiscussion(t)}>☑ Open checklist, messages & files</button>
<select value={t.status} onChange={e=>move(t,e.target.value)}>{statuses.map(s=>
<option key={s}>{s}</option>)}</select>
</div>
</div>
</article>):<div className="empty">✓<b>Nothing here right now</b>
<span>Add a task or choose a different filter.</span>
</div>}</div>
</section>
<aside>
<div className="stat dark">
<strong>{shown.filter(t=>t.status!=="Completed").length}</strong>
<span>{identity&&view==="mine"?"My open tasks":"Open tasks"}</span>
</div>
<div className="stat">
<strong>{shown.filter(t=>t.status==="Completed").length}</strong>
<span>Completed shown</span>
</div>
</aside>
</main>
 {open&&<div className="shade" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
<section className="modal">
<div className="modalhead">
<h2>Add a task</h2>
<button onClick={()=>setOpen(false)}>×</button>
</div>
<form onSubmit={add} className="taskform">
<label className="wide">What needs done?<input required autoFocus value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
</label>
<label>Assigned to<select value={form.assignee} onChange={e=>setForm({...form,assignee:e.target.value})}>{members.map(x=>
<option key={x.id}>{x.name}</option>)}<option>Everyone</option>
</select>
</label>
<label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{cats.map(x=>
<option key={x}>{x}</option>)}</select>
</label>
<label>Field or location<input value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/>
</label>
<label>Due date<input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/>
</label>
<label>Priority<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>{["Normal","High","Urgent"].map(x=>
<option key={x}>{x}</option>)}</select>
</label>
<label className="wide">Instructions or notes<textarea rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
</label>
<button className="wide" disabled={busy}>{busy?"Posting…":"Post task"}</button>
</form>
</section>
</div>}
 {activeTask&&<div className="shade" onMouseDown={e=>{if(e.target===e.currentTarget)setActiveTask(null)}}>
<section className="modal discussionModal">
<div className="modalhead">
<div className="taskTitleArea">{editingTitle?<form className="editTitleForm" onSubmit={saveTaskTitle}><label>Task title<input autoFocus maxLength={200} value={titleDraft} onChange={e=>setTitleDraft(e.target.value)}/></label><div><button className="saveTitle" disabled={discussionBusy}>✓ {discussionBusy?"Saving…":"Save changes"}</button><button type="button" className="cancelTitle" onClick={()=>{setTitleDraft(activeTask.title);setEditingTitle(false)}}>Cancel</button></div></form>:<><h2>{activeTask.title}</h2><button className="editTitle" onClick={()=>{setTitleDraft(activeTask.title);setEditingTitle(true)}}>✎ Edit title</button><p>Checklist, conversation and shared files</p></>}</div>
<button className="closeModal" aria-label="Close task" onClick={()=>setActiveTask(null)}>× <span>Close</span></button>
</div>
<div className="taskStatusEditor">
<label htmlFor="activeTaskStatus">Task status</label>
<select id="activeTaskStatus" value={activeTask.status} disabled={discussionBusy} onChange={e=>move(activeTask,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select>
<span className={`statusPill status-${activeTask.status.toLowerCase().replace(" ","-")}`}>{discussionBusy?"Saving…":activeTask.status}</span>
</div>
<div className="guestShareBox">
<div className="guestShareHead"><div><h3>Share this task</h3><p>Give an outside person access to this card only.</p></div><button className="shareToggle" onClick={()=>setShareOpen(x=>!x)}>{shareOpen?"Hide":"↗ Share task"}</button></div>
{shareOpen&&!guestShare&&<form className="guestShareForm" onSubmit={createGuestShare}><label>Guest access PIN<input required inputMode="numeric" pattern="[0-9]*" minLength={4} maxLength={6} placeholder="4–6 digits" value={sharePin} onChange={e=>setSharePin(e.target.value)}/></label><label>Link expires<select value={shareDays} onChange={e=>setShareDays(e.target.value)}><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="180">180 days</option></select></label><button disabled={discussionBusy}>{discussionBusy?"Creating…":"Create private link"}</button><small>The guest must enter this PIN and their name. They will only see this task.</small></form>}
{shareOpen&&guestShare&&<div className="guestShareReady"><b>Private guest link is ready</b><div><span>PIN</span><strong>{guestShare.pin}</strong></div><small>Expires {new Date(guestShare.expires_at).toLocaleDateString()}</small><button className="sendShare" onClick={sendGuestShare}>↗ Send or copy link and PIN</button><button className="revokeShare" onClick={revokeGuestShare}>Revoke guest access</button></div>}
</div>
<div className="checklistBox">
<div className="checklistTitle"><h3>Task checklist</h3>{checklist.length>0&&<b>{checklist.filter(x=>x.is_complete).length} of {checklist.length} complete</b>}</div>
{checklist.length?<div className="checklistItems">{checklist.map(item=><div className={item.is_complete?"checkItem done":"checkItem"} key={item.id}><label><input type="checkbox" checked={item.is_complete} onChange={e=>toggleChecklistItem(item,e.target.checked)}/><span>{item.body}</span></label><div>{item.is_complete&&<small>Completed by {item.completed_by_name}</small>}<button aria-label={`Remove ${item.body}`} onClick={()=>deleteChecklistItem(item)}>×</button></div></div>)}</div>:<p className="quiet">No checklist items yet.</p>}
<form className="addCheckItem" onSubmit={addChecklistItem}><input maxLength={500} placeholder="Add the next checklist item…" value={checklistText} onChange={e=>setChecklistText(e.target.value)}/><button disabled={discussionBusy||!checklistText.trim()}>＋ Add</button></form>
</div>
<div className="conversation">{discussionBusy&&!messages.length&&<p>Loading…</p>}{messages.length?messages.map(m=>
<div className="message" key={m.id}>
<b>{m.author_name}</b>
<span>{new Date(m.created_at).toLocaleString()}</span>
<p>{m.body}</p>
</div>):!discussionBusy&&<p className="quiet">No messages yet. Start the conversation below.</p>}</div>
<form className="messageForm" onSubmit={postMessage}>
<textarea required maxLength={2000} rows={3} placeholder="Write an update, question, or reply…" value={message} onChange={e=>setMessage(e.target.value)}/>
<button disabled={discussionBusy}>{discussionBusy?"Posting…":"Post message"}</button>
</form>
<div className="files">
<div className="filesHead">
<h3>Photos and documents</h3>
<label className="uploadButton">＋ Add file<input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" onChange={uploadFile}/>
</label>
</div>
<small>Maximum file size: 4 MB</small>{attachments.length?<div className="fileList">{attachments.map(a=>
<a key={a.id} href={`/api/attachments/${a.id}`} target="_blank" rel="noreferrer">
<span>{a.content_type.startsWith("image/")?"📷":"📄"}</span>
<div>
<b>{a.file_name}</b>
<small>{a.author_name} · {(a.byte_size/1024).toFixed(0)} KB</small>
</div>
</a>)}</div>:<p className="quiet">No files attached yet.</p>}</div>
</section>
</div>}
 {teamOpen&&<div className="shade" onMouseDown={e=>{if(e.target===e.currentTarget)setTeamOpen(false)}}>
<section className="modal teamModal">
<div className="modalhead">
<div>
<h2>Manage team</h2>
<p>{identity?.role==="owner"?"Set a private 4–6 digit PIN for each person.":"Add, modify, or remove team members."}</p>
</div>
<button onClick={()=>setTeamOpen(false)}>×</button>
</div>
<div className="memberList">{members.map(m=>
<div className="memberRow" key={m.id}>
<label>Name<input value={m.name} onChange={e=>setMembers(x=>x.map(y=>y.id===m.id?{...y,name:e.target.value}:y))}/>
</label>
<label>Mobile number<input inputMode="tel" placeholder="Optional" value={m.phone} onChange={e=>setMembers(x=>x.map(y=>y.id===m.id?{...y,phone:e.target.value}:y))}/>
</label>{identity&&(identity.role==="owner"||identity.role==="manager")&&<label className="pinField">Personal PIN<input aria-label={`${m.name} personal PIN`} inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="4–6 digits" value={pins[m.id]||""} onChange={e=>setPins(x=>({...x,[m.id]:e.target.value}))}/>
</label>}<button className="saveMember" onClick={()=>saveMember(m)}>Save details</button>{identity&&(identity.role==="owner"||identity.role==="manager")&&<button className="pinButton" disabled={!pins[m.id]} onClick={()=>setMemberPin(m)}>Set PIN</button>}<button className="removeMember" onClick={()=>removeMember(m)}>Remove</button>
</div>)}</div>
<form className="addMember" onSubmit={addMember}>
<h3>Add team member</h3>
<label>Name<input required value={newMember.name} onChange={e=>setNewMember({...newMember,name:e.target.value})}/>
</label>
<label>Mobile number<input inputMode="tel" value={newMember.phone} onChange={e=>setNewMember({...newMember,phone:e.target.value})}/>
</label>
<button disabled={busy}>{busy?"Adding…":"Add member"}</button>
</form>
</section>
</div>}</>}
