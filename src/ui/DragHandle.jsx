export default function DragHandle({onPointerDown}){
  return <span className="drag-handle" onPointerDown={onPointerDown}
    style={{fontSize:15,color:"var(--text-faint)",padding:"4px 6px",borderRadius:5,userSelect:"none",lineHeight:1,touchAction:"none"}}>⠿</span>;
}
