import { useState, useEffect } from "react";

const ALL_TXN = [
  { id:"3519372", amount:104.89, product:"C", network:"visa",       cardType:"debit",  addr:null, dist:null, groundTruth:"confirmed_fraud" },
  { id:"3053108", amount:152.51, product:"C", network:"visa",       cardType:"credit", addr:null, dist:null, groundTruth:"confirmed_fraud" },
  { id:"3492704", amount:230.18, product:"C", network:"visa",       cardType:"debit",  addr:null, dist:null, groundTruth:"confirmed_fraud" },
  { id:"3560122", amount:193.05, product:"C", network:"mastercard", cardType:"debit",  addr:null, dist:null, groundTruth:"confirmed_fraud" },
  { id:"3104673", amount:105.41, product:"C", network:"visa",       cardType:"credit", addr:null, dist:null, groundTruth:"confirmed_fraud" },
  { id:"3320693", amount:268.27, product:"C", network:"visa",       cardType:"debit",  addr:null, dist:null, groundTruth:"confirmed_fraud" },
  { id:"3407378", amount:206.64, product:"C", network:"mastercard", cardType:"credit", addr:null, dist:null, groundTruth:"confirmed_fraud" },
  { id:"3044105", amount:117.00, product:"W", network:"mastercard", cardType:"credit", addr:264,  dist:326,  groundTruth:"confirmed_fraud" },
  { id:"3557070", amount:29.00,  product:"W", network:"visa",       cardType:"debit",  addr:325,  dist:8,    groundTruth:"legitimate"      },
  { id:"3336054", amount:35.95,  product:"W", network:"visa",       cardType:"debit",  addr:441,  dist:3,    groundTruth:"legitimate"      },
  { id:"3330843", amount:57.95,  product:"W", network:"visa",       cardType:"debit",  addr:315,  dist:0,    groundTruth:"legitimate"      },
  { id:"3034548", amount:25.95,  product:"W", network:"visa",       cardType:"debit",  addr:441,  dist:3,    groundTruth:"legitimate"      },
  { id:"3354853", amount:25.95,  product:"W", network:"visa",       cardType:"debit",  addr:324,  dist:8,    groundTruth:"legitimate"      },
  { id:"3124696", amount:47.95,  product:"W", network:"visa",       cardType:"debit",  addr:143,  dist:2,    groundTruth:"legitimate"      },
  { id:"3453553", amount:59.00,  product:"W", network:"visa",       cardType:"debit",  addr:204,  dist:6,    groundTruth:"legitimate"      },
];

const TASK2_IDS = ["3053108", "3354853", "3492704", "3557070"];
const PRODUCT_LABELS = { W:"Web purchase", C:"Card payment", H:"Home purchase", R:"Retail", S:"Service" };

