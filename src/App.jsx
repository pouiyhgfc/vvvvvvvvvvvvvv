import React, { useState, useEffect, useMemo } from 'react';
import {
  DEFAULT_ROUTINES, DEFAULT_CAL_TEMPLATES, DEFAULT_AREAS, DEFAULT_SETTINGS,
  buildAreaStyles,
} from './lib/constants.js';
import { dk, fmtDate, isToday, getMonday } from './lib/date.js';
import { loadJSON, saveJSON, buzz } from './lib/storage.js';
import { useNotifications } from './lib/notify.js';
import NavBtn from './ui/NavBtn.jsx';
import TrackerView from './features/tracker/TrackerView.jsx';
import WeekView from './features/planner/WeekView.jsx';
import MonthView from './features/month/MonthView.jsx';
import StatsView from './features/stats/StatsView.jsx';
import SettingsPanel from './features/settings/SettingsPanel.jsx';

export default function App(){
  const [settings,setSettings]=useState(()=>({...DEFAULT_SETTINGS,...loadJSON("rt_settings",{})}));
  const [notifPerm,setNotifPerm]=useState(typeof Notification!=="undefined"?Notification.permission:"unsupported");
  const [openPeriods,setOpenPeriods]=useState({ochtend:true,middag:true,avond:true});
  const [routines,setRoutines]=useState(()=>loadJSON("rt_routines",DEFAULT_ROUTINES));
  const [areas,setAreas]=useState(()=>{const a=loadJSON("rt_areas",null);return Array.isArray(a)&&a.length?a:DEFAULT_AREAS});
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
  useEffect(()=>{saveJSON("rt_areas",areas)},[areas]);

  const areaStyles=useMemo(()=>buildAreaStyles(areas),[areas]);
  const areaNames=areas.map(a=>a.name);

  useEffect(()=>{document.documentElement.dataset.theme=settings.theme;
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute("content",settings.theme==="dark"?"#0f1311":"#064e3b");
  },[settings.theme]);

  useNotifications(settings, calEvents);

  const saveDay=(data)=>{setDay(data);saveJSON(`rt_day_${key}`,data)};

  const toggle=(id)=>{
    const next={...day,checked:{...day.checked,[id]:!day.checked[id]}};
    saveDay(next);
    if(!day.checked[id]){buzz(8);setPop(id);setTimeout(()=>setPop(null),500)}
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
    const payload={version:5,exportedAt:new Date().toISOString(),routines,areas,calTemplates,calEvents,weekScheduleTemplates,settings,days:allDays};
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
        if(Array.isArray(data.areas)&&data.areas.length){saveJSON("rt_areas",data.areas);setAreas(data.areas)}
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
      if(k&&(k.startsWith("rt_day_")||k.startsWith("rt_notified_")||["rt_routines","rt_areas","rt_cal_templates","rt_cal_events","rt_week_schedule_tpls","rt_settings"].includes(k)))keysToDelete.push(k);
    }
    keysToDelete.forEach(k=>localStorage.removeItem(k));
    setRoutines(DEFAULT_ROUTINES);setAreas(DEFAULT_AREAS);setCalTemplates(DEFAULT_CAL_TEMPLATES);setCalEvents([]);setWeekScheduleTemplates([]);setSettings({...DEFAULT_SETTINGS});
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
        <SettingsPanel
          settings={settings} setSettings={setSettings}
          notifPerm={notifPerm}
          areas={areas} setAreas={setAreas}
          routines={routines} setRoutines={setRoutines}
          calTemplates={calTemplates} setCalTemplates={setCalTemplates}
          weekScheduleTemplates={weekScheduleTemplates} setWeekScheduleTemplates={setWeekScheduleTemplates}
          calEvents={calEvents} setCalEvents={setCalEvents}
          openPeriods={openPeriods} setOpenPeriods={setOpenPeriods}
          addingTo={addingTo} setAddingTo={setAddingTo}
          newR={newR} setNewR={setNewR}
          calTplForm={calTplForm} setCalTplForm={setCalTplForm}
          calTplShowEmoji={calTplShowEmoji} setCalTplShowEmoji={setCalTplShowEmoji}
          newCalTpl={newCalTpl} setNewCalTpl={setNewCalTpl}
          savingWeekTpl={savingWeekTpl} setSavingWeekTpl={setSavingWeekTpl}
          newWeekTplName={newWeekTplName} setNewWeekTplName={setNewWeekTplName}
          date={date}
          total={total}
          areaNames={areaNames}
          areaStyles={areaStyles}
          editingRoutine={editingRoutine} setEditingRoutine={setEditingRoutine}
          toggleNotifications={toggleNotifications}
          clearAllDays={clearAllDays}
          clearEverything={clearEverything}
          exportData={exportData}
          exportRoutines={exportRoutines}
          exportWeekplanning={exportWeekplanning}
          importData={importData}
          dataInfo={dataInfo}
        />
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
        <TrackerView
          day={day} saveDay={saveDay}
          routines={routines} tab={tab} setTab={setTab}
          checked={checked} pctTotal={pctTotal} pDone={pDone} pPct={pPct}
          pop={pop} toggle={toggle}
          areaStyles={areaStyles} streak={streak} total={total}
        />
      )}

      {/* WEEK VIEW */}
      {view==="week"&&!showSettings&&(
        <WeekView date={date} calTemplates={calTemplates} calEvents={calEvents} setCalEvents={setCalEvents} weekScheduleTemplates={weekScheduleTemplates}/>
      )}

      {/* MONTH VIEW */}
      {view==="month"&&!showSettings&&<MonthView date={date} setDate={setDate} setView={setView} routines={routines}/>}

      {/* STATS VIEW */}
      {view==="stats"&&!showSettings&&<StatsView routines={routines} getAllDays={getAllDays} areaStyles={areaStyles}/>}
    </div>
  );
}
