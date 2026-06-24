import { PERIOD_LABELS, PERIOD_COLORS, MOODS, FALLBACK_AREA_STYLE } from '../../lib/constants.js';
import Ring from '../../ui/Ring.jsx';

export default function TrackerView({day,saveDay,routines,tab,setTab,checked,pctTotal,pDone,pPct,pop,toggle,areaStyles,streak}){
  return(
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
          const done=!!checked[r.id];const a=areaStyles[r.area]||FALLBACK_AREA_STYLE;
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
  );
}
