import { PERIOD_LABELS, PERIOD_COLORS, EVENT_COLORS, DEFAULT_ROUTINES } from '../../lib/constants.js';
import { getMonday, dk, uid, applyWeekTemplate } from '../../lib/date.js';
import { buzz } from '../../lib/storage.js';
import { arrMove } from '../../hooks/useSortable.js';
import EmojiPicker from '../../ui/EmojiPicker.jsx';
import { SortableTemplateList, SortableWeekTplList, SortableRoutineList } from '../../ui/SortableList.jsx';

export default function SettingsPanel({
  settings, setSettings,
  notifPerm,
  areas, setAreas,
  routines, setRoutines,
  calTemplates, setCalTemplates,
  weekScheduleTemplates, setWeekScheduleTemplates,
  calEvents,
  openPeriods, setOpenPeriods,
  addingTo, setAddingTo,
  newR, setNewR,
  calTplForm, setCalTplForm,
  calTplShowEmoji, setCalTplShowEmoji,
  newCalTpl, setNewCalTpl,
  savingWeekTpl, setSavingWeekTpl,
  newWeekTplName, setNewWeekTplName,
  date,
  total,
  areaNames,
  areaStyles,
  editingRoutine, setEditingRoutine,
  toggleNotifications,
  clearAllDays,
  clearEverything,
  exportData, exportRoutines, exportWeekplanning,
  importData,
  dataInfo,
}){
  const addCalTpl=()=>{
    if(!newCalTpl.title.trim())return;
    buzz();
    setCalTemplates(prev=>[...prev,{id:uid(),title:newCalTpl.title.trim(),icon:newCalTpl.icon,color:newCalTpl.color,desc:(newCalTpl.desc||"").trim()}]);
    setNewCalTpl({title:"",icon:"✅",color:"#059669",desc:""});
    setCalTplForm(false);setCalTplShowEmoji(false);
  };

  const updateArea=(i,patch)=>setAreas(prev=>prev.map((a,idx)=>idx===i?{...a,...patch}:a));
  const renameArea=(i,newName)=>{
    const old=areas[i]?.name;
    setAreas(prev=>prev.map((a,idx)=>idx===i?{...a,name:newName}:a));
    if(old&&old!==newName)setRoutines(prev=>{const n={};for(const k in prev)n[k]=prev[k].map(r=>r.area===old?{...r,area:newName}:r);return n});
  };
  const addArea=()=>{buzz();setAreas(prev=>[...prev,{name:"Nieuw gebied",color:EVENT_COLORS[prev.length%EVENT_COLORS.length]}])};
  const deleteArea=(i)=>{
    if(areas.length<=1){alert("Je hebt minimaal één focusgebied nodig.");return}
    if(!confirm(`Gebied "${areas[i].name}" verwijderen? Routines met dit gebied houden de naam maar krijgen een neutrale kleur.`))return;
    setAreas(prev=>prev.filter((_,idx)=>idx!==i));
  };

  const resetRoutines=()=>{
    if(confirm("Alle routines terugzetten naar standaard? Je dagdata blijft bewaard.")){
      setRoutines(DEFAULT_ROUTINES);
    }
  };

  const renameRoutine=(period,id,newName,newIcon,newArea,newDesc)=>{
    setRoutines(prev=>({...prev,[period]:prev[period].map(r=>r.id===id?{...r,name:newName,icon:newIcon,area:newArea,desc:(newDesc||"").trim()}:r)}));
    setEditingRoutine(null);
  };
  const deleteRoutine=(period,id)=>{
    if(!confirm("Weet je zeker dat je deze routine wilt verwijderen?"))return;
    setRoutines(prev=>({...prev,[period]:prev[period].filter(r=>r.id!==id)}));
  };
  const reorderRoutine=(period,from,to)=>{
    setRoutines(prev=>({...prev,[period]:arrMove(prev[period],from,to)}));
  };

  const addRoutine=(period)=>{
    if(!newR.name.trim())return;
    buzz();
    const area=areaNames.includes(newR.area)?newR.area:(areas[0]?.name||newR.area);
    const r={id:uid(),name:newR.name.trim(),icon:newR.icon,area,desc:(newR.desc||"").trim()};
    setRoutines(prev=>({...prev,[period]:[...prev[period],r]}));
    setNewR({name:"",icon:"✅",area:"Zelfzorg",desc:""});
    setAddingTo(null);
  };

  return(
    <div style={{background:"var(--card)",borderBottom:"1px solid var(--border-mid)",padding:16,animation:"fadeUp .2s ease"}}>
      <h2 style={{fontFamily:"var(--ff-head)",fontSize:17,fontWeight:700,marginBottom:12}}>⚙️ Instellingen</h2>

      {/* WEERGAVE & MELDINGEN */}
      <div style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:12,marginBottom:14}}>
        <h3 style={{fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:10}}>🎨 Weergave & Meldingen</h3>

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

      {/* FOCUSGEBIEDEN */}
      <div style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:10,padding:12,marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <h3 style={{fontFamily:"var(--ff-head)",fontSize:14,fontWeight:700}}>🎯 Focusgebieden</h3>
          <button onClick={addArea} style={{fontSize:11,padding:"3px 10px",borderRadius:6,background:"#059669",color:"white",fontWeight:600}}>+ Gebied</button>
        </div>
        <p style={{fontSize:11,color:"var(--text-muted)",marginBottom:10,lineHeight:1.5}}>
          Pas naam en kleur aan, of voeg eigen gebieden toe. De kleur wordt gebruikt voor routines in dit gebied (kalender-events hebben een eigen kleur).
        </p>
        {areas.map((ar,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 9px",borderRadius:8,background:"var(--card)",borderLeft:`4px solid ${ar.color}`,marginBottom:5,boxShadow:"0 1px 2px var(--shadow)"}}>
            <label style={{width:26,height:26,borderRadius:13,flexShrink:0,cursor:"pointer",position:"relative",overflow:"hidden",background:ar.color,border:"2px solid var(--card)",boxShadow:"0 0 0 1px var(--border)"}}>
              <input type="color" value={ar.color} onChange={e=>updateArea(i,{color:e.target.value})}
                style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",border:"none",padding:0}}/>
            </label>
            <input type="text" value={ar.name} onChange={e=>renameArea(i,e.target.value)}
              style={{flex:1,minWidth:0,padding:"5px 8px",borderRadius:6,border:"1px solid var(--border)",fontSize:12,fontWeight:600,outline:"none"}}/>
            <button onClick={()=>deleteArea(i)} style={{fontSize:12,background:"var(--danger-bg)",border:"1px solid var(--danger-border)",padding:"4px 6px",borderRadius:5}}>🗑️</button>
          </div>
        ))}
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
              <input type="text" value={newCalTpl.title} autoFocus onChange={e=>setNewCalTpl(p=>({...p,title:e.target.value}))}
                onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addCalTpl()}}}
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
              <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                {EVENT_COLORS.map(c=>(
                  <button key={c} onClick={()=>setNewCalTpl(p=>({...p,color:c}))}
                    style={{width:24,height:24,borderRadius:12,background:c,border:newCalTpl.color.toLowerCase()===c?"3px solid var(--text)":"2px solid transparent",flexShrink:0}}/>
                ))}
                <label style={{width:24,height:24,borderRadius:12,flexShrink:0,cursor:"pointer",position:"relative",overflow:"hidden",
                  border:EVENT_COLORS.includes(newCalTpl.color.toLowerCase())?"1.5px dashed var(--border)":"3px solid var(--text)",
                  background:EVENT_COLORS.includes(newCalTpl.color.toLowerCase())?"conic-gradient(red,orange,yellow,lime,aqua,blue,magenta,red)":newCalTpl.color,
                  display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {EVENT_COLORS.includes(newCalTpl.color.toLowerCase())&&<span style={{fontSize:11}}>🎨</span>}
                  <input type="color" value={newCalTpl.color} onChange={e=>setNewCalTpl(p=>({...p,color:e.target.value}))}
                    style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",border:"none",padding:0}}/>
                </label>
              </div>
            </div>
            <button onClick={addCalTpl} style={{width:"100%",padding:"8px",borderRadius:8,background:"#059669",color:"white",fontWeight:600,fontSize:13}}>
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
        <SortableWeekTplList items={weekScheduleTemplates}
          onReorder={(from,to)=>setWeekScheduleTemplates(prev=>arrMove(prev,from,to))}
          onLoad={(tpl)=>{
            if(!confirm(`Template "${tpl.name}" inladen voor deze week?\n\nBestaande events van deze week worden NIET gewist — de template wordt toegevoegd.`))return;
            const newEvs=applyWeekTemplate(tpl,getMonday(date));
            setCalEvents(prev=>[...prev,...newEvs]);
            alert(`✓ ${newEvs.length} events toegevoegd voor deze week.`);
          }}
          onDelete={(tpl)=>{if(confirm(`Template "${tpl.name}" verwijderen?`))setWeekScheduleTemplates(prev=>prev.filter(t=>t.id!==tpl.id))}}/>
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
                  <input type="text" value={newR.name} autoFocus onChange={e=>setNewR(p=>({...p,name:e.target.value}))}
                    onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addRoutine(period)}}}
                    placeholder="Routine naam..." style={{flex:1,minWidth:120,padding:"7px 10px",borderRadius:7,border:"1px solid var(--border)",fontSize:13,outline:"none"}}/>
                  <select value={areaNames.includes(newR.area)?newR.area:(areaNames[0]||"")} onChange={e=>setNewR(p=>({...p,area:e.target.value}))}
                    style={{padding:"7px 8px",borderRadius:7,border:"1px solid var(--border)",fontSize:12,background:"var(--card)"}}>
                    {areaNames.map(a=><option key={a} value={a}>{a}</option>)}
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
              onReorder={(from,to)=>reorderRoutine(period,from,to)}
              areaStyles={areaStyles} areaNames={areaNames}/>
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
  );
}
