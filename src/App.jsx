import { useState } from "react";

const ALL_TXN = [
  { id:"TXN-4821", amount:4299.99, merchant:"ElectroMart Online", category:"Electronics", country:"RO", time:"02:14", cardPresent:false, velocity:8,  distanceKm:1420, avgSpend:85,  hour:2,  newMerchant:true,  intl:true,  groundTruth:"confirmed_fraud" },
  { id:"TXN-3317", amount:52.40,   merchant:"Rewe Supermarkt",    category:"Grocery",     country:"DE", time:"11:32", cardPresent:true,  velocity:1,  distanceKm:2,    avgSpend:61,  hour:11, newMerchant:false, intl:false, groundTruth:"legitimate"      },
  { id:"TXN-9043", amount:899.00,  merchant:"LuxuryBags.com",     category:"Fashion",     country:"CN", time:"03:47", cardPresent:false, velocity:5,  distanceKm:8700, avgSpend:85,  hour:3,  newMerchant:true,  intl:true,  groundTruth:"suspected"       },
  { id:"TXN-1156", amount:23.80,   merchant:"BP Tankstelle",      category:"Fuel",        country:"DE", time:"08:15", cardPresent:true,  velocity:2,  distanceKm:15,   avgSpend:61,  hour:8,  newMerchant:false, intl:false, groundTruth:"legitimate"      },
  { id:"TXN-7729", amount:1750.00, merchant:"Crypto Exchange X",  category:"Crypto",      country:"US", time:"22:58", cardPresent:false, velocity:12, distanceKm:640,  avgSpend:85,  hour:22, newMerchant:true,  intl:true,  groundTruth:"confirmed_fraud" },
  { id:"TXN-2234", amount:210.00,  merchant:"Zalando",            category:"Fashion",     country:"DE", time:"21:30", cardPresent:false, velocity:3,  distanceKm:0,    avgSpend:95,  hour:21, newMerchant:false, intl:false, groundTruth:"suspected"       },
  { id:"TXN-5512", amount:3100.00, merchant:"GoldJewels Dubai",   category:"Jewellery",   country:"AE", time:"01:22", cardPresent:false, velocity:7,  distanceKm:5200, avgSpend:90,  hour:1,  newMerchant:true,  intl:true,  groundTruth:"confirmed_fraud" },
  { id:"TXN-6630", amount:38.50,   merchant:"Lidl Supermarkt",    category:"Grocery",     country:"DE", time:"09:45", cardPresent:true,  velocity:1,  distanceKm:4,    avgSpend:55,  hour:9,  newMerchant:false, intl:false, groundTruth:"legitimate"      },
  { id:"TXN-8801", amount:620.00,  merchant:"SteamGames",         category:"Gaming",      country:"RU", time:"04:10", cardPresent:false, velocity:4,  distanceKm:2100, avgSpend:75,  hour:4,  newMerchant:true,  intl:true,  groundTruth:"suspected"       },
  { id:"TXN-5541", amount:420.00,  merchant:"MediaMarkt Berlin",  category:"Electronics", country:"DE", time:"19:45", cardPresent:false, velocity:4,  distanceKm:310,  avgSpend:95,  hour:19, newMerchant:true,  intl:false, groundTruth:"legitimate"      },
  { id:"TXN-3341", amount:2400.00, merchant:"CryptoWallet Pro",   category:"Crypto",      country:"US", time:"03:05", cardPresent:false, velocity:9,  distanceKm:720,  avgSpend:80,  hour:3,  newMerchant:true,  intl:true,  groundTruth:"confirmed_fraud" },
  { id:"TXN-4450", amount:340.00,  merchant:"Saturn Markt",       category:"Electronics", country:"DE", time:"18:55", cardPresent:true,  velocity:2,  distanceKm:42,   avgSpend:70,  hour:18, newMerchant:true,  intl:false, groundTruth:"legitimate"      },
  { id:"TXN-7760", amount:5800.00, merchant:"TechZone Warsaw",    category:"Electronics", country:"PL", time:"02:55", cardPresent:false, velocity:6,  distanceKm:1100, avgSpend:90,  hour:2,  newMerchant:true,  intl:true,  groundTruth:"confirmed_fraud" },
  { id:"TXN-6612", amount:185.00,  merchant:"Booking.com",        category:"Travel",      country:"NL", time:"23:10", cardPresent:false, velocity:3,  distanceKm:220,  avgSpend:110, hour:23, newMerchant:false, intl:true,  groundTruth:"legitimate"      },
  { id:"TXN-9910", amount:980.00,  merchant:"LuxuryWatch HK",     category:"Jewellery",   country:"HK", time:"04:33", cardPresent:false, velocity:5,  distanceKm:9200, avgSpend:85,  hour:4,  newMerchant:true,  intl:true,  groundTruth:"confirmed_fraud" },
];

function xgbScore(tx) {
  if (!tx) return 0;
  let s = 0.05;
  const r = tx.amount / tx.avgSpend;
  if (r > 20) s += 0.30; else if (r > 5) s += 0.15; else if (r > 2) s += 0.07;
  if (!tx.cardPresent) s += 0.08;
  if (tx.intl) s += 0.12;
  if (tx.distanceKm > 1000) s += 0.15; else if (tx.distanceKm > 200) s += 0.06;
  if (tx.velocity > 7) s += 0.14; else if (tx.velocity > 3) s += 0.06;
  if (tx.hour < 5) s += 0.10; else if (tx.hour < 7) s += 0.04;
  if (tx.newMerchant) s += 0.07;
  if (tx.category === "Crypto") s += 0.10;
  if (tx.category === "Electronics" && tx.intl) s += 0.08;
  if (tx.category === "Jewellery" && tx.intl) s += 0.06;
  if (tx.groundTruth === "suspected") s = Math.min(0.82, Math.max(0.50, s));
  return Math.min(0.99, s);
}

function lrScore(tx) {
  if (!tx) return 0;
  const r = tx.amount / tx.avgSpend;
  const logit = -1.2 + r*0.18 + (tx.intl?0.9:0) + (tx.distanceKm/1000)*0.6
    + tx.velocity*0.07 + (!tx.cardPresent?0.5:0) + (tx.newMerchant?0.4:0)
    + (tx.hour<5?0.7:0) + (tx.category==="Crypto"?0.8:0);
  return Math.min(0.99, Math.max(0.01, 1/(1+Math.exp(-logit))));
}

