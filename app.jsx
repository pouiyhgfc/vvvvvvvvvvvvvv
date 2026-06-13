
const { useState, useEffect, useRef } = React;

/* ─────── DEFAULT ROUTINES ─────── */
const DEFAULT_ROUTINES = {
  ochtend: [
    { id:"o1", name:"Duah", icon:"🤲", area:"Quran/Hifd" },
    { id:"o2", name:"Rekken, Touwtje springen, Boxen", icon:"🥊", area:"Fitness" },
    { id:"o3", name:"Douchen", icon:"🚿", area:"Zelfzorg" },
    { id:"o4", name:"Bidden", icon:"🕌", area:"Quran/Hifd" },
    { id:"o5", name:"Hifd", icon:"📖", area:"Quran/Hifd" },
    { id:"o6", name:"Pagina Quran lezen", icon:"📜", area:"Quran/Hifd" },
    { id:"o7", name:"Ademhalingssessie", icon:"🌬️", area:"Zelfzorg" },
    { id:"o8", name:"Adhkar reciteren", icon:"📿", area:"Quran/Hifd" },
    { id:"o9", name:"Frans Anki", icon:"🇫🇷", area:"Talen" },
    { id:"o10", name:"Arabisch leren", icon:"🇸🇦", area:"Talen" },
    { id:"o11", name:"Chinees leren", icon:"🇨🇳", area:"Talen" },
    { id:"o12", name:"Berbers leren", icon:"ⵣ", area:"Talen" },
    { id:"o13", name:"Video kijken", icon:"🎬", area:"School" },
  ],
  middag: [
    { id:"m1", name:"Adhkar verrichten", icon:"📿", area:"Quran/Hifd" },
    { id:"m2", name:"Arabisch met AI", icon:"🇸🇦", area:"Talen" },
    { id:"m3", name:"Berbers met AI", icon:"ⵣ", area:"Talen" },
    { id:"m4", name:"Chinees met AI", icon:"🇨🇳", area:"Talen" },
    { id:"m5", name:"Hifd revisen/lezen", icon:"📖", area:"Quran/Hifd" },
  ],
  avond: [
    { id:"a1", name:"Shake maken", icon:"🥤", area:"Fitness" },
    { id:"a2", name:"Douche dingen", icon:"🚿", area:"Zelfzorg" },
    { id:"a3", name:"Rekken", icon:"🧘", area:"Fitness" },
    { id:"a4", name:"Blz Quran lezen", icon:"📜", area:"Quran/Hifd" },
    { id:"a5", name:"Ademhalingssessie", icon:"🌬️", area:"Zelfzorg" },
    { id:"a6", name:"Duah lezen", icon:"🤲", area:"Quran/Hifd" },
    { id:"a7", name:"Logboek", icon:"📓", area:"Zelfzorg" },
    { id:"a8", name:"Slapen (10-11 uur)", icon:"😴", area:"Zelfzorg" },
  ],
};

/* ─── WEEKPLANNER TEMPLATES ─── */
const DEFAULT_CAL_TEMPLATES = [
  {id:"ct1",title:"Hifd",icon:"📖",color:"#dc2626"},
  {id:"ct2",title:"Rekken / Boxen",icon:"🥊",color:"#d97706"},
  {id:"ct3",title:"Arabisch",icon:"🇸🇦",color:"#7c3aed"},
  {id:"ct4",title:"Quran lezen",icon:"📜",color:"#059669"},
  {id:"ct5",title:"Frans Anki",icon:"🇫🇷",color:"#2563eb"},
  {id:"ct6",title:"School",icon:"🎬",color:"#0891b2"},
];

const AREAS = ["Quran/Hifd","Talen","Fitness","Zelfzorg","School"];
const AREA_STYLES = {
  "Quran/Hifd":{bg:"#fef2f2",border:"#fecaca",text:"#b91c1c",tag:"#fee2e2"},
  Talen:{bg:"#f5f3ff",border:"#ddd6fe",text:"#6d28d9",tag:"#ede9fe"},
  Fitness:{bg:"#fff7ed",border:"#fed7aa",text:"#c2410c",tag:"#ffedd5"},
  Zelfzorg:{bg:"#fdf2f8",border:"#fbcfe8",text:"#be185d",tag:"#fce7f3"},
  School:{bg:"#fefce8",border:"#fef08a",text:"#a16207",tag:"#fef9c3"},
};
const PERIOD_COLORS = {ochtend:"#d97706",middag:"#2563eb",avond:"#7c3aed"};
const PERIOD_LABELS = {ochtend:"🌅 Ochtend",middag:"🌤️ Middag",avond:"🌙 Avond"};
const MOODS = [
  {value:"Geweldig",emoji:"🔥"},{value:"Goed",emoji:"😊"},{value:"Oké",emoji:"😐"},
  {value:"Moe",emoji:"😴"},{value:"Slecht",emoji:"😞"},
];
const DAYS_NL = ["Zondag","Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag"];
const MONTHS_NL = ["Januari","Februari","Maart","April","Mei","Juni","Juli","Augustus","September","Oktober","November","December"];
const EMOJI_CATEGORIES = [
  {name:"Gebed & Quran",kw:"gebed bidden quran hifd duah adhkar islam moskee",emojis:["🤲","🕌","📖","📜","📿","🕋","☪️","🧎","📕","🌙","✨","🙏","🕯️"]},
  {name:"Talen & vlaggen",kw:"taal talen vlag frans arabisch chinees berbers engels duits spaans",emojis:["🇸🇦","🇳🇱","🇬🇧","🇫🇷","🇩🇪","🇪🇸","🇮🇹","🇨🇳","🇯🇵","🇹🇷","🇲🇦","🇵🇹","🇷🇺","🇰🇷","🇮🇳","ⵣ","🗣️","💬","🔤","🔡"]},
  {name:"Sport & fitness",kw:"sport fitness boxen rekken hardlopen gym workout",emojis:["🥊","🏋️","🏃","🚶","🧘","🧘‍♂️","💪","🤸","🚴","⚽","🏀","🏊","🥋","🧗","⛹️","🏸","🎽","🤾","🏐","🛹"]},
  {name:"Eten & drinken",kw:"eten drinken food shake water fruit koffie maaltijd",emojis:["🥤","🥗","🍎","🍓","🫐","🍳","🥚","🥛","💧","☕","🍵","🧃","🍌","🥦","🥕","🍗","🍚","🥜","🍯","🧉"]},
  {name:"Studie & werk",kw:"studie school werk leren huiswerk video focus",emojis:["📝","✏️","📓","📚","🎓","💻","📱","🖋️","🧠","🎯","🔬","🧪","📊","📈","🗂️","📌","⏰","⌛","🎬","🎵"]},
  {name:"Zelfzorg",kw:"zelfzorg douche slapen rust gezondheid ademhaling logboek",emojis:["🚿","🛁","🧼","😴","🛌","🌬️","💊","🩺","🦷","🧴","🪥","❤️","🫀","🌿","🧿","🤍","☀️","🧖","💆","🧹"]},
  {name:"Natuur & weer",kw:"natuur weer ochtend avond zon maan vuur",emojis:["🌅","🌄","🌙","☀️","⭐","🌟","🔥","🌊","🌿","🌱","🌳","🍃","🌸","🌷","❄️","🌈","☁️","⚡","💫","🌍"]},
  {name:"Symbolen",kw:"symbool overig check vinkje doel beloning",emojis:["✅","☑️","🔔","⏰","🎯","💡","🏆","🥇","🎉","❤️","🔥","⭐","🧿","📍","🔑","🤝","👍","✨","🤖","🎨"]},
];
const EMOJI_LIST = EMOJI_CATEGORIES.flatMap(c=>c.emojis);
const EVENT_COLORS = ["#059669","#2563eb","#7c3aed","#dc2626","#d97706","#be185d","#0891b2","#65a30d"];
const WEEK_DAYS_SHORT = ["Ma","Di","Wo","Do","Vr","Za","Zo"];
const CAL_HOUR_H = 56;
const CAL_START_H = 3;
const CAL_END_H = 24;

function dk(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function fmtDate(d){return `${DAYS_NL[d.getDay()]} ${d.getDate()} ${MONTHS_NL[d.getMonth()]} ${d.getFullYear()}`}
function isToday(d){const t=new Date();return d.getDate()===t.getDate()&&d.getMonth()===t.getMonth()&&d.getFullYear()===t.getFullYear()}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function getMonday(d){
  const date=new Date(d);
  const day=date.getDay();
  const diff=day===0?-6:1-day;
  date.setDate(date.getDate()+diff);
  date.setHours(0,0,0,0);
  return date;
}

/* ─────── STORAGE ─────── */
function loadJSON(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}}
function saveJSON(key,val){try{localStorage.setItem(key,JSON.stringify(val))}catch{}}

/* ─────── RING ─────── */
function Ring({value,size=90,stroke=7,label,color="#059669"}){
  const r=(size-stroke)/2,c=2*Math.PI*r,off=c-(value/100)*c;
  return(
    <div style={{position:"relative",width:size,height:size}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" style={{stroke:"var(--border)"}} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{transition:"stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:size*.26,fontWeight:800,color:"var(--text)",fontFamily:"var(--ff-head)"}}>{value}%</span>
        {label&&<span style={{fontSize:10,color:"var(--text-muted)",marginTop:1}}>{label}</span>}
      </div>
    </div>
  );
}

/* ─────── MAIN APP ─────── */
const DEFAULT_SETTINGS={theme:"light",notifEnabled:false,notifLeadMin:10,streakPct:50};

