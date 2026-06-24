export default function NavBtn({onClick,children}){
  return <button onClick={onClick} style={{width:34,height:34,borderRadius:8,border:"1px solid var(--border)",background:"var(--card)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600,color:"var(--text)"}}>{children}</button>;
}
