const STORAGE="fio_state_v1";

const defaultState={
  workspace:"private",
  workspaces:{private:{projects:{}},work:{projects:{}},study:{projects:{}}},
  activeProject:null
};

let state=JSON.parse(localStorage.getItem(STORAGE)||"null")||defaultState;
function save(){localStorage.setItem(STORAGE,JSON.stringify(state));}
function $(id){return document.getElementById(id);}

function renderTabs(){
  document.querySelectorAll(".tab").forEach(b=>{
    b.classList.toggle("active",b.dataset.ws===state.workspace);
  });
}

function renderProjects(){
  const list=$("projectList");
  list.innerHTML="";
  const ws=state.workspaces[state.workspace];
  Object.values(ws.projects).forEach(p=>{
    const div=document.createElement("div");
    div.className="project"+(state.activeProject===p.id?" active":"");
    div.textContent=p.name;
    div.onclick=()=>{state.activeProject=p.id;save();renderAll();};
    list.appendChild(div);
  });
}

function renderHeader(){
  $("activeWorkspace").textContent=state.workspace;
  const p=getProject();
  $("activeProject").textContent=p?p.name:"Kein Projekt";
}

function renderMessages(){
  const box=$("messages");
  box.innerHTML="";
  const p=getProject();
  if(!p)return;
  p.messages.forEach(m=>{
    const div=document.createElement("div");
    div.className="message "+m.role;
    div.textContent=m.content;
    box.appendChild(div);
  });
  box.scrollTop=box.scrollHeight;
}

function getProject(){
  return state.workspaces[state.workspace].projects[state.activeProject]||null;
}

function createProject(){
  const name=prompt("Projektname:");
  if(!name)return;
  const id="p_"+Date.now();
  state.workspaces[state.workspace].projects[id]={id,name,messages:[]};
  state.activeProject=id;
  save();renderAll();
}

async function sendMessage(){
  const text=$("input").value.trim();
  if(!text)return;
  const p=getProject();
  if(!p)return alert("Kein Projekt");
  $("input").value="";
  p.messages.push({role:"user",content:text});
  renderMessages();
  const res=await fetch("/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:text})});
  const data=await res.json();
  const reply=data.reply||data.content||data.choices?.[0]?.message?.content||"";
  p.messages.push({role:"assistant",content:reply});
  save();renderMessages();
}

function renderAll(){renderTabs();renderProjects();renderHeader();renderMessages();}

document.querySelectorAll(".tab").forEach(b=>{
  b.onclick=()=>{state.workspace=b.dataset.ws;state.activeProject=null;save();renderAll();};
});

$("newProject").onclick=createProject;
$("send").onclick=sendMessage;
$("input").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}});

renderAll();
