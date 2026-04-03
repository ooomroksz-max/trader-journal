import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://khspgjnfxurxrtdwrgxs.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtoc3Bnam5meHVyeHJ0ZHdyZ3hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTk4NjMsImV4cCI6MjA5MDc3NTg2M30.QzJHXVw09VBqrO3ikMHYvG-ZPitK-lKVI1vnYTV5Djk";
const USER_ID = "default_user";

const EW_WAVES = ["Wave 1","Wave 2","Wave 3","Wave 4","Wave 5","Wave A","Wave B","Wave C","WXY","WXYXZ"];
const ICT_CONCEPTS = ["Order Block","FVG","Liquidity Sweep","MSB","BOS","OTE","NWOG","NDOG","Breaker Block","Mitigation Block","Displacement","Power of 3","Judas Swing","ICT Killzone","Silver Bullet"];
const SESSIONS = ["Londra","New York","Asya","Londra-NY Overlap"];
const DIRECTIONS = ["Long","Short"];
const OUTCOMES = ["Kâr","Zarar","Başabaş","Devam Ediyor"];
const TIMEFRAMES = ["1D","4H","1H","15M","5M","1M"];
const PAIRS = ["EURUSD","GBPUSD","XAUUSD","BTCUSDT","NASDAQ","SP500","Diğer"];

interface Trade { id:string;date:string;pair:string;direction:string;session:string;timeframe:string;entryPrice:string;stopLoss:string;takeProfit:string;outcome:string;pnl:string;ewWave:string;ictConcepts:string[];confluences:string;lessons:string;images:string[]; }
interface DiaryEntry { id:string;date:string;title:string;content:string;mood:string; }
interface StrategyNote { id:string;title:string;content:string;tags:string[];updatedAt:string; }
interface MarketObs { id:string;date:string;pair:string;timeframe:string;bias:string;notes:string;keyLevels:string; }

const EMPTY_TRADE: Omit<Trade,"id"> = { date:new Date().toISOString().slice(0,10),pair:"",direction:"",session:"",timeframe:"",entryPrice:"",stopLoss:"",takeProfit:"",outcome:"",pnl:"",ewWave:"",ictConcepts:[],confluences:"",lessons:"",images:[] };

