import { useEffect } from 'react';
import { dk, eventsOnDate } from './date.js';
import { loadJSON, saveJSON } from './storage.js';

export function useNotifications(settings, calEvents) {
  useEffect(()=>{
    if(!settings.notifEnabled||typeof Notification==="undefined"||Notification.permission!=="granted")return;
    const lead=settings.notifLeadMin||0;
    const body=(ev)=>`${ev.startTime}–${ev.endTime}${ev.desc?" · "+ev.desc:""}`;
    const titleOf=(ev)=>`${ev.icon||"🔔"} ${ev.title}`;
    const hasTriggers=typeof window!=="undefined"&&"TimestampTrigger"in window;

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
}