function dtScore(tx) {
  if (!tx) return 0;
  const r = tx.amount / tx.avgSpend;
  if (r > 10 && tx.intl) return 0.93;
  if (r > 5 && tx.velocity > 5) return 0.87;
  if (tx.distanceKm > 1000 && !tx.cardPresent) return 0.82;
  if (tx.hour < 5 && tx.intl) return 0.78;
  if (tx.category === "Crypto" && tx.velocity > 3) return 0.76;
  if ((tx.amount/tx.avgSpend) > 3 && tx.newMerchant) return 0.55;
  if ((tx.amount/tx.avgSpend) < 2 && !tx.intl && tx.distanceKm < 50) return 0.08;
  return 0.25;
}

function getShap(tx) {
  if (!tx) return [];
  const r = tx.amount / tx.avgSpend;
  return [
    {f:"Amount vs avg",    v: r>20?0.28:r>5?0.13:r>2?0.06:-0.03, lbl:`×${r.toFixed(1)}`},
    {f:"Hour",             v: tx.hour<5?0.09:tx.hour<7?0.03:-0.02, lbl:`${tx.hour}:00`},
    {f:"Distance",         v: tx.distanceKm>1000?0.14:tx.distanceKm>200?0.05:-0.02, lbl:`${tx.distanceKm}km`},
    {f:"Velocity",         v: tx.velocity>7?0.13:tx.velocity>3?0.05:-0.03, lbl:`${tx.velocity}/hr`},
    {f:"International",    v: tx.intl?0.11:-0.04, lbl:tx.intl?"Yes":"No"},
    {f:"Card not present", v: !tx.cardPresent?0.07:-0.03, lbl:tx.cardPresent?"Present":"Absent"},
    {f:"New merchant",     v: tx.newMerchant?0.06:-0.02, lbl:tx.newMerchant?"Yes":"No"},
    {f:"Category",         v: tx.category==="Crypto"?0.09:tx.category==="Electronics"?0.05:["Grocery","Fuel"].includes(tx.category)?-0.04:0.01, lbl:tx.category},
  ].sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));
}

function riskLevel(s) {
  if (s >= 0.7) return {text:"High risk",   col:"#c0392b", bg:"#fdecea"};
  if (s >= 0.4) return {text:"Medium risk", col:"#b7770d", bg:"#fef3cd"};
  return               {text:"Low risk",    col:"#1a7a4a", bg:"#e8f7ee"};
}

const TRUTH_CFG = {
  confirmed_fraud: {label:"Confirmed fraud", col:"#c0392b", bg:"#fdecea", icon:"⚠"},
  legitimate:      {label:"Legitimate",      col:"#1a7a4a", bg:"#e8f7ee", icon:"✓"},
  suspected:       {label:"Suspected fraud", col:"#8e44ad", bg:"#f5eeff", icon:"?"},
};

const WORKFLOW = [
  {id:"triage",   icon:"🔍", label:"1 · Alert appears",              stage:"Alert Appears",   col:"#4a7c59", bg:"#e8f5ee", single:true},
  {id:"escalate", icon:"📋", label:"2 · Evaluate explanations",   stage:"Investigation",   col:"#7b5ea7", bg:"#f2eef9", single:true},
  {id:"priority", icon:"🎯", label:"3 · Multi-alert prioritization", stage:"Batch of Alerts", col:"#b8860b", bg:"#fef9e7", single:false},
];

const ALL_EXP_TABS = ["SHAP","LIME","LLM","Counterfactual","Logistic regression","Decision tree","Peer cases"];
const SPEED_EXP   = ["Under 10 sec","10–30 sec","30–60 sec","1–2 min","Over 2 min"];
const SPEED_BATCH = ["Under 1 min","1–2 min","2–3 min","3–4 min","Over 4 min"];

const TASK_METRICS = {
  triage: [
    {lbl:"Based on the information above, how would you classify this transaction?", type:"classification"},
    {lbl:"Confidence", type:"l7"},
  ],
  escalate: [
    {lbl:"Which explanation helped you the most in assessing this transaction?", type:"expselect"},
    {lbl:"How long did you take to understand this explanation?", type:"speed_exp"},
    {lbl:"On a scale of 1 to 5, how clear was this explanation?", type:"clarity"},
    {lbl:"On a scale of 1 to 5, how complete was this explanation?", type:"completeness"},
  ],
  priority: [
    {lbl:"Prioritization accuracy", type:"pct"},
    {lbl:"How confident are you in your prioritisation?", type:"l7"},
    {lbl:"How long did it take you to prioritise all alerts?", type:"speed_batch"},
  ],
};

const EXP_GROUPS = [
  {id:"posthoc",  label:"Post-hoc explainability",  col:"#2980b9", bg:"#e8f0fe",
   desc:"Applied after model prediction was made",
   tabs:[{id:"shap",label:"SHAP"},{id:"lime",label:"LIME"},{id:"llm",label:"LLM"},{id:"counterfactual",label:"Counterfactual"}]},
  {id:"inherent", label:"Inherently interpretable", col:"#16a085", bg:"#e8f8f5",
   desc:"Transparent by construction — no post-hoc approximation",
   tabs:[{id:"logreg",label:"Logistic regression"},{id:"dtree",label:"Decision tree"},{id:"peers",label:"Peer cases"}]},
];

// ── Shared components ─────────────────────────────────────────────────────────
function Badge({label, col="#888", bg="#f0f0f0", sz=11}) {
  return <span style={{fontSize:sz,padding:"2px 8px",borderRadius:10,background:bg,color:col,fontWeight:500,whiteSpace:"nowrap"}}>{label}</span>;
}

function Gauge({score}) {
  const pct = Math.round(Math.min(score, 0.99) * 100);
  const r = riskLevel(score);
  const cx = 80; const cy = 72; const radius = 54;
  const startDeg = 210; const sweepDeg = 120;
  const angleDeg = startDeg + (pct / 100) * sweepDeg;
  const angleRad = angleDeg * Math.PI / 180;
  const needleLen = radius - 8;
  const needleX = cx + needleLen * Math.cos(angleRad);
  const needleY = cy + needleLen * Math.sin(angleRad);
  const x1 = cx + radius * Math.cos(startDeg * Math.PI / 180);
  const y1 = cy + radius * Math.sin(startDeg * Math.PI / 180);
  const x2 = cx + radius * Math.cos(330 * Math.PI / 180);
  const y2 = cy + radius * Math.sin(330 * Math.PI / 180);
  const filledAngle = startDeg + (pct / 100) * sweepDeg;
  const fx = cx + radius * Math.cos(filledAngle * Math.PI / 180);
  const fy = cy + radius * Math.sin(filledAngle * Math.PI / 180);
  const largeArc = (pct / 100) * sweepDeg > 180 ? 1 : 0;
  return (
    <div style={{textAlign:"center"}}>
      <svg viewBox="0 0 160 125" width="140">
        <path d={`M${x1},${y1} A${radius},${radius},0,0,1,${x2},${y2}`}
          fill="none" stroke="#eee" strokeWidth="12" strokeLinecap="round"/>
        {pct > 0 && (
          <path d={`M${x1},${y1} A${radius},${radius},0,${largeArc},1,${fx},${fy}`}
            fill="none" stroke={r.col} strokeWidth="12" strokeLinecap="round"/>
        )}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#333" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="5" fill="#333"/>
        <text x={cx} y="100" textAnchor="middle" fontSize="22" fontWeight="500" fill={r.col}>{pct}</text>
        <text x={cx} y="116" textAnchor="middle" fontSize="11" fontWeight="500" fill={r.col}>{r.text}</text>
      </svg>
    </div>
  );
}

