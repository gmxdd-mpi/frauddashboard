import { useState, useEffect } from "react";

const ALL_TXN = [
  { id:"3053108", amount:152.51, product:"C", network:"visa", cardType:"credit", dist:null, groundTruth:"confirmed_fraud" },
  { id:"3354853", amount:25.95,  product:"W", network:"visa", cardType:"debit",  dist:8,    groundTruth:"legitimate"      },
  { id:"3492704", amount:230.18, product:"C", network:"visa", cardType:"debit",  dist:null, groundTruth:"confirmed_fraud" },
  { id:"3557070", amount:29.00,  product:"W", network:"visa", cardType:"debit",  dist:8,    groundTruth:"legitimate"      },
];

const PEER_POOLS = {
  "3053108": [
    { id:"3521091", amount:157.39, product:"C", network:"visa", cardType:"debit",  dist:null, groundTruth:"confirmed_fraud" },
    { id:"3314821", amount:134.13, product:"C", network:"visa", cardType:"debit",  dist:null, groundTruth:"confirmed_fraud" },
    { id:"3371282", amount:106.04, product:"C", network:"visa", cardType:"debit",  dist:null, groundTruth:"confirmed_fraud" },
    { id:"3115753", amount:130.13, product:"C", network:"visa", cardType:"credit", dist:null, groundTruth:"confirmed_fraud" },
    { id:"3431490", amount:83.67,  product:"C", network:"visa", cardType:"credit", dist:null, groundTruth:"legitimate"      },
  ],
  "3354853": [
    { id:"3565025", amount:57.95,  product:"W", network:"visa", cardType:"debit",  dist:7,    groundTruth:"confirmed_fraud" },
    { id:"3211183", amount:58.95,  product:"W", network:"visa", cardType:"debit",  dist:8,    groundTruth:"legitimate"      },
    { id:"3223916", amount:47.95,  product:"W", network:"visa", cardType:"debit",  dist:2,    groundTruth:"legitimate"      },
    { id:"3510290", amount:39.00,  product:"W", network:"visa", cardType:"debit",  dist:1,    groundTruth:"legitimate"      },
    { id:"3044069", amount:59.00,  product:"W", network:"visa", cardType:"debit",  dist:19,   groundTruth:"legitimate"      },
  ],
  "3492704": [
    { id:"3521091", amount:157.39, product:"C", network:"visa", cardType:"debit",  dist:null, groundTruth:"confirmed_fraud" },
    { id:"3314821", amount:134.13, product:"C", network:"visa", cardType:"debit",  dist:null, groundTruth:"confirmed_fraud" },
    { id:"3371282", amount:106.04, product:"C", network:"visa", cardType:"debit",  dist:null, groundTruth:"confirmed_fraud" },
    { id:"3074287", amount:54.10,  product:"C", network:"visa", cardType:"debit",  dist:null, groundTruth:"confirmed_fraud" },
    { id:"3202734", amount:40.97,  product:"C", network:"visa", cardType:"debit",  dist:null, groundTruth:"legitimate"      },
  ],
  "3557070": [
    { id:"3211183", amount:58.95,  product:"W", network:"visa", cardType:"debit",  dist:8,    groundTruth:"legitimate"      },
    { id:"3223916", amount:47.95,  product:"W", network:"visa", cardType:"debit",  dist:2,    groundTruth:"legitimate"      },
    { id:"3510290", amount:39.00,  product:"W", network:"visa", cardType:"debit",  dist:1,    groundTruth:"legitimate"      },
    { id:"3044069", amount:59.00,  product:"W", network:"visa", cardType:"debit",  dist:19,   groundTruth:"legitimate"      },
    { id:"3565025", amount:57.95,  product:"W", network:"visa", cardType:"debit",  dist:7,    groundTruth:"confirmed_fraud" },
  ],
};

const REAL_EXPLANATIONS = {
  "3053108":{ score:0.0096, shap:{TransactionAmt:-0.4179,ProductCD:0.3726,card4:-0.3341,card6:-2.195,addr1:-0.5997,dist1:-1.4414}, lime:{"card6 <= 1.00":-0.1449,"ProductCD <= 3.00":0.1068,"dist1 > 5.00":-0.0815,"184.00 < addr1 <= 272.00":0.0237,"card4 <= 2.00":-0.0144,"68.77 < TransactionAmt <= 125.00":0.001} },
  "3354853":{ score:0.8778, shap:{TransactionAmt:-0.6999,ProductCD:1.7578,card4:0.1166,card6:0.4982,addr1:-0.0035,dist1:0.3187}, lime:{"card6 <= 1.00":-0.1348,"ProductCD <= 3.00":0.1209,"dist1 <= -1.00":0.0635,"addr1 <= 184.00":-0.0451,"card4 <= 2.00":-0.0102,"68.77 < TransactionAmt <= 125.00":0.0068} },
  "3492704":{ score:0.7733, shap:{TransactionAmt:0.2236,ProductCD:1.3541,card4:1.182,card6:-1.804,addr1:0.0501,dist1:0.2379}, lime:{"TransactionAmt > 125.00":0.1466,"card6 <= 1.00":-0.1336,"ProductCD <= 3.00":0.1169,"dist1 <= -1.00":0.0669,"addr1 <= 184.00":-0.0413,"card4 <= 2.00":0.0001} },
  "3557070":{ score:0.015,  shap:{TransactionAmt:-2.1688,ProductCD:0.0755,card4:-0.2918,card6:0.0731,addr1:-0.3374,dist1:-1.5203}, lime:{"card6 <= 1.00":-0.1369,"TransactionAmt <= 43.32":-0.1098,"ProductCD <= 3.00":0.0983,"dist1 > 5.00":-0.0859,"272.00 < addr1 <= 327.00":0.0252,"card4 <= 2.00":-0.0128} },
};

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxzon2zq5pp-nOh3nnio__Vk8Dm8oVvbhAI1oVBc1xR7MsMT4A6RVSmun5b3gM0ObVV/exec";

