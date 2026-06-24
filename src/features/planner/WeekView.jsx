import { useState, useEffect, useRef } from 'react';
import { dk, getMonday, isToday, uid, eventsOnDate, applyWeekTemplate, tMin, minT } from '../../lib/date.js';
import { MONTHS_NL, WEEK_DAYS_SHORT, CAL_HOUR_H, CAL_START_H, CAL_END_H } from '../../lib/constants.js';
import EventModal from './EventModal.jsx';

export default function WeekView({date,calTemplates,calEvents,setCalEvents,weekScheduleTemplates}){
  const [modal,setModal]=useState(null);
  const [showTplPicker,setShowTplPicker]=useState(false);
  const gridRef=useRef(null);
  const dragRef=useRef(null);
  const [drag,setDrag]=useState(null);
  const [nowT,setNowT]=useState(new Date());
  useEffect(()=>{const iv=setInterval(()=>setNowT(new Date()),60000);return()=>clearInterval(iv)},[]);

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

      <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{minWidth:360}}>
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

          <div style={{position:"relative",height:gridH,background:"var(--card)"}}>
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

            <div ref={gridRef} style={{position:"absolute",left:42,right:0,top:0,bottom:0,display:"flex"}}>
              {weekDays.map((d,di)=>(
                <div key={di} style={{flex:1,position:"relative",borderLeft:"1px solid var(--border-soft)"}}>
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
                  {isToday(d)&&nowT.getHours()>=CAL_START_H&&(
                    <div style={{position:"absolute",left:0,right:0,top:timeToY(`${String(nowT.getHours()).padStart(2,"0")}:${String(nowT.getMinutes()).padStart(2,"0")}`),height:0,borderTop:"2px solid #ef4444",zIndex:5,pointerEvents:"none"}}>
                      <div style={{position:"absolute",left:-3,top:-4,width:8,height:8,borderRadius:4,background:"#ef4444",boxShadow:"0 0 0 2px var(--card)"}}/>
                    </div>
                  )}
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