const REAL_EXPLANATIONS = {
  "3519372": { score:0.0754, shap:{TransactionAmt:-2.3667,ProductCD:-0.0615,card4:0.7712,card6:0.0789,addr1:-0.4372,dist1:-0.4749}, lime:{"card6 <= 1.00":-0.1407,"TransactionAmt <= 43.32":-0.1163,"ProductCD <= 3.00":0.1095,"card4 <= 2.00":-0.0222,"-1.00 < dist1 <= 5.00":0.015,"addr1 > 327.00":0.0038} },
  "3053108": { score:0.0096, shap:{TransactionAmt:-0.4179,ProductCD:0.3726,card4:-0.3341,card6:-2.195,addr1:-0.5997,dist1:-1.4414}, lime:{"card6 <= 1.00":-0.1449,"ProductCD <= 3.00":0.1068,"dist1 > 5.00":-0.0815,"184.00 < addr1 <= 272.00":0.0237,"card4 <= 2.00":-0.0144,"68.77 < TransactionAmt <= 125.00":0.001} },
  "3492704": { score:0.7733, shap:{TransactionAmt:0.2236,ProductCD:1.3541,card4:1.182,card6:-1.804,addr1:0.0501,dist1:0.2379}, lime:{"TransactionAmt > 125.00":0.1466,"card6 <= 1.00":-0.1336,"ProductCD <= 3.00":0.1169,"dist1 <= -1.00":0.0669,"addr1 <= 184.00":-0.0413,"card4 <= 2.00":0.0001} },
  "3560122": { score:0.6856, shap:{TransactionAmt:-0.6303,ProductCD:1.6618,card4:1.1214,card6:-1.7827,addr1:0.1087,dist1:0.3171}, lime:{"card6 <= 1.00":-0.1328,"ProductCD <= 3.00":0.0974,"dist1 <= -1.00":0.0573,"addr1 <= 184.00":-0.0473,"68.77 < TransactionAmt <= 125.00":0.0112,"card4 <= 2.00":0.0007} },
  "3104673": { score:0.0424, shap:{TransactionAmt:-1.692,ProductCD:0.1425,card4:0.4111,card6:-0.0928,addr1:-0.7315,dist1:-1.1375}, lime:{"card6 <= 1.00":-0.1366,"ProductCD <= 3.00":0.0962,"addr1 <= 184.00":-0.0508,"43.32 < TransactionAmt <= 68.77":-0.0378,"card4 <= 2.00":-0.0186,"-1.00 < dist1 <= 5.00":0.0181} },
  "3320693": { score:0.6121, shap:{TransactionAmt:0.0002,ProductCD:1.1516,card4:-0.841,card6:0.4246,addr1:-0.4031,dist1:0.1403}, lime:{"card6 <= 1.00":-0.1373,"TransactionAmt > 125.00":0.1291,"ProductCD <= 3.00":0.1003,"dist1 <= -1.00":0.0651,"addr1 <= 184.00":-0.0519,"card4 <= 2.00":-0.0076} },
  "3407378": { score:0.2236, shap:{TransactionAmt:-1.2778,ProductCD:0.7817,card4:-0.2332,card6:0.0495,addr1:-0.4284,dist1:-0.1203}, lime:{"card6 <= 1.00":-0.1452,"ProductCD <= 3.00":0.0952,"43.32 < TransactionAmt <= 68.77":-0.039,"272.00 < addr1 <= 327.00":0.0249,"card4 <= 2.00":-0.0141,"-1.00 < dist1 <= 5.00":0.0016} },
  "3044105": { score:0.2868, shap:{TransactionAmt:-1.7195,ProductCD:0.025,card4:1.1008,card6:0.1131,addr1:-0.0924,dist1:-0.3217}, lime:{"card6 <= 1.00":-0.1314,"ProductCD <= 3.00":0.1027,"TransactionAmt <= 43.32":-0.1016,"-1.00 < dist1 <= 5.00":0.0152,"card4 <= 2.00":-0.0053,"addr1 > 327.00":0.0006} },
  "3557070": { score:0.015,  shap:{TransactionAmt:-2.1688,ProductCD:0.0755,card4:-0.2918,card6:0.0731,addr1:-0.3374,dist1:-1.5203}, lime:{"card6 <= 1.00":-0.1369,"TransactionAmt <= 43.32":-0.1098,"ProductCD <= 3.00":0.0983,"dist1 > 5.00":-0.0859,"272.00 < addr1 <= 327.00":0.0252,"card4 <= 2.00":-0.0128} },
  "3336054": { score:0.6288, shap:{TransactionAmt:0.3914,ProductCD:0.7413,card4:0.8316,card6:-1.8774,addr1:0.1754,dist1:0.2811}, lime:{"card6 <= 1.00":-0.1477,"TransactionAmt > 125.00":0.1378,"ProductCD <= 3.00":0.0992,"addr1 <= 184.00":-0.0546,"dist1 <= -1.00":0.052,"card4 <= 2.00":-0.0117} },
  "3330843": { score:0.6229, shap:{TransactionAmt:-0.1587,ProductCD:0.2424,card4:0.5792,card6:0.2649,addr1:0.0313,dist1:-0.4408}, lime:{"card6 <= 1.00":-0.1357,"dist1 > 5.00":-0.0803,"ProductCD <= 3.00":0.0789,"43.32 < TransactionAmt <= 68.77":-0.0355,"184.00 < addr1 <= 272.00":0.0237,"card4 <= 2.00":-0.0165} },
  "3034548": { score:0.707,  shap:{TransactionAmt:-0.1665,ProductCD:1.2921,card4:-0.2645,card6:0.2935,addr1:-0.3437,dist1:0.0864}, lime:{"card6 <= 1.00":-0.1427,"TransactionAmt > 125.00":0.1295,"ProductCD <= 3.00":0.0805,"dist1 <= -1.00":0.0609,"addr1 <= 184.00":-0.0504,"card4 <= 2.00":-0.0083} },
  "3354853": { score:0.8778, shap:{TransactionAmt:-0.6999,ProductCD:1.7578,card4:0.1166,card6:0.4982,addr1:-0.0035,dist1:0.3187}, lime:{"card6 <= 1.00":-0.1348,"ProductCD <= 3.00":0.1209,"dist1 <= -1.00":0.0635,"addr1 <= 184.00":-0.0451,"card4 <= 2.00":-0.0102,"68.77 < TransactionAmt <= 125.00":0.0068} },
  "3124696": { score:0.2267, shap:{TransactionAmt:-0.7779,ProductCD:0.0365,card4:-0.1829,card6:0.1153,addr1:0.0352,dist1:-0.4366}, lime:{"card6 <= 1.00":-0.1392,"TransactionAmt <= 43.32":-0.1066,"dist1 > 5.00":-0.0894,"ProductCD <= 3.00":0.0821,"272.00 < addr1 <= 327.00":0.0193,"card4 <= 2.00":-0.0151} },
  "3453553": { score:0.8175, shap:{TransactionAmt:0.171,ProductCD:1.0238,card4:-0.2542,card6:0.346,addr1:-0.0704,dist1:0.3}, lime:{"card6 <= 1.00":-0.1426,"TransactionAmt > 125.00":0.1348,"ProductCD <= 3.00":0.1179,"dist1 <= -1.00":0.0673,"addr1 <= 184.00":-0.0532,"card4 <= 2.00":-0.0052} },
};

const SHEET_URL = "https://script.google.com/macros/s/AKfycbw40D7CtJKFxD7H8w0BGUVBKVxVhBssaKYzjGTZaim2EJyBiN6lmw135ceAEzuAcDp1OA/exec";

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

function xgbScore(tx) { return tx ? (REAL_EXPLANATIONS[tx.id]?.score ?? 0) : 0; }

function getShap(tx) {
  if (!tx) return [];
  const shap = REAL_EXPLANATIONS[tx.id]?.shap ?? {};
  const labels = { TransactionAmt:`$${tx.amount}`, ProductCD:`${tx.product} · ${PRODUCT_LABELS[tx.product]||tx.product}`, card4:tx.network, card6:tx.cardType, addr1:tx.addr!==null?`${tx.addr}`:"N/A", dist1:tx.dist!==null?`${tx.dist}km`:"N/A" };
  return Object.entries(shap).map(([k,v])=>({f:k,v,lbl:labels[k]||k})).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));
}

function getLime(tx) {
  if (!tx) return [];
  const lime = REAL_EXPLANATIONS[tx.id]?.lime ?? {};
  return Object.entries(lime).map(([k,v])=>({f:k,v})).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));
}