function App(){
  const [settings,setSettings]=useState(()=>({...DEFAULT_SETTINGS,...loadJSON("rt_settings",{})}));
  const [notifPerm,setNotifPerm]=useState(typeof Notification!=="undefined"?Notification.permission:"unsupported");
  const [openPeriods,setOpenPeriods]=useState({ochtend:true,middag:true,avond:true});
  const [routines,setRoutines]=useState(()=>loadJSON("rt_routines",DEFAULT_ROUTINES));
  const [date,setDate]=useState(new Date());
  const [tab,setTab]=useState("ochtend");
  const [day,setDay]=useState(()=>loadJSON(`rt_day_${dk(new Date())}`,{checked:{},energy:7,mood:"Goed",notes:""}));
  const [view,setView]=useState("tracker");
  const [pop,setPop]=useState(null);
  const [showSettings,setShowSettings]=useState(false);
  const [editingRoutine,setEditingRoutine]=useState(null);
  const [addingTo,setAddingTo]=useState(null);
  const [newR,setNewR]=useState({name:"",icon:"✅",area:"Zelfzorg"});
  const [calTemplates,setCalTemplates]=useState(()=>loadJSON("rt_cal_templates",DEFAULT_CAL_TEMPLATES));
  const [calEvents,setCalEvents]=useState(()=>loadJSON("rt_cal_events",[]));
  const [calTplForm,setCalTplForm]=useState(false);
  const [calTplShowEmoji,setCalTplShowEmoji]=useState(false);
  const [newCalTpl,setNewCalTpl]=useState({title:"",icon:"✅",color:"#059669"});
  const [weekScheduleTemplates,setWeekScheduleTemplates]=useState(()=>loadJSON("rt_week_schedule_tpls",[]));
  const [savingWeekTpl,setSavingWeekTpl]=useState(false);
  const [newWeekTplName,setNewWeekTplName]=useState("");

  const key=dk(date);
  const total=Object.values(routines).flat().length;

  useEffect(()=>{
    setDay(loadJSON(`rt_day_${key}`,{checked:{},energy:7,mood:"Goed",notes:""}));
  },[key]);

  useEffect(()=>{
    const checkDate=()=>{
      const now=new Date();
      const todayKey=dk(now);
      const currentKey=dk(date);
      if(currentKey!==todayKey){
        const yesterday=new Date(now);yesterday.setDate(now.getDate()-1);
        if(currentKey===dk(yesterday)) setDate(new Date());
      }
    };
    const onVisible=()=>{if(document.visibilityState==="visible")checkDate()};
    document.addEventListener("visibilitychange",onVisible);
    window.addEventListener("focus",checkDate);
    const interval=setInterval(checkDate,60000);
    return()=>{document.removeEventListener("visibilitychange",onVisible);window.removeEventListener("focus",checkDate);clearInterval(interval)};
  },[date]);

  useEffect(()=>{saveJSON("rt_routines",routines)},[routines]);
  useEffect(()=>{saveJSON("rt_cal_templates",calTemplates)},[calTemplates]);
  useEffect(()=>{saveJSON("rt_cal_events",calEvents)},[calEvents]);
  useEffect(()=>{saveJSON("rt_week_schedule_tpls",weekScheduleTemplates)},[weekScheduleTemplates]);
  useEffect(()=>{saveJSON("rt_settings",settings)},[settings]);
  useEffect(()=>{document.documentElement.dataset.theme=settings.theme;
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute("content",settings.theme==="dark"?"#0f1311":"#064e3b");
  },[settings.theme]);

  /* ─── MELDINGEN ─── */
  useEffect(()=>{
    if(!settings.notifEnabled||typeof Notification==="undefined"||Notification.permission!=="granted")return;
    const lead=settings.notifLeadMin||0;
    const body=(ev)=>`${ev.startTime}–${ev.endTime}${ev.desc?" · "+ev.desc:""}`;
    const titleOf=(ev)=>`${ev.icon||"🔔"} ${ev.title}`;
    const hasTriggers=typeof window!=="undefined"&&"TimestampTrigger"in window;

    /* (A) Best-effort: vooraf inplannen via de service worker — werkt (op ondersteunde
       Android-toestellen) ook als de app dicht is. */
    if(hasTriggers&&navigator.serviceWorker){
      let cancelled=false;
      navigator.serviceWorker.ready.then(reg=>{
        if(cancelled)return;
        const schedule=()=>{
          const now=Date.now();
          for(let i=0;i<14;i++){
            const d=new Date();d.setDate(d.getDate()+i);
            eventsOnDate(calEvents,d).forEach(ev=>{
              const[h,m]=(ev.startTime||"00:00").split(":").map(Number);
              const fire=new Date(d);fire.setHours(h,m,0,0);fire.setMinutes(fire.getMinutes()-lead);
              const ts=fire.getTime();
              if(ts>now+1500){
                try{reg.showNotification(titleOf(ev),{body:body(ev),tag:`rt_${ev.id}_${dk(d)}`,icon:"/icon-192.png",badge:"/icon-192.png",showTrigger:new TimestampTrigger(ts)}).catch(()=>{})}catch{}
              }
            });
          }
        };
        // verouderde geplande meldingen opruimen, dan opnieuw inplannen
        if(reg.getNotifications){
          reg.getNotifications({includeTriggered:false}).then(list=>{
            if(cancelled)return;
            list.forEach(n=>{if(n.tag&&n.tag.startsWith("rt_"))n.close()});
            schedule();
          }).catch(()=>{if(!cancelled)schedule()});
        }else schedule();
      }).catch(()=>{});
      return()=>{cancelled=true};
    }

    /* (B) Fallback (o.a. iOS): alleen terwijl de app open is. */
    const fire=(ev)=>{
      try{
        if(navigator.serviceWorker){
          navigator.serviceWorker.ready.then(reg=>reg.showNotification(titleOf(ev),{body:body(ev),tag:ev.id,icon:"/icon-192.png",badge:"/icon-192.png"})).catch(()=>{new Notification(titleOf(ev),{body:body(ev)})});
        }else{new Notification(titleOf(ev),{body:body(ev)})}
      }catch{}
    };
    const check=()=>{
      const now=new Date();
      const notifiedKey=`rt_notified_${dk(now)}`;
      const notified=loadJSON(notifiedKey,[]);
      const nowMin=now.getHours()*60+now.getMinutes();
      let changed=false;
      eventsOnDate(calEvents,now).forEach(ev=>{
        if(notified.includes(ev.id))return;
        const[h,m]=(ev.startTime||"00:00").split(":").map(Number);
        const fireMin=h*60+m-lead;
        if(nowMin>=fireMin&&nowMin<=fireMin+2){fire(ev);notified.push(ev.id);changed=true}
      });
      if(changed)saveJSON(notifiedKey,notified);
      for(let i=localStorage.length-1;i>=0;i--){
        const k=localStorage.key(i);
        if(k&&k.startsWith("rt_notified_")&&k!==notifiedKey)localStorage.removeItem(k);
      }
    };
    check();
    const iv=setInterval(check,30000);
    return()=>clearInterval(iv);
  },[settings.notifEnabled,settings.notifLeadMin,calEvents]);

  const saveDay=(data)=>{setDay(data);saveJSON(`rt_day_${key}`,data)};

  const toggle=(id)=>{
    const next={...day,checked:{...day.checked,[id]:!day.checked[id]}};
    saveDay(next);
    if(!day.checked[id]){setPop(id);setTimeout(()=>setPop(null),500)}
  };

  const go=(n)=>{const d=new Date(date);d.setDate(d.getDate()+n);setDate(d)};

  const checked=day.checked||{};
  const totalDone=Object.values(checked).filter(Boolean).length;
  const pctTotal=total>0?Math.round((totalDone/total)*100):0;
  const pDone=(p)=>routines[p].filter(r=>checked[r.id]).length;
  const pPct=(p)=>routines[p].length>0?Math.round((pDone(p)/routines[p].length)*100):0;

  const streak=(()=>{
    const threshold=Math.max(1,Math.ceil(total*((settings.streakPct||50)/100)));
    let s=0;const d=new Date();
    const todayCount=Object.values(checked).filter(Boolean).length;
    if(isToday(date)&&todayCount>=threshold)s++;
    else if(!isToday(date)){
      const t=loadJSON(`rt_day_${dk(new Date())}`,null);
      if(t?.checked&&Object.values(t.checked).filter(Boolean).length>=threshold)s++;
    }
    d.setDate(d.getDate()-1);
    for(let i=0;i<365;i++){
      const data=loadJSON(`rt_day_${dk(d)}`,null);
      const done=data?.checked?Object.values(data.checked).filter(Boolean).length:0;
      if(done<threshold)break;
      s++;d.setDate(d.getDate()-1);
    }
    return s;
  })();

  const addRoutine=(period)=>{
    if(!newR.name.trim())return;
    const r={id:uid(),name:newR.name.trim(),icon:newR.icon,area:newR.area,desc:(newR.desc||"").trim()};
    setRoutines(prev=>({...prev,[period]:[...prev[period],r]}));
    setNewR({name:"",icon:"✅",area:"Zelfzorg",desc:""});
    setAddingTo(null);
  };

  const deleteRoutine=(period,id)=>{
    if(!confirm("Weet je zeker dat je deze routine wilt verwijderen?"))return;
    setRoutines(prev=>({...prev,[period]:prev[period].filter(r=>r.id!==id)}));
  };

  const renameRoutine=(period,id,newName,newIcon,newArea,newDesc)=>{
    setRoutines(prev=>({...prev,[period]:prev[period].map(r=>r.id===id?{...r,name:newName,icon:newIcon,area:newArea,desc:(newDesc||"").trim()}:r)}));
    setEditingRoutine(null);
  };

  const reorderRoutine=(period,from,to)=>{
    setRoutines(prev=>({...prev,[period]:arrMove(prev[period],from,to)}));
  };

  const toggleNotifications=async()=>{
    if(typeof Notification==="undefined"){alert("Meldingen worden niet ondersteund door deze browser.");return}
    if(settings.notifEnabled){setSettings(s=>({...s,notifEnabled:false}));return}
    let perm=Notification.permission;
    if(perm!=="granted")perm=await Notification.requestPermission();
    setNotifPerm(perm);
    if(perm==="granted"){
      setSettings(s=>({...s,notifEnabled:true}));
      try{new Notification("🔔 Meldingen aan",{body:"Je krijgt nu herinneringen voor je weekplanning."})}catch{}
    }else{
      alert("Meldingen zijn geblokkeerd. Sta ze toe in de browser-/app-instellingen om herinneringen te krijgen.");
    }
  };

  const resetRoutines=()=>{
    if(confirm("Alle routines terugzetten naar standaard? Je dagdata blijft bewaard.")){
      setRoutines(DEFAULT_ROUTINES);
    }
  };

  const getAllDays=()=>{
    const all={};
    for(let i=0;i<365;i++){
      const d=new Date();d.setDate(d.getDate()-i);
      const data=loadJSON(`rt_day_${dk(d)}`,null);
      if(data)all[dk(d)]=data;
    }
    return all;
  };

  const exportData=()=>{
    const allDays={};
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k&&k.startsWith("rt_day_")){
        const data=loadJSON(k,null);
        if(data)allDays[k.replace("rt_day_","")]=data;
      }
    }
    const payload={version:4,exportedAt:new Date().toISOString(),routines,calTemplates,calEvents,weekScheduleTemplates,settings,days:allDays};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=`routine-backup-${dk(new Date())}.json`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportRoutines=()=>{
    const payload={version:1,exportedAt:new Date().toISOString(),type:"routines",routines};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=`routines-${dk(new Date())}.json`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportWeekplanning=()=>{
    const payload={version:1,exportedAt:new Date().toISOString(),type:"weekplanning",calTemplates,calEvents,weekScheduleTemplates};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=`weekplanning-${dk(new Date())}.json`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData=(file)=>{
    const reader=new FileReader();
    reader.onload=(e)=>{
      try{
        const data=JSON.parse(e.target.result);
        const type=data.type||"full";
        if(!data.routines&&!data.days&&!data.calEvents&&!data.weekScheduleTemplates){alert("❌ Ongeldig backup bestand.");return}

        if(type==="routines"){
          if(!data.routines){alert("❌ Geen routines gevonden in dit bestand.");return}
          saveJSON("rt_routines",data.routines);setRoutines(data.routines);
          alert("✓ Routines geïmporteerd.");return;
        }
        if(type==="weekplanning"){
          if(data.calTemplates){saveJSON("rt_cal_templates",data.calTemplates);setCalTemplates(data.calTemplates)}
          if(data.calEvents){saveJSON("rt_cal_events",data.calEvents);setCalEvents(data.calEvents)}
          if(data.weekScheduleTemplates){saveJSON("rt_week_schedule_tpls",data.weekScheduleTemplates);setWeekScheduleTemplates(data.weekScheduleTemplates)}
          alert("✓ Weekplanning geïmporteerd.");return;
        }

        if(!data.routines||!data.days){alert("❌ Ongeldig backup bestand.");return}
        const mode=confirm("OK = Samenvoegen\nAnnuleer = Volledig vervangen");
        if(!mode){
          const keysToDelete=[];
          for(let i=0;i<localStorage.length;i++){
            const k=localStorage.key(i);
            if(k&&(k.startsWith("rt_day_")||["rt_routines","rt_cal_templates","rt_cal_events","rt_week_schedule_tpls"].includes(k)))keysToDelete.push(k);
          }
          keysToDelete.forEach(k=>localStorage.removeItem(k));
        }
        saveJSON("rt_routines",data.routines);setRoutines(data.routines);
        if(data.calTemplates){saveJSON("rt_cal_templates",data.calTemplates);setCalTemplates(data.calTemplates)}
        if(data.calEvents){saveJSON("rt_cal_events",data.calEvents);setCalEvents(data.calEvents)}
        if(data.weekScheduleTemplates){saveJSON("rt_week_schedule_tpls",data.weekScheduleTemplates);setWeekScheduleTemplates(data.weekScheduleTemplates)}
        if(data.settings){const merged={...DEFAULT_SETTINGS,...data.settings};saveJSON("rt_settings",merged);setSettings(merged)}
        Object.entries(data.days).forEach(([dateKey,dayData])=>{saveJSON(`rt_day_${dateKey}`,dayData)});
        setDay(loadJSON(`rt_day_${key}`,{checked:{},energy:7,mood:"Goed",notes:""}));
        alert(`✓ Import gelukt! ${Object.keys(data.days).length} dagen geïmporteerd.`);
      }catch(err){alert("❌ Fout bij importeren: "+err.message)}
    };
    reader.readAsText(file);
  };

  const clearAllDays=()=>{
    if(!confirm("⚠️ ALLE dagdata wissen?\n\nExporteer eerst een backup!"))return;
    if(!confirm("Weet je het écht zeker?"))return;
    const keysToDelete=[];
    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith("rt_day_"))keysToDelete.push(k)}
    keysToDelete.forEach(k=>localStorage.removeItem(k));
    setDay({checked:{},energy:7,mood:"Goed",notes:""});
    alert(`✓ ${keysToDelete.length} dagen gewist.`);
  };

  const clearEverything=()=>{
    if(!confirm("⚠️⚠️ ALLES wissen? Exporteer eerst een backup!"))return;
    if(!confirm("Dit is DEFINITIEF. Doorgaan?"))return;
    const keysToDelete=[];
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k&&(k.startsWith("rt_day_")||k.startsWith("rt_notified_")||["rt_routines","rt_cal_templates","rt_cal_events","rt_week_schedule_tpls","rt_settings"].includes(k)))keysToDelete.push(k);
    }
    keysToDelete.forEach(k=>localStorage.removeItem(k));
    setRoutines(DEFAULT_ROUTINES);setCalTemplates(DEFAULT_CAL_TEMPLATES);setCalEvents([]);setWeekScheduleTemplates([]);setSettings({...DEFAULT_SETTINGS});
    setDay({checked:{},energy:7,mood:"Goed",notes:""});
    alert("✓ Alles gewist. App is gereset.");
  };

  const dataInfo=(()=>{
    let dayCount=0,bytes=0;
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k&&(k.startsWith("rt_day_")||["rt_routines","rt_cal_templates","rt_cal_events","rt_week_schedule_tpls"].includes(k))){
        const v=localStorage.getItem(k)||"";bytes+=k.length+v.length;
        if(k.startsWith("rt_day_"))dayCount++;
      }
    }
    return{dayCount,kb:(bytes/1024).toFixed(1)};
  })();

  const isCurrentWeek = dk(getMonday(date))===dk(getMonday(new Date()));

  return(
    <div style={{maxWidth:540,margin:"0 auto",background:"var(--bg)",minHeight:"100vh",paddingBottom:40}}>

      {/* HEADER */}
      <div style={{background:"linear-gradient(140deg,#064e3b 0%,#047857 100%)",padding:"22px 16px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <div style={{width:40,height:40,borderRadius:10,background:"rgba(255,255,255,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>📋</div>
            <div>
              <h1 style={{fontFamily:"var(--ff-head)",fontSize:20,fontWeight:800,color:"white"}}>Routine Tracker</h1>
              <p style={{fontSize:11,color:"rgba(255,255,255,.7)",marginTop:1}}>{fmtDate(date)}{isToday(date)?" — Vandaag":""}</p>
            </div>
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"flex-end"}}>
            {[["tracker","📝"],["week","📆"],["month","📅"],["stats","📊"],["settings","⚙️"]].map(([v,ic])=>(
              <button key={v} onClick={()=>{v==="settings"?setShowSettings(!showSettings):setView(v);if(v!=="settings")setShowSettings(false)}}
                style={{padding:"5px 8px",borderRadius:7,border:"1px solid rgba(255,255,255,.2)",
                  background:(view===v&&v!=="settings")||(v==="settings"&&showSettings)?"white":"rgba(255,255,255,.08)",
                  color:(view===v&&v!=="settings")||(v==="settings"&&showSettings)?"#064e3b":"white",
                  fontSize:12,fontWeight:600,transition:"all .2s"}}>{ic}</button>
            ))}
          </div>
        </div>
      </div>

      {/* SETTINGS PANEL */}
      {showSettings&&(
        <div style={{background:"var(--card)",borderBottom:"1px solid var(--border-mid)",padding:16,animation:"fadeUp .2s ease"}}>
          <h2 style={{fontFamily:"var(--ff-head)",fontSize:17,fontWeight:700,marginBottom:12}}>⚙️ Instellingen</h2>

          {/* WEERGAVE & MELDINGEN */}
          <div style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:12,marginBottom:14}}>
            <h3 style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:10}}>🎨 Weergave & Meldingen</h3>

            {/* Donkere modus */}
            <div style={{display:"flex",alignItems:"flex-start",gap:10,paddingBottom:12,borderBottom:"1px solid var(--border)"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>🌙 Donkere modus</div>
                <div style={{fontSize:10,color:"var(--text-muted)",marginTop:2,lineHeight:1.4}}>Schakelt de app naar een donker thema — rustiger voor je ogen 's avonds.</div>
              </div>
              <label className="switch" style={{marginTop:2}}>
                <input type="checkbox" checked={settings.theme==="dark"} onChange={e=>setSettings(s=>({...s,theme:e.target.checked?"dark":"light"}))}/>
                <span className="slider-tg"/>
              </label>
            </div>

            {/* Meldingen */}
            <div style={{display:"flex",alignItems:"flex-start",gap:10,paddingTop:12,paddingBottom:settings.notifEnabled?12:0,borderBottom:settings.notifEnabled?"1px solid var(--border)":"none"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>🔔 Meldingen weekplanning</div>
                <div style={{fontSize:10,color:"var(--text-muted)",marginTop:2,lineHeight:1.4}}>
                  Herinnering vóór een gepland event. Op Android (geïnstalleerde app) ook op de achtergrond; op iPhone alleen terwijl de app open is.
                  {notifPerm==="denied"&&<span style={{color:"#dc2626",display:"block",marginTop:2}}>⚠️ Geblokkeerd in browserinstellingen.</span>}
                  {notifPerm==="unsupported"&&<span style={{color:"#dc2626",display:"block",marginTop:2}}>⚠️ Niet ondersteund op dit apparaat.</span>}
                </div>
              </div>
              <label className="switch" style={{marginTop:2}}>
                <input type="checkbox" checked={settings.notifEnabled} onChange={toggleNotifications}/>
                <span className="slider-tg"/>
              </label>
            </div>
            {settings.notifEnabled&&(
              <div style={{paddingTop:12,paddingBottom:12,borderBottom:"1px solid var(--border)"}}>
                <label style={{fontSize:12,fontWeight:600,color:"var(--text)",display:"block",marginBottom:6}}>
                  ⏰ Tijd vooraf: {settings.notifLeadMin===0?"op starttijd":`${settings.notifLeadMin} min vooraf`}
                </label>
                <input type="range" min={0} max={60} step={5} value={settings.notifLeadMin}
                  onChange={e=>setSettings(s=>({...s,notifLeadMin:+e.target.value}))}/>
                <div style={{fontSize:10,color:"var(--text-muted)",marginTop:4,lineHeight:1.4}}>Hoeveel minuten vóór elk event je een melding krijgt.</div>
              </div>
            )}

            {/* Streak-drempel */}
            <div style={{paddingTop:12}}>
              <label style={{fontSize:12,fontWeight:600,color:"var(--text)",display:"block",marginBottom:6}}>
                🔥 Streak-drempel: {settings.streakPct}%
              </label>
              <input type="range" min={10} max={100} step={5} value={settings.streakPct}
                onChange={e=>setSettings(s=>({...s,streakPct:+e.target.value}))}/>
              <div style={{fontSize:10,color:"var(--text-muted)",marginTop:4,lineHeight:1.4}}>
                Minimaal {Math.max(1,Math.ceil(total*(settings.streakPct/100)))} van {total} routines afvinken telt als een voltooide dag voor je streak.
              </div>
            </div>
          </div>

          {/* BACKUP */}
          <div style={{background:"var(--accent-bg)",border:"1px solid var(--accent-border)",borderRadius:10,padding:12,marginBottom:14}}>
            <h3 style={{fontSize:13,fontWeight:700,color:"var(--accent-text)",marginBottom:8}}>💾 Backup & Data</h3>
            <div style={{marginBottom:6}}>
              <div style={{fontSize:10,fontWeight:600,color:"var(--text)",marginBottom:4}}>Alles in één</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                <button onClick={exportData} style={{padding:"8px",borderRadius:7,background:"#059669",color:"white",fontSize:12,fontWeight:600}}>📤 Exporteer alles</button>
                <label style={{padding:"8px",borderRadius:7,background:"#0369a1",color:"white",fontSize:12,fontWeight:600,textAlign:"center",cursor:"pointer"}}>
                  📥 Importeer
                  <input type="file" accept="application/json,.json" onChange={e=>{if(e.target.files?.[0]){importData(e.target.files[0]);e.target.value=""}}} style={{display:"none"}}/>
                </label>
              </div>
            </div>
            <div style={{borderTop:"1px solid var(--accent-border)",paddingTop:8,marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:600,color:"var(--text)",marginBottom:4}}>Losse export</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                <button onClick={exportRoutines} style={{padding:"7px 8px",borderRadius:7,background:"#d97706",color:"white",fontSize:11,fontWeight:600}}>📋 Export Routines</button>
                <button onClick={exportWeekplanning} style={{padding:"7px 8px",borderRadius:7,background:"#7c3aed",color:"white",fontSize:11,fontWeight:600}}>📆 Export Weekplanning</button>
              </div>
            </div>
            <div style={{fontSize:10,color:"var(--accent-text)",lineHeight:1.6}}>
              <div>📊 <b>{dataInfo.dayCount}</b> dagen · <b>{total}</b> routines · <b>{calTemplates.length}</b> templates · <b>{weekScheduleTemplates.length}</b> weekschema's · <b>{dataInfo.kb} KB</b></div>
              <div style={{opacity:.8}}>Alles staat lokaal op dit apparaat. Niemand kan meekijken.</div>
            </div>
          </div>

          {/* WEEKPLANNER TEMPLATES */}
          <div style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:12,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <h3 style={{fontFamily:"var(--ff-head)",fontSize:14,fontWeight:700}}>📅 Weekplanner Templates</h3>
              <button onClick={()=>{setCalTplForm(!calTplForm);setCalTplShowEmoji(false)}}
                style={{fontSize:11,padding:"3px 10px",borderRadius:6,background:calTplForm?"#dc2626":"#059669",color:"white",fontWeight:600}}>
                {calTplForm?"✕ Annuleer":"+ Nieuw"}
              </button>
            </div>
            <p style={{fontSize:11,color:"var(--text-muted)",marginBottom:10,lineHeight:1.5}}>
              Snelkeuze-activiteiten voor de weekkalender. Naam, icoon, kleur en optioneel een beschrijving — de tijd stel je in op de kalender zelf. Sleep met ⠿ om de volgorde te wijzigen.
            </p>

            {calTplForm&&(
              <div style={{background:"var(--accent-bg)",borderRadius:10,padding:12,marginBottom:10,animation:"fadeUp .2s ease"}}>
                <div style={{display:"flex",gap:6,marginBottom:8,alignItems:"center"}}>
                  <button onClick={()=>setCalTplShowEmoji(!calTplShowEmoji)}
                    style={{width:36,height:36,borderRadius:7,border:"1.5px solid var(--border)",background:"var(--card)",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{newCalTpl.icon}</button>
                  <input type="text" value={newCalTpl.title} onChange={e=>setNewCalTpl(p=>({...p,title:e.target.value}))}
                    placeholder="Template naam..." style={{flex:1,padding:"7px 10px",borderRadius:7,border:"1px solid var(--border)",fontSize:13,outline:"none"}}/>
                </div>
                <input type="text" value={newCalTpl.desc||""} onChange={e=>setNewCalTpl(p=>({...p,desc:e.target.value}))}
                  placeholder="Beschrijving (optioneel)..." style={{width:"100%",marginBottom:8,padding:"7px 10px",borderRadius:7,border:"1px solid var(--border)",fontSize:12,outline:"none"}}/>
                {calTplShowEmoji&&(
                  <div style={{marginBottom:8}}>
                    <EmojiPicker value={newCalTpl.icon} onPick={e=>{setNewCalTpl(p=>({...p,icon:e}));setCalTplShowEmoji(false)}} size={26} height={130}/>
                  </div>
                )}
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:11,fontWeight:600,color:"var(--text)",marginBottom:5}}>Kleur</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {EVENT_COLORS.map(c=>(
                      <button key={c} onClick={()=>setNewCalTpl(p=>({...p,color:c}))}
                        style={{width:24,height:24,borderRadius:12,background:c,border:newCalTpl.color===c?"3px solid var(--text)":"2px solid transparent",flexShrink:0}}/>
                    ))}
                  </div>
                </div>
                <button onClick={()=>{
                  if(!newCalTpl.title.trim())return;
                  setCalTemplates(prev=>[...prev,{id:uid(),title:newCalTpl.title.trim(),icon:newCalTpl.icon,color:newCalTpl.color,desc:(newCalTpl.desc||"").trim()}]);
                  setNewCalTpl({title:"",icon:"✅",color:"#059669",desc:""});
                  setCalTplForm(false);setCalTplShowEmoji(false);
                }} style={{width:"100%",padding:"8px",borderRadius:8,background:"#059669",color:"white",fontWeight:600,fontSize:13}}>
                  ✓ Template Toevoegen
                </button>
              </div>
            )}

            {calTemplates.length===0&&!calTplForm&&(
              <div style={{textAlign:"center",padding:"14px 0",color:"var(--text-faint)",fontSize:12}}>Nog geen templates.</div>
            )}
            <SortableTemplateList items={calTemplates}
              onReorder={(from,to)=>setCalTemplates(prev=>arrMove(prev,from,to))}
              onDelete={(id)=>setCalTemplates(prev=>prev.filter(x=>x.id!==id))}/>
          </div>

          {/* WEEKSCHEMA TEMPLATES */}
          <div style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:12,marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <h3 style={{fontFamily:"var(--ff-head)",fontSize:14,fontWeight:700}}>📅 Weekschema Templates</h3>
              <button onClick={()=>{setSavingWeekTpl(!savingWeekTpl);setNewWeekTplName("")}}
                style={{fontSize:11,padding:"3px 10px",borderRadius:6,background:savingWeekTpl?"#dc2626":"#059669",color:"white",fontWeight:600}}>
                {savingWeekTpl?"✕ Annuleer":"💾 Huidig opslaan"}
              </button>
            </div>
            <p style={{fontSize:11,color:"var(--text-muted)",marginBottom:10,lineHeight:1.5}}>
              Sla je huidige weekplanning op als template en laad hem later in voor elke week.
            </p>
            {savingWeekTpl&&(
              <div style={{background:"var(--accent-bg)",borderRadius:10,padding:12,marginBottom:10,animation:"fadeUp .2s ease"}}>
                <input type="text" value={newWeekTplName} onChange={e=>setNewWeekTplName(e.target.value)}
                  placeholder="Naam voor dit weekschema..." style={{width:"100%",padding:"8px 10px",borderRadius:7,border:"1px solid var(--border)",fontSize:13,outline:"none",marginBottom:8}}/>
                <p style={{fontSize:10,color:"var(--text-muted)",marginBottom:8}}>Slaat alle events van de huidige week op ({calEvents.filter(e=>dk(getMonday(date))<=e.date&&e.date<=dk(new Date(getMonday(date).getTime()+6*86400000))).length} events).</p>
                <button onClick={()=>{
                  if(!newWeekTplName.trim())return;
                  const mon=getMonday(date);
                  const sun=new Date(mon);sun.setDate(mon.getDate()+6);
                  const monStr=dk(mon),sunStr=dk(sun);
                  const weekEvents=calEvents.filter(e=>e.date>=monStr&&e.date<=sunStr);
                  const dayOffset=(ev)=>{const d=new Date(ev.date+"T00:00");return Math.round((d-mon)/86400000)};
                  const tplEvents=weekEvents.map(ev=>({...ev,id:uid(),dayOffset:dayOffset(ev)}));
                  setWeekScheduleTemplates(prev=>[...prev,{id:uid(),name:newWeekTplName.trim(),createdAt:new Date().toISOString(),events:tplEvents}]);
                  setSavingWeekTpl(false);setNewWeekTplName("");
                }} style={{width:"100%",padding:"8px",borderRadius:8,background:"#059669",color:"white",fontWeight:600,fontSize:13}}>
                  💾 Opslaan als template
                </button>
              </div>
            )}
            {weekScheduleTemplates.length===0&&!savingWeekTpl&&(
              <div style={{textAlign:"center",padding:"14px 0",color:"var(--text-faint)",fontSize:12}}>Nog geen weekschema templates.</div>
            )}
            {weekScheduleTemplates.map(tpl=>(
              <div key={tpl.id} style={{background:"var(--card)",borderRadius:8,padding:"10px 12px",marginBottom:6,boxShadow:"0 1px 2px var(--shadow)",border:"1px solid var(--border)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontSize:14}}>📅</span>
                  <span style={{flex:1,fontSize:13,fontWeight:600,color:"var(--text)"}}>{tpl.name}</span>
                  <span style={{fontSize:9,color:"var(--text-faint)"}}>{tpl.events.length} events</span>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>{
                    if(!confirm(`Template "${tpl.name}" inladen voor deze week?\n\nBestaande events van deze week worden NIET gewist — de template wordt toegevoegd.`))return;
                    const newEvs=applyWeekTemplate(tpl,getMonday(date));
                    setCalEvents(prev=>[...prev,...newEvs]);
                    alert(`✓ ${newEvs.length} events toegevoegd voor deze week.`);
                  }} style={{flex:1,padding:"6px 8px",borderRadius:6,background:"#059669",color:"white",fontSize:11,fontWeight:600}}>
                    ▶ Inladen deze week
                  </button>
                  <button onClick={()=>{
                    if(!confirm(`Template "${tpl.name}" verwijderen?`))return;
                    setWeekScheduleTemplates(prev=>prev.filter(t=>t.id!==tpl.id));
                  }} style={{padding:"6px 8px",borderRadius:6,background:"var(--danger-bg)",border:"1px solid var(--danger-border)",color:"#dc2626",fontSize:11,fontWeight:600}}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ROUTINES */}
          <div style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:12,marginBottom:14}}>
            <h3 style={{fontFamily:"var(--ff-head)",fontSize:14,fontWeight:700}}>📋 Routines Beheren</h3>
            <p style={{fontSize:11,color:"var(--text-muted)",marginTop:2,lineHeight:1.4}}>Sleep met ⠿ om de volgorde te wijzigen. Tik ✏️ om naam, icoon en beschrijving te bewerken.</p>

          {Object.entries(PERIOD_LABELS).map(([period,label])=>{
            const isOpen=openPeriods[period];
            return(
            <div key={period} style={{marginTop:12,borderTop:"1px solid var(--border)",paddingTop:10}}>
              <div onClick={()=>setOpenPeriods(p=>({...p,[period]:!p[period]}))} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
                <h3 style={{fontSize:14,fontWeight:700,color:PERIOD_COLORS[period],display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:11,color:"var(--text-faint)",display:"inline-block",transition:"transform .2s",transform:isOpen?"rotate(90deg)":"none"}}>▸</span>
                  {label}<span style={{fontSize:11,fontWeight:600,color:"var(--text-faint)"}}>({routines[period].length})</span>
                </h3>
                <button onClick={e=>{e.stopPropagation();setOpenPeriods(p=>({...p,[period]:true}));setAddingTo(addingTo===period?null:period)}}
                  style={{fontSize:11,padding:"3px 10px",borderRadius:6,background:addingTo===period?"#dc2626":"#059669",color:"white",fontWeight:600}}>
                  {addingTo===period?"✕ Annuleer":"+ Toevoegen"}
                </button>
              </div>
              {isOpen&&(<div style={{marginTop:8}}>
              {addingTo===period&&(
                <div style={{background:"var(--accent-bg)",borderRadius:10,padding:12,marginBottom:8,animation:"fadeUp .2s ease"}}>
                  <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                    <input type="text" value={newR.name} onChange={e=>setNewR(p=>({...p,name:e.target.value}))}
                      placeholder="Routine naam..." style={{flex:1,minWidth:120,padding:"7px 10px",borderRadius:7,border:"1px solid var(--border)",fontSize:13,outline:"none"}}/>
                    <select value={newR.area} onChange={e=>setNewR(p=>({...p,area:e.target.value}))}
                      style={{padding:"7px 8px",borderRadius:7,border:"1px solid var(--border)",fontSize:12,background:"var(--card)"}}>
                      {AREAS.map(a=><option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <input type="text" value={newR.desc||""} onChange={e=>setNewR(p=>({...p,desc:e.target.value}))}
                    placeholder="Beschrijving (optioneel)..." style={{width:"100%",marginBottom:8,padding:"7px 10px",borderRadius:7,border:"1px solid var(--border)",fontSize:12,outline:"none"}}/>
                  <div style={{marginBottom:8}}>
                    <EmojiPicker value={newR.icon} onPick={e=>setNewR(p=>({...p,icon:e}))}/>
                  </div>
                  <button onClick={()=>addRoutine(period)}
                    style={{width:"100%",padding:"8px",borderRadius:8,background:"#059669",color:"white",fontWeight:600,fontSize:13}}>
                    ✓ Toevoegen aan {label}
                  </button>
                </div>
              )}
              <SortableRoutineList period={period} items={routines[period]}
                editingId={editingRoutine} setEditingId={setEditingRoutine}
                onSave={renameRoutine} onDelete={deleteRoutine}
                onReorder={(from,to)=>reorderRoutine(period,from,to)}/>
              </div>)}
            </div>
            );
          })}
          </div>

          {/* DANGER ZONE */}
          <div style={{background:"var(--danger-bg)",border:"1px solid var(--danger-border)",borderRadius:10,padding:12,marginTop:4}}>
            <h3 style={{fontSize:13,fontWeight:700,color:"var(--danger-text)",marginBottom:8}}>⚠️ Gevarenzone</h3>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <button onClick={resetRoutines} style={{padding:"8px",borderRadius:7,background:"var(--card)",border:"1px solid var(--danger-border)",color:"var(--danger-text)",fontSize:11,fontWeight:600,textAlign:"left"}}>
                🔄 Reset routines naar standaard <span style={{opacity:.7,fontWeight:400}}>(dagdata blijft)</span>
              </button>
              <button onClick={clearAllDays} style={{padding:"8px",borderRadius:7,background:"var(--card)",border:"1px solid var(--danger-border)",color:"var(--danger-text)",fontSize:11,fontWeight:600,textAlign:"left"}}>
                🗑️ Wis alle dagdata <span style={{opacity:.7,fontWeight:400}}>(routines blijven)</span>
              </button>
              <button onClick={clearEverything} style={{padding:"8px",borderRadius:7,background:"#dc2626",border:"1px solid #dc2626",color:"white",fontSize:11,fontWeight:700,textAlign:"left"}}>
                💥 Wis ALLES (reset naar fabrieksinstellingen)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DATE NAV */}
      {!showSettings&&(
        <div style={{display:"flex",justifyContent:"center",gap:10,padding:"12px 16px",background:"var(--card)",borderBottom:"1px solid var(--border-mid)"}}>
          <NavBtn onClick={()=>go(view==="week"?-7:-1)}>◀</NavBtn>
          <button onClick={()=>setDate(new Date())} style={{
            padding:"5px 16px",borderRadius:8,
            border:(view==="week"?isCurrentWeek:isToday(date))?"2px solid #059669":"1px solid var(--border)",
            background:(view==="week"?isCurrentWeek:isToday(date))?"var(--sel-bg)":"var(--card)",
            fontSize:13,fontWeight:600,
            color:(view==="week"?isCurrentWeek:isToday(date))?"#059669":"#6b7280"}}>
            {view==="week"?"Deze week":"Vandaag"}
          </button>
          <NavBtn onClick={()=>go(view==="week"?7:1)}>▶</NavBtn>
        </div>
      )}

      {/* TRACKER */}
      {view==="tracker"&&!showSettings&&(
        <div style={{animation:"fadeUp .3s ease"}}>
          <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 12px",background:"var(--card)",margin:"10px 12px",borderRadius:14,boxShadow:"0 1px 4px var(--shadow)",flexWrap:"wrap"}}>
            <Ring value={pctTotal} size={84} label="Totaal"/>
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:6,minWidth:150}}>
              {Object.entries(PERIOD_LABELS).map(([k,label])=>(
                <div key={k} style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:11,minWidth:78,color:"var(--text)"}}>{label}</span>
                  <div style={{flex:1,height:5,borderRadius:3,background:"var(--border-soft)"}}>
                    <div style={{height:"100%",borderRadius:3,width:`${pPct(k)}%`,background:PERIOD_COLORS[k],transition:"width .4s ease"}}/>
                  </div>
                  <span style={{fontSize:10,fontWeight:700,minWidth:26,textAlign:"right",color:"var(--text-muted)"}}>{pDone(k)}/{routines[k].length}</span>
                </div>
              ))}
              <div style={{display:"flex",alignItems:"center",gap:4,marginTop:1}}>
                <span style={{fontSize:16}}>🔥</span>
                <span style={{fontSize:12,fontWeight:700,color:"#059669"}}>{streak} dag{streak!==1?"en":""} streak</span>
              </div>
            </div>
          </div>

          <div className="period-tabs" style={{display:"flex",gap:4,padding:"0 12px",marginBottom:5}}>
            {Object.entries(PERIOD_LABELS).map(([k,label])=>{
              const active=tab===k;const col=PERIOD_COLORS[k];
              return(
                <button key={k} onClick={()=>setTab(k)} style={{
                  flex:1,padding:"8px 4px",borderRadius:9,
                  border:active?`2px solid ${col}`:"2px solid transparent",
                  background:active?"var(--card)":"var(--card2)",color:active?col:"var(--text-faint)",
                  fontSize:12,fontWeight:700,transition:"all .2s",
                  boxShadow:active?"0 2px 8px rgba(0,0,0,.06)":"none",
                  display:"flex",flexDirection:"column",alignItems:"center",gap:1
                }}>
                  {label}
                  <span style={{fontSize:10,fontWeight:600,opacity:.7}}>{pDone(k)}/{routines[k].length}</span>
                </button>
              );
            })}
          </div>

          <div style={{padding:"0 12px",display:"flex",flexDirection:"column",gap:4,marginBottom:12}}>
            {routines[tab].map((r,i)=>{
              const done=!!checked[r.id];const a=AREA_STYLES[r.area]||AREA_STYLES.Zelfzorg;
              return(
                <div key={r.id} className="routine-item" onClick={()=>toggle(r.id)} style={{
                  display:"flex",alignItems:"center",gap:9,padding:"10px 11px",borderRadius:11,
                  borderLeft:`4px solid ${a.border}`,background:done?a.bg:"var(--card)",
                  boxShadow:"0 1px 2px var(--shadow)",cursor:"pointer",transition:"all .15s",
                  animation:`fadeUp .2s ease ${i*0.025}s both`,opacity:done?.8:1
                }}>
                  <div style={{
                    width:22,height:22,borderRadius:6,border:`2px solid ${done?a.text:"var(--border)"}`,
                    background:done?a.text:"var(--card)",display:"flex",alignItems:"center",justifyContent:"center",
                    flexShrink:0,transition:"all .2s",animation:pop===r.id?"pop .35s ease":"none"
                  }}>
                    {done&&<span style={{color:"white",fontSize:13,lineHeight:1}}>✓</span>}
                  </div>
                  <span style={{fontSize:15,flexShrink:0}}>{r.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,color:done?"var(--text-faint)":"var(--text)",textDecoration:done?"line-through":"none"}}>{r.name}</div>
                    {r.desc&&<div style={{fontSize:10,color:"var(--text-muted)",marginTop:1,opacity:done?.7:1}}>{r.desc}</div>}
                  </div>
                  <span style={{fontSize:9,padding:"2px 6px",borderRadius:99,background:a.tag,color:a.text,fontWeight:600,whiteSpace:"nowrap"}}>{r.area}</span>
                </div>
              );
            })}
          </div>

          <div style={{display:"flex",gap:12,padding:12,background:"var(--card)",margin:"0 12px 8px",borderRadius:12,boxShadow:"0 1px 3px var(--shadow)",flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:130}}>
              <label style={{fontSize:11,fontWeight:600,color:"var(--text)",display:"block",marginBottom:5}}>⚡ Energie: {day.energy}/10</label>
              <input type="range" min={1} max={10} value={day.energy} onChange={e=>{const v=+e.target.value;saveDay({...day,energy:v})}}/>
            </div>
            <div style={{flex:1,minWidth:190}}>
              <label style={{fontSize:11,fontWeight:600,color:"var(--text)",display:"block",marginBottom:5}}>Hoe voel je je?</label>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {MOODS.map(m=>(
                  <button key={m.value} onClick={()=>saveDay({...day,mood:m.value})} style={{
                    display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"4px 7px",
                    borderRadius:7,border:day.mood===m.value?"2px solid #059669":"1.5px solid var(--border)",
                    background:day.mood===m.value?"var(--sel-bg)":"var(--card)",transition:"all .15s"
                  }}>
                    <span style={{fontSize:16}}>{m.emoji}</span>
                    <span style={{fontSize:8,fontWeight:600,color:day.mood===m.value?"#059669":"var(--text-faint)"}}>{m.value}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{padding:"0 12px 16px"}}>
            <div style={{background:"var(--card)",borderRadius:12,padding:14,boxShadow:"0 1px 3px var(--shadow)"}}>
              <label style={{fontSize:12,fontWeight:600,color:"var(--text)",display:"flex",alignItems:"center",gap:4,marginBottom:8}}>📝 Notities & Reflecties</label>
              <textarea value={day.notes||""} onChange={e=>saveDay({...day,notes:e.target.value})}
                placeholder={"Hoe was je dag?\nWat ging goed? Wat kan beter?\nWaar ben je dankbaar voor?"}
                rows={4} style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid var(--border)",fontSize:13,lineHeight:1.6,outline:"none",background:"var(--input-bg)",resize:"vertical",minHeight:90,transition:"border-color .2s",color:"var(--text)"}}
                onFocus={e=>e.target.style.borderColor="#059669"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              {day.notes&&<div style={{marginTop:6,fontSize:10,color:"var(--text-faint)",textAlign:"right"}}>{day.notes.length} tekens</div>}
            </div>
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {view==="week"&&!showSettings&&(
        <WeekView date={date} calTemplates={calTemplates} calEvents={calEvents} setCalEvents={setCalEvents} weekScheduleTemplates={weekScheduleTemplates}/>
      )}

      {/* MONTH VIEW */}
      {view==="month"&&!showSettings&&<MonthView date={date} setDate={setDate} setView={setView} routines={routines}/>}

      {/* STATS VIEW */}
      {view==="stats"&&!showSettings&&<StatsView routines={routines} getAllDays={getAllDays}/>}
    </div>
  );
}

/* ─── EDIT ROW ─── */
function EditRow({r,period,onSave,onCancel}){
  const [name,setName]=useState(r.name);
  const [icon,setIcon]=useState(r.icon);
  const [area,setArea]=useState(r.area);
  const [desc,setDesc]=useState(r.desc||"");
  const [showEmoji,setShowEmoji]=useState(false);
  return(
    <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap",flex:1}}>
      <button onClick={()=>setShowEmoji(!showEmoji)} style={{fontSize:16,background:"none",padding:2}}>{icon}</button>
      <input type="text" value={name} onChange={e=>setName(e.target.value)}
        style={{flex:1,minWidth:80,padding:"4px 6px",borderRadius:5,border:"1px solid var(--border)",fontSize:12,outline:"none"}}/>
      <select value={area} onChange={e=>setArea(e.target.value)} style={{padding:"4px",borderRadius:5,border:"1px solid var(--border)",fontSize:10,background:"var(--card)"}}>
        {AREAS.map(a=><option key={a} value={a}>{a}</option>)}
      </select>
      <button onClick={()=>onSave(period,r.id,name,icon,area,desc)} style={{fontSize:10,color:"#059669",background:"var(--sel-bg)",padding:"3px 6px",borderRadius:4,fontWeight:600}}>✓</button>
      <button onClick={onCancel} style={{fontSize:10,color:"var(--text-muted)",background:"var(--input-bg)",padding:"3px 6px",borderRadius:4}}>✕</button>
      <input type="text" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Beschrijving (optioneel)..."
        style={{width:"100%",marginTop:4,padding:"5px 8px",borderRadius:5,border:"1px solid var(--border)",fontSize:11,outline:"none"}}/>
      {showEmoji&&(
        <div style={{width:"100%",marginTop:4}}>
          <EmojiPicker value={icon} onPick={e=>{setIcon(e);setShowEmoji(false)}} size={26} height={130}/>
        </div>
      )}
    </div>
  );
}

/* ─── SORTEERBARE TEMPLATE-LIJST ─── */
function SortableTemplateList({items,onReorder,onDelete}){
  const {ref,dragId,onHandleDown}=useSortable(onReorder);
  if(items.length===0)return null;
  return(
    <div ref={ref}>
      {items.map((t)=>(
        <div key={t.id} data-srow="1" data-sid={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,
          background:"var(--card)",borderLeft:`3px solid ${t.color}`,marginBottom:4,boxShadow:"0 1px 2px var(--shadow)"}}
          className={dragId===t.id?"dragging":""}>
          <DragHandle onPointerDown={(e)=>onHandleDown(e,items.indexOf(t),t.id)}/>
          <span style={{fontSize:15}}>{t.icon}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{t.title}</div>
            {t.desc&&<div style={{fontSize:10,color:"var(--text-muted)",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.desc}</div>}
          </div>
          <div style={{width:12,height:12,borderRadius:6,background:t.color,flexShrink:0}}/>
          <button onClick={()=>onDelete(t.id)}
            style={{fontSize:12,background:"var(--danger-bg)",padding:"4px 6px",borderRadius:5}}>🗑️</button>
        </div>
      ))}
    </div>
  );
}

/* ─── SORTEERBARE ROUTINE-LIJST ─── */
function SortableRoutineList({period,items,editingId,setEditingId,onSave,onDelete,onReorder}){
  const {ref,dragId,onHandleDown}=useSortable(onReorder);
  return(
    <div ref={ref}>
      {items.map((r)=>{
        const isEditing=editingId===r.id;
        const a=AREA_STYLES[r.area]||AREA_STYLES.Zelfzorg;
        return(
          <div key={r.id} data-srow="1" data-sid={r.id} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px",borderRadius:8,
            background:isEditing?"var(--card2)":"var(--card)",borderLeft:`3px solid ${a.border}`,marginBottom:3,boxShadow:"0 1px 2px var(--shadow)"}}
            className={dragId===r.id?"dragging":""}>
            {isEditing?(
              <EditRow r={r} period={period} onSave={onSave} onCancel={()=>setEditingId(null)}/>
            ):(
              <>
                <DragHandle onPointerDown={(e)=>onHandleDown(e,items.indexOf(r),r.id)}/>
                <span style={{fontSize:14}}>{r.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,color:"var(--text)"}}>{r.name}</div>
                  {r.desc&&<div style={{fontSize:10,color:"var(--text-muted)",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.desc}</div>}
                </div>
                <span style={{fontSize:9,padding:"1px 6px",borderRadius:99,background:a.tag,color:a.text,fontWeight:600,flexShrink:0}}>{r.area}</span>
                <button onClick={()=>setEditingId(r.id)} style={{fontSize:12,background:"#eff6ff",padding:"4px 6px",borderRadius:5}}>✏️</button>
                <button onClick={()=>onDelete(period,r.id)} style={{fontSize:12,background:"var(--danger-bg)",padding:"4px 6px",borderRadius:5}}>🗑️</button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* events van één dag, inclusief herhalende events + uitzonderingen */
function eventsOnDate(events,d){
  const ds=dk(d), wd=d.getDay(), out=[];
  events.forEach(e=>{
    const rep=e.repeat||"none";
    if(rep==="none"){if(e.date===ds)out.push(e);return}
    if(ds<e.date)return;                              // vóór de startdatum
    if(e.exDates&&e.exDates.includes(ds))return;      // overgeslagen dag
    if(rep==="daily"){out.push({...e,date:ds,_recur:true});return}
    if(rep==="weekly"){
      const ed=new Date(e.date+"T00:00");
      if(ed.getDay()===wd)out.push({...e,date:ds,_recur:true});
    }
  });
  return out;
}

function applyWeekTemplate(tpl, targetMonday){
  return tpl.events.map(ev=>{
    const d=new Date(targetMonday);
    d.setDate(targetMonday.getDate()+Math.max(0,Math.min(6,ev.dayOffset||0)));
    return{...ev,id:uid(),date:dk(d)};
  });
}

function NavBtn({onClick,children}){
  return <button onClick={onClick} style={{width:34,height:34,borderRadius:8,border:"1px solid var(--border)",background:"var(--card)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,color:"var(--text)"}}>{children}</button>;
}

/* ─── ARRAY REORDER HELPER ─── */
function arrMove(arr,from,to){const a=[...arr];const[x]=a.splice(from,1);a.splice(to,0,x);return a}

/* ─── SORTABLE HOOK (touch-vriendelijk slepen, rijen schuiven live mee) ─── */
function useSortable(onReorder){
  const ref=React.useRef(null);
  const st=React.useRef(null);
  const [dragId,setDragId]=React.useState(null);
  const clearRows=()=>{
    const s=st.current;if(!s)return;
    s.rows.forEach(r=>{r.el.style.transform="";r.el.style.transition="";r.el.style.zIndex=""});
  };
  const onHandleDown=(e,index,id)=>{
    if(e.button!=null&&e.button!==0)return;
    const container=ref.current;if(!container)return;
    const els=[...container.querySelectorAll('[data-srow="1"]')];
    const rows=els.map(el=>{const b=el.getBoundingClientRect();return{el,center:b.top+b.height/2,height:b.height}});
    st.current={index,id,startY:e.clientY,rows,dragH:rows[index]?rows[index].height+3:48,dy:0,to:index};
    setDragId(id);
    try{e.target.setPointerCapture(e.pointerId)}catch{}
    e.preventDefault();
  };
  React.useEffect(()=>{
    if(dragId==null)return;
    const move=(e)=>{
      const s=st.current;if(!s)return;
      s.dy=e.clientY-s.startY;
      const cur=s.rows[s.index].center+s.dy;
      let to=0;
      for(let i=0;i<s.rows.length;i++){if(i===s.index)continue;if(s.rows[i].center<cur)to++}
      s.to=to;
      s.rows.forEach((r,i)=>{
        if(i===s.index){
          r.el.style.transition="none";
          r.el.style.transform=`translateY(${s.dy}px) scale(1.02)`;
          r.el.style.zIndex="50";
          return;
        }
        let shift=0;
        if(s.index<to&&i>s.index&&i<=to)shift=-s.dragH;
        else if(s.index>to&&i>=to&&i<s.index)shift=s.dragH;
        r.el.style.transition="";
        r.el.style.transform=shift?`translateY(${shift}px)`:"";
      });
    };
    const up=()=>{
      const s=st.current;
      if(s){clearRows();const{index,to}=s;st.current=null;setDragId(null);if(to!==index)onReorder(index,to);}
      else setDragId(null);
    };
    window.addEventListener("pointermove",move,{passive:false});
    window.addEventListener("pointerup",up);
    window.addEventListener("pointercancel",up);
    return()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up);window.removeEventListener("pointercancel",up)};
  },[dragId,onReorder]);
  return{ref,dragId,onHandleDown};
}

/* drag-handvat icoon */
function DragHandle({onPointerDown}){
  return <span className="drag-handle" onPointerDown={onPointerDown}
    style={{fontSize:15,color:"var(--text-faint)",padding:"4px 6px",borderRadius:5,userSelect:"none",lineHeight:1,touchAction:"none"}}>⠿</span>;
}

/* ─── ICOON-KIEZER (categorieën + zoeken) ─── */
function EmojiPicker({value,onPick,size=30,height=170}){
  const [q,setQ]=React.useState("");
  const [cat,setCat]=React.useState(0);
  const query=q.trim().toLowerCase();
  let emojis;
  if(query){
    const hits=EMOJI_CATEGORIES.filter(c=>(c.name+" "+c.kw).toLowerCase().includes(query));
    emojis=(hits.length?hits:EMOJI_CATEGORIES).flatMap(c=>c.emojis);
    emojis=[...new Set(emojis)];
  }else{
    emojis=EMOJI_CATEGORIES[cat].emojis;
  }
  return(
    <div style={{background:"var(--card)",borderRadius:8,border:"1px solid var(--border)",padding:6}}>
      <input type="text" value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Zoek (bv. sport, eten, gebed)..."
        style={{width:"100%",padding:"6px 9px",borderRadius:6,border:"1px solid var(--border)",fontSize:12,outline:"none",marginBottom:6,background:"var(--input-bg)"}}/>
      {!query&&(
        <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:5,marginBottom:5,borderBottom:"1px solid var(--border)",WebkitOverflowScrolling:"touch"}}>
          {EMOJI_CATEGORIES.map((c,i)=>(
            <button key={c.name} onClick={()=>setCat(i)}
              style={{flexShrink:0,fontSize:10,fontWeight:600,padding:"4px 9px",borderRadius:99,whiteSpace:"nowrap",
                border:cat===i?"1.5px solid #059669":"1px solid var(--border)",
                background:cat===i?"var(--sel-bg)":"var(--card)",color:cat===i?"var(--accent-text)":"var(--text-muted)"}}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:4,flexWrap:"wrap",maxHeight:height,overflowY:"auto",padding:2}}>
        {emojis.map((e,idx)=>(
          <button key={e+idx} onClick={()=>onPick(e)}
            style={{width:size,height:size,borderRadius:6,border:value===e?"2px solid #059669":"1px solid var(--border)",
              background:value===e?"var(--sel-bg)":"var(--card)",fontSize:size*.5,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{e}</button>
        ))}
        {emojis.length===0&&<div style={{fontSize:11,color:"var(--text-faint)",padding:8}}>Niets gevonden.</div>}
      </div>
    </div>
  );
}

/* tijd-helpers voor het slepen van events */
function tMin(t){const[h,m]=t.split(":").map(Number);return h*60+m}
function minT(m){let mm=Math.max(0,Math.min(1439,Math.round(m)));return `${String(Math.floor(mm/60)).padStart(2,"0")}:${String(mm%60).padStart(2,"0")}`}

/* ─── WEEK VIEW ─── */
function WeekView({date,calTemplates,calEvents,setCalEvents,weekScheduleTemplates}){
  const [modal,setModal]=useState(null);
  const [showTplPicker,setShowTplPicker]=useState(false);
  const gridRef=useRef(null);
  const dragRef=useRef(null);
  const [drag,setDrag]=useState(null); // {id,dx,dy} tijdens slepen

  const wStart=getMonday(date);
  const weekDays=Array.from({length:7},(_,i)=>{
    const d=new Date(wStart);d.setDate(wStart.getDate()+i);return d;
  });
  const HOURS=Array.from({length:CAL_END_H-CAL_START_H},(_,i)=>CAL_START_H+i);
  const gridH=(CAL_END_H-CAL_START_H)*CAL_HOUR_H;

  const eventsForDay=(d)=>eventsOnDate(calEvents,d);

  const timeToY=(time)=>{
    const[h,m]=time.split(":").map(Number);
    const hh=h===0?24:h;
    return Math.max(0,((hh-CAL_START_H)+m/60)*CAL_HOUR_H);
  };
  const blockH=(start,end)=>{
    const[sh,sm]=start.split(":").map(Number);
    let[eh,em]=end.split(":").map(Number);
    if(eh===0)eh=24;
    const mins=(eh*60+em)-(sh*60+sm);
    return Math.max(22,(mins/60)*CAL_HOUR_H);
  };

  const addEvent=(ev)=>{setCalEvents(prev=>[...prev,{...ev,id:uid()}]);setModal(null)};
  const updateEvent=(ev)=>{setCalEvents(prev=>prev.map(e=>e.id===ev.id?ev:e));setModal(null)};
  const deleteEvent=(id,opts)=>{
    if(opts&&opts.skipDate){
      setCalEvents(prev=>prev.map(e=>e.id===id?{...e,exDates:[...(e.exDates||[]),opts.skipDate]}:e));
    }else{
      setCalEvents(prev=>prev.filter(e=>e.id!==id));
    }
    setModal(null);
  };

  /* ── event slepen (tijd + dag) ── */
  const evDown=(e,ev)=>{
    if(e.button!=null&&e.button!==0)return;
    dragRef.current={id:ev.id,ev,startX:e.clientX,startY:e.clientY,dx:0,dy:0,moved:false};
    try{e.currentTarget.setPointerCapture(e.pointerId)}catch{}
  };
  const evMove=(e)=>{
    const s=dragRef.current;if(!s)return;
    const dx=e.clientX-s.startX,dy=e.clientY-s.startY;
    if(!s.moved&&Math.hypot(dx,dy)<6)return;
    s.moved=true;s.dx=dx;s.dy=dy;
    setDrag({id:s.id,dx,dy});
  };
  const evUp=(e,ev)=>{
    const s=dragRef.current;dragRef.current=null;
    if(!s)return;
    if(!s.moved){setDrag(null);setModal({mode:"edit",event:ev});return}
    let newDate=ev.date;
    const grid=gridRef.current;
    if(grid){
      const rect=grid.getBoundingClientRect();
      const colW=rect.width/7;
      let di=Math.floor((e.clientX-rect.left)/colW);
      di=Math.max(0,Math.min(6,di));
      newDate=dk(weekDays[di]);
    }
    let dur=tMin(ev.endTime)-tMin(ev.startTime);if(dur<=0)dur+=1440;
    const deltaMin=Math.round((s.dy/CAL_HOUR_H)*60/15)*15;
    let ns=tMin(ev.startTime)+deltaMin;
    ns=Math.max(CAL_START_H*60,Math.min(CAL_END_H*60-15,ns));
    let ne=Math.min(CAL_END_H*60,ns+dur);
    setDrag(null);
    setCalEvents(prev=>prev.map(x=>x.id===ev.id?{...x,date:newDate,startTime:minT(ns),endTime:minT(ne)}:x));
  };

  const we=new Date(wStart);we.setDate(wStart.getDate()+6);
  const weekLabel=`${wStart.getDate()} ${MONTHS_NL[wStart.getMonth()].substring(0,3)} – ${we.getDate()} ${MONTHS_NL[we.getMonth()].substring(0,3)} ${we.getFullYear()}`;

  return(
    <div style={{animation:"fadeUp .3s ease"}}>
      {/* Week label + template loader */}
      <div style={{padding:"8px 16px 4px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",letterSpacing:.3}}>{weekLabel}</div>
        {weekScheduleTemplates&&weekScheduleTemplates.length>0&&(
          <button onClick={()=>setShowTplPicker(!showTplPicker)}
            style={{fontSize:10,fontWeight:600,padding:"3px 9px",borderRadius:6,background:showTplPicker?"#dc2626":"#7c3aed",color:"white",border:"none",cursor:"pointer"}}>
            {showTplPicker?"✕ Sluiten":"📅 Template laden"}
          </button>
        )}
      </div>
      {showTplPicker&&weekScheduleTemplates&&weekScheduleTemplates.length>0&&(
        <div style={{margin:"0 12px 8px",background:"var(--purple-bg)",border:"1px solid var(--purple-border)",borderRadius:10,padding:10,animation:"fadeUp .2s ease"}}>
          <div style={{fontSize:11,fontWeight:600,color:"var(--purple-text)",marginBottom:7}}>Kies een weekschema:</div>
          {weekScheduleTemplates.map(tpl=>(
            <div key={tpl.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
              <span style={{flex:1,fontSize:12,fontWeight:600,color:"var(--text)"}}>{tpl.name}</span>
              <span style={{fontSize:9,color:"var(--text-faint)"}}>{tpl.events.length} ev.</span>
              <button onClick={()=>{
                if(!confirm(`"${tpl.name}" inladen voor deze week?\nBestaande events blijven staan.`))return;
                const newEvs=applyWeekTemplate(tpl,getMonday(date));
                setCalEvents(prev=>[...prev,...newEvs]);
                setShowTplPicker(false);
                alert(`✓ ${newEvs.length} events toegevoegd.`);
              }} style={{padding:"4px 9px",borderRadius:5,background:"#7c3aed",color:"white",fontSize:10,fontWeight:600,border:"none",cursor:"pointer"}}>
                ▶ Laden
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Calendar grid wrapper */}
      <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{minWidth:360}}>

          {/* Sticky day header */}
          <div style={{display:"flex",background:"var(--card)",borderBottom:"2px solid var(--border-mid)",position:"sticky",top:0,zIndex:10}}>
            <div style={{width:42,flexShrink:0}}/>
            {weekDays.map((d,i)=>{
              const today=isToday(d);
              return(
                <div key={i} style={{flex:1,padding:"6px 2px",textAlign:"center",borderLeft:"1px solid var(--border-soft)"}}>
                  <div style={{fontSize:10,fontWeight:600,color:"var(--text-faint)",lineHeight:1}}>{WEEK_DAYS_SHORT[i]}</div>
                  <div style={{
                    width:24,height:24,borderRadius:12,margin:"3px auto 0",
                    background:today?"#059669":"transparent",
                    display:"flex",alignItems:"center",justifyContent:"center"
                  }}>
                    <span style={{fontSize:12,fontWeight:700,color:today?"white":"var(--text)"}}>{d.getDate()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid body */}
          <div style={{position:"relative",height:gridH,background:"var(--card)"}}>

            {/* Hour labels */}
            {HOURS.map(h=>(
              <div key={h} style={{
                position:"absolute",top:(h-CAL_START_H)*CAL_HOUR_H,
                left:0,width:42,height:CAL_HOUR_H,
                paddingRight:5,paddingTop:2,
                fontSize:9,color:"#b0b7c3",textAlign:"right",
                borderTop:"1px solid var(--border-soft)",
                userSelect:"none"
              }}>
                {String(h).padStart(2,"0")}:00
              </div>
            ))}

            {/* Day columns (clickable + events) */}
            <div ref={gridRef} style={{position:"absolute",left:42,right:0,top:0,bottom:0,display:"flex"}}>
              {weekDays.map((d,di)=>(
                <div key={di} style={{flex:1,position:"relative",borderLeft:"1px solid var(--border-soft)"}}>
                  {/* Hour click cells */}
                  {HOURS.map(h=>(
                    <div key={h}
                      className="cal-hour-cell"
                      onClick={()=>setModal({mode:"add",date:d,hour:h})}
                      style={{
                        position:"absolute",
                        top:(h-CAL_START_H)*CAL_HOUR_H,
                        left:0,right:0,
                        height:CAL_HOUR_H,
                        borderTop:"1px solid var(--border-soft)",
                        cursor:"pointer",
                        transition:"background .1s"
                      }}
                    />
                  ))}
                  {/* Events */}
                  {eventsForDay(d).map(ev=>{
                    const top=timeToY(ev.startTime);
                    const height=blockH(ev.startTime,ev.endTime);
                    const c=ev.color||"#059669";
                    const isDragging=drag&&drag.id===ev.id;
                    return(
                      <div key={ev.id}
                        onPointerDown={e=>{e.stopPropagation();evDown(e,ev)}}
                        onPointerMove={evMove}
                        onPointerUp={e=>{e.stopPropagation();evUp(e,ev)}}
                        onPointerCancel={()=>{dragRef.current=null;setDrag(null)}}
                        style={{
                          position:"absolute",
                          top,left:2,right:2,height,
                          borderRadius:5,
                          background:c+"20",
                          borderLeft:`3px solid ${c}`,
                          padding:"2px 4px",
                          overflow:"hidden",
                          cursor:"grab",
                          touchAction:"none",
                          zIndex:isDragging?60:2,
                          opacity:isDragging?.9:1,
                          transform:isDragging?`translate(${drag.dx}px,${drag.dy}px) scale(1.03)`:"none",
                          boxShadow:isDragging?"0 8px 24px rgba(0,0,0,.25)":`0 1px 4px ${c}30`,
                        }}>
                        <div style={{fontSize:10,fontWeight:700,color:c,lineHeight:1.2,display:"flex",gap:2,alignItems:"center"}}>
                          <span style={{flexShrink:0}}>{ev.icon}</span>
                          <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</span>
                          {ev._recur&&<span style={{flexShrink:0,fontSize:8,opacity:.7}}>🔁</span>}
                        </div>
                        {height>38&&<div style={{fontSize:9,color:c,opacity:.75,marginTop:1,whiteSpace:"nowrap"}}>{ev.startTime}–{ev.endTime}</div>}
                        {height>54&&ev.desc&&<div style={{fontSize:8,color:c,opacity:.7,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.desc}</div>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {modal&&(
        <EventModal
          modal={modal}
          templates={calTemplates}
          onSave={modal.mode==="add"?addEvent:updateEvent}
          onDelete={deleteEvent}
          onClose={()=>setModal(null)}
        />
      )}
    </div>
  );
}

/* ─── EVENT MODAL ─── */
function EventModal({modal,templates,onSave,onDelete,onClose}){
  const isEdit=modal.mode==="edit";
  const ev=isEdit?modal.event:null;
  const h0=isEdit?null:modal.hour;

  const [title,setTitle]=useState(ev?.title||"");
  const [icon,setIcon]=useState(ev?.icon||"✅");
  const [startTime,setStartTime]=useState(ev?.startTime||(h0!=null?`${String(h0).padStart(2,"0")}:00`:"09:00"));
  const [endTime,setEndTime]=useState(ev?.endTime||(h0!=null?(h0>=23?"23:59":`${String(h0+1).padStart(2,"0")}:00`):"10:00"));
  const [color,setColor]=useState(ev?.color||"#059669");
  const [desc,setDesc]=useState(ev?.desc||"");
  const [repeat,setRepeat]=useState(ev?.repeat||"none");
  const [showEmoji,setShowEmoji]=useState(false);

  const dateStr=isEdit?ev.date:dk(modal.date);
  const dayLabel=isEdit?fmtDate(new Date(ev.date+"T00:00")):fmtDate(modal.date);

  const applyTpl=(t)=>{setTitle(t.title);setIcon(t.icon);setColor(t.color);if(t.desc)setDesc(t.desc)};

  const submit=()=>{
    if(!title.trim())return;
    onSave({...(isEdit?{id:ev.id,exDates:ev.exDates||[]}:{}),date:dateStr,title:title.trim(),icon,startTime,endTime,color,desc:desc.trim(),repeat});
  };

  const handleDelete=()=>{
    if(isEdit&&ev.repeat&&ev.repeat!=="none"){
      const whole=confirm(`"${ev.title}" is een herhalend event.\n\nOK = hele reeks verwijderen\nAnnuleren = alleen deze dag (${dayLabel}) overslaan`);
      if(whole)onDelete(ev.id,{whole:true});
      else onDelete(ev.id,{skipDate:ev.date});
    }else{
      if(confirm("Event verwijderen?"))onDelete(ev.id);
    }
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:"var(--card)",borderRadius:"16px 16px 0 0",padding:20,width:"100%",maxWidth:540,maxHeight:"92vh",overflowY:"auto",animation:"fadeUp .25s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
          <h3 style={{fontFamily:"var(--ff-head)",fontSize:16,fontWeight:700}}>{isEdit?"Event bewerken":"Nieuw event"}</h3>
          <button onClick={onClose} style={{fontSize:20,color:"var(--text-faint)",background:"none",padding:4,lineHeight:1}}>✕</button>
        </div>
        <div style={{fontSize:11,color:"var(--text-faint)",marginBottom:12}}>{dayLabel}</div>

        {/* Template quick pick */}
        {!isEdit&&templates.length>0&&(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:600,color:"var(--text)",marginBottom:6}}>Snel invullen via template:</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {templates.map(t=>(
                <button key={t.id} onClick={()=>applyTpl(t)}
                  style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:99,
                    background:t.color+"18",border:`1.5px solid ${title===t.title?t.color:t.color+"55"}`,
                    fontSize:12,fontWeight:600,color:t.color,transition:"border-color .15s"}}>
                  {t.icon} {t.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Icon + Title */}
        <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
          <button onClick={()=>setShowEmoji(!showEmoji)}
            style={{width:42,height:42,borderRadius:9,border:"1.5px solid var(--border)",background:"var(--input-bg)",fontSize:22,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {icon}
          </button>
          <input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Naam activiteit..."
            style={{flex:1,padding:"10px 12px",borderRadius:8,border:"1.5px solid var(--border)",fontSize:13,outline:"none"}}
            onFocus={e=>e.target.style.borderColor="#059669"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
        </div>

        {showEmoji&&(
          <div style={{marginBottom:10}}>
            <EmojiPicker value={icon} onPick={e=>{setIcon(e);setShowEmoji(false)}} size={28} height={150}/>
          </div>
        )}

        {/* Beschrijving */}
        <div style={{marginBottom:10}}>
          <label style={{fontSize:11,fontWeight:600,color:"var(--text)",display:"block",marginBottom:4}}>Beschrijving <span style={{fontWeight:400,color:"var(--text-faint)"}}>(optioneel)</span></label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Notitie of details..." rows={2}
            style={{width:"100%",padding:"9px 11px",borderRadius:8,border:"1.5px solid var(--border)",fontSize:13,outline:"none",resize:"vertical",lineHeight:1.5}}
            onFocus={e=>e.target.style.borderColor="#059669"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
        </div>

        {/* Times */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:"var(--text)",display:"block",marginBottom:4}}>Starttijd</label>
            <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)}
              style={{width:"100%",padding:"9px 10px",borderRadius:8,border:"1.5px solid var(--border)",fontSize:14,outline:"none"}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:600,color:"var(--text)",display:"block",marginBottom:4}}>Eindtijd</label>
            <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)}
              style={{width:"100%",padding:"9px 10px",borderRadius:8,border:"1.5px solid var(--border)",fontSize:14,outline:"none"}}/>
          </div>
        </div>

        {/* Herhaling */}
        <div style={{marginBottom:14}}>
          <label style={{fontSize:11,fontWeight:600,color:"var(--text)",display:"block",marginBottom:6}}>🔁 Herhalen</label>
          <div style={{display:"flex",gap:6}}>
            {[["none","Niet"],["daily","Elke dag"],["weekly","Elke week"]].map(([v,l])=>(
              <button key={v} onClick={()=>setRepeat(v)}
                style={{flex:1,padding:"8px 4px",borderRadius:8,fontSize:12,fontWeight:600,
                  border:repeat===v?"2px solid #059669":"1.5px solid var(--border)",
                  background:repeat===v?"var(--sel-bg)":"var(--card)",color:repeat===v?"var(--accent-text)":"var(--text-muted)"}}>
                {l}
              </button>
            ))}
          </div>
          {repeat==="weekly"&&<div style={{fontSize:10,color:"var(--text-faint)",marginTop:5}}>Herhaalt elke {DAYS_NL[new Date(dateStr+"T00:00").getDay()].toLowerCase()} vanaf {dayLabel}.</div>}
          {repeat==="daily"&&<div style={{fontSize:10,color:"var(--text-faint)",marginTop:5}}>Herhaalt elke dag vanaf {dayLabel}.</div>}
        </div>

        {/* Color */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,fontWeight:600,color:"var(--text)",marginBottom:7}}>Kleur</div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {EVENT_COLORS.map(c=>(
              <button key={c} onClick={()=>setColor(c)}
                style={{width:28,height:28,borderRadius:14,background:c,
                  border:color===c?"3px solid var(--text)":"2.5px solid transparent",
                  boxShadow:color===c?"0 0 0 2px white inset":"none",flexShrink:0,transition:"all .15s"}}/>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{display:"flex",gap:8}}>
          {isEdit&&(
            <button onClick={handleDelete}
              style={{padding:"11px 14px",borderRadius:9,background:"var(--danger-bg)",border:"1px solid var(--danger-border)",color:"#dc2626",fontSize:14,fontWeight:600}}>
              🗑️
            </button>
          )}
          <button onClick={submit}
            style={{flex:1,padding:"11px",borderRadius:9,background:"#059669",color:"white",fontSize:14,fontWeight:700,
              opacity:title.trim()?"1":".5",transition:"opacity .15s"}}>
            {isEdit?"💾 Opslaan":"✓ Toevoegen"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── MONTH ─── */
function MonthView({date,setDate,setView,routines}){
  const y=date.getFullYear(),m=date.getMonth();
  const first=new Date(y,m,1),last=new Date(y,m+1,0);
  const fDow=first.getDay()===0?6:first.getDay()-1;
  const total=Object.values(routines).flat().length;

  const days=[];
  for(let d=1;d<=last.getDate();d++){
    const k=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const data=loadJSON(`rt_day_${k}`,null);
    const done=data?.checked?Object.values(data.checked).filter(Boolean).length:0;
    days.push({day:d,pct:total>0?Math.round((done/total)*100):0,done});
  }

  const color=(pct)=>pct===0?"var(--heat0)":pct<30?"#fecaca":pct<60?"#fde68a":pct<80?"#bbf7d0":"#059669";
  const today=new Date();

  return(
    <div style={{padding:"14px 12px 24px",animation:"fadeUp .3s ease"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <NavBtn onClick={()=>{const d=new Date(date);d.setMonth(d.getMonth()-1);setDate(d)}}>◀</NavBtn>
        <h2 style={{fontFamily:"var(--ff-head)",fontSize:18,fontWeight:700}}>{MONTHS_NL[m]} {y}</h2>
        <NavBtn onClick={()=>{const d=new Date(date);d.setMonth(d.getMonth()+1);setDate(d)}}>▶</NavBtn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:5}}>
        {["Ma","Di","Wo","Do","Vr","Za","Zo"].map(d=>(
          <div key={d} style={{textAlign:"center",fontSize:10,fontWeight:600,color:"var(--text-faint)",padding:2}}>{d}</div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {Array(fDow).fill(null).map((_,i)=><div key={`e${i}`}/>)}
        {days.map(d=>{
          const isT=d.day===today.getDate()&&m===today.getMonth()&&y===today.getFullYear();
          return(
            <div key={d.day} onClick={()=>{setDate(new Date(y,m,d.day));setView("tracker")}}
              style={{textAlign:"center",padding:"6px 2px",borderRadius:7,background:color(d.pct),
                cursor:"pointer",border:isT?"2px solid #059669":"2px solid transparent",transition:"all .15s"}}>
              <div style={{fontSize:11,fontWeight:isT?800:500,color:d.pct>=80?"white":"var(--text)"}}>{d.day}</div>
              {d.done>0&&<div style={{fontSize:8,color:d.pct>=80?"rgba(255,255,255,.85)":"#6b7280"}}>{d.pct}%</div>}
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:6,marginTop:12,justifyContent:"center",flexWrap:"wrap"}}>
        {[["var(--heat0)","0%"],["#fecaca","<30%"],["#fde68a","<60%"],["#bbf7d0","<80%"],["#059669","80%+"]].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:3}}>
            <div style={{width:9,height:9,borderRadius:2,background:c}}/><span style={{fontSize:9,color:"var(--text-muted)"}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── STATS ─── */
function StatsView({routines,getAllDays}){
  const allDays=getAllDays();
  const entries=Object.entries(allDays).filter(([,v])=>v?.checked);
  const total=Object.values(routines).flat().length;

  const last7=[];
  for(let i=6;i>=0;i--){
    const d=new Date();d.setDate(d.getDate()-i);
    const data=allDays[dk(d)];
    const done=data?.checked?Object.values(data.checked).filter(Boolean).length:0;
    last7.push({d:DAYS_NL[d.getDay()].substring(0,2),pct:total>0?Math.round((done/total)*100):0});
  }

  const allR=Object.values(routines).flat();
  const areaStats={};
  allR.forEach(r=>{
    if(!areaStats[r.area])areaStats[r.area]={total:0,done:0};
    areaStats[r.area].total+=entries.length||1;
    entries.forEach(([,data])=>{if(data.checked?.[r.id])areaStats[r.area].done++});
  });

  let bestPct=0;
  entries.forEach(([,v])=>{
    const pct=total>0?Math.round((Object.values(v.checked).filter(Boolean).length/total)*100):0;
    if(pct>bestPct)bestPct=pct;
  });

  const skipCount={};
  allR.forEach(r=>{skipCount[r.id]={name:r.name,icon:r.icon,skipped:0}});
  entries.forEach(([,data])=>{allR.forEach(r=>{if(!data.checked?.[r.id])skipCount[r.id].skipped++})});
  const mostSkipped=Object.values(skipCount).sort((a,b)=>b.skipped-a.skipped).slice(0,5);

  return(
    <div style={{padding:"14px 12px 24px",animation:"fadeUp .3s ease"}}>
      <h2 style={{fontFamily:"var(--ff-head)",fontSize:18,fontWeight:700,marginBottom:14}}>📊 Statistieken</h2>

      <div style={{background:"var(--card)",borderRadius:12,padding:12,marginBottom:8,boxShadow:"0 1px 3px var(--shadow)"}}>
        <h3 style={{fontFamily:"var(--ff-head)",fontSize:13,fontWeight:700,marginBottom:12}}>Afgelopen 7 dagen</h3>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-around",height:100,gap:4}}>
          {last7.map((d,i)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,flex:1}}>
              <span style={{fontSize:9,fontWeight:700,color:"#059669"}}>{d.pct}%</span>
              <div style={{width:"100%",maxWidth:26,height:Math.max(3,(d.pct/100)*70),background:"linear-gradient(to top,#059669,#34d399)",borderRadius:4,transition:"height .5s ease"}}/>
              <span style={{fontSize:9,color:"var(--text-muted)"}}>{d.d}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{background:"var(--card)",borderRadius:12,padding:12,marginBottom:8,boxShadow:"0 1px 3px var(--shadow)"}}>
        <h3 style={{fontFamily:"var(--ff-head)",fontSize:13,fontWeight:700,marginBottom:10}}>Per Focus Gebied</h3>
        {Object.entries(areaStats).map(([area,s])=>{
          const pct=s.total>0?Math.round((s.done/s.total)*100):0;
          const st=AREA_STYLES[area]||AREA_STYLES.Zelfzorg;
          return(
            <div key={area} style={{marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                <span style={{fontSize:11,fontWeight:600,color:st.text}}>{area}</span>
                <span style={{fontSize:10,color:"var(--text-muted)"}}>{pct}%</span>
              </div>
              <div style={{height:6,borderRadius:3,background:"var(--border-soft)"}}>
                <div style={{height:"100%",borderRadius:3,width:`${pct}%`,background:st.text,transition:"width .5s ease"}}/>
              </div>
            </div>
          );
        })}
      </div>

      {entries.length>0&&(
        <div style={{background:"var(--card)",borderRadius:12,padding:12,marginBottom:8,boxShadow:"0 1px 3px var(--shadow)"}}>
          <h3 style={{fontFamily:"var(--ff-head)",fontSize:13,fontWeight:700,marginBottom:8}}>⚠️ Meest overgeslagen</h3>
          {mostSkipped.map((r,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 0",borderBottom:i<4?"1px solid var(--border-soft)":"none"}}>
              <span style={{fontSize:13}}>{r.icon}</span>
              <span style={{flex:1,fontSize:11,color:"var(--text)"}}>{r.name}</span>
              <span style={{fontSize:10,fontWeight:600,color:"#dc2626"}}>{r.skipped}x</span>
            </div>
          ))}
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div style={{background:"var(--card)",borderRadius:12,padding:12,textAlign:"center",boxShadow:"0 1px 3px var(--shadow)"}}>
          <div style={{fontSize:24,marginBottom:2}}>📅</div>
          <div style={{fontSize:20,fontWeight:800,color:"#059669",fontFamily:"var(--ff-head)"}}>{entries.length}</div>
          <div style={{fontSize:10,color:"var(--text-muted)"}}>Dagen gelogd</div>
        </div>
        <div style={{background:"var(--card)",borderRadius:12,padding:12,textAlign:"center",boxShadow:"0 1px 3px var(--shadow)"}}>
          <div style={{fontSize:24,marginBottom:2}}>🏆</div>
          <div style={{fontSize:20,fontWeight:800,color:"#d97706",fontFamily:"var(--ff-head)"}}>{bestPct}%</div>
          <div style={{fontSize:10,color:"var(--text-muted)"}}>Beste dag</div>
        </div>
      </div>

      {entries.length===0&&(
        <div style={{textAlign:"center",padding:30,color:"var(--text-faint)"}}>
          <p style={{fontSize:32,marginBottom:4}}>📭</p>
          <p style={{fontSize:12}}>Nog geen data — begin met afvinken!</p>
        </div>
      )}
    </div>
  );
}

ReactDOM.render(<App/>, document.getElementById("root"));