const FEAT_LABELS = {
  TransactionAmt:"Transaction amount (USD)",
  ProductCD:"Transaction channel",
  card4:"Card network",
  card6:"Card type",
  dist1:"Distance: billing to transaction (km)",
};
const CHANNEL_LABELS = { W:"Web purchase", C:"Card payment", H:"Home purchase", R:"Retail", S:"Service" };
const TAB_ID_TO_LABEL = {shap:"SHAP",lime:"LIME",llm:"LLM",counterfactual:"Counterfactual",peers:"Similar Cases (CBR)"};
const ALL_EXP_TABS = Object.values(TAB_ID_TO_LABEL);
const EXP_TAB_IDS = ["shap","lime","llm","counterfactual","peers"];

const TRUTH_CFG = {
  confirmed_fraud:{label:"Confirmed fraud",col:"#c0392b",bg:"#fdecea",icon:"⚠"},
  legitimate:     {label:"Legitimate",     col:"#1a7a4a",bg:"#e8f7ee",icon:"✓"},
  suspected:      {label:"Suspected fraud",col:"#8e44ad",bg:"#f5eeff",icon:"?"},
};
const SEV_CFG = {HIGH:{col:"#c0392b",bg:"#fdecea"},MED:{col:"#b7770d",bg:"#fef3cd"},LOW:{col:"#1a7a4a",bg:"#e8f7ee"}};

function xgbScore(tx){return tx?(REAL_EXPLANATIONS[tx.id]?.score??0):0;}
function riskLevel(s){
  if(s>=0.7)return{text:"High risk",col:"#c0392b",bg:"#fdecea"};
  if(s>=0.4)return{text:"Medium risk",col:"#b7770d",bg:"#fef3cd"};
  return{text:"Low risk",col:"#1a7a4a",bg:"#e8f7ee"};
}

const FRAUD_RATES = {
  card6:{ credit:6.7, debit:2.4 },
  card4:{ visa:3.5, mastercard:3.4, discover:7.7, "american express":2.9 },
  ProductCD:{ C:11.7, H:4.8, R:3.8, S:5.9, W:2.0 },
};
const CHANNEL_CONTEXT = {
  C:"Card payments have the highest fraud rate in this dataset at 11.7% — nearly 6× higher than web purchases",
  W:"Web purchases have the lowest fraud rate in this dataset at 2.0% — a relatively low-risk channel",
  H:"Home purchases have a 4.8% fraud rate in this dataset",
  R:"Retail transactions have a 3.8% fraud rate in this dataset",
  S:"Service transactions have a 5.9% fraud rate in this dataset",
};

function annotateLimeRule(rule, tx){
  const network = tx.network.toLowerCase();
  const cardType = tx.cardType.toLowerCase();
  const channelContext = CHANNEL_CONTEXT[tx.product] || `${CHANNEL_LABELS[tx.product]||tx.product} transactions were factored in by the model`;
  if(/TransactionAmt > 125/.test(rule)){
    return tx.amount > 125
      ? `Amount $${tx.amount.toFixed(2)} — above $125 threshold, higher fraud risk`
      : `Amount $${tx.amount.toFixed(2)} — below $125 threshold, lower fraud risk`;
  }
  if(/TransactionAmt <= 43/.test(rule)){
    return tx.amount <= 43.32
      ? `Amount $${tx.amount.toFixed(2)} — small transaction, lower fraud risk`
      : `Amount $${tx.amount.toFixed(2)} — above low-amount threshold of $43`;
  }
  if(/68\.77 < TransactionAmt <= 125/.test(rule)){
    return tx.amount > 68.77 && tx.amount <= 125
      ? `Amount $${tx.amount.toFixed(2)} — mid-range band ($68–$125)`
      : `Amount $${tx.amount.toFixed(2)} — outside mid-range band ($68–$125)`;
  }
  if(/card6 <= 1/.test(rule)){
    const rate = FRAUD_RATES.card6[cardType]??"unknown";
    const otherType = cardType==="credit"?"debit":"credit";
    const otherRate = FRAUD_RATES.card6[otherType]??"unknown";
    return `${cardType.charAt(0).toUpperCase()+cardType.slice(1)} card — ${rate}% fraud rate vs ${otherRate}% for ${otherType}. `
      + (cardType==="credit"?"Higher risk card type.":"Lower risk card type.");
  }
  if(/card4 <= 2/.test(rule)){
    const rate = FRAUD_RATES.card4[network]??"unknown";
    return `${tx.network.charAt(0).toUpperCase()+tx.network.slice(1)} network — ${rate}% fraud rate in training data`;
  }
  if(/ProductCD <= 3/.test(rule)) return channelContext;
  if(/dist1 > 5/.test(rule)) return tx.dist!==null
    ? `Distance ${tx.dist}km — away from billing address, raises suspicion`
    : `Distance unavailable — location unverifiable`;
  if(/dist1 <= -1/.test(rule)) return "Distance unavailable — cannot verify location against billing address, higher fraud risk";
  return null;
}

function getLimeEntries(tx){
  if(!tx)return[];
  return Object.entries(REAL_EXPLANATIONS[tx.id]?.lime??{})
    .filter(([rule])=>{
      if(/addr1/.test(rule)) return false;
      if(/dist1 <= -1/.test(rule) && tx.dist!==null) return false;
      if(/dist1 > 5/.test(rule) && tx.dist===null) return false;
      if(/TransactionAmt > 125/.test(rule) && tx.amount<=125) return false;
      if(/TransactionAmt <= 43/.test(rule) && tx.amount>43) return false;
      if(/68\.77 < TransactionAmt <= 125/.test(rule) && (tx.amount<=68.77||tx.amount>125)) return false;
      return true;
    })
    .map(([k,v])=>({rule:k,annotation:annotateLimeRule(k,tx),v}))
    .sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));
}