function riskLevel(s) {
  if (s>=0.7) return {text:"High risk",   col:"#c0392b", bg:"#fdecea"};
  if (s>=0.4) return {text:"Medium risk", col:"#b7770d", bg:"#fef3cd"};
  return             {text:"Low risk",    col:"#1a7a4a", bg:"#e8f7ee"};
}

const TRUTH_CFG = {
  confirmed_fraud: {label:"Confirmed fraud", col:"#c0392b", bg:"#fdecea", icon:"⚠"},
  legitimate:      {label:"Legitimate",      col:"#1a7a4a", bg:"#e8f7ee", icon:"✓"},
  suspected:       {label:"Suspected fraud", col:"#8e44ad", bg:"#f5eeff", icon:"?"},
};

const WORKFLOW = [
  {id:"triage",   icon:"🔍", label:"1 · Alert appears",         stage:"Alert Appears", col:"#4a7c59", bg:"#e8f5ee"},
  {id:"escalate", icon:"📋", label:"2 · Evaluate explanations", stage:"Investigation", col:"#7b5ea7", bg:"#f2eef9"},
];

const ALL_EXP_TABS = ["SHAP","LIME","LLM","Counterfactual","Logistic regression","Decision tree","Peer cases"];
const TAB_ID_TO_LABEL = {shap:"SHAP",lime:"LIME",llm:"LLM",counterfactual:"Counterfactual",logreg:"Logistic regression",dtree:"Decision tree",peers:"Peer cases"};

const TASK_METRICS = {
  triage: [
    {lbl:"Based on the information above, how would you classify this transaction?", type:"classification"},
    {lbl:"Confidence", type:"l7"},
  ],
  escalate: [
    {lbl:"On a scale of 1 to 5, how clear was this explanation?", type:"clarity"},
    {lbl:"On a scale of 1 to 5, how complete was this explanation?", type:"completeness"},
  ],
};

const EXP_GROUPS = [
  {id:"posthoc",  label:"Post-hoc explainability",  col:"#2980b9", bg:"#e8f0fe", desc:"Applied after model prediction was made",
   tabs:[{id:"shap",label:"SHAP"},{id:"lime",label:"LIME"},{id:"llm",label:"LLM"},{id:"counterfactual",label:"Counterfactual"}]},
  {id:"inherent", label:"Inherently interpretable", col:"#16a085", bg:"#e8f8f5", desc:"Transparent by construction",
   tabs:[{id:"logreg",label:"Logistic regression"},{id:"dtree",label:"Decision tree"},{id:"peers",label:"Peer cases"}]},
];

function Badge({label, col="#888", bg="#f0f0f0", sz=11}) {
  return <span style={{fontSize:sz,padding:"2px 8px",borderRadius:10,background:bg,color:col,fontWeight:500,whiteSpace:"nowrap"}}>{label}</span>;
}

function Gauge({score}) {
  const pct = Math.round(Math.min(score,0.99)*100);
  const r = riskLevel(score);
  const cx=80,cy=72,radius=54,startDeg=210,sweepDeg=120;
  const toRad = d => d*Math.PI/180;
  const nx = cx+(radius-8)*Math.cos(toRad(startDeg+(pct/100)*sweepDeg));
  const ny = cy+(radius-8)*Math.sin(toRad(startDeg+(pct/100)*sweepDeg));
  const x1=cx+radius*Math.cos(toRad(startDeg)), y1=cy+radius*Math.sin(toRad(startDeg));
  const x2=cx+radius*Math.cos(toRad(330)),       y2=cy+radius*Math.sin(toRad(330));
  const fa=startDeg+(pct/100)*sweepDeg;
  const fx=cx+radius*Math.cos(toRad(fa)), fy=cy+radius*Math.sin(toRad(fa));
  const la=(pct/100)*sweepDeg>180?1:0;
  return (
    <div style={{textAlign:"center"}}>
      <svg viewBox="0 0 160 125" width="140">
        <path d={`M${x1},${y1} A${radius},${radius},0,0,1,${x2},${y2}`} fill="none" stroke="#eee" strokeWidth="12" strokeLinecap="round"/>
        {pct>0&&<path d={`M${x1},${y1} A${radius},${radius},0,${la},1,${fx},${fy}`} fill="none" stroke={r.col} strokeWidth="12" strokeLinecap="round"/>}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#333" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="5" fill="#333"/>
        <text x={cx} y="100" textAnchor="middle" fontSize="22" fontWeight="500" fill={r.col}>{pct}</text>
        <text x={cx} y="116" textAnchor="middle" fontSize="11" fontWeight="500" fill={r.col}>{r.text}</text>
      </svg>
    </div>
  );
}

function AttrBar({v, maxV=2.5}) {
  const pct = Math.min(Math.abs(v)/maxV*100,100);
  return (
    <div style={{flex:1,background:"#f5f5f5",borderRadius:3,height:11,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",left:v>0?`${50-pct/2}%`:"50%",width:`${pct/2}%`,height:"100%",background:v>0?"#c0392b":"#1a7a4a"}}/>
      <div style={{position:"absolute",left:"50%",top:0,height:"100%",width:1,background:"#ccc"}}/>
    </div>
  );
}

function ShapPanel({tx}) {
  const vals = getShap(tx);
  const maxV = Math.max(...vals.map(d=>Math.abs(d.v)),0.01);
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
            <AttrBar v={d.v} maxV={maxV}/>
            <span style={{fontSize:11,color:d.v>0?"#c0392b":"#1a7a4a",minWidth:52,textAlign:"right"}}>{d.v>0?"+":""}{d.v.toFixed(3)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function LimePanel({tx}) {
  const vals = getLime(tx);
  const maxV = Math.max(...vals.map(d=>Math.abs(d.v)),0.01);
  return (
    <div>
      <div style={{fontSize:12,color:"#888",marginBottom:8}}>Local linear surrogate fitted around this transaction (sampled neighbourhood)</div>
      <div style={{display:"flex",gap:10,fontSize:11,color:"#888",marginBottom:10}}>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,background:"#c0392b",borderRadius:2,display:"inline-block"}}/>Increases risk</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,background:"#1a7a4a",borderRadius:2,display:"inline-block"}}/>Decreases risk</span>
      </div>
      {vals.map((d,i)=>(
        <div key={i} style={{marginBottom:8}}>
          <div style={{fontSize:11,color:"#444",marginBottom:2}}>{d.f}</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <AttrBar v={d.v} maxV={maxV}/>
            <span style={{fontSize:11,color:d.v>0?"#c0392b":"#1a7a4a",minWidth:52,textAlign:"right"}}>{d.v>0?"+":""}{d.v.toFixed(3)}</span>
          </div>
        </div>
      ))}
      <div style={{marginTop:10,fontSize:11,color:"#bbb",fontStyle:"italic"}}>Note: LIME approximates locally — feature importance may differ from SHAP</div>
    </div>
  );
}

