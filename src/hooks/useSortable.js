import { useRef, useState, useEffect } from 'react';

export function arrMove(arr,from,to){const a=[...arr];const[x]=a.splice(from,1);a.splice(to,0,x);return a}

export function useSortable(onReorder){
  const ref=useRef(null);
  const st=useRef(null);
  const [dragId,setDragId]=useState(null);
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
  useEffect(()=>{
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