function AttrBar({v}) {
  const pct = Math.min(Math.abs(v)/0.30*100,100);
  return (
    <div style={{flex:1,background:"#f5f5f5",borderRadius:3,height:11,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",left:v>0?"50%":`${50-pct/2}%`,width:`${pct/2}%`,height:"100%",background:v>0?"#c0392b":"#1a7a4a"}}/>
      <div style={{position:"absolute",left:"50%",top:0,height:"100%",width:1,background:"#ccc"}}/>
    </div>
  );
}

// ── Explanation panels ────────────────────────────────────────────────────────
function ShapPanel({tx}) {
  const vals = getShap(tx);
  return (
    <div>
      <div style={{fontSize:12,color:"#888",marginBottom:8}}>Per-feature contribution to XGBoost score (TreeSHAP — exact)</div>
      <div style={{display:"flex",gap:10,fontSize:11,color:"#888",marginBottom:10}}>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,background:"#c0392b",borderRadius:2,display:"inline-block"}}/>Increases risk</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,background:"#1a7a4a",borderRadius:2,display:"inline-block"}}/>Decreases risk</span>
      </div>
      {vals.map((d,i)=>(
        <div key={i} style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}>
            <span style={{color:"#444"}}>{d.f}</span><span style={{color:"#aaa"}}>{d.lbl}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <AttrBar v={d.v}/>
            <span style={{fontSize:11,color:d.v>0?"#c0392b":"#1a7a4a",minWidth:44,textAlign:"right"}}>{d.v>0?"+":""}{d.v.toFixed(3)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function LimePanel({tx}) {
  const vals = getShap(tx).slice(0,6).map(d=>({...d,v:d.v*0.88}));
  return (
    <div>
      <div style={{fontSize:12,color:"#888",marginBottom:10}}>Local surrogate approximation around this transaction</div>
      {vals.map((d,i)=>(
        <div key={i} style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}>
            <span style={{color:"#444"}}>{d.f}</span><span style={{color:"#aaa"}}>{d.lbl}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <AttrBar v={d.v}/>
            <span style={{fontSize:11,color:d.v>0?"#c0392b":"#1a7a4a",minWidth:44,textAlign:"right"}}>{d.v>0?"+":""}{d.v.toFixed(3)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── FIXED LLMPanel ────────────────────────────────────────────────────────────
function LLMPanel({tx, score}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const run = async () => {
    setLoading(true); setError(""); setText(""); setDone(false);
    const r = riskLevel(score);
    const prompt = `You are an AI assistant in a bank fraud detection dashboard for anti-fraud analysts.\n\nTransaction: ${tx.id} · €${tx.amount} at ${tx.merchant} (${tx.category}, ${tx.country}) · ${tx.time} · Card ${tx.cardPresent?"present":"not present"} · ${tx.intl?"International":"Domestic"} · ${tx.distanceKm}km · ${tx.velocity} txns/hr · ${tx.newMerchant?"New":"Known"} merchant · Avg spend €${tx.avgSpend}\nXGBoost score: ${Math.round(score*100)}/100 (${r.text})\n\nWrite 3 concise paragraphs: (1) overall risk and key drivers, (2) what the model detected and why, (3) recommended action. Plain language, no bullets.`;

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(`API error: ${data.error.message}`);
      } else {
        setText(data.choices[0]?.message?.content || "No response.");
        setDone(true);
      }
    } catch (e) {
      setError("API call failed. Check your API key in Vercel environment variables.");
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span style={{fontSize:11,color:"#888"}}>Generated by</span>
        <Badge label="claude-sonnet-4-20250514" col="#6b3fa0" bg="#f0e8ff"/>
        <Badge label="Anthropic API" col="#2980b9" bg="#e8f0fe"/>
      </div>
      {!done&&!loading&&<button onClick={run} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #6b3fa0",background:"#f9f4ff",color:"#6b3fa0",fontSize:13,cursor:"pointer",fontWeight:500}}>Generate narrative ↗</button>}
      {loading&&<div style={{display:"flex",alignItems:"center",gap:8,color:"#888",fontSize:13}}><div style={{width:13,height:13,border:"2px solid #ccc",borderTopColor:"#6b3fa0",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Generating…</div>}
      {error&&<div style={{color:"#c0392b",fontSize:13,padding:"8px 12px",background:"#fdecea",borderRadius:6}}>{error}</div>}
      {text&&<div><div style={{fontSize:13,lineHeight:1.8,color:"#333",whiteSpace:"pre-wrap"}}>{text}</div><button onClick={run} style={{marginTop:8,padding:"4px 12px",borderRadius:6,border:"1px solid #ddd",background:"#fafafa",color:"#888",fontSize:12,cursor:"pointer"}}>Regenerate</button></div>}
    </div>
  );
}

function CounterfactualPanel({tx, score}) {
  const pct = Math.round(score*100);
  const r = tx.amount/tx.avgSpend;
  const changes = [];
  if (tx.hour<6)         changes.push({icon:"🕐",desc:`Transaction at normal hour (08–20)`,delta:-10,feasible:false});
  if (tx.distanceKm>200) changes.push({icon:"📍",desc:`Merchant within 50 km (now ${tx.distanceKm}km)`,delta:-14,feasible:false});
  if (tx.velocity>3)     changes.push({icon:"⚡",desc:`Under 3 txns/hr (now ${tx.velocity})`,delta:-10,feasible:true});
  if (!tx.cardPresent)   changes.push({icon:"💳",desc:"Card present at terminal",delta:-8,feasible:false});
  if (tx.newMerchant)    changes.push({icon:"🏪",desc:"Previously known merchant",delta:-7,feasible:false});
  if (r>5)               changes.push({icon:"💰",desc:`Amount ≤ €${Math.round(tx.avgSpend*3)} (3× avg)`,delta:-15,feasible:true});
  if (changes.length===0) return <div style={{fontSize:13,color:"#888",padding:"12px 0"}}>This transaction is already near or below the alert threshold.</div>;
  const newScore = Math.max(5, pct+changes.reduce((a,c)=>a+c.delta,0));
  return (
    <div>
      <div style={{fontSize:12,color:"#888",marginBottom:10}}>Minimal changes to fall below the alert threshold (40)</div>
      {changes.map((c,i)=>(
        <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"7px 0",borderBottom:"1px solid #f5f5f5"}}>
          <span style={{fontSize:15}}>{c.icon}</span>
          <div style={{flex:1}}><div style={{fontSize:13,color:"#333"}}>{c.desc}</div><div style={{fontSize:11,color:"#bbb"}}>{c.feasible?"Can be verified":"Fixed historical fact — cannot change"}</div></div>
          <span style={{fontSize:12,color:"#1a7a4a",fontWeight:500}}>−{Math.abs(c.delta)}</span>
        </div>
      ))}
      <div style={{marginTop:10,padding:"9px 12px",background:"#f8f8f8",borderRadius:8,fontSize:13}}>
        All changes applied: <strong style={{color:newScore<40?"#1a7a4a":"#c0392b"}}>{newScore}/100</strong>
        <span style={{color:"#aaa",marginLeft:6}}>{newScore<40?"→ below threshold":"→ still above"}</span>
      </div>
    </div>
  );
}

function LogRegPanel({tx}) {
  const score = lrScore(tx); const r = riskLevel(score);
  const amt = tx.amount/tx.avgSpend;
  const coeffs = [
    {f:"Intercept",       coef:-1.20, val:1,                         c:-1.20},
    {f:"Amount ratio",    coef:0.18,  val:amt,                        c:0.18*amt},
    {f:"International",   coef:0.90,  val:tx.intl?1:0,                c:tx.intl?0.90:0},
    {f:"Distance (×1km)", coef:0.60,  val:tx.distanceKm/1000,         c:0.60*(tx.distanceKm/1000)},
    {f:"Velocity/hr",     coef:0.07,  val:tx.velocity,                 c:0.07*tx.velocity},
    {f:"Card not pres.",  coef:0.50,  val:tx.cardPresent?0:1,         c:tx.cardPresent?0:0.50},
    {f:"New merchant",    coef:0.40,  val:tx.newMerchant?1:0,         c:tx.newMerchant?0.40:0},
    {f:"Off-hours",       coef:0.70,  val:tx.hour<5?1:0,              c:tx.hour<5?0.70:0},
    {f:"Crypto",          coef:0.80,  val:tx.category==="Crypto"?1:0, c:tx.category==="Crypto"?0.80:0},
  ].sort((a,b)=>Math.abs(b.c)-Math.abs(a.c));
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <Badge label="Logistic Regression" col="#16a085" bg="#e8f8f5"/>
        <span style={{fontSize:12,color:"#888"}}>Score: <strong style={{color:r.col}}>{Math.round(score*100)}/100</strong></span>
      </div>
      <div style={{fontFamily:"monospace",fontSize:11,background:"#f8f8f8",borderRadius:6,padding:"9px 12px",marginBottom:12,lineHeight:1.7,color:"#555"}}>
        P(fraud) = σ({coeffs.map((c,i)=>`${i>0&&c.c>0?"+":""}${c.c.toFixed(2)}`).join(" ")})
      </div>
      {coeffs.map((c,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid #f5f5f5"}}>
          <span style={{flex:1,fontSize:12,color:"#444"}}>{c.f}</span>
          <span style={{fontSize:11,color:"#aaa",minWidth:90}}>{c.coef.toFixed(2)} × {c.val.toFixed(2)}</span>
          <span style={{fontSize:12,fontWeight:500,minWidth:50,textAlign:"right",color:c.c>0?"#c0392b":"#1a7a4a"}}>{c.c>0?"+":""}{c.c.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

function DTreePanel({tx}) {
  const score = dtScore(tx); const r = riskLevel(score);
  const amt = tx.amount/tx.avgSpend;
  const path = [];
  if (amt>10&&tx.intl)                          {path.push({q:"Amount > 10× avg?",a:"Yes"},{q:"International?",a:"Yes"});}
  else if (amt>5&&tx.velocity>5)                {path.push({q:"Amount > 5× avg?",a:"Yes"},{q:"Velocity > 5/hr?",a:"Yes"});}
  else if (tx.distanceKm>1000&&!tx.cardPresent) {path.push({q:"Distance > 1000km?",a:"Yes"},{q:"Card not present?",a:"Yes"});}
  else if (tx.hour<5&&tx.intl)                  {path.push({q:"Hour 00–05?",a:"Yes"},{q:"International?",a:"Yes"});}
  else if (amt<2&&!tx.intl&&tx.distanceKm<50)   {path.push({q:"Amount < 2× avg?",a:"Yes"},{q:"Domestic & local?",a:"Yes"});}
  else                                           {path.push({q:"Amount > 3× avg?",a:amt>3?"Yes":"No"},{q:"New merchant?",a:tx.newMerchant?"Yes":"No"});}
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <Badge label="Decision Tree" col="#16a085" bg="#e8f8f5"/>
        <span style={{fontSize:12,color:"#888"}}>Score: <strong style={{color:r.col}}>{Math.round(score*100)}/100</strong></span>
      </div>
      <div style={{fontSize:12,color:"#888",marginBottom:10}}>Decision path — transparent by construction</div>
      {path.map((p,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",marginBottom:6,background:i%2===0?"#f9f9f9":"#fff",borderRadius:6,border:"1px solid #f0f0f0"}}>
          <span style={{fontSize:14,color:"#aaa"}}>{"→".repeat(i+1)}</span>
          <span style={{fontSize:12,color:"#555",flex:1}}><strong>IF</strong> {p.q}</span>
          <Badge label={p.a} col={p.a==="Yes"?"#c0392b":"#1a7a4a"} bg={p.a==="Yes"?"#fdecea":"#e8f7ee"}/>
        </div>
      ))}
      <div style={{marginTop:8,padding:"10px 12px",borderRadius:8,background:r.bg,color:r.col,fontSize:13,fontWeight:500}}>
        Terminal node: {Math.round(score*100)}/100 — {r.text}
      </div>
    </div>
  );
}

function PeersPanel() {
  const peers = [
    {sim:97,outcome:"confirmed_fraud",amount:3890,merchant:"TechStore BG",country:"BG",hour:3,vel:9},
    {sim:91,outcome:"confirmed_fraud",amount:5100,merchant:"ElecZone RO",  country:"RO",hour:1,vel:7},
    {sim:84,outcome:"suspected",      amount:2750,merchant:"GadgetHub UA", country:"UA",hour:4,vel:6},
    {sim:78,outcome:"legitimate",     amount:1200,merchant:"MediaMarkt",   country:"DE",hour:14,vel:1},
    {sim:71,outcome:"legitimate",     amount:980,  merchant:"Saturn",       country:"DE",hour:10,vel:2},
    {sim:65,outcome:"suspected",      amount:640,  merchant:"Zalando",      country:"DE",hour:22,vel:2},
  ];
  const counts = Object.fromEntries(Object.keys(TRUTH_CFG).map(k=>[k,peers.filter(p=>p.outcome===k).length]));
  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {Object.entries(counts).map(([k,v])=>{
          const tc=TRUTH_CFG[k];
          return <div key={k} style={{flex:1,background:tc.bg,borderRadius:8,padding:"8px",textAlign:"center"}}><div style={{fontSize:18,fontWeight:500,color:tc.col}}>{v}</div><div style={{fontSize:10,color:tc.col}}>{tc.label}</div></div>;
        })}
      </div>
      {peers.map((p,i)=>{
        const tc=TRUTH_CFG[p.outcome];
        return (
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:"1px solid #f5f5f5"}}>
            <div style={{minWidth:36,textAlign:"center"}}><div style={{fontSize:11,fontWeight:500,color:"#555"}}>{p.sim}%</div></div>
            <div style={{width:28,height:28,borderRadius:"50%",background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:tc.col,fontWeight:700}}>{tc.icon}</div>
            <div style={{flex:1}}><div style={{fontSize:12,color:"#333"}}>{p.merchant} · €{p.amount.toLocaleString()}</div><div style={{fontSize:11,color:"#aaa"}}>{p.country} · {p.hour}:00 · {p.vel}/hr</div></div>
            <Badge label={tc.label} col={tc.col} bg={tc.bg}/>
          </div>
        );
      })}
    </div>
  );
}

// ── Metric input ──────────────────────────────────────────────────────────────
function MetricInput({m, val, onChange}) {
  switch (m.type) {
    case "timer":
      return <div style={{fontSize:12,color:"#888",fontStyle:"italic",padding:"4px 0"}}>⏱ Auto-measured on task completion</div>;

    case "classification":
      return (
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[
            {key:"confirmed_fraud",label:"Confirmed fraud",col:"#c0392b",bg:"#fdecea",icon:"⚠"},
            {key:"legitimate",     label:"Legitimate",     col:"#1a7a4a",bg:"#e8f7ee",icon:"✓"},
            {key:"suspected",      label:"Suspected fraud",col:"#8e44ad",bg:"#f5eeff",icon:"?"},
          ].map(o=>(
            <button key={o.key} onClick={()=>onChange(o.key)}
              style={{padding:"9px 18px",borderRadius:10,border:`2px solid ${val===o.key?o.col:"#ddd"}`,background:val===o.key?o.bg:"#fff",color:val===o.key?o.col:"#888",fontSize:13,fontWeight:val===o.key?600:400,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:15}}>{o.icon}</span>{o.label}
            </button>
          ))}
        </div>
      );

    case "l7":
    case "l5": {
      const max = m.type==="l7"?7:5;
      return (
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          <span style={{fontSize:10,color:"#bbb",minWidth:24}}>low</span>
          {Array.from({length:max},(_,i)=>i+1).map(n=>(
            <button key={n} onClick={()=>onChange(n)} style={{width:30,height:30,borderRadius:6,border:`1px solid ${val===n?"#2980b9":"#ddd"}`,background:val===n?"#e8f0fe":"#fff",color:val===n?"#2980b9":"#888",fontSize:12,cursor:"pointer"}}>{n}</button>
          ))}
          <span style={{fontSize:10,color:"#bbb",minWidth:28}}>high</span>
        </div>
      );
    }

    case "clarity":
    case "completeness":
      return (
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:10,color:"#aaa",minWidth:68}}>Very unclear</span>
          {[1,2,3,4,5].map(n=>(
            <button key={n} onClick={()=>onChange(n)} style={{width:32,height:32,borderRadius:6,border:`1px solid ${val===n?"#2980b9":"#ddd"}`,background:val===n?"#e8f0fe":"#fff",color:val===n?"#2980b9":"#888",fontSize:13,cursor:"pointer"}}>{n}</button>
          ))}
          <span style={{fontSize:10,color:"#aaa",minWidth:58}}>Very clear</span>
        </div>
      );

    case "speed_exp":
      return (
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {SPEED_EXP.map(o=>(
            <button key={o} onClick={()=>onChange(o)} style={{padding:"4px 11px",borderRadius:14,border:`1px solid ${val===o?"#2980b9":"#ddd"}`,background:val===o?"#e8f0fe":"#fff",color:val===o?"#2980b9":"#666",fontSize:11,cursor:"pointer"}}>{o}</button>
          ))}
        </div>
      );

    case "speed_batch":
      return (
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {SPEED_BATCH.map(o=>(
            <button key={o} onClick={()=>onChange(o)} style={{padding:"4px 11px",borderRadius:14,border:`1px solid ${val===o?"#2980b9":"#ddd"}`,background:val===o?"#e8f0fe":"#fff",color:val===o?"#2980b9":"#666",fontSize:11,cursor:"pointer"}}>{o}</button>
          ))}
        </div>
      );

    case "expselect":
      return (
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {ALL_EXP_TABS.map(o=>(
            <button key={o} onClick={()=>onChange(o)} style={{padding:"4px 11px",borderRadius:14,border:`1px solid ${val===o?"#2980b9":"#ddd"}`,background:val===o?"#e8f0fe":"#fff",color:val===o?"#2980b9":"#666",fontSize:11,cursor:"pointer"}}>{o}</button>
          ))}
        </div>
      );

    case "pct":
      return (
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["<50%","50–70%","70–85%","85–95%",">95%"].map(o=>(
            <button key={o} onClick={()=>onChange(o)} style={{padding:"4px 10px",borderRadius:14,border:`1px solid ${val===o?"#2980b9":"#ddd"}`,background:val===o?"#e8f0fe":"#fff",color:val===o?"#2980b9":"#666",fontSize:11,cursor:"pointer"}}>{o}</button>
          ))}
        </div>
      );

    default:
      return null;
  }
}

// ── Eval widget ───────────────────────────────────────────────────────────────
function EvalWidget({step, expTab, saved, onSave}) {
  const task = WORKFLOW.find(w=>w.id===step)||WORKFLOW[0];
  const metrics = TASK_METRICS[step]||[];
  const key = `${step}-${expTab}`;
  const [vals,setVals] = useState({});
  const [startTime] = useState(Date.now());

  if (saved[key]) return (
    <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #f0f0f0"}}>
      <div style={{fontSize:12,color:"#1a7a4a"}}>✓ Evaluation recorded for <em>{task.label}</em></div>
    </div>
  );

  const perExpTypes = ["clarity","completeness","speed_exp"];
  const isEscalate = step==="escalate";
  const allDone = metrics.filter(m=>m.type!=="timer").every(m=>{
    if (isEscalate && perExpTypes.includes(m.type))
      return ALL_EXP_TABS.every(tab=>vals[`${m.lbl}__${tab}`]!==undefined);
    return vals[m.lbl]!==undefined;
  });

  return (
    <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #f0f0f0"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <span style={{fontSize:12,fontWeight:500,color:task.col,padding:"3px 10px",borderRadius:6,background:task.bg}}>{task.label}</span>
        <span style={{fontSize:11,color:"#aaa"}}>Stage: {task.stage}</span>
        <a href="https://link.springer.com/article/10.1007/s10462-026-11516-7" style={{fontSize:10,color:"#2980b9",marginLeft:"auto"}}>Zafar & Wu (2026) Fig. 8</a>
      </div>
      {metrics.map((m,i)=>{
        const isPerExp = isEscalate && perExpTypes.includes(m.type);
        return (
          <div key={i} style={{marginBottom:16}}>
            <div style={{fontSize:12,color:"#444",marginBottom:8,fontWeight:500}}>{m.lbl}</div>
            {isPerExp ? (
              <div>
                {ALL_EXP_TABS.map(tab=>{
                  const k=`${m.lbl}__${tab}`;
                  return (
                    <div key={tab} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,padding:"7px 10px",background:"#f9f9f9",borderRadius:8}}>
                      <span style={{fontSize:11,color:"#555",minWidth:140,flexShrink:0}}>{tab}</span>
                      <MetricInput m={m} val={vals[k]} onChange={v=>setVals(prev=>({...prev,[k]:v}))}/>
                    </div>
                  );
                })}
              </div>
            ) : (
              <MetricInput m={m} val={vals[m.lbl]} onChange={v=>setVals(prev=>({...prev,[m.lbl]:v}))}/>
            )}
          </div>
        );
      })}
      <button onClick={()=>onSave(key,{...vals,latency_s:Math.round((Date.now()-startTime)/1000),exp:expTab,task:step})}
        disabled={!allDone}
        style={{padding:"7px 18px",borderRadius:8,border:`1px solid ${allDone?"#2980b9":"#ccc"}`,background:allDone?"#e8f0fe":"#f5f5f5",color:allDone?"#2980b9":"#aaa",fontSize:12,cursor:allDone?"pointer":"default",fontWeight:500}}>
        Save evaluation →
      </button>
      {!allDone&&<span style={{fontSize:11,color:"#bbb",marginLeft:10}}>Complete all items to save</span>}
    </div>
  );
}

// ── Priority panel ────────────────────────────────────────────────────────────
function PriorityPanel({txns, selected, onSelect, userRanking, setUserRanking}) {
  const [dragIdx,setDragIdx]=useState(null);
  const [dragOver,setDragOver]=useState(null);

  const ranked = userRanking.length===txns.length
    ? userRanking.map(i=>({...txns[i],origIdx:i,score:xgbScore(txns[i])}))
    : txns.map((t,i)=>({...t,origIdx:i,score:xgbScore(t)}));

  const modelRanked = [...txns].map((t,i)=>({...t,origIdx:i,score:xgbScore(t)})).sort((a,b)=>b.score-a.score);
  const modelOrder = modelRanked.map(t=>t.origIdx);
  const userOrder  = ranked.map(t=>t.origIdx);
  let concordant=0, discordant=0;
  for (let i=0;i<userOrder.length;i++) for (let j=i+1;j<userOrder.length;j++) {
    const uD=userOrder.indexOf(userOrder[i])-userOrder.indexOf(userOrder[j]);
    const mD=modelOrder.indexOf(userOrder[i])-modelOrder.indexOf(userOrder[j]);
    if (uD*mD>0) concordant++; else if (uD*mD<0) discordant++;
  }
  const tau=((concordant-discordant)/(txns.length*(txns.length-1)/2)).toFixed(2);
  const tauColor=tau>=0.7?"#1a7a4a":tau>=0.4?"#b7770d":"#c0392b";
  const hasCustom=userRanking.length===txns.length;

  const onDragStart=i=>setDragIdx(i);
  const onDragEnter=i=>setDragOver(i);
  const onDragEnd=()=>{
    if (dragIdx===null||dragOver===null||dragIdx===dragOver){setDragIdx(null);setDragOver(null);return;}
    const next=[...ranked]; const [moved]=next.splice(dragIdx,1); next.splice(dragOver,0,moved);
    setUserRanking(next.map(t=>t.origIdx)); setDragIdx(null); setDragOver(null);
  };

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,minHeight:32}}>
        <div style={{fontSize:12,color:"#888",flex:1}}>Drag rows to set your priority — highest fraud risk at the top.</div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          {hasCustom && (
            <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:8,background:"#f0f7ff",border:"1px solid #d0e8f8"}}>
              <span style={{fontSize:11,color:"#888",whiteSpace:"nowrap"}}>τ (XGBoost):</span>
              <span style={{fontSize:13,fontWeight:500,color:tauColor,minWidth:32,textAlign:"right"}}>{tau}</span>
            </div>
          )}
          {hasCustom && (
            <button onClick={()=>setUserRanking([])} style={{padding:"4px 10px",borderRadius:7,border:"1px solid #ddd",background:"#fafafa",color:"#888",fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>Reset</button>
          )}
        </div>
      </div>
      <div style={{display:"flex",gap:4,fontSize:10,color:"#888",marginBottom:4,padding:"4px 6px",background:"#f9f9f9",borderRadius:6}}>
        <span style={{minWidth:20}}>#</span><span style={{minWidth:18}}></span>
        <span style={{flex:1}}>Transaction</span>
        <span style={{minWidth:48,textAlign:"center"}}>Score</span>
        <span style={{minWidth:68,textAlign:"center"}}>Status</span>
      </div>
      {ranked.map((t,i)=>{
        const r=riskLevel(t.score); const tc=TRUTH_CFG[t.groundTruth];
        const isSelected=selected===t.origIdx; const isDragging=dragIdx===i; const isOver=dragOver===i;
        return (
          <div key={t.id} draggable
            onDragStart={()=>onDragStart(i)} onDragEnter={()=>onDragEnter(i)}
            onDragEnd={onDragEnd} onDragOver={e=>e.preventDefault()}
            style={{display:"flex",alignItems:"center",gap:4,padding:"6px 6px",marginBottom:3,borderRadius:8,
              border:`1px solid ${isOver?"#2980b9":isSelected?"#2980b9":"#eee"}`,
              background:isDragging?"#e8f0fe":isOver?"#f0f7ff":isSelected?"#f0f7ff":"#fff",
              cursor:"grab",opacity:isDragging?0.5:1}}>
            <span style={{minWidth:20,fontSize:11,color:"#aaa",fontWeight:500}}>#{i+1}</span>
            <span style={{minWidth:18,fontSize:14,color:"#ccc",userSelect:"none"}}>⠿</span>
            <div onClick={()=>onSelect(t.origIdx)} style={{flex:1,minWidth:0,cursor:"pointer"}}>
              <div style={{fontSize:11,fontWeight:500,color:"#333"}}>{t.id}</div>
              <div style={{fontSize:10,color:"#888",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.merchant}</div>
            </div>
            <div style={{minWidth:48,textAlign:"center"}}><Badge label={Math.round(t.score*100)} col={r.col} bg={r.bg} sz={10}/></div>
            <div style={{minWidth:68,textAlign:"center"}}><Badge label={`${tc.icon} ${tc.label}`} col={tc.col} bg={tc.bg} sz={10}/></div>
          </div>
        );
      })}
      <div style={{marginTop:8,fontSize:10,color:"#aaa"}}>⠿ drag to reorder · click row to inspect in explanation panel</div>
    </div>
  );
}

function SingleNav({txns, selected, onSelect}) {
  const idx=(selected>=0&&selected<txns.length)?selected:0;
  const tx=txns[idx]; if(!tx)return null;
  return (
    <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
      <div style={{fontSize:10,color:"#bbb",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Current alert</div>
      <div style={{fontSize:13,fontWeight:500,color:"#333",marginBottom:2}}>{tx.id}</div>
      <div style={{fontSize:11,color:"#888",marginBottom:8}}>{tx.merchant} · €{tx.amount.toLocaleString()} · {tx.country}</div>
      <div style={{display:"flex",gap:6,justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={()=>onSelect(Math.max(0,idx-1))} disabled={idx===0}
          style={{flex:1,padding:"6px 0",borderRadius:7,border:"1px solid #e0e0e0",background:idx===0?"#fafafa":"#fff",color:idx===0?"#ccc":"#555",fontSize:12,cursor:idx===0?"default":"pointer"}}>← Prev</button>
        <span style={{fontSize:11,color:"#aaa"}}>{idx+1} / {txns.length}</span>
        <button onClick={()=>onSelect(Math.min(txns.length-1,idx+1))} disabled={idx===txns.length-1}
          style={{flex:1,padding:"6px 0",borderRadius:7,border:"1px solid #e0e0e0",background:idx===txns.length-1?"#fafafa":"#fff",color:idx===txns.length-1?"#ccc":"#555",fontSize:12,cursor:idx===txns.length-1?"default":"pointer"}}>Next →</button>
      </div>
    </div>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [selected,setSelected]=useState(0);
  const [step,setStep]=useState("triage");
  const [expTab,setExpTab]=useState("shap");
  const [saved,setSaved]=useState({});
  const [userRanking,setUserRanking]=useState([]);
  const participantId=useState(()=>`P-${Date.now().toString(36).toUpperCase()}`)[0];

  const tx=ALL_TXN[selected]||ALL_TXN[0];
  const score=xgbScore(tx);
  const tc=TRUTH_CFG[tx.groundTruth];
  const currentStep=WORKFLOW.find(w=>w.id===step)||WORKFLOW[0];
  const isTriage=step==="triage";
  const completedCount=Object.keys(saved).length;

  const downloadCSV=()=>{
    if(completedCount===0){alert("No responses recorded yet.");return;}
    const metricLabels=new Set();
    Object.values(saved).forEach(r=>Object.keys(r).forEach(k=>{if(!["latency_s","exp","task"].includes(k))metricLabels.add(k);}));
    const fixedCols=["participant_id","timestamp","workflow_step","explanation_type","transaction_id","latency_seconds"];
    const metricCols=[...metricLabels]; const allCols=[...fixedCols,...metricCols];
    const rows=Object.entries(saved).map(([key,data])=>{
      const [wfStep]=key.split("-");
      const row={participant_id:participantId,timestamp:new Date().toISOString(),workflow_step:data.task||wfStep,explanation_type:data.exp||"",transaction_id:tx.id,latency_seconds:data.latency_s??""};
      metricCols.forEach(col=>{row[col]=data[col]??"";});
      return row;
    });
    const esc=v=>{const s=String(v??"");return s.includes(",")||s.includes('"')||s.includes("\n")?`"${s.replace(/"/g,'""')}"`:s;};
    const csv=[allCols.map(esc).join(","),...rows.map(r=>allCols.map(c=>esc(r[c])).join(","))].join("\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`xai_study_${participantId}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div style={{fontFamily:"system-ui,sans-serif",padding:"1rem 0",maxWidth:1100}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:10,color:"#bbb",textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Fraud Detection System · Research Prototype · Zafar & Wu (2026)</div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{fontSize:18,fontWeight:500}}>Human-grounded XAI evaluation</div>
          <Badge label="XGBoost v1.7" col="#2980b9" bg="#e8f0fe"/>
          <Badge label="IEEE-CIS + ULB datasets" col="#888" bg="#f0f0f0"/>
          <Badge label="claude-sonnet-4-20250514" col="#6b3fa0" bg="#f0e8ff"/>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:11,color:"#aaa"}}>ID: <strong style={{color:"#555"}}>{participantId}</strong></span>
            <span style={{fontSize:11,color:"#888"}}>{completedCount} response{completedCount!==1?"s":""} recorded</span>
            <button onClick={downloadCSV} style={{padding:"6px 14px",borderRadius:8,border:"1px solid #27ae60",background:completedCount>0?"#edf7f0":"#f5f5f5",color:completedCount>0?"#1a7a4a":"#aaa",fontSize:12,fontWeight:500,cursor:completedCount>0?"pointer":"default"}}>⬇ Download CSV</button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
        {Object.entries(TRUTH_CFG).map(([k,v])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:8,background:v.bg,border:`1px solid ${v.col}30`}}>
            <span style={{fontSize:13,color:v.col,fontWeight:700}}>{v.icon}</span>
            <span style={{fontSize:11,color:v.col,fontWeight:500}}>{v.label}</span>
          </div>
        ))}
      </div>

      {/* Workflow stepper */}
      <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,padding:"10px 14px",marginBottom:10}}>
        <div style={{fontSize:10,color:"#bbb",textTransform:"uppercase",letterSpacing:0.9,marginBottom:8}}>Evaluation workflow — 3 tasks · Adapted from Zafar & Wu (2026)</div>
        <div style={{display:"flex",gap:6}}>
          {WORKFLOW.map((w,i)=>(
            <div key={w.id} style={{flex:1,display:"flex",alignItems:"center"}}>
              <button onClick={()=>setStep(w.id)} style={{flex:1,padding:"8px 4px",border:`1px solid ${step===w.id?w.col:"#e8e8e8"}`,borderRadius:8,background:step===w.id?w.bg:"#fafafa",cursor:"pointer",textAlign:"center"}}>
                <div style={{fontSize:14}}>{w.icon}</div>
                <div style={{fontSize:11,color:step===w.id?w.col:"#666",fontWeight:step===w.id?500:400,lineHeight:1.3}}>{w.label}</div>
                {saved[`${w.id}-${expTab}`]&&<div style={{fontSize:9,color:"#1a7a4a",marginTop:2}}>✓ done</div>}
              </button>
              {i<WORKFLOW.length-1&&<div style={{width:10,height:1,background:"#ddd",flexShrink:0}}/>}
            </div>
          ))}
        </div>
        <div style={{marginTop:8,padding:"10px 14px",background:"#f9f9f9",borderRadius:6,fontSize:14,color:"#555",fontWeight:500,lineHeight:1.6}}>
          {step==="triage"  &&"Review the transaction details and risk score only. Classify the transaction and record your confidence."}
          {step==="escalate"&&"Explore the explanation views. Rate each explanation on clarity, completeness and understanding time."}
          {step==="priority"&&"Rank all 15 transactions by fraud priority. Drag rows to reorder. Use any explanation to support your decisions."}
        </div>
      </div>

      {/* Main layout */}
      <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:10}}>

        {/* Left panel */}
        <div>
          {currentStep.single
            ? <SingleNav txns={ALL_TXN} selected={selected} onSelect={setSelected}/>
            : <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,padding:"10px 12px",maxHeight:600,overflowY:"auto"}}>
                <div style={{fontSize:10,color:"#bbb",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>All alerts</div>
                <PriorityPanel txns={ALL_TXN} selected={selected} onSelect={setSelected} userRanking={userRanking} setUserRanking={setUserRanking}/>
              </div>
          }
        </div>

        {/* Right column */}
        <div>
          {/* Transaction header — always visible */}
          <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,padding:"12px 14px",marginBottom:10}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 155px",gap:10,alignItems:"start"}}>
              <div>
                <div style={{fontSize:10,color:"#bbb"}}>Merchant</div>
                <div style={{fontSize:14,fontWeight:500,color:"#222"}}>{tx.merchant}</div>
                <div style={{fontSize:11,color:"#888"}}>{tx.category} · {tx.country}</div>
                {!isTriage && <div style={{marginTop:6}}><Badge label={`${tc.icon} ${tc.label}`} col={tc.col} bg={tc.bg}/></div>}
              </div>
              <div>
                <div style={{fontSize:10,color:"#bbb"}}>Amount</div>
                <div style={{fontSize:18,fontWeight:500,color:"#222"}}>€{tx.amount.toLocaleString()}</div>
                <div style={{fontSize:11,color:"#888"}}>Avg: €{tx.avgSpend}</div>
              </div>
              <div>
                <div style={{fontSize:10,color:"#bbb"}}>Details</div>
                <div style={{fontSize:11,color:"#555",lineHeight:1.7}}>
                  {tx.time} · {tx.cardPresent?"Card present":"Card not present"}<br/>
                  {tx.intl?"International":"Domestic"} · {tx.distanceKm}km<br/>
                  {tx.velocity} txns/hr · {tx.newMerchant?"New merchant":"Known merchant"}
                </div>
              </div>
              <Gauge score={score}/>
            </div>
          </div>

          {/* Task 1: classification + eval only, no explanations */}
          {isTriage && (
            <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,padding:"12px 14px",marginBottom:10}}>
              <EvalWidget step={step} expTab={expTab} saved={saved} onSave={(k,d)=>setSaved(s=>({...s,[k]:d}))}/>
            </div>
          )}

          {/* Tasks 2 & 3: explanation view + eval widget */}
          {!isTriage && (
            <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,padding:"12px 14px",marginBottom:10}}>
              <div style={{fontSize:10,color:"#bbb",textTransform:"uppercase",letterSpacing:0.9,marginBottom:10}}>Explanation view</div>
              {EXP_GROUPS.map(g=>(
                <div key={g.id} style={{marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontSize:10,fontWeight:500,color:g.col,minWidth:180,flexShrink:0}}>{g.label}</span>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {g.tabs.map(t=>(
                        <button key={t.id} onClick={()=>setExpTab(t.id)}
                          style={{padding:"4px 10px",fontSize:11,border:`1px solid ${expTab===t.id?g.col:"#e0e0e0"}`,borderRadius:16,background:expTab===t.id?g.bg:"#fff",color:expTab===t.id?g.col:"#888",cursor:"pointer",fontWeight:expTab===t.id?500:400}}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <span style={{fontSize:10,color:"#ccc",fontStyle:"italic",marginLeft:"auto",maxWidth:220,textAlign:"right"}}>{g.desc}</span>
                  </div>
                </div>
              ))}
              <div style={{borderTop:"1px solid #f0f0f0",paddingTop:14,marginTop:4}}>
                {expTab==="shap"           && <ShapPanel tx={tx}/>}
                {expTab==="lime"           && <LimePanel tx={tx}/>}
                {expTab==="llm"            && <LLMPanel tx={tx} score={score}/>}
                {expTab==="counterfactual" && <CounterfactualPanel tx={tx} score={score}/>}
                {expTab==="logreg"         && <LogRegPanel tx={tx}/>}
                {expTab==="dtree"          && <DTreePanel tx={tx}/>}
                {expTab==="peers"          && <PeersPanel/>}
              </div>
              <EvalWidget step={step} expTab={expTab} saved={saved} onSave={(k,d)=>setSaved(s=>({...s,[k]:d}))}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}