function LLMPanel({tx, score}) {
  const [text,setText]=useState(""); const [loading,setLoading]=useState(false);
  const [error,setError]=useState(""); const [done,setDone]=useState(false);
  const run = async () => {
    setLoading(true); setError(""); setText(""); setDone(false);
    const r = riskLevel(score);
    const prompt = `You are an AI assistant in a bank fraud detection dashboard for anti-fraud analysts.\n\nTransaction: ${tx.amount} | ${PRODUCT_LABELS[tx.product]||tx.product} | ${tx.network} ${tx.cardType} | Address: ${tx.addr??"N/A"} | Distance: ${tx.dist!==null?tx.dist+"km":"N/A"} | Fraud score: ${Math.round(score*100)}/100 (${r.text})\n\nWrite 3 short paragraphs: (1) key risk drivers based on the features above, (2) what the model detected and any features that seem inconsistent with the score, (3) a recommended action that is proportionate to the risk score — low scores should recommend approval or minimal review, high scores should recommend blocking or escalation. Be concise and do not recommend caution if the score is low.`;
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${import.meta.env.VITE_GROQ_API_KEY}`},
        body:JSON.stringify({model:"llama-3.1-8b-instant",max_tokens:400,messages:[{role:"user",content:prompt}]}),
      });
      const data = await res.json();
      if (data.error) setError(`API error: ${data.error.message}`);
      else { setText(data.choices[0]?.message?.content||"No response."); setDone(true); }
    } catch { setError("API call failed."); }
    setLoading(false);
  };
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span style={{fontSize:11,color:"#888"}}>Generated by</span>
        <Badge label="llama-3.1-8b-instant" col="#e65c00" bg="#fff3e0"/>
        <Badge label="Groq API" col="#2980b9" bg="#e8f0fe"/>
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
  const shap = REAL_EXPLANATIONS[tx.id]?.shap ?? {};
  const topRisk = Object.entries(shap).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  const featureAdvice = {
    TransactionAmt: tx.amount>125?{icon:"💰",desc:`Amount of $${tx.amount} is unusually high — verify with cardholder`,feasible:true}:{icon:"💰",desc:`Amount of $${tx.amount} is within normal range`,feasible:true},
    ProductCD:{icon:"🖥",desc:`${PRODUCT_LABELS[tx.product]||tx.product} — confirm channel matches cardholder behaviour`,feasible:true},
    card4:{icon:"💳",desc:`Card network ${tx.network} — verify card is registered to this customer`,feasible:true},
    card6:{icon:"💳",desc:`${tx.cardType} card used — check if cardholder typically uses ${tx.cardType}`,feasible:true},
    addr1:tx.addr===null?{icon:"📍",desc:"Billing address missing — request address verification from cardholder",feasible:true}:{icon:"📍",desc:`Billing address ${tx.addr} — confirm matches records on file`,feasible:true},
    dist1:tx.dist===null?{icon:"📏",desc:"Distance data unavailable — unable to assess location risk",feasible:false}:tx.dist>5?{icon:"📏",desc:`Transaction ${tx.dist}km from billing address — verify with cardholder`,feasible:true}:{icon:"📏",desc:`Distance of ${tx.dist}km is low — consistent with local purchase`,feasible:true},
  };
  const changes = topRisk.slice(0,4).map(([f,v])=>({...featureAdvice[f],feature:f,delta:-Math.round(v*30)})).filter(c=>c?.desc);
  if (!changes.length) return <div style={{fontSize:13,color:"#888",padding:"12px 0"}}>No strong positive risk drivers found.</div>;
  const newScore = Math.max(2, pct+changes.reduce((a,c)=>a+c.delta,0));
  return (
    <div>
      <div style={{fontSize:12,color:"#888",marginBottom:10}}>Analyst actions to verify or challenge the top risk-driving features</div>
      {changes.map((c,i)=>(
        <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"7px 0",borderBottom:"1px solid #f5f5f5"}}>
          <span style={{fontSize:15}}>{c.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,color:"#333"}}>{c.desc}</div>
            <div style={{fontSize:11,color:"#aaa"}}>{c.feasible?"Analyst can verify":"Cannot be verified"}</div>
          </div>
          <span style={{fontSize:12,color:"#1a7a4a",fontWeight:500}}>−{Math.abs(c.delta)}</span>
        </div>
      ))}
      <div style={{marginTop:10,padding:"9px 12px",background:"#f8f8f8",borderRadius:8,fontSize:13}}>
        All changes applied: <strong style={{color:newScore<40?"#1a7a4a":"#c0392b"}}>{newScore}/100</strong>
        <span style={{color:"#aaa",marginLeft:6}}>{newScore<40?"→ below threshold":"→ still above threshold"}</span>
      </div>
    </div>
  );
}

function LogRegPanel({tx}) {
  const score=xgbScore(tx); const r=riskLevel(score);
  const shap=REAL_EXPLANATIONS[tx.id]?.shap??{};
  const coeffs=Object.entries(shap).map(([f,v])=>({f,v})).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <Badge label="Logistic Regression (approx.)" col="#16a085" bg="#e8f8f5"/>
        <span style={{fontSize:12,color:"#888"}}>Score: <strong style={{color:r.col}}>{Math.round(score*100)}/100</strong></span>
      </div>
      <div style={{fontSize:11,color:"#aaa",marginBottom:10,fontStyle:"italic"}}>Log-odds contributions from XGBoost feature values, presented as a linear approximation</div>
      <div style={{fontFamily:"monospace",fontSize:11,background:"#f8f8f8",borderRadius:6,padding:"9px 12px",marginBottom:12,lineHeight:1.7,color:"#555"}}>
        P(fraud) = σ({coeffs.map((c,i)=>`${i>0&&c.v>0?"+":""}${c.v.toFixed(3)}`).join(" ")}) = {Math.round(score*100)}%
      </div>
      {coeffs.map((c,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid #f5f5f5"}}>
          <span style={{flex:1,fontSize:12,color:"#444"}}>{c.f}</span>
          <span style={{fontSize:12,fontWeight:500,minWidth:50,textAlign:"right",color:c.v>0?"#c0392b":"#1a7a4a"}}>{c.v>0?"+":""}{c.v.toFixed(3)}</span>
        </div>
      ))}
    </div>
  );
}

function DTreePanel({tx}) {
  const score=xgbScore(tx); const r=riskLevel(score);
  const shap=REAL_EXPLANATIONS[tx.id]?.shap??{};
  const top=Object.entries(shap).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,3);
  const fl={
    TransactionAmt:tx.amount>125?`Amount > $125 ($${tx.amount})`:tx.amount>43?`$43 < Amount ≤ $125 ($${tx.amount})`:`Amount ≤ $43 ($${tx.amount})`,
    ProductCD:`Product = ${tx.product} (${PRODUCT_LABELS[tx.product]||tx.product})`,
    card4:`Card network = ${tx.network}`, card6:`Card type = ${tx.cardType}`,
    addr1:tx.addr!==null?`Address present (${tx.addr})`:"Address missing",
    dist1:tx.dist!==null?(tx.dist<=5?`Distance ≤ 5km (${tx.dist}km)`:`Distance > 5km (${tx.dist}km)`):"Distance unknown",
  };
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <Badge label="Decision Tree (approx.)" col="#16a085" bg="#e8f8f5"/>
        <span style={{fontSize:12,color:"#888"}}>Score: <strong style={{color:r.col}}>{Math.round(score*100)}/100</strong></span>
      </div>
      <div style={{fontSize:11,color:"#aaa",marginBottom:10,fontStyle:"italic"}}>Decision path derived from top XGBoost feature contributions</div>
      {top.map(([f,v],i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",marginBottom:6,background:i%2===0?"#f9f9f9":"#fff",borderRadius:6,border:"1px solid #f0f0f0"}}>
          <span style={{fontSize:14,color:"#aaa"}}>{"→".repeat(i+1)}</span>
          <span style={{fontSize:12,color:"#555",flex:1}}><strong>IF</strong> {fl[f]||f}</span>
          <Badge label={v>0?"↑ Risk":"↓ Risk"} col={v>0?"#c0392b":"#1a7a4a"} bg={v>0?"#fdecea":"#e8f7ee"}/>
        </div>
      ))}
      <div style={{marginTop:8,padding:"10px 12px",borderRadius:8,background:r.bg,color:r.col,fontSize:13,fontWeight:500}}>
        Terminal node: {Math.round(score*100)}/100 — {r.text}
      </div>
    </div>
  );
}

function PeersPanel({tx}) {
  const others=ALL_TXN.filter(t=>t.id!==tx.id).map(t=>({...t,sim:Math.round(100-((t.product!==tx.product?15:0)+(t.network!==tx.network?10:0)+(t.cardType!==tx.cardType?10:0)+Math.min(30,Math.abs(t.amount-tx.amount)/20)))})).sort((a,b)=>b.sim-a.sim).slice(0,6);
  const counts=Object.fromEntries(Object.keys(TRUTH_CFG).map(k=>[k,others.filter(p=>p.groundTruth===k).length]));
  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {Object.entries(counts).map(([k,v])=>{const tc=TRUTH_CFG[k];return <div key={k} style={{flex:1,background:tc.bg,borderRadius:8,padding:"8px",textAlign:"center"}}><div style={{fontSize:18,fontWeight:500,color:tc.col}}>{v}</div><div style={{fontSize:10,color:tc.col}}>{tc.label}</div></div>;})}
      </div>
      {others.map((p,i)=>{const tc=TRUTH_CFG[p.groundTruth];return(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:"1px solid #f5f5f5"}}>
          <div style={{minWidth:36,textAlign:"center"}}><div style={{fontSize:11,fontWeight:500,color:"#555"}}>{p.sim}%</div></div>
          <div style={{width:28,height:28,borderRadius:"50%",background:tc.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:tc.col,fontWeight:700}}>{tc.icon}</div>
          <div style={{flex:1}}><div style={{fontSize:12,color:"#333"}}>TXN {p.id} · ${p.amount}</div><div style={{fontSize:11,color:"#aaa"}}>{p.network} {p.cardType} · {PRODUCT_LABELS[p.product]||p.product}</div></div>
          <Badge label={tc.label} col={tc.col} bg={tc.bg}/>
        </div>
      );})}
    </div>
  );
}

function MetricInput({m, val, onChange}) {
  switch(m.type) {
    case "classification": return (
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {[
          {key:"confirmed_fraud", label:"Confirmed fraud", col:"#c0392b", bg:"#fdecea", icon:"⚠"},
          {key:"suspected",       label:"Suspected fraud", col:"#8e44ad", bg:"#f5eeff", icon:"?"},
          {key:"legitimate",      label:"Legitimate",      col:"#1a7a4a", bg:"#e8f7ee", icon:"✓"},
        ].map(o=>(
          <button key={o.key} onClick={()=>onChange(o.key)} style={{padding:"9px 18px",borderRadius:10,border:`2px solid ${val===o.key?o.col:"#ddd"}`,background:val===o.key?o.bg:"#fff",color:val===o.key?o.col:"#888",fontSize:13,fontWeight:val===o.key?600:400,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:15}}>{o.icon}</span>{o.label}
          </button>
        ))}
      </div>
    );
    case "l7": case "l5": {
      const max=m.type==="l7"?7:5;
      return (<div style={{display:"flex",gap:5,alignItems:"center"}}><span style={{fontSize:10,color:"#bbb",minWidth:24}}>low</span>{Array.from({length:max},(_,i)=>i+1).map(n=>(<button key={n} onClick={()=>onChange(n)} style={{width:30,height:30,borderRadius:6,border:`1px solid ${val===n?"#2980b9":"#ddd"}`,background:val===n?"#e8f0fe":"#fff",color:val===n?"#2980b9":"#888",fontSize:12,cursor:"pointer"}}>{n}</button>))}<span style={{fontSize:10,color:"#bbb",minWidth:28}}>high</span></div>);
    }
    case "clarity": return (
      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,color:"#aaa",minWidth:68}}>Very unclear</span>
        {[1,2,3,4,5].map(n=>(<button key={n} onClick={()=>onChange(n)} style={{width:32,height:32,borderRadius:6,border:`1px solid ${val===n?"#2980b9":"#ddd"}`,background:val===n?"#e8f0fe":"#fff",color:val===n?"#2980b9":"#888",fontSize:13,cursor:"pointer"}}>{n}</button>))}
        <span style={{fontSize:10,color:"#aaa",minWidth:58}}>Very clear</span>
      </div>
    );
    case "completeness": return (
      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,color:"#aaa",minWidth:80}}>Very incomplete</span>
        {[1,2,3,4,5].map(n=>(<button key={n} onClick={()=>onChange(n)} style={{width:32,height:32,borderRadius:6,border:`1px solid ${val===n?"#2980b9":"#ddd"}`,background:val===n?"#e8f0fe":"#fff",color:val===n?"#2980b9":"#888",fontSize:13,cursor:"pointer"}}>{n}</button>))}
        <span style={{fontSize:10,color:"#aaa",minWidth:70}}>Very complete</span>
      </div>
    );
    default: return null;
  }
}

function EscalateEvalWidget({expTab, expTabStartTime, txId, saved, onSave}) {
  const [open,setOpen]=useState(false);
  const [vals,setVals]=useState({});
  const key=`escalate-${txId}-${expTab}`;
  const metrics=TASK_METRICS.escalate;
  useEffect(()=>{setVals({});setOpen(false);},[expTab,txId]);
  if (saved[key]) return <div style={{marginTop:10,padding:"8px 12px",borderRadius:8,background:"#e8f7ee",fontSize:12,color:"#1a7a4a"}}>✓ Evaluation saved for <strong>{expTab}</strong></div>;
  const allDone=metrics.every(m=>vals[m.lbl]!==undefined);
  return (
    <div style={{marginTop:10,border:"1px solid #e8e8e8",borderRadius:10,overflow:"hidden"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",padding:"10px 14px",background:open?"#f2eef9":"#fafafa",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,color:"#7b5ea7",fontWeight:500}}>
        <span>📋 Rate this explanation — {expTab}</span>
        <span style={{fontSize:11,color:"#aaa"}}>{open?"▲ collapse":"▼ expand"}</span>
      </button>
      {open&&(
        <div style={{padding:"12px 14px",borderTop:"1px solid #f0f0f0"}}>
          {metrics.map((m,i)=>(
            <div key={i} style={{marginBottom:14}}>
              <div style={{fontSize:12,color:"#444",marginBottom:6,fontWeight:500}}>{m.lbl}</div>
              <MetricInput m={m} val={vals[m.lbl]} onChange={v=>setVals(p=>({...p,[m.lbl]:v}))}/>
            </div>
          ))}
          <button onClick={()=>onSave(key,{...vals,reading_time_s:Math.round((Date.now()-expTabStartTime)/1000),exp:expTab,transaction_id:txId,task:"escalate"})}
            disabled={!allDone}
            style={{padding:"7px 18px",borderRadius:8,border:`1px solid ${allDone?"#7b5ea7":"#ccc"}`,background:allDone?"#f2eef9":"#f5f5f5",color:allDone?"#7b5ea7":"#aaa",fontSize:12,cursor:allDone?"pointer":"default",fontWeight:500}}>
            Save evaluation →
          </button>
          {!allDone&&<span style={{fontSize:11,color:"#bbb",marginLeft:10}}>Complete all items to save</span>}
        </div>
      )}
    </div>
  );
}

function EvalWidget({step, expTab, saved, onSave, txId}) {
  const task=WORKFLOW.find(w=>w.id===step)||WORKFLOW[0];
  const metrics=TASK_METRICS[step]||[];
  const key=`${step}-${txId}`;
  const [vals,setVals]=useState({});
  const [startTime]=useState(Date.now());
  useEffect(()=>{setVals({});},[key]);
  if (saved[key]) return <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #f0f0f0"}}><div style={{fontSize:12,color:"#1a7a4a"}}>✓ Evaluation recorded for <em>{task.label}</em></div></div>;
  const allDone=metrics.every(m=>vals[m.lbl]!==undefined);
  return (
    <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #f0f0f0"}}>
      {metrics.map((m,i)=>(
        <div key={i} style={{marginBottom:16}}>
          <div style={{fontSize:12,color:"#444",marginBottom:8,fontWeight:500}}>{m.lbl}</div>
          <MetricInput m={m} val={vals[m.lbl]} onChange={v=>setVals(prev=>({...prev,[m.lbl]:v}))}/>
        </div>
      ))}
      <button onClick={()=>onSave(key,{...vals,latency_s:Math.round((Date.now()-startTime)/1000),exp:expTab,task:step})}
        disabled={!allDone}
        style={{padding:"7px 18px",borderRadius:8,border:`1px solid ${allDone?"#2980b9":"#ccc"}`,background:allDone?"#e8f0fe":"#f5f5f5",color:allDone?"#2980b9":"#aaa",fontSize:12,cursor:allDone?"pointer":"default",fontWeight:500}}>
        Save evaluation →
      </button>
      {!allDone&&<span style={{fontSize:11,color:"#bbb",marginLeft:10}}>Complete all items to save</span>}
    </div>
  );
}

function SingleNav({txns, selected, onSelect}) {
  const idx=(selected>=0&&selected<txns.length)?selected:0;
  const tx=txns[idx]; if(!tx)return null;
  return (
    <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
      <div style={{fontSize:10,color:"#bbb",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Current alert</div>
      <div style={{fontSize:13,fontWeight:500,color:"#333",marginBottom:2}}>TXN {tx.id}</div>
      <div style={{fontSize:11,color:"#888",marginBottom:8}}>${tx.amount} · {tx.network} {tx.cardType}</div>
      <div style={{display:"flex",gap:6,justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={()=>onSelect(Math.max(0,idx-1))} disabled={idx===0} style={{flex:1,padding:"6px 0",borderRadius:7,border:"1px solid #e0e0e0",background:idx===0?"#fafafa":"#fff",color:idx===0?"#ccc":"#555",fontSize:12,cursor:idx===0?"default":"pointer"}}>← Prev</button>
        <span style={{fontSize:11,color:"#aaa"}}>{idx+1} / {txns.length}</span>
        <button onClick={()=>onSelect(Math.min(txns.length-1,idx+1))} disabled={idx===txns.length-1} style={{flex:1,padding:"6px 0",borderRadius:7,border:"1px solid #e0e0e0",background:idx===txns.length-1?"#fafafa":"#fff",color:idx===txns.length-1?"#ccc":"#555",fontSize:12,cursor:idx===txns.length-1?"default":"pointer"}}>Next →</button>
      </div>
    </div>
  );
}

export default function App() {
  const [selected,setSelected]=useState(0);
  const [step,setStep]=useState("triage");
  const [expTab,setExpTab]=useState("shap");
  const [expTabStartTime,setExpTabStartTime]=useState(Date.now());
  const [saved,setSaved]=useState({});
  const [showMeta,setShowMeta]=useState(false);
  const participantId=useState(()=>`P-${Date.now().toString(36).toUpperCase()}`)[0];

  const [task1Txns]=useState(()=>shuffleArray(ALL_TXN));
  const [task2Txns]=useState(()=>shuffleArray(ALL_TXN.filter(t=>TASK2_IDS.includes(t.id))));

  const txns = step==="escalate" ? task2Txns : task1Txns;
  const tx = txns[selected] || txns[0];
  const score = xgbScore(tx);
  const tc = TRUTH_CFG[tx.groundTruth];
  const isTriage = step==="triage";

  const handleExpTabChange = (tabId) => { setExpTab(tabId); setExpTabStartTime(Date.now()); };

  const handleSave = (k, d) => {
    setSaved(s => ({ ...s, [k]: d }));
    fetch(SHEET_URL, {
      method: "POST",
      body: JSON.stringify({ participant_id: participantId, key: k, ...d }),
    }).catch(() => {});
  };

  return (
    <div style={{fontFamily:"system-ui,sans-serif",padding:"1rem 0",maxWidth:1200}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{fontSize:20,fontWeight:600}}>Fraud Dashboard with Explainable AI</div>
          <button onClick={()=>setShowMeta(m=>!m)} style={{padding:"2px 8px",borderRadius:6,border:"1px solid #ddd",background:"#f9f9f9",color:"#bbb",fontSize:10,cursor:"pointer"}}>{showMeta?"hide":"···"}</button>
          {showMeta&&<div style={{display:"flex",gap:6,alignItems:"center"}}>
            <Badge label="IEEE-CIS Fraud Detection dataset" col="#2980b9" bg="#e8f0fe"/>
            <Badge label="XGBoost · scale_pos_weight=27.6" col="#888" bg="#f0f0f0"/>
            <Badge label="llama-3.1-8b-instant · Groq" col="#e65c00" bg="#fff3e0"/>
          </div>}
          <div style={{marginLeft:"auto"}}>
            <span style={{fontSize:11,color:"#aaa"}}>ID: <strong style={{color:"#555"}}>{participantId}</strong></span>
          </div>
        </div>
      </div>

      {/* Legend — Task 1 only */}
      {isTriage && <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
        {Object.entries(TRUTH_CFG).map(([k,v])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:8,background:v.bg,border:`1px solid ${v.col}30`}}>
            <span style={{fontSize:13,color:v.col,fontWeight:700}}>{v.icon}</span>
            <span style={{fontSize:11,color:v.col,fontWeight:500}}>{v.label}</span>
          </div>
        ))}
      </div>}

      {/* Workflow stepper */}
      <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,padding:"10px 14px",marginBottom:10}}>
        <div style={{fontSize:10,color:"#bbb",textTransform:"uppercase",letterSpacing:0.9,marginBottom:8}}>Evaluation workflow — 2 tasks</div>
        <div style={{display:"flex",gap:6}}>
          {WORKFLOW.map((w,i)=>(
            <div key={w.id} style={{flex:1,display:"flex",alignItems:"center"}}>
              <button onClick={()=>{setStep(w.id);setSelected(0);}} style={{flex:1,padding:"8px 4px",border:`1px solid ${step===w.id?w.col:"#e8e8e8"}`,borderRadius:8,background:step===w.id?w.bg:"#fafafa",cursor:"pointer",textAlign:"center"}}>
                <div style={{fontSize:14}}>{w.icon}</div>
                <div style={{fontSize:11,color:step===w.id?w.col:"#666",fontWeight:step===w.id?500:400,lineHeight:1.3}}>{w.label}</div>
              </button>
              {i<WORKFLOW.length-1&&<div style={{width:10,height:1,background:"#ddd",flexShrink:0}}/>}
            </div>
          ))}
        </div>
        <div style={{marginTop:8,padding:"10px 14px",background:"#f9f9f9",borderRadius:6,fontSize:13,color:"#555",lineHeight:1.6}}>
          {isTriage && "Review each transaction's details and risk score. Classify it and record your confidence."}
          {!isTriage && (
            <div>
              <div style={{fontWeight:500,marginBottom:8}}>Rate all 7 explanation types for each of the 4 transactions below. Click a transaction to begin.</div>
              <div style={{display:"flex",gap:6}}>
                {task2Txns.map((t,i)=>{
                  const isCurrent=txns[selected]?.id===t.id;
                  const ratedCount=ALL_EXP_TABS.filter(tab=>saved[`escalate-${t.id}-${tab}`]).length;
                  return (
                    <div key={t.id} onClick={()=>setSelected(i)} style={{flex:1,padding:"8px",borderRadius:8,border:`2px solid ${isCurrent?"#7b5ea7":"#e0e0e0"}`,background:isCurrent?"#f2eef9":"#fafafa",cursor:"pointer",textAlign:"center"}}>
                      <div style={{fontSize:11,fontWeight:600,color:isCurrent?"#7b5ea7":"#555"}}>TXN {i+1}</div>
                      <div style={{fontSize:10,color:"#aaa",marginBottom:4}}>{t.id}</div>
                      <div style={{fontSize:10,color:ratedCount===7?"#1a7a4a":isCurrent?"#7b5ea7":"#aaa",fontWeight:500}}>{ratedCount}/7 rated{ratedCount===7?" ✓":""}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:10}}>
        <div>
          <SingleNav txns={txns} selected={selected} onSelect={setSelected}/>
        </div>
        <div>
          <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,padding:"12px 14px",marginBottom:10}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 155px",gap:10,alignItems:"start"}}>
              <div>
                <div style={{fontSize:10,color:"#bbb"}}>Transaction ID</div>
                <div style={{fontSize:14,fontWeight:500,color:"#222"}}>TXN {tx.id}</div>
                <div style={{fontSize:11,color:"#888"}}>{PRODUCT_LABELS[tx.product]||tx.product}</div>
                {!isTriage&&<div style={{marginTop:6}}><Badge label={`${tc.icon} ${tc.label}`} col={tc.col} bg={tc.bg}/></div>}
              </div>
              <div>
                <div style={{fontSize:10,color:"#bbb"}}>Amount</div>
                <div style={{fontSize:18,fontWeight:500,color:"#222"}}>${tx.amount.toLocaleString()}</div>
              </div>
              <div>
                <div style={{fontSize:10,color:"#bbb"}}>Card details</div>
                <div style={{fontSize:11,color:"#555",lineHeight:1.7}}>
                  {tx.network} · {tx.cardType}<br/>
                  Address code: {tx.addr??"N/A"}<br/>
                  Distance (dist1): {tx.dist!==null?`${tx.dist}km`:"N/A"}
                </div>
              </div>
              <Gauge score={score}/>
            </div>
          </div>

          {isTriage&&(
            <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,padding:"12px 14px",marginBottom:10}}>
              <EvalWidget step={step} expTab={expTab} saved={saved} onSave={handleSave} txId={tx.id}/>
            </div>
          )}

          {!isTriage&&(
            <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,padding:"12px 14px",marginBottom:10}}>
              <div style={{fontSize:10,color:"#bbb",textTransform:"uppercase",letterSpacing:0.9,marginBottom:10}}>Explanation view</div>
              {EXP_GROUPS.map(g=>(
                <div key={g.id} style={{marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontSize:10,fontWeight:500,color:g.col,minWidth:180,flexShrink:0}}>{g.label}</span>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {g.tabs.map(t=>(
                        <button key={t.id} onClick={()=>handleExpTabChange(t.id)}
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
                {expTab==="llm"            && <LLMPanel key={tx.id} tx={tx} score={score}/>}
                {expTab==="counterfactual" && <CounterfactualPanel tx={tx} score={score}/>}
                {expTab==="logreg"         && <LogRegPanel tx={tx}/>}
                {expTab==="dtree"          && <DTreePanel tx={tx}/>}
                {expTab==="peers"          && <PeersPanel tx={tx}/>}
              </div>
              <EscalateEvalWidget
                expTab={TAB_ID_TO_LABEL[expTab]||expTab}
                expTabStartTime={expTabStartTime}
                txId={tx.id}
                saved={saved}
                onSave={handleSave}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}