function getShapEntries(tx){
  if(!tx)return[];
  const shap=REAL_EXPLANATIONS[tx.id]?.shap??{};
  const vals={TransactionAmt:`$${tx.amount.toFixed(2)}`,ProductCD:CHANNEL_LABELS[tx.product]||tx.product,card4:tx.network,card6:tx.cardType,dist1:tx.dist!==null?`${tx.dist} km`:'N/A'};
  return Object.entries(shap).filter(([k])=>k!=="addr1").map(([k,v])=>({key:k,label:FEAT_LABELS[k]||k,value:vals[k],shap:v})).sort((a,b)=>Math.abs(b.shap)-Math.abs(a.shap));
}

function getRiskFlags(tx, score){
  const f=[];
  if(score>=0.7)                                         f.push({code:"RF-01",label:"High fraud score",severity:"HIGH"});
  if(tx.amount>150)                                      f.push({code:"RF-02",label:"Amount above threshold",severity:"HIGH"});
  if(tx.dist===null)                                     f.push({code:"RF-04",label:"Distance unavailable — location unverifiable",severity:"MED"});
  if(tx.dist!==null&&tx.dist>100)                        f.push({code:"RF-03",label:"Suspicious transaction distance",severity:"HIGH"});
  if(tx.dist!==null&&tx.dist>20&&tx.dist<=100)           f.push({code:"RF-03",label:"Elevated transaction distance",severity:"MED"});
  if(tx.product==="C"&&score>0.3)                        f.push({code:"RF-05",label:"Card payment — elevated risk pattern",severity:"MED"});
  if(tx.product==="W"&&tx.dist!==null&&tx.dist>50)       f.push({code:"RF-06",label:"Web purchase with distance anomaly",severity:"MED"});
  if(score>=0.4&&score<0.7)                              f.push({code:"RF-07",label:"Medium fraud score — review required",severity:"MED"});
  if(f.length===0)                                       f.push({code:"RF-00",label:"No rules triggered — within normal parameters",severity:"LOW"});
  return f;
}

function riskLabel(v,max){
  const r=Math.abs(v)/max;
  const dir=v>0?"increases":"decreases";
  const strength=r>0.66?"strongly":r>0.33?"moderately":"slightly";
  return `${strength} ${dir} risk`;
}

function Badge({label,col="#888",bg="#f0f0f0"}){
  return <span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:bg,color:col,fontWeight:500,whiteSpace:"nowrap"}}>{label}</span>;
}

function MiniGauge({score}){
  const pct=Math.round(Math.min(score,0.99)*100);
  const r=riskLevel(score);
  return(
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1,height:8,background:"#e2e8f0",borderRadius:4,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:r.col,borderRadius:4}}/>
      </div>
      <span style={{fontSize:13,fontWeight:700,color:r.col,minWidth:28}}>{pct}</span>
      <span style={{fontSize:10,color:r.col,background:r.bg,padding:"2px 6px",borderRadius:6,fontWeight:500}}>{r.text}</span>
    </div>
  );
}

function ShapPanel({tx}){
  const entries=getShapEntries(tx);
  const maxV=Math.max(...entries.map(e=>Math.abs(e.shap)),0.01);
  return(
    <div>
      <div style={{background:"#f0f7ff",borderRadius:8,padding:"10px 12px",marginBottom:10,fontSize:11,color:"#1e40af",lineHeight:1.6}}>
        <strong>How much did each feature shift the score?</strong> Positive values push the fraud score up; negative values push it down.
      </div>
      {entries.map((e,i)=>{
        const pct=Math.min(Math.abs(e.shap)/maxV*100,100);
        const isPos=e.shap>0;
        return(
          <div key={i} style={{marginBottom:10,padding:"8px 10px",background:"#f8fafc",borderRadius:6}}>
            <div style={{fontSize:11,fontWeight:600,color:"#1e293b",marginBottom:2}}>{e.label.split(" (")[0]}</div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#64748b",marginBottom:5}}>
              <span style={{fontStyle:"italic",color:isPos?"#c0392b":"#2563eb"}}>{riskLabel(e.shap,maxV)}</span>
              <span>Value: <strong style={{color:"#334155"}}>{e.value}</strong></span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{flex:1,height:14,background:"#e2e8f0",borderRadius:4,overflow:"hidden",position:"relative"}}>
                <div style={{position:"absolute",left:isPos?"50%":"auto",right:isPos?"auto":"50%",width:`${pct/2}%`,height:"100%",background:isPos?"#c0392b":"#2563eb",opacity:0.8}}/>
                <div style={{position:"absolute",left:"50%",top:0,width:1,height:"100%",background:"#94a3b8"}}/>
              </div>
              <span style={{fontSize:10,fontWeight:700,color:isPos?"#c0392b":"#2563eb",minWidth:46,textAlign:"right"}}>{isPos?"+":""}{e.shap.toFixed(3)}</span>
            </div>
          </div>
        );
      })}
      <div style={{fontSize:10,color:"#94a3b8",fontStyle:"italic",marginTop:4}}>Values from TreeSHAP — exact contributions from the XGBoost model.</div>
    </div>
  );
}