// ─── Supabase helpers ────────────────────────────────────────────────────────
async function dbFetch(table: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${USER_ID}&order=created_at.desc`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  const rows = await res.json();
  return rows.map((r: any) => r.data);
}

async function dbUpsert(table: string, id: string, data: any) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ id, user_id: USER_ID, data })
  });
}

async function dbDelete(table: string, id: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "DELETE",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
}

// ─── Reusable UI ─────────────────────────────────────────────────────────────
function Tag({label,color}:{label:string;color:string}) {
  return <span style={{display:"inline-flex",alignItems:"center",background:color+"22",border:`1px solid ${color}55`,color,borderRadius:4,padding:"2px 8px",fontSize:11,fontFamily:"monospace"}}>{label}</span>;
}
function StatCard({label,value,color}:{label:string;value:string|number;color?:string}) {
  return <div style={{background:"#0f1117",border:"1px solid #1e2535",borderRadius:8,padding:"16px 20px",flex:1,minWidth:100}}><div style={{color:"#4a5568",fontSize:11,textTransform:"uppercase",letterSpacing:1}}>{label}</div><div style={{color:color||"#e2e8f0",fontSize:22,fontWeight:700,fontFamily:"monospace",marginTop:4}}>{value}</div></div>;
}
function Card({children,style,onClick}:{children:React.ReactNode;style?:React.CSSProperties;onClick?:()=>void}) {
  return <div onClick={onClick} style={{background:"#0a0d14",border:"1px solid #1e2535",borderRadius:8,padding:16,...style}}>{children}</div>;
}
function Spinner() {
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 0"}}><div style={{width:24,height:24,border:"2px solid #1e2535",borderTop:"2px solid #3182ce",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
}

// ─── Trade Form ───────────────────────────────────────────────────────────────
function TradeForm({form,setForm,onSave,onCancel,saveLabel}:{form:Omit<Trade,"id">;setForm:(f:Omit<Trade,"id">)=>void;onSave:()=>void;onCancel:()=>void;saveLabel:string}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const f = (k:string,v:any) => setForm({...form,[k]:v});
  const toggleICT = (c:string) => setForm({...form,ictConcepts:form.ictConcepts.includes(c)?form.ictConcepts.filter((x:string)=>x!==c):[...form.ictConcepts,c]});
  function handleImages(e:React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files||[]).forEach(file=>{ const r=new FileReader(); r.onload=ev=>setForm((p:Omit<Trade,"id">)=>({...p,images:[...p.images,ev.target?.result as string]})); r.readAsDataURL(file); });
  }
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}}>
        <div><label>Tarih</label><input type="date" value={form.date} onChange={e=>f("date",e.target.value)}/></div>
        <div><label>Parite</label><input placeholder="EURUSD..." value={form.pair} onChange={e=>f("pair",e.target.value)}/></div>
        <div><label>Yön</label><select value={form.direction} onChange={e=>f("direction",e.target.value)}><option value="">Seç</option>{DIRECTIONS.map(d=><option key={d}>{d}</option>)}</select></div>
        <div><label>Timeframe</label><select value={form.timeframe} onChange={e=>f("timeframe",e.target.value)}><option value="">Seç</option>{TIMEFRAMES.map(t=><option key={t}>{t}</option>)}</select></div>
        <div><label>Seans</label><select value={form.session} onChange={e=>f("session",e.target.value)}><option value="">Seç</option>{SESSIONS.map(s=><option key={s}>{s}</option>)}</select></div>
        <div><label>Sonuç</label><select value={form.outcome} onChange={e=>f("outcome",e.target.value)}><option value="">Seç</option>{OUTCOMES.map(o=><option key={o}>{o}</option>)}</select></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:12}}>
        <div><label>Giriş</label><input placeholder="1.0850" value={form.entryPrice} onChange={e=>f("entryPrice",e.target.value)}/></div>
        <div><label>Stop Loss</label><input placeholder="1.0820" value={form.stopLoss} onChange={e=>f("stopLoss",e.target.value)}/></div>
        <div><label>Take Profit</label><input placeholder="1.0920" value={form.takeProfit} onChange={e=>f("takeProfit",e.target.value)}/></div>
        <div><label>P&L (R)</label><input placeholder="+2.5" value={form.pnl} onChange={e=>f("pnl",e.target.value)}/></div>
      </div>
      <div><label>Elliott Wave</label><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{EW_WAVES.map(w=><button key={w} className="ict-tag" onClick={()=>f("ewWave",form.ewWave===w?"":w)} style={form.ewWave===w?{borderColor:"#b794f4",color:"#d6bcfa",background:"#b794f422"}:{}}>{w}</button>)}</div></div>
      <div><label>ICT Konseptleri</label><div style={{display:"flex",flexWrap:"wrap"}}>{ICT_CONCEPTS.map(c=><button key={c} className={`ict-tag ${form.ictConcepts.includes(c)?"active":""}`} onClick={()=>toggleICT(c)}>{c}</button>)}</div></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div><label>Konfluence & Analiz</label><textarea rows={3} placeholder="Neden girdim..." value={form.confluences} onChange={e=>f("confluences",e.target.value)}/></div>
        <div><label>Ders & Çıkarımlar</label><textarea rows={3} placeholder="Ne öğrendim..." value={form.lessons} onChange={e=>f("lessons",e.target.value)}/></div>
      </div>
      <div>
        <label>Grafik Ekran Görüntüleri</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"flex-start"}}>
          {form.images.map((img:string,i:number)=>(
            <div key={i} style={{position:"relative"}}>
              <img src={img} alt="" style={{width:120,height:80,objectFit:"cover",borderRadius:6,border:"1px solid #1e2535"}}/>
              <button onClick={()=>setForm({...form,images:form.images.filter((_:string,j:number)=>j!==i)})} style={{position:"absolute",top:-6,right:-6,width:18,height:18,borderRadius:"50%",background:"#fc8181",border:"none",color:"#fff",fontSize:10,cursor:"pointer"}}>×</button>
            </div>
          ))}
          <button className="btn" onClick={()=>fileRef.current?.click()} style={{width:120,height:80,background:"#0f1117",border:"1px dashed #2d3748",color:"#4a5568",fontSize:12,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,borderRadius:6}}>
            <span style={{fontSize:20}}>+</span><span>Resim Ekle</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImages} style={{display:"none"}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button className="btn" onClick={onSave} style={{background:"#3182ce",color:"#fff",padding:"11px 24px",fontSize:14,borderRadius:8,flex:1}}>{saveLabel}</button>
        <button className="btn" onClick={onCancel} style={{background:"#1e2535",color:"#a0aec0",padding:"11px 20px",fontSize:14,borderRadius:8}}>İptal</button>
      </div>
    </div>
  );
}

// ─── Trade Journal ────────────────────────────────────────────────────────────
function TradeJournalSection() {
  const [trades,setTrades]=useState<Trade[]>([]);
  const [loading,setLoading]=useState(true);
  const [view,setView]=useState<"list"|"add"|"detail"|"edit">("list");
  const [form,setForm]=useState<Omit<Trade,"id">>(EMPTY_TRADE);
  const [selected,setSelected]=useState<Trade|null>(null);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [filterDir,setFilterDir]=useState("Tümü");
  const [filterOut,setFilterOut]=useState("Tümü");
  const [lightbox,setLightbox]=useState<string|null>(null);

  useEffect(()=>{ dbFetch("trades").then(data=>{ setTrades(data); setLoading(false); }).catch(()=>setLoading(false)); },[]);

  async function saveTrade(trade: Trade) {
    await dbUpsert("trades", trade.id, trade);
    setTrades(prev => {
      const exists = prev.find(t => t.id === trade.id);
      return exists ? prev.map(t => t.id === trade.id ? trade : t) : [trade, ...prev];
    });
  }

  async function removeTrade(id: string) {
    await dbDelete("trades", id);
    setTrades(prev => prev.filter(t => t.id !== id));
  }

  function startEdit(t:Trade){const{id,...rest}=t;setEditingId(id);setForm(rest);setView("edit");}
  async function saveEdit(){
    if(!editingId)return;
    const updated={...form,id:editingId};
    await saveTrade(updated);
    setSelected(updated);
    setEditingId(null);setForm(EMPTY_TRADE);setView("detail");
  }

  const filtered=trades.filter(t=>(filterDir==="Tümü"||t.direction===filterDir)&&(filterOut==="Tümü"||t.outcome===filterOut));
  const wins=trades.filter(t=>t.outcome==="Kâr").length,losses=trades.filter(t=>t.outcome==="Zarar").length,total=trades.length;
  const wr=total>0?Math.round((wins/(wins+losses||1))*100):0;
  const totalPnl=trades.reduce((s,t)=>s+(parseFloat(t.pnl)||0),0);
  const oC:Record<string,string>={"Kâr":"#48bb78","Zarar":"#fc8181","Başabaş":"#ecc94b","Devam Ediyor":"#63b3ed"};
  const dC:Record<string,string>={"Long":"#48bb78","Short":"#fc8181"};

  return (
    <div>
      {lightbox&&<div className="lightbox" onClick={()=>setLightbox(null)}><img src={lightbox} alt=""/></div>}
      {view==="list"&&<>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
          <StatCard label="Toplam" value={total}/><StatCard label="Win Rate" value={`${wr}%`} color={wr>=50?"#48bb78":"#fc8181"}/><StatCard label="Kâr" value={wins} color="#48bb78"/><StatCard label="Zarar" value={losses} color="#fc8181"/><StatCard label="Net P&L" value={totalPnl>=0?`+${totalPnl.toFixed(1)}R`:`${totalPnl.toFixed(1)}R`} color={totalPnl>=0?"#48bb78":"#fc8181"}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,marginBottom:14}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {["Tümü","Long","Short"].map(d=><button key={d} className="btn" onClick={()=>setFilterDir(d)} style={{background:filterDir===d?"#1e2535":"transparent",border:`1px solid ${filterDir===d?"#3182ce":"#1e2535"}`,color:filterDir===d?"#63b3ed":"#4a5568",padding:"5px 10px",fontSize:12}}>{d}</button>)}
            {["Tümü","Kâr","Zarar","Başabaş","Devam Ediyor"].map(o=><button key={o} className="btn" onClick={()=>setFilterOut(o)} style={{background:filterOut===o?"#1e2535":"transparent",border:`1px solid ${filterOut===o?"#3182ce":"#1e2535"}`,color:filterOut===o?"#63b3ed":"#4a5568",padding:"5px 10px",fontSize:12}}>{o}</button>)}
          </div>
          <button className="btn" onClick={()=>{setForm(EMPTY_TRADE);setView("add");}} style={{background:"#3182ce",color:"#fff",padding:"7px 16px",fontSize:12}}>+ Yeni Trade</button>
        </div>
        {loading?<Spinner/>:filtered.length===0?<div style={{color:"#2d3748",textAlign:"center",padding:"40px 0",fontSize:13}}>Henüz trade yok</div>:(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filtered.map(t=>(
              <Card key={t.id} onClick={()=>{setSelected(t);setView("detail");}} style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",cursor:"pointer"}}>
                {t.images.length>0&&<img src={t.images[0]} alt="" style={{width:48,height:32,objectFit:"cover",borderRadius:4,border:"1px solid #1e2535"}}/>}
                <div style={{minWidth:80,color:"#718096",fontSize:12}}>{t.date}</div>
                <div style={{fontWeight:700,fontSize:14,minWidth:70}}>{t.pair||"—"}</div>
                <Tag label={t.direction} color={dC[t.direction]||"#718096"}/>
                {t.ewWave&&<Tag label={t.ewWave} color="#b794f4"/>}
                {t.ictConcepts.slice(0,2).map((c:string)=><Tag key={c} label={c} color="#63b3ed"/>)}
                {t.ictConcepts.length>2&&<Tag label={`+${t.ictConcepts.length-2}`} color="#4a5568"/>}
                <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
                  {t.pnl&&<span style={{color:parseFloat(t.pnl)>=0?"#48bb78":"#fc8181",fontSize:13}}>{parseFloat(t.pnl)>=0?"+":""}{t.pnl}R</span>}
                  {t.outcome&&<Tag label={t.outcome} color={oC[t.outcome]||"#718096"}/>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </>}
      {view==="add"&&<>
        <div style={{color:"#63b3ed",fontSize:11,textTransform:"uppercase",letterSpacing:1.5,borderBottom:"1px solid #1e2535",paddingBottom:10,marginBottom:18,display:"flex",justifyContent:"space-between"}}><span>YENİ TRADE</span><button className="btn" onClick={()=>setView("list")} style={{background:"#1e2535",color:"#a0aec0",padding:"4px 10px",fontSize:11}}>← Geri</button></div>
        <TradeForm form={form} setForm={setForm} onSave={async()=>{if(!form.pair||!form.direction)return;const t={...form,id:Date.now().toString()};await saveTrade(t);setForm(EMPTY_TRADE);setView("list");}} onCancel={()=>setView("list")} saveLabel="Trade Kaydet"/>
      </>}
      {view==="edit"&&<>
        <div style={{color:"#ecc94b",fontSize:11,textTransform:"uppercase",letterSpacing:1.5,borderBottom:"1px solid #1e2535",paddingBottom:10,marginBottom:18}}>✏️ TRADE DÜZENLE</div>
        <TradeForm form={form} setForm={setForm} onSave={saveEdit} onCancel={()=>setView("detail")} saveLabel="Değişiklikleri Kaydet"/>
      </>}
      {view==="detail"&&selected&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #1e2535",paddingBottom:16,flexWrap:"wrap"}}>
            <span style={{fontWeight:700,fontSize:20}}>{selected.pair}</span>
            <Tag label={selected.direction} color={dC[selected.direction]||"#718096"}/>
            {selected.outcome&&<Tag label={selected.outcome} color={oC[selected.outcome]||"#718096"}/>}
            {selected.pnl&&<span style={{color:parseFloat(selected.pnl)>=0?"#48bb78":"#fc8181",fontFamily:"monospace",fontSize:16}}>{parseFloat(selected.pnl)>=0?"+":""}{selected.pnl}R</span>}
            <div style={{marginLeft:"auto",display:"flex",gap:8}}>
              <button className="btn" onClick={()=>startEdit(selected)} style={{background:"#1e2535",border:"1px solid #3182ce55",color:"#63b3ed",padding:"5px 12px",fontSize:12}}>✏️ Düzenle</button>
              <button className="btn" onClick={()=>setView("list")} style={{background:"#1e2535",color:"#a0aec0",padding:"5px 12px",fontSize:12}}>← Geri</button>
              <button className="btn" onClick={async()=>{await removeTrade(selected.id);setView("list");}} style={{background:"transparent",border:"1px solid #fc818133",color:"#fc8181",padding:"5px 12px",fontSize:12}}>Sil</button>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
            {([["Tarih",selected.date],["Timeframe",selected.timeframe],["Seans",selected.session],["Giriş",selected.entryPrice],["Stop",selected.stopLoss],["TP",selected.takeProfit]] as [string,string][]).map(([l,v])=>v?(<div key={l} style={{background:"#0f1117",border:"1px solid #1e2535",borderRadius:6,padding:"10px 14px"}}><div style={{color:"#4a5568",fontSize:11,textTransform:"uppercase"}}>{l}</div><div style={{color:"#e2e8f0",fontFamily:"monospace",marginTop:3}}>{v}</div></div>):null)}
          </div>
          {selected.ewWave&&<div><label>Elliott Wave</label><Tag label={selected.ewWave} color="#b794f4"/></div>}
          {selected.ictConcepts.length>0&&<div><label>ICT Konseptleri</label><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{selected.ictConcepts.map((c:string)=><Tag key={c} label={c} color="#63b3ed"/>)}</div></div>}
          {selected.confluences&&<div><label>Konfluence</label><div style={{background:"#0f1117",border:"1px solid #1e2535",borderRadius:6,padding:14,fontSize:13,lineHeight:1.6,color:"#a0aec0"}}>{selected.confluences}</div></div>}
          {selected.lessons&&<div><label>Ders & Çıkarımlar</label><div style={{background:"#0f1117",border:"1px solid #1e2535",borderLeft:"2px solid #ecc94b",borderRadius:6,padding:14,fontSize:13,lineHeight:1.6,color:"#a0aec0"}}>{selected.lessons}</div></div>}
          {selected.images.length>0&&<div><label>Grafikler ({selected.images.length})</label><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{selected.images.map((img:string,i:number)=><img key={i} src={img} className="img-thumb" onClick={()=>setLightbox(img)} alt="" style={{width:160,height:100}}/>)}</div></div>}
        </div>
      )}
    </div>
  );
}

// ─── Diary ────────────────────────────────────────────────────────────────────
function DiarySection() {
  const [entries,setEntries]=useState<DiaryEntry[]>([]);
  const [loading,setLoading]=useState(true);
  const [view,setView]=useState<"list"|"add"|"detail">("list");
  const [form,setForm]=useState({date:new Date().toISOString().slice(0,10),title:"",content:"",mood:"😐"});
  const [selected,setSelected]=useState<DiaryEntry|null>(null);
  const MOODS=["😊","😐","😤","😰","🔥","💡"];
  useEffect(()=>{ dbFetch("diary").then(data=>{ setEntries(data); setLoading(false); }).catch(()=>setLoading(false)); },[]);
  return (
    <div>
      {view==="list"&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <span style={{color:"#718096",fontSize:11,textTransform:"uppercase",letterSpacing:1.5}}>📒 Günlük</span>
          <button className="btn" onClick={()=>setView("add")} style={{background:"#3182ce",color:"#fff",padding:"6px 14px",fontSize:12}}>+ Yeni Not</button>
        </div>
        {loading?<Spinner/>:entries.length===0?<div style={{color:"#2d3748",textAlign:"center",padding:"40px 0",fontSize:13}}>Henüz günlük notu yok</div>:(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {entries.map(e=>(
              <Card key={e.id} onClick={()=>{setSelected(e);setView("detail");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:22}}>{e.mood}</span>
                <div><div style={{fontWeight:600,fontSize:14}}>{e.title||"Başlıksız"}</div><div style={{color:"#4a5568",fontSize:11,marginTop:2}}>{e.date} · {e.content.slice(0,60)}{e.content.length>60?"...":""}</div></div>
              </Card>
            ))}
          </div>
        )}
      </>}
      {view==="add"&&<>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><span style={{color:"#63b3ed",fontSize:11,textTransform:"uppercase",letterSpacing:1.5}}>📒 Yeni Not</span><button className="btn" onClick={()=>setView("list")} style={{background:"#1e2535",color:"#a0aec0",padding:"5px 12px",fontSize:12}}>← Geri</button></div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label>Tarih</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
            <div><label>Ruh Hali</label><div style={{display:"flex",gap:6,marginTop:4}}>{MOODS.map(m=><button key={m} onClick={()=>setForm({...form,mood:m})} style={{fontSize:18,background:form.mood===m?"#1e2535":"transparent",border:`1px solid ${form.mood===m?"#3182ce":"#1e2535"}`,borderRadius:6,padding:"3px 7px",cursor:"pointer"}}>{m}</button>)}</div></div>
          </div>
          <div><label>Başlık</label><input placeholder="Bugünkü piyasa..." value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
          <div><label>Notlar</label><textarea rows={8} placeholder="Bugün neler oldu?" value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/></div>
          <div style={{display:"flex",gap:10}}>
            <button className="btn" onClick={async()=>{if(!form.content&&!form.title)return;const e={...form,id:Date.now().toString()};await dbUpsert("diary",e.id,e);setEntries(prev=>[e,...prev]);setForm({date:new Date().toISOString().slice(0,10),title:"",content:"",mood:"😐"});setView("list");}} style={{background:"#3182ce",color:"#fff",padding:"10px",flex:1,borderRadius:8}}>Kaydet</button>
            <button className="btn" onClick={()=>setView("list")} style={{background:"#1e2535",color:"#a0aec0",padding:"10px 18px",borderRadius:8}}>İptal</button>
          </div>
        </div>
      </>}
      {view==="detail"&&selected&&<>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <button className="btn" onClick={()=>setView("list")} style={{background:"#1e2535",color:"#a0aec0",padding:"5px 12px",fontSize:12}}>← Geri</button>
          <button className="btn" onClick={async()=>{await dbDelete("diary",selected.id);setEntries(prev=>prev.filter(e=>e.id!==selected.id));setView("list");}} style={{background:"transparent",border:"1px solid #fc818133",color:"#fc8181",padding:"5px 12px",fontSize:12}}>Sil</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><span style={{fontSize:28}}>{selected.mood}</span><div><div style={{fontWeight:700,fontSize:18}}>{selected.title||"Başlıksız"}</div><div style={{color:"#4a5568",fontSize:12}}>{selected.date}</div></div></div>
        <div style={{background:"#0f1117",border:"1px solid #1e2535",borderRadius:8,padding:16,fontSize:14,lineHeight:1.8,color:"#a0aec0",whiteSpace:"pre-wrap"}}>{selected.content}</div>
      </>}
    </div>
  );
}

// ─── Strategy ─────────────────────────────────────────────────────────────────
function StrategySection() {
  const [notes,setNotes]=useState<StrategyNote[]>([]);
  const [loading,setLoading]=useState(true);
  const [view,setView]=useState<"list"|"add"|"detail">("list");
  const [form,setForm]=useState({title:"",content:"",tags:[] as string[],tagInput:""});
  const [selected,setSelected]=useState<StrategyNote|null>(null);
  useEffect(()=>{ dbFetch("strategy").then(data=>{ setNotes(data); setLoading(false); }).catch(()=>setLoading(false)); },[]);
  function addTag(e:React.KeyboardEvent<HTMLInputElement>){if(e.key==="Enter"&&form.tagInput.trim()){setForm({...form,tags:[...form.tags,form.tagInput.trim()],tagInput:""}); }}
  return (
    <div>
      {view==="list"&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <span style={{color:"#718096",fontSize:11,textTransform:"uppercase",letterSpacing:1.5}}>🧠 Strateji Notları</span>
          <button className="btn" onClick={()=>setView("add")} style={{background:"#3182ce",color:"#fff",padding:"6px 14px",fontSize:12}}>+ Yeni Strateji</button>
        </div>
        {loading?<Spinner/>:notes.length===0?<div style={{color:"#2d3748",textAlign:"center",padding:"40px 0",fontSize:13}}>Henüz strateji notu yok</div>:(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {notes.map(n=>(
              <Card key={n.id} onClick={()=>{setSelected(n);setView("detail");}} style={{cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontWeight:600,fontSize:14}}>{n.title}</div><div style={{color:"#4a5568",fontSize:11}}>{n.updatedAt}</div></div>
                <div style={{color:"#4a5568",fontSize:12,marginTop:4}}>{n.content.slice(0,80)}{n.content.length>80?"...":""}</div>
                {n.tags.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:8}}>{n.tags.map((t:string)=><Tag key={t} label={t} color="#b794f4"/>)}</div>}
              </Card>
            ))}
          </div>
        )}
      </>}
      {view==="add"&&<>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><span style={{color:"#b794f4",fontSize:11,textTransform:"uppercase",letterSpacing:1.5}}>🧠 Yeni Strateji</span><button className="btn" onClick={()=>setView("list")} style={{background:"#1e2535",color:"#a0aec0",padding:"5px 12px",fontSize:12}}>← Geri</button></div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><label>Başlık</label><input placeholder="Wave 3 giriş stratejim..." value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
          <div><label>İçerik</label><textarea rows={10} placeholder="Strateji detayları..." value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/></div>
          <div><label>Etiket Ekle (Enter ile)</label><input placeholder="EW, ICT, OB..." value={form.tagInput} onChange={e=>setForm({...form,tagInput:e.target.value})} onKeyDown={addTag}/>{form.tags.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:8}}>{form.tags.map((t:string)=><span key={t} style={{background:"#b794f422",border:"1px solid #b794f455",color:"#b794f4",borderRadius:4,padding:"2px 8px",fontSize:11,cursor:"pointer"}} onClick={()=>setForm({...form,tags:form.tags.filter((x:string)=>x!==t)})}>{t} ×</span>)}</div>}</div>
          <div style={{display:"flex",gap:10}}>
            <button className="btn" onClick={async()=>{if(!form.title)return;const n={title:form.title,content:form.content,tags:form.tags,id:Date.now().toString(),updatedAt:new Date().toISOString().slice(0,10)};await dbUpsert("strategy",n.id,n);setNotes(prev=>[n,...prev]);setForm({title:"",content:"",tags:[],tagInput:""});setView("list");}} style={{background:"#3182ce",color:"#fff",padding:"10px",flex:1,borderRadius:8}}>Kaydet</button>
            <button className="btn" onClick={()=>setView("list")} style={{background:"#1e2535",color:"#a0aec0",padding:"10px 18px",borderRadius:8}}>İptal</button>
          </div>
        </div>
      </>}
      {view==="detail"&&selected&&<>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <button className="btn" onClick={()=>setView("list")} style={{background:"#1e2535",color:"#a0aec0",padding:"5px 12px",fontSize:12}}>← Geri</button>
          <button className="btn" onClick={async()=>{await dbDelete("strategy",selected.id);setNotes(prev=>prev.filter(n=>n.id!==selected.id));setView("list");}} style={{background:"transparent",border:"1px solid #fc818133",color:"#fc8181",padding:"5px 12px",fontSize:12}}>Sil</button>
        </div>
        <div style={{fontWeight:700,fontSize:20,marginBottom:8}}>{selected.title}</div>
        <div style={{color:"#4a5568",fontSize:12,marginBottom:12}}>{selected.updatedAt}</div>
        {selected.tags.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:16}}>{selected.tags.map((t:string)=><Tag key={t} label={t} color="#b794f4"/>)}</div>}
        <div style={{background:"#0f1117",border:"1px solid #1e2535",borderRadius:8,padding:16,fontSize:14,lineHeight:1.8,color:"#a0aec0",whiteSpace:"pre-wrap"}}>{selected.content}</div>
      </>}
    </div>
  );
}

// ─── Market Obs ───────────────────────────────────────────────────────────────
function MarketObsSection() {
  const [obs,setObs]=useState<MarketObs[]>([]);
  const [loading,setLoading]=useState(true);
  const [view,setView]=useState<"list"|"add"|"detail">("list");
  const [form,setForm]=useState({date:new Date().toISOString().slice(0,10),pair:"",timeframe:"",bias:"",notes:"",keyLevels:""});
  const [selected,setSelected]=useState<MarketObs|null>(null);
  const BIASES=["Bullish","Bearish","Nötr","Belirsiz"];
  const bC:Record<string,string>={"Bullish":"#48bb78","Bearish":"#fc8181","Nötr":"#ecc94b","Belirsiz":"#718096"};
  useEffect(()=>{ dbFetch("market_obs").then(data=>{ setObs(data); setLoading(false); }).catch(()=>setLoading(false)); },[]);
  return (
    <div>
      {view==="list"&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <span style={{color:"#718096",fontSize:11,textTransform:"uppercase",letterSpacing:1.5}}>👁️ Piyasa Gözlemleri</span>
          <button className="btn" onClick={()=>setView("add")} style={{background:"#3182ce",color:"#fff",padding:"6px 14px",fontSize:12}}>+ Yeni Gözlem</button>
        </div>
        {loading?<Spinner/>:obs.length===0?<div style={{color:"#2d3748",textAlign:"center",padding:"40px 0",fontSize:13}}>Henüz piyasa gözlemi yok</div>:(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {obs.map(o=>(
              <Card key={o.id} onClick={()=>{setSelected(o);setView("detail");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                <div style={{color:"#718096",fontSize:12,minWidth:80}}>{o.date}</div>
                <div style={{fontWeight:700,fontSize:14}}>{o.pair}</div>
                {o.timeframe&&<Tag label={o.timeframe} color="#63b3ed"/>}
                {o.bias&&<Tag label={o.bias} color={bC[o.bias]||"#718096"}/>}
                <div style={{color:"#4a5568",fontSize:12,flex:1}}>{o.notes.slice(0,60)}{o.notes.length>60?"...":""}</div>
              </Card>
            ))}
          </div>
        )}
      </>}
      {view==="add"&&<>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><span style={{color:"#63b3ed",fontSize:11,textTransform:"uppercase",letterSpacing:1.5}}>👁️ Yeni Gözlem</span><button className="btn" onClick={()=>setView("list")} style={{background:"#1e2535",color:"#a0aec0",padding:"5px 12px",fontSize:12}}>← Geri</button></div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}}>
            <div><label>Tarih</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
            <div><label>Parite</label><select value={form.pair} onChange={e=>setForm({...form,pair:e.target.value})}><option value="">Seç</option>{PAIRS.map(p=><option key={p}>{p}</option>)}</select></div>
            <div><label>Timeframe</label><select value={form.timeframe} onChange={e=>setForm({...form,timeframe:e.target.value})}><option value="">Seç</option>{TIMEFRAMES.map(t=><option key={t}>{t}</option>)}</select></div>
          </div>
          <div><label>Bias</label><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{BIASES.map(b=><button key={b} className="btn" onClick={()=>setForm({...form,bias:b})} style={{padding:"6px 14px",background:form.bias===b?bC[b]+"22":"transparent",border:`1px solid ${form.bias===b?bC[b]:"#1e2535"}`,color:form.bias===b?bC[b]:"#4a5568"}}>{b}</button>)}</div></div>
          <div><label>Önemli Seviyeler</label><textarea rows={3} placeholder="1.0850 → Bullish OB" value={form.keyLevels} onChange={e=>setForm({...form,keyLevels:e.target.value})}/></div>
          <div><label>Gözlem Notları</label><textarea rows={5} placeholder="Piyasa ne söylüyor?" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
          <div style={{display:"flex",gap:10}}>
            <button className="btn" onClick={async()=>{if(!form.pair)return;const o={...form,id:Date.now().toString()};await dbUpsert("market_obs",o.id,o);setObs(prev=>[o,...prev]);setForm({date:new Date().toISOString().slice(0,10),pair:"",timeframe:"",bias:"",notes:"",keyLevels:""});setView("list");}} style={{background:"#3182ce",color:"#fff",padding:"10px",flex:1,borderRadius:8}}>Kaydet</button>
            <button className="btn" onClick={()=>setView("list")} style={{background:"#1e2535",color:"#a0aec0",padding:"10px 18px",borderRadius:8}}>İptal</button>
          </div>
        </div>
      </>}
      {view==="detail"&&selected&&<>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <button className="btn" onClick={()=>setView("list")} style={{background:"#1e2535",color:"#a0aec0",padding:"5px 12px",fontSize:12}}>← Geri</button>
          <button className="btn" onClick={async()=>{await dbDelete("market_obs",selected.id);setObs(prev=>prev.filter(o=>o.id!==selected.id));setView("list");}} style={{background:"transparent",border:"1px solid #fc818133",color:"#fc8181",padding:"5px 12px",fontSize:12}}>Sil</button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
          <span style={{fontWeight:700,fontSize:20}}>{selected.pair}</span>
          {selected.timeframe&&<Tag label={selected.timeframe} color="#63b3ed"/>}
          {selected.bias&&<Tag label={selected.bias} color={bC[selected.bias]||"#718096"}/>}
          <span style={{color:"#4a5568",fontSize:12}}>{selected.date}</span>
        </div>
        {selected.keyLevels&&<div style={{marginBottom:16}}><label>Önemli Seviyeler</label><div style={{background:"#0f1117",border:"1px solid #1e2535",borderLeft:"2px solid #63b3ed",borderRadius:8,padding:14,fontSize:13,lineHeight:1.8,color:"#a0aec0",whiteSpace:"pre-wrap"}}>{selected.keyLevels}</div></div>}
        {selected.notes&&<div><label>Gözlem Notları</label><div style={{background:"#0f1117",border:"1px solid #1e2535",borderRadius:8,padding:14,fontSize:14,lineHeight:1.8,color:"#a0aec0",whiteSpace:"pre-wrap"}}>{selected.notes}</div></div>}
      </>}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState<"journal"|"diary"|"strategy"|"market">("journal");
  const tabs=[{id:"journal",label:"📈 Trade"},{id:"diary",label:"📒 Günlük"},{id:"strategy",label:"🧠 Strateji"},{id:"market",label:"👁️ Piyasa"}];
  return (
    <div style={{minHeight:"100vh",background:"#080b10",color:"#e2e8f0",fontFamily:"'IBM Plex Mono','Courier New',monospace"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;600;700&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0f1117}::-webkit-scrollbar-thumb{background:#1e2535}
        input,select,textarea{background:#0f1117!important;color:#e2e8f0!important;border:1px solid #1e2535!important;border-radius:6px;padding:8px 12px;font-family:inherit;font-size:13px;outline:none;width:100%;transition:border-color .2s}
        input:focus,select:focus,textarea:focus{border-color:#3182ce!important}
        select option{background:#0f1117}
        .btn{cursor:pointer;border:none;border-radius:6px;font-family:inherit;font-size:13px;font-weight:600;transition:all .15s}
        .btn:hover{filter:brightness(1.15)}
        .ict-tag{cursor:pointer;padding:4px 10px;border-radius:4px;font-size:11px;border:1px solid #1e2535;color:#718096;transition:all .15s;margin:2px;display:inline-block;background:transparent;font-family:inherit}
        .ict-tag:hover{border-color:#3182ce55;color:#90cdf4}
        .ict-tag.active{background:#3182ce22!important;border-color:#3182ce!important;color:#63b3ed!important}
        label{font-size:11px;color:#718096;text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:5px}
        .lightbox{position:fixed;inset:0;background:#000000cc;z-index:1000;display:flex;align-items:center;justify-content:center;cursor:zoom-out}
        .lightbox img{max-width:90vw;max-height:90vh;border-radius:8px}
        .img-thumb{object-fit:cover;border-radius:6px;border:1px solid #1e2535;cursor:pointer;transition:transform .15s}
        .img-thumb:hover{transform:scale(1.05);border-color:#3182ce}
      `}</style>
      <div style={{borderBottom:"1px solid #1e2535",padding:"14px 24px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,background:"#080b10",zIndex:10}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:"#48bb78",boxShadow:"0 0 8px #48bb78"}}/>
        <span style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:18,letterSpacing:-0.5}}>EW·ICT Platform</span>
      </div>
      <div style={{borderBottom:"1px solid #1e2535",padding:"0 24px",display:"flex",gap:0,overflowX:"auto"}}>
        {tabs.map(t=>(
          <button key={t.id} className="btn" onClick={()=>setTab(t.id as any)} style={{padding:"12px 18px",background:"transparent",borderRadius:0,fontSize:12,fontWeight:600,color:tab===t.id?"#e2e8f0":"#4a5568",borderBottom:tab===t.id?"2px solid #3182ce":"2px solid transparent",whiteSpace:"nowrap"}}>{t.label}</button>
        ))}
      </div>
      <div style={{maxWidth:960,margin:"0 auto",padding:"24px 16px"}}>
        {tab==="journal"&&<TradeJournalSection/>}
        {tab==="diary"&&<DiarySection/>}
        {tab==="strategy"&&<StrategySection/>}
        {tab==="market"&&<MarketObsSection/>}
      </div>
    </div>
  );
}