function LimePanel({tx}){
  const entries=getLimeEntries(tx);
  const maxV=Math.max(...entries.map(e=>Math.abs(e.v)),0.01);
  return(
    <div>
      <div style={{background:"#f0fdf4",borderRadius:8,padding:"10px 12px",marginBottom:10,fontSize:11,color:"#166534",lineHeight:1.6}}>
        <strong>Which rules mattered most?</strong> LIME fits a local approximation around this transaction and weights each rule by how strongly it influenced the prediction.
      </div>
      {entries.map((e,i)=>{
        const pct=Math.min(Math.abs(e.v)/maxV*90,90);
        const isPos=e.v>0;
        const col=isPos?"#c0392b":"#1a7a4a";
        return(
          <div key={i} style={{marginBottom:10,padding:"8px 10px",background:"#f8fafc",borderRadius:6}}>
            <div style={{fontSize:11,fontWeight:600,color:"#1e293b",marginBottom:2}}>{e.annotation||e.rule}</div>
            <div style={{fontSize:9,color:"#94a3b8",fontFamily:"monospace",marginBottom:5}}>{e.rule}</div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{flex:1,height:12,background:"#e2e8f0",borderRadius:4,overflow:"hidden",position:"relative"}}>
                <div style={{position:"absolute",left:0,width:`${pct}%`,height:"100%",background:isPos?"#fca5a5":"#86efac",borderRadius:4}}/>
                <div style={{position:"absolute",top:0,bottom:0,left:`${pct}%`,width:3,background:col,borderRadius:2}}/>
              </div>
              <span style={{fontSize:10,fontWeight:700,color:col,minWidth:50,textAlign:"right"}}>{isPos?"+":""}{e.v.toFixed(4)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LLMPanel({tx,score}){
  const [text,setText]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [done,setDone]=useState(false);
  const r=riskLevel(score);
  const prompt=`You are an expert fraud analyst writing a case summary for a colleague who will decide whether to approve, flag, or block a transaction.

Transaction details:
- Amount: $${tx.amount.toFixed(2)}
- Channel: ${CHANNEL_LABELS[tx.product]||tx.product}
- Card: ${tx.network} ${tx.cardType}
- Distance from billing address: ${tx.dist!==null?tx.dist+" km":"unavailable"}
- Fraud risk score: ${Math.round(score*100)} out of 100 (${r.text})

Write 3 short paragraphs:
1. Summarise the overall risk level and the two or three most notable characteristics of this transaction.
2. Describe anything that looks unusual or inconsistent about this transaction.
3. Recommend a clear action — approve, investigate further, or block — and briefly explain why.

Write in plain English as if briefing a colleague. Do not use bullet points, technical jargon, or mention model internals.`;

  const run=async()=>{
    setLoading(true);setError("");setText("");setDone(false);
    try{
      const res=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${import.meta.env.VITE_GROQ_API_KEY}`},body:JSON.stringify({model:"llama-3.1-8b-instant",max_tokens:450,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      if(data.error)setError(`API error: ${data.error.message}`);
      else{setText(data.choices[0]?.message?.content||"No response.");setDone(true);}
    }catch{setError("API call failed.");}
    setLoading(false);
  };

  return(
    <div>
      <div style={{background:"#faf5ff",borderRadius:8,padding:"10px 12px",marginBottom:10,fontSize:11,color:"#6b21a8",lineHeight:1.6}}>
        <strong>AI-generated narrative.</strong> Plain-language case summary, similar to how an analyst would brief a colleague.
      </div>
      <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
        <Badge label="llama-3.1-8b-instant" col="#e65c00" bg="#fff3e0"/>
        <Badge label="Groq API" col="#2980b9" bg="#e8f0fe"/>
      </div>
      {!done&&!loading&&<button onClick={run} style={{width:"100%",padding:"10px",borderRadius:8,border:"1px solid #6b3fa0",background:"#f9f4ff",color:"#6b3fa0",fontSize:13,cursor:"pointer",fontWeight:500}}>Generate narrative ↗</button>}
      {loading&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,color:"#888",fontSize:13,padding:"12px"}}><div style={{width:13,height:13,border:"2px solid #ccc",borderTopColor:"#6b3fa0",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Generating…</div>}
      {error&&<div style={{color:"#c0392b",fontSize:12,padding:"8px",background:"#fdecea",borderRadius:6}}>{error}</div>}
      {text&&<div>
        <div style={{fontSize:12,lineHeight:1.85,color:"#1e293b",whiteSpace:"pre-wrap"}}>{text}</div>
        <button onClick={run} style={{marginTop:8,width:"100%",padding:"8px",borderRadius:6,border:"1px solid #ddd",background:"#fafafa",color:"#888",fontSize:12,cursor:"pointer"}}>↺ Regenerate</button>
      </div>}
    </div>
  );
}

function CounterfactualPanel({tx}){
  const shap=REAL_EXPLANATIONS[tx.id]?.shap??{};
  const riskDrivers=Object.entries(shap).filter(([k,v])=>v>0&&k!=="addr1").sort((a,b)=>b[1]-a[1]);
  const advice={
    TransactionAmt:{required:"Lower transaction amount",feasible:false,reason:"Cannot be changed retroactively"},
    ProductCD:     {required:"Different transaction channel",feasible:false,reason:"Cannot be changed retroactively"},
    card4:         {required:"Verify card ownership with issuer",feasible:true,reason:"Contact card issuer"},
    card6:         {required:"Verify card type matches account",feasible:true,reason:"Check account records"},
    dist1:         tx.dist===null
      ? {required:"Obtain location data, verify against billing address",feasible:true,reason:"Request from payment processor or contact cardholder"}
      : {required:"Cardholder confirms travel or foreign purchase",feasible:true,reason:"Contact cardholder"},
  };
  if(!riskDrivers.length)return<div style={{fontSize:13,color:"#888",padding:"12px 0"}}>No risk-increasing features for this transaction.</div>;
  return(
    <div>
      <div style={{background:"#eff6ff",borderRadius:8,padding:"10px 12px",marginBottom:10,fontSize:11,color:"#1e40af",lineHeight:1.6}}>
        <strong>What-if analysis.</strong> Which risk factors could realistically be verified or disputed?
      </div>
      {riskDrivers.slice(0,5).map(([k],i)=>{
        const a=advice[k]||{required:"No clear counterfactual",feasible:false,reason:""};
        const valMap={TransactionAmt:`$${tx.amount.toFixed(2)}`,ProductCD:CHANNEL_LABELS[tx.product]||tx.product,card4:tx.network,card6:tx.cardType,dist1:tx.dist!==null?`${tx.dist} km`:'N/A'};
        return(
          <div key={i} style={{marginBottom:8,padding:"10px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:11,fontWeight:600,color:"#1e293b"}}>{FEAT_LABELS[k]||k}</span>
              <span style={{padding:"2px 8px",borderRadius:10,fontSize:10,fontWeight:600,background:a.feasible?"#dcfce7":"#f1f5f9",color:a.feasible?"#15803d":"#94a3b8"}}>{a.feasible?"✓ Actionable":"✗ Fixed"}</span>
            </div>
            <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>Current: <strong style={{color:"#334155"}}>{valMap[k]}</strong></div>
            <div style={{fontSize:11,color:"#2563eb"}}>{a.required}</div>
            {a.reason&&<div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{a.reason}</div>}
          </div>
        );
      })}
    </div>
  );
}

function PeersPanel({tx}){
  const pool=PEER_POOLS[tx.id]||[];
  const others=pool.map(p=>{
    let sim=0;
    if(p.product===tx.product)sim+=25;
    if(p.network===tx.network)sim+=20;
    if(p.cardType===tx.cardType)sim+=20;
    if(Math.abs(p.amount-tx.amount)<tx.amount*0.4)sim+=25;
    if((p.dist===null)===(tx.dist===null))sim+=10;
    return{...p,sim};
  }).sort((a,b)=>b.sim-a.sim);
  const fraudCount=others.filter(p=>p.groundTruth==="confirmed_fraud").length;
  const [expanded,setExpanded]=useState(null);
  return(
    <div>
      <div style={{background:"#f0fdf4",borderRadius:8,padding:"10px 12px",marginBottom:10,fontSize:11,color:"#166534",lineHeight:1.6}}>
        <strong>Similar past cases.</strong> Tap any case to expand details.
      </div>
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        {[["confirmed_fraud","#c0392b","#fdecea"],["legitimate","#1a7a4a","#e8f7ee"]].map(([k,col,bg])=>(
          <div key={k} style={{flex:1,background:bg,borderRadius:8,padding:"8px",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:col}}>{others.filter(p=>p.groundTruth===k).length}</div>
            <div style={{fontSize:10,color:col}}>{TRUTH_CFG[k].icon} {TRUTH_CFG[k].label}</div>
          </div>
        ))}
        <div style={{flex:1,background:"#f1f5f9",borderRadius:8,padding:"8px",textAlign:"center"}}>
          <div style={{fontSize:20,fontWeight:700,color:"#475569"}}>{others.length>0?Math.round(fraudCount/others.length*100):0}%</div>
          <div style={{fontSize:10,color:"#64748b"}}>Fraud rate</div>
        </div>
      </div>
      {others.map((p,i)=>{
        const tc=TRUTH_CFG[p.groundTruth];
        const ps=xgbScore(p);const pr=riskLevel(ps);
        const isOpen=expanded===p.id;
        const flags=getRiskFlags(p,ps);
        return(
          <div key={i} style={{marginBottom:6,borderRadius:8,border:`1px solid ${isOpen?"#93c5fd":"#e2e8f0"}`,overflow:"hidden"}}>
            <div onClick={()=>setExpanded(isOpen?null:p.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:isOpen?"#eff6ff":"#f8fafc",cursor:"pointer"}}>
              <div style={{textAlign:"center",minWidth:34}}>
                <div style={{fontSize:11,fontWeight:700,color:"#475569"}}>{p.sim}%</div>
                <div style={{fontSize:9,color:"#94a3b8"}}>match</div>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:500,color:"#1e293b"}}>TXN {p.id} · ${p.amount.toFixed(2)}</div>
                <div style={{fontSize:10,color:"#64748b"}}>Score: <strong style={{color:pr.col}}>{Math.round(ps*100)}</strong></div>
              </div>
              <Badge label={`${tc.icon} ${tc.label}`} col={tc.col} bg={tc.bg}/>
              <span style={{fontSize:11,color:"#94a3b8"}}>{isOpen?"▲":"▼"}</span>
            </div>
            {isOpen&&(
              <div style={{padding:"10px",background:"#fff",borderTop:"1px solid #e2e8f0"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:8}}>
                  {[["Amount",`$${p.amount.toFixed(2)}`],["Channel",CHANNEL_LABELS[p.product]||p.product],["Network",p.network],["Card type",p.cardType],["Distance",p.dist!==null?`${p.dist} km`:'N/A']].map(([l,v])=>(
                    <div key={l} style={{background:"#f8fafc",borderRadius:5,padding:"5px 7px"}}>
                      <div style={{fontSize:9,color:"#94a3b8",fontWeight:600}}>{l}</div>
                      <div style={{fontSize:11,color:"#1e293b",fontWeight:500}}>{v}</div>
                    </div>
                  ))}
                </div>
                {flags.map((f,fi)=>{
                  const sc=SEV_CFG[f.severity];
                  return(
                    <div key={fi} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 7px",background:sc.bg,borderRadius:5,marginBottom:3}}>
                      <span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,color:sc.col,minWidth:34}}>{f.code}</span>
                      <span style={{fontSize:10,color:"#1e293b",flex:1}}>{f.label}</span>
                      <span style={{fontSize:9,fontWeight:700,color:sc.col}}>{f.severity}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ClassifyWidget({txId,saved,onSave}){
  const key=`classify-${txId}`;
  const [cls,setCls]=useState(null);
  const [conf,setConf]=useState(null);
  const [start]=useState(Date.now());
  useEffect(()=>{setCls(null);setConf(null);},[txId]);
  if(saved[key])return(
    <div style={{padding:"10px 12px",background:"#f0fdf4",borderRadius:8,border:"1px solid #bbf7d0",width:"100%",boxSizing:"border-box"}}>
      <div style={{fontSize:12,color:"#166534",fontWeight:600,marginBottom:2}}>✓ Classification recorded</div>
      <div style={{fontSize:11,color:"#166534"}}>{TRUTH_CFG[saved[key].classification]?.label} · Confidence {saved[key].confidence}/7</div>
    </div>
  );
  return(
    <div style={{padding:"14px",background:"#fafafa",borderRadius:12,border:"1px solid #e2e8f0",width:"100%",boxSizing:"border-box"}}>
      <div style={{fontSize:12,fontWeight:600,color:"#1e293b",marginBottom:10}}>Step 1 — Initial classification</div>
      <div style={{fontSize:11,color:"#475569",marginBottom:6,fontWeight:500}}>How would you classify this transaction?</div>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
        {[{key:"confirmed_fraud",label:"Confirmed fraud",col:"#c0392b",bg:"#fdecea",icon:"⚠"},{key:"suspected",label:"Suspected fraud",col:"#8e44ad",bg:"#f5eeff",icon:"?"},{key:"legitimate",label:"Legitimate",col:"#1a7a4a",bg:"#e8f7ee",icon:"✓"}].map(o=>(
          <button key={o.key} onClick={()=>setCls(o.key)} style={{padding:"10px 14px",borderRadius:10,border:`2px solid ${cls===o.key?o.col:"#ddd"}`,background:cls===o.key?o.bg:"#fff",color:cls===o.key?o.col:"#888",fontSize:13,fontWeight:cls===o.key?600:400,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>{o.icon}</span>{o.label}
          </button>
        ))}
      </div>
      <div style={{fontSize:11,color:"#475569",marginBottom:6,fontWeight:500}}>Confidence (1 = low · 7 = high)</div>
      <div style={{display:"flex",gap:5,marginBottom:12}}>
        {[1,2,3,4,5,6,7].map(n=>(
          <button key={n} onClick={()=>setConf(n)} style={{flex:1,height:36,borderRadius:6,border:`1px solid ${conf===n?"#2980b9":"#ddd"}`,background:conf===n?"#e8f0fe":"#fff",color:conf===n?"#2980b9":"#888",fontSize:13,cursor:"pointer",fontWeight:conf===n?700:400}}>{n}</button>
        ))}
      </div>
      <button onClick={()=>onSave(key,{classification:cls,confidence:conf,latency_s:Math.round((Date.now()-start)/1000),transaction_id:txId})}
        disabled={!cls||!conf}
        style={{width:"100%",padding:"12px",borderRadius:8,border:`1px solid ${cls&&conf?"#2980b9":"#ccc"}`,background:cls&&conf?"#2980b9":"#f5f5f5",color:cls&&conf?"#fff":"#aaa",fontSize:13,cursor:cls&&conf?"pointer":"default",fontWeight:600}}>
        Confirm &amp; unlock explanations →
      </button>
    </div>
  );
}

function ExpRatingWidget({txId,expTab,saved,onSave}){
  const key=`exprating-${txId}-${expTab}`;
  const [trust,setTrust]=useState(null);
  const [load,setLoad]=useState(null);
  const [tabStart]=useState(()=>Date.now());
  useEffect(()=>{setTrust(null);setLoad(null);},[txId,expTab]);
  if(saved[key])return(
    <div style={{marginTop:10,padding:"10px 12px",background:"#f0fdf4",borderRadius:8,border:"1px solid #bbf7d0"}}>
      <div style={{fontSize:11,color:"#166534",fontWeight:500}}>✓ Rated — Trust: <strong>{saved[key].trust}</strong> · Mental load: <strong>{saved[key].mental_load}</strong></div>
    </div>
  );
  const ScaleRow=({label,value,setValue})=>(
    <div style={{marginBottom:12}}>
      <div style={{fontSize:11,color:"#334155",fontWeight:500,marginBottom:8,lineHeight:1.5}}>{label}</div>
      <div style={{display:"flex",gap:4}}>
        {[1,2,3,4,5].map(n=>(
          <button key={n} onClick={()=>setValue(n)} style={{flex:1,height:36,borderRadius:6,border:`1px solid ${value===n?"#2980b9":"#ddd"}`,background:value===n?"#e8f0fe":"#fff",color:value===n?"#2980b9":"#888",fontSize:13,cursor:"pointer",fontWeight:value===n?700:400}}>{n}</button>
        ))}
        <button onClick={()=>setValue("dk")} style={{flex:1.5,height:36,borderRadius:6,border:`1px solid ${value==="dk"?"#7c3aed":"#ddd"}`,background:value==="dk"?"#ede9fe":"#fff",color:value==="dk"?"#7c3aed":"#888",fontSize:10,cursor:"pointer",fontWeight:value==="dk"?600:400}}>IDK</button>
      </div>
    </div>
  );
  return(
    <div style={{marginTop:10,padding:"12px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0"}}>
      <div style={{fontSize:11,fontWeight:600,color:"#475569",marginBottom:10}}>Rate this explanation — {expTab}</div>
      <ScaleRow label="1. I trust this AI's assessment after seeing this explanation." value={trust} setValue={setTrust}/>
      <ScaleRow label="2. This explanation reduced my mental load in understanding the AI." value={load} setValue={setLoad}/>
      <button onClick={()=>onSave(key,{trust,mental_load:load,exp:expTab,transaction_id:txId,tab_time_s:Math.round((Date.now()-tabStart)/1000)})}
        disabled={!trust||!load}
        style={{width:"100%",padding:"10px",borderRadius:7,border:`1px solid ${trust&&load?"#2980b9":"#ccc"}`,background:trust&&load?"#e8f0fe":"#f5f5f5",color:trust&&load?"#2980b9":"#aaa",fontSize:12,cursor:trust&&load?"pointer":"default",fontWeight:500}}>
        Save rating →
      </button>
    </div>
  );
}

function SummaryWidget({txId,initialClass,saved,onSave,txStart}){
  const key=`summary-${txId}`;
  const [reclassify,setReclassify]=useState(null);
  const [bestExp,setBestExp]=useState(null);
  const [conf,setConf]=useState(null);
  useEffect(()=>{setReclassify(null);setBestExp(null);setConf(null);},[txId]);
  if(saved[key])return(
    <div style={{padding:"10px 12px",background:"#f0fdf4",borderRadius:8,border:"1px solid #bbf7d0"}}>
      <div style={{fontSize:12,color:"#166534",fontWeight:600}}>✓ Summary recorded</div>
    </div>
  );
  const allDone=reclassify&&bestExp&&conf;
  const tc=initialClass?TRUTH_CFG[initialClass]:null;
  return(
    <div style={{padding:"12px",background:"#f2eef9",borderRadius:8,border:"1px solid #ddd6fe"}}>
      <div style={{fontSize:12,fontWeight:600,color:"#5b21b6",marginBottom:10}}>Step 3 — Reflect on the explanations</div>
      {tc&&<div style={{fontSize:11,color:"#64748b",marginBottom:10}}>Initial classification: <Badge label={`${tc.icon} ${tc.label}`} col={tc.col} bg={tc.bg}/></div>}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:500,color:"#374151",marginBottom:6}}>Has your classification changed?</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {[{key:"no_change",label:"No change",col:"#475569",bg:"#f1f5f9",icon:"→"},{key:"confirmed_fraud",label:"Confirmed fraud",col:"#c0392b",bg:"#fdecea",icon:"⚠"},{key:"suspected",label:"Suspected fraud",col:"#8e44ad",bg:"#f5eeff",icon:"?"},{key:"legitimate",label:"Legitimate",col:"#1a7a4a",bg:"#e8f7ee",icon:"✓"}].map(o=>(
            <button key={o.key} onClick={()=>setReclassify(o.key)} style={{padding:"10px 12px",borderRadius:10,border:`2px solid ${reclassify===o.key?o.col:"#ddd"}`,background:reclassify===o.key?o.bg:"#fff",color:reclassify===o.key?o.col:"#888",fontSize:12,fontWeight:reclassify===o.key?600:400,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:8}}>
              <span>{o.icon}</span>{o.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:500,color:"#374151",marginBottom:6}}>Final confidence (1 = low · 7 = high)</div>
        <div style={{display:"flex",gap:5}}>
          {[1,2,3,4,5,6,7].map(n=>(
            <button key={n} onClick={()=>setConf(n)} style={{flex:1,height:36,borderRadius:6,border:`1px solid ${conf===n?"#7b5ea7":"#ddd"}`,background:conf===n?"#ede9fe":"#fff",color:conf===n?"#7b5ea7":"#888",fontSize:13,cursor:"pointer",fontWeight:conf===n?700:400}}>{n}</button>
          ))}
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:500,color:"#374151",marginBottom:6}}>Most helpful explanation?</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {ALL_EXP_TABS.map(t=>(
            <button key={t} onClick={()=>setBestExp(t)} style={{padding:"6px 10px",borderRadius:14,border:`1px solid ${bestExp===t?"#7b5ea7":"#ddd"}`,background:bestExp===t?"#ede9fe":"#fff",color:bestExp===t?"#7b5ea7":"#888",fontSize:11,cursor:"pointer",fontWeight:bestExp===t?600:400}}>{t}</button>
          ))}
        </div>
      </div>
      <button onClick={()=>onSave(key,{reclassification:reclassify,most_helpful_explanation:bestExp,final_confidence:conf,transaction_id:txId,initial_classification:initialClass,total_txn_time_s:Math.round((Date.now()-txStart)/1000)})}
        disabled={!allDone}
        style={{width:"100%",padding:"12px",borderRadius:8,border:`1px solid ${allDone?"#7b5ea7":"#ccc"}`,background:allDone?"#7b5ea7":"#f5f5f5",color:allDone?"#fff":"#aaa",fontSize:13,cursor:allDone?"pointer":"default",fontWeight:600}}>
        Save &amp; complete →
      </button>
    </div>
  );
}

function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

export default function App(){
  const [selected,setSelected]=useState(0);
  const [saved,setSaved]=useState({});
  const participantId=useState(()=>`P-${Date.now().toString(36).toUpperCase()}`)[0];
  const [txnOrder]=useState(()=>shuffle([...ALL_TXN]));
  const [tabOrder]=useState(()=>shuffle([...EXP_TAB_IDS]));
  const [expTab,setExpTab]=useState(()=>tabOrder[0]);
  const [txStartTimes,setTxStartTimes]=useState({[0]:Date.now()});
  const [view,setView]=useState("txn"); // "txn" | "exp"

  const tx=txnOrder[selected];
  const score=xgbScore(tx);
  const classifyKey=`classify-${tx.id}`;
  const summaryKey=`summary-${tx.id}`;
  const classified=!!saved[classifyKey];
  const summarised=!!saved[summaryKey];
  const initialClass=saved[classifyKey]?.classification;
  const allExpRated=ALL_EXP_TABS.every(tab=>saved[`exprating-${tx.id}-${tab}`]);
  const ratedCount=ALL_EXP_TABS.filter(tab=>saved[`exprating-${tx.id}-${tab}`]).length;
  const currentTabIdx=tabOrder.indexOf(expTab);
  const isLastTab=currentTabIdx===tabOrder.length-1;

  const handleSave=(k,d)=>{
    setSaved(s=>({...s,[k]:d}));
    fetch(SHEET_URL,{method:"POST",body:JSON.stringify({participant_id:participantId,key:k,...d})}).catch(()=>{});
    if(k.startsWith("exprating-")&&!isLastTab) setExpTab(tabOrder[currentTabIdx+1]);
  };

  const completedCount=txnOrder.filter(t=>saved[`summary-${t.id}`]).length;
  const flags=getRiskFlags(tx,score);
  const r=riskLevel(score);

  const fields=[
    {label:"Amount",value:`$${tx.amount.toFixed(2)}`},
    {label:"Channel",value:CHANNEL_LABELS[tx.product]||tx.product},
    {label:"Network",value:tx.network.charAt(0).toUpperCase()+tx.network.slice(1)},
    {label:"Card type",value:tx.cardType.charAt(0).toUpperCase()+tx.cardType.slice(1)},
    {label:"Distance",value:tx.dist!==null?`${tx.dist} km`:'Not available'},
  ];

  return(
    <div style={{fontFamily:"system-ui,sans-serif",maxWidth:480,margin:"0 auto",background:"#f8fafc",minHeight:"100vh"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{background:"#1e293b",padding:"12px 16px",position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#f8fafc"}}>Fraud XAI Study</div>
          <div style={{fontSize:11,color:"#94a3b8"}}>{completedCount}/4 done · <span style={{fontFamily:"monospace",color:"#cbd5e1"}}>{participantId}</span></div>
        </div>
        {/* Transaction selector */}
        <div style={{display:"flex",gap:6,marginTop:10}}>
          {txnOrder.map((t,i)=>{
            const done=!!saved[`summary-${t.id}`];
            const isCurrent=selected===i;
            return(
              <button key={t.id} onClick={()=>{setSelected(i);setExpTab(tabOrder[0]);setView("txn");setTxStartTimes(s=>({...s,[i]:s[i]??Date.now()}));}}
                style={{flex:1,padding:"6px 4px",borderRadius:8,border:`2px solid ${isCurrent?"#60a5fa":done?"#4ade80":"#475569"}`,background:isCurrent?"#1d4ed8":done?"#166534":"#334155",cursor:"pointer",textAlign:"center"}}>
                <div style={{fontSize:12,fontWeight:700,color:isCurrent?"#fff":done?"#4ade80":"#94a3b8"}}>T{i+1}</div>
                <div style={{fontSize:9,color:isCurrent?"#bfdbfe":done?"#4ade80":"#64748b"}}>{done?"✓":isCurrent?"active":"—"}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{padding:"12px 12px 80px"}}>

        {/* Transaction summary card */}
        <div style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:"14px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <div style={{fontSize:10,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".08em"}}>Transaction ID</div>
              <div style={{fontSize:18,fontWeight:700,color:"#1e293b"}}>{tx.id}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:22,fontWeight:700,color:r.col}}>{Math.round(score*100)}</div>
              <div style={{fontSize:10,color:r.col,background:r.bg,padding:"2px 8px",borderRadius:6,fontWeight:500}}>{r.text}</div>
            </div>
          </div>
          <MiniGauge score={score}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginTop:10}}>
            {fields.map(f=>(
              <div key={f.label} style={{background:"#f8fafc",borderRadius:6,padding:"6px 8px"}}>
                <div style={{fontSize:9,color:"#94a3b8",fontWeight:600}}>{f.label}</div>
                <div style={{fontSize:12,color:"#1e293b",fontWeight:500}}>{f.value}</div>
              </div>
            ))}
          </div>
          {/* Risk flags */}
          <div style={{marginTop:10}}>
            {flags.map((f,i)=>{
              const sc=SEV_CFG[f.severity];
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",background:sc.bg,borderRadius:5,border:`1px solid ${sc.col}22`,marginBottom:4}}>
                  <span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,color:sc.col,minWidth:34}}>{f.code}</span>
                  <span style={{fontSize:11,color:"#1e293b",flex:1}}>{f.label}</span>
                  <span style={{fontSize:9,fontWeight:700,color:sc.col,padding:"1px 5px",borderRadius:6,background:"#fff",border:`1px solid ${sc.col}44`}}>{f.severity}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1 */}
        <div style={{marginTop:10,width:"100%",boxSizing:"border-box"}}>
          <ClassifyWidget txId={tx.id} saved={saved} onSave={handleSave}/>
        </div>

        {/* Step 2 — Explanations */}
        {classified&&(
          <div style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:"14px",marginTop:10}}>
            <div style={{fontSize:11,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Step 2 — Explore explanations</div>
            {/* Tab scroll */}
            <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:6,marginBottom:10,WebkitOverflowScrolling:"touch"}}>
              {tabOrder.map(id=>{
                const label=TAB_ID_TO_LABEL[id];
                const rated=!!saved[`exprating-${tx.id}-${label}`];
                return(
                  <button key={id} onClick={()=>setExpTab(id)}
                    style={{padding:"6px 12px",fontSize:11,border:`1px solid ${expTab===id?"#2980b9":rated?"#1a7a4a":"#e0e0e0"}`,borderRadius:14,background:expTab===id?"#e8f0fe":rated?"#f0fdf4":"#fff",color:expTab===id?"#2980b9":rated?"#1a7a4a":"#888",cursor:"pointer",fontWeight:expTab===id?600:400,whiteSpace:"nowrap",flexShrink:0}}>
                    {rated?"✓ ":""}{label}
                  </button>
                );
              })}
            </div>
            {expTab==="shap"           &&<ShapPanel tx={tx}/>}
            {expTab==="lime"           &&<LimePanel tx={tx}/>}
            {expTab==="llm"            &&<LLMPanel key={tx.id} tx={tx} score={score}/>}
            {expTab==="counterfactual" &&<CounterfactualPanel tx={tx}/>}
            {expTab==="peers"          &&<PeersPanel tx={tx}/>}
            <ExpRatingWidget txId={tx.id} expTab={TAB_ID_TO_LABEL[expTab]} saved={saved} onSave={handleSave}/>
          </div>
        )}

        {classified&&!allExpRated&&(
          <div style={{padding:"10px 12px",background:"#fefce8",border:"1px solid #fde68a",borderRadius:8,fontSize:11,color:"#92400e",marginTop:10}}>
            📋 Rate all 5 explanations to unlock the final step. <strong>{ratedCount}/5 rated</strong>
          </div>
        )}

        {classified&&allExpRated&&(
          <div style={{marginTop:10}}>
            <SummaryWidget txId={tx.id} initialClass={initialClass} saved={saved} onSave={handleSave} txStart={txStartTimes[selected]??Date.now()}/>
          </div>
        )}

        {summarised&&(
          <div style={{padding:"12px",background:"#eff6ff",borderRadius:8,border:"1px solid #bfdbfe",fontSize:12,color:"#1e40af",textAlign:"center",marginTop:10}}>
            ✓ Transaction {selected+1} complete.{selected<ALL_TXN.length-1?" Tap the next transaction above.":" All 4 done — thank you!"}
          </div>
        )}
      </div>
    </div>
  );
}