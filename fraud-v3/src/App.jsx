import { useState, useEffect } from "react";

const ALL_TXN = [
  { id:"3053108", amount:152.51, product:"C", network:"visa", cardType:"credit", dist:null, groundTruth:"confirmed_fraud" },
  { id:"3354853", amount:25.95,  product:"W", network:"visa", cardType:"debit",  dist:8,    groundTruth:"legitimate"      },
  { id:"3492704", amount:230.18, product:"C", network:"visa", cardType:"debit",  dist:null, groundTruth:"confirmed_fraud" },
  { id:"3557070", amount:29.00,  product:"W", network:"visa", cardType:"debit",  dist:8,    groundTruth:"legitimate"      },
];

const PEER_POOLS = {
  // False Negative — model missed fraud. Peers show similar transactions that WERE caught as fraud,
  // nudging analysts to question why this one scored so low.
  "3053108": [
    { id:"3521091", amount:157.39, product:"C", network:"visa", cardType:"debit",  dist:null, groundTruth:"confirmed_fraud" },
    { id:"3314821", amount:134.13, product:"C", network:"visa", cardType:"debit",  dist:null, groundTruth:"confirmed_fraud" },
    { id:"3371282", amount:106.04, product:"C", network:"visa", cardType:"debit",  dist:null, groundTruth:"confirmed_fraud" },
    { id:"3115753", amount:130.13, product:"C", network:"visa", cardType:"credit", dist:null, groundTruth:"confirmed_fraud" },
    { id:"3431490", amount:83.67,  product:"C", network:"visa", cardType:"credit", dist:null, groundTruth:"legitimate"      },
  ],
  // False Positive — model wrongly flagged legit. Peers are mostly legit,
  // helping analysts push back on the high score.
  "3354853": [
    { id:"3565025", amount:57.95,  product:"W", network:"visa", cardType:"debit",  dist:7,    groundTruth:"confirmed_fraud" },
    { id:"3211183", amount:58.95,  product:"W", network:"visa", cardType:"debit",  dist:8,    groundTruth:"legitimate"      },
    { id:"3223916", amount:47.95,  product:"W", network:"visa", cardType:"debit",  dist:2,    groundTruth:"legitimate"      },
    { id:"3510290", amount:39.00,  product:"W", network:"visa", cardType:"debit",  dist:1,    groundTruth:"legitimate"      },
    { id:"3044069", amount:59.00,  product:"W", network:"visa", cardType:"debit",  dist:19,   groundTruth:"legitimate"      },
  ],
  // True Positive — correctly caught fraud. Peers are mostly fraud,
  // confirming the analyst's suspicion.
  "3492704": [
    { id:"3521091", amount:157.39, product:"C", network:"visa", cardType:"debit",  dist:null, groundTruth:"confirmed_fraud" },
    { id:"3314821", amount:134.13, product:"C", network:"visa", cardType:"debit",  dist:null, groundTruth:"confirmed_fraud" },
    { id:"3371282", amount:106.04, product:"C", network:"visa", cardType:"debit",  dist:null, groundTruth:"confirmed_fraud" },
    { id:"3074287", amount:54.10,  product:"C", network:"visa", cardType:"debit",  dist:null, groundTruth:"confirmed_fraud" },
    { id:"3202734", amount:40.97,  product:"C", network:"visa", cardType:"debit",  dist:null, groundTruth:"legitimate"      },
  ],
  // True Negative — correctly cleared legit. Peers are mostly legit,
  // confirming it is safe to approve.
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
  ProductCD:"Transaction channel (ProductCD)",
  card4:"Card network (card4)",
  card6:"Card type (card6)",
  dist1:"Distance: billing to transaction, km (dist1)",
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
function getShapEntries(tx){
  if(!tx)return[];
  const shap=REAL_EXPLANATIONS[tx.id]?.shap??{};
  const vals={TransactionAmt:`${tx.amount.toFixed(2)}`,ProductCD:CHANNEL_LABELS[tx.product]||tx.product,card4:tx.network,card6:tx.cardType,dist1:tx.dist!==null?`${tx.dist} km`:'N/A'};
  return Object.entries(shap).filter(([k])=>k!=="addr1").map(([k,v])=>({key:k,label:FEAT_LABELS[k]||k,value:vals[k],shap:v})).sort((a,b)=>Math.abs(b.shap)-Math.abs(a.shap));
}

const FRAUD_RATES = {
  card6: { credit: 6.7, debit: 2.4, "charge card": 0.0, "debit or credit": 0.0 },
  card4: { visa: 3.5, mastercard: 3.4, discover: 7.7, "american express": 2.9 },
  ProductCD: { C: 11.7, H: 4.8, R: 3.8, S: 5.9, W: 2.0 },
};

// Contextual descriptions for channels
const CHANNEL_CONTEXT = {
  C: "Card payments have the highest fraud rate in this dataset at 11.7% — nearly 6× higher than web purchases",
  W: "Web purchases have the lowest fraud rate in this dataset at 2.0% — a relatively low-risk channel",
  H: "Home purchases have a 4.8% fraud rate in this dataset",
  R: "Retail transactions have a 3.8% fraud rate in this dataset",
  S: "Service transactions have a 5.9% fraud rate in this dataset",
};

function annotateLimeRule(rule, tx){
  const channel = CHANNEL_LABELS[tx.product] || tx.product;
  const network = tx.network.toLowerCase();
  const cardType = tx.cardType.toLowerCase();
  const cardTypeRate = FRAUD_RATES.card6[cardType];
  const networkRate = FRAUD_RATES.card4[network];
  const channelContext = CHANNEL_CONTEXT[tx.product] || `${channel} transactions were factored in by the model`;

  if(/TransactionAmt > 125/.test(rule))           return "Amount is high — above the typical threshold for this channel";
  if(/TransactionAmt <= 43/.test(rule))            return "Amount is low — well within the normal range for this channel";
  if(/68\.77 < TransactionAmt <= 125/.test(rule))  return "Amount is moderate — within a common mid-range band";
  if(/card6 <= 1/.test(rule))                      return `Card type is ${tx.cardType} — ${cardTypeRate}% of ${tx.cardType} card transactions in the training data were fraudulent`;
  if(/card4 <= 2/.test(rule))                      return `Card network is ${tx.network} — ${networkRate}% of ${tx.network} transactions in the training data were fraudulent`;
  if(/ProductCD <= 3/.test(rule))                  return channelContext;
  if(/dist1 > 5/.test(rule))                       return `Distance is ${tx.dist}km — the model factored in that distance data was present for this transaction`;
  if(/dist1 <= -1/.test(rule))                     return "Distance data unavailable — transaction location could not be compared against the billing address";
  if(/addr1 <= 184/.test(rule))                    return "Billing region is in the lower range — the model weighted this when scoring the transaction";
  if(/184\.00 < addr1 <= 272/.test(rule))          return "Billing region is in the mid range — the model weighted this when scoring the transaction";
  if(/272\.00 < addr1 <= 327/.test(rule))          return "Billing region is in the higher range — the model weighted this when scoring the transaction";
  return null;
}

function getLimeEntries(tx){
  if(!tx)return[];
  return Object.entries(REAL_EXPLANATIONS[tx.id]?.lime??{})
    .filter(([rule])=>{
      if(/addr1/.test(rule)) return false;
      if(/dist1 <= -1/.test(rule) && tx.dist !== null) return false;
      if(/dist1 > 5/.test(rule) && tx.dist === null) return false;
      if(/TransactionAmt > 125/.test(rule) && tx.amount <= 125) return false;
      if(/TransactionAmt <= 43/.test(rule) && tx.amount > 43) return false;
      if(/68\.77 < TransactionAmt <= 125/.test(rule) && (tx.amount <= 68.77 || tx.amount > 125)) return false;
      return true;
    })
    .map(([k,v])=>({rule:k, annotation:annotateLimeRule(k,tx), v}))
    .sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));
}

function getRiskFlags(tx,score){
  const f=[];
  if(score>=0.7)                               f.push({code:"RF-01",label:"High fraud score",severity:"HIGH"});
  if(tx.amount>150)                            f.push({code:"RF-02",label:"Transaction amount above threshold",severity:"HIGH"});
  if(tx.dist!==null&&tx.dist>100)              f.push({code:"RF-03",label:"Suspicious transaction distance",severity:"HIGH"});
  if(tx.dist!==null&&tx.dist>20&&tx.dist<=100) f.push({code:"RF-03",label:"Elevated transaction distance",severity:"MED"});
  if(tx.product==="C"&&score>0.3)              f.push({code:"RF-05",label:"Card payment — elevated risk pattern",severity:"MED"});
  if(tx.product==="W"&&tx.dist!==null&&tx.dist>5) f.push({code:"RF-06",label:"Web purchase with distance anomaly",severity:"MED"});
  if(score>=0.4&&score<0.7)                    f.push({code:"RF-07",label:"Medium fraud score — review required",severity:"MED"});
  if(f.length===0)                             f.push({code:"RF-00",label:"No rules triggered — transaction within normal parameters",severity:"LOW"});
  return f;
}

function Badge({label,col="#888",bg="#f0f0f0",sz=11}){
  return <span style={{fontSize:sz,padding:"2px 8px",borderRadius:10,background:bg,color:col,fontWeight:500,whiteSpace:"nowrap"}}>{label}</span>;
}

function Gauge({score}){
  const pct=Math.round(Math.min(score,0.99)*100);
  const r=riskLevel(score);
  const cx=70,cy=62,radius=46,startDeg=210,sweepDeg=120;
  const toRad=d=>d*Math.PI/180;
  const nx=cx+(radius-7)*Math.cos(toRad(startDeg+(pct/100)*sweepDeg));
  const ny=cy+(radius-7)*Math.sin(toRad(startDeg+(pct/100)*sweepDeg));
  const x1=cx+radius*Math.cos(toRad(startDeg)),y1=cy+radius*Math.sin(toRad(startDeg));
  const x2=cx+radius*Math.cos(toRad(330)),y2=cy+radius*Math.sin(toRad(330));
  const fa=startDeg+(pct/100)*sweepDeg;
  const fx=cx+radius*Math.cos(toRad(fa)),fy=cy+radius*Math.sin(toRad(fa));
  const la=(pct/100)*sweepDeg>180?1:0;
  return(
    <div style={{textAlign:"center"}}>
      <svg viewBox="0 0 140 108" width="120">
        <path d={`M${x1},${y1} A${radius},${radius},0,0,1,${x2},${y2}`} fill="none" stroke="#eee" strokeWidth="10" strokeLinecap="round"/>
        {pct>0&&<path d={`M${x1},${y1} A${radius},${radius},0,${la},1,${fx},${fy}`} fill="none" stroke={r.col} strokeWidth="10" strokeLinecap="round"/>}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#333" strokeWidth="2" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="4" fill="#333"/>
        <text x={cx} y="86" textAnchor="middle" fontSize="20" fontWeight="600" fill={r.col}>{pct}</text>
        <text x={cx} y="100" textAnchor="middle" fontSize="9" fontWeight="500" fill={r.col}>{r.text}</text>
      </svg>
    </div>
  );
}

const SHAP_TOOLTIPS = {
  TransactionAmt: "The dollar amount of this transaction. Unusually high amounts relative to the cardholder's norm can push the fraud score up.",
  ProductCD: "The channel through which the transaction was made — e.g. web purchase or card payment. Some channels are more commonly associated with fraud.",
  card4: "The card network (e.g. Visa, Mastercard). Certain networks appear more frequently in fraudulent transactions in the training data.",
  card6: "Whether the card is a credit or debit card. The model learned that one type is more associated with fraud in this dataset.",
  dist1: "The distance in km between the billing address and where the transaction occurred. Large distances can indicate the card is being used away from its owner.",
};

function ShapTooltip({featureKey}){
  const [vis, setVis] = useState(false);
  const tip = SHAP_TOOLTIPS[featureKey];
  if(!tip) return null;
  return(
    <span style={{position:"relative",display:"inline-flex",alignItems:"center",marginLeft:5}}>
      <span onMouseEnter={()=>setVis(true)} onMouseLeave={()=>setVis(false)}
        style={{width:15,height:15,borderRadius:"50%",background:"#cbd5e1",color:"#475569",fontSize:10,fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center",cursor:"default",flexShrink:0,lineHeight:1}}>?</span>
      {vis&&(
        <span style={{position:"absolute",left:"50%",bottom:"calc(100% + 6px)",transform:"translateX(-50%)",background:"#1e293b",color:"#f8fafc",fontSize:11,lineHeight:1.5,padding:"7px 10px",borderRadius:7,width:220,zIndex:100,boxShadow:"0 4px 12px rgba(0,0,0,0.18)",pointerEvents:"none"}}>
          {tip}
          <span style={{position:"absolute",left:"50%",top:"100%",transform:"translateX(-50%)",borderWidth:5,borderStyle:"solid",borderColor:"#1e293b transparent transparent transparent",display:"block",width:0,height:0}}/>
        </span>
      )}
    </span>
  );
}

function riskLabel(v, max) {
  const r = Math.abs(v) / max;
  const dir = v > 0 ? "increases" : "decreases";
  const strength = r > 0.66 ? "strongly" : r > 0.33 ? "moderately" : "slightly";
  return `${strength} ${dir} risk`;
}

function ShapPanel({tx}){
  const entries=getShapEntries(tx);
  const maxV=Math.max(...entries.map(e=>Math.abs(e.shap)),0.01);
  return(
    <div>
      <div style={{background:"#f0f7ff",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:12,color:"#1e40af",lineHeight:1.6}}>
        <strong>How much did each feature shift the score away from average?</strong> The model has a baseline — the average fraud score across all transactions. SHAP measures how much each feature in <em>this specific transaction</em> pushed the score above or below that average. A card type that is unusually common in fraud, for example, would push the score up. Each bar shows the size of that push. The numbers are on the same scale and can be compared directly across rows.
      </div>
      <div style={{display:"flex",gap:16,fontSize:11,color:"#888",marginBottom:10}}>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:12,height:12,borderRadius:2,background:"#c0392b",display:"inline-block"}}/>Raises fraud score</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:12,height:12,borderRadius:2,background:"#2563eb",display:"inline-block"}}/>Lowers fraud score</span>
      </div>
      {entries.map((e,i)=>{
        const pct=Math.min(Math.abs(e.shap)/maxV*100,100);
        const isPos=e.shap>0;
        return(
          <div key={i} style={{marginBottom:10,padding:"8px 10px",background:"#f8fafc",borderRadius:6}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:5,flexWrap:"wrap",gap:4}}>
              <span style={{display:"inline-flex",alignItems:"center",color:"#1e293b",fontWeight:600}}>{e.label.split(" (")[0]}<ShapTooltip featureKey={e.key}/></span>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:11,fontStyle:"italic",color:isPos?"#c0392b":"#2563eb"}}>{riskLabel(e.shap, maxV)}</span>
                <span style={{color:"#94a3b8"}}>Value: <strong style={{color:"#334155"}}>{e.value}</strong></span>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1,height:18,background:"#e2e8f0",borderRadius:4,overflow:"hidden",position:"relative"}}>
                <div style={{position:"absolute",left:isPos?"50%":"auto",right:isPos?"auto":"50%",width:`${pct/2}%`,height:"100%",background:isPos?"#c0392b":"#2563eb",opacity:0.8,borderRadius:isPos?"0 4px 4px 0":"4px 0 0 4px"}}/>
                <div style={{position:"absolute",left:"50%",top:0,width:1,height:"100%",background:"#94a3b8"}}/>
              </div>
              <span style={{fontSize:11,fontWeight:700,color:isPos?"#c0392b":"#2563eb",minWidth:54,textAlign:"right"}}>{isPos?"+":""}{e.shap.toFixed(3)}</span>
            </div>
          </div>
        );
      })}
      <div style={{fontSize:11,color:"#94a3b8",fontStyle:"italic",marginTop:4}}>Values computed using TreeSHAP — exact contributions from the trained XGBoost model.</div>
    </div>
  );
}

function LimePanel({tx}){
  const entries=getLimeEntries(tx);
  const maxV=Math.max(...entries.map(e=>Math.abs(e.v)),0.01);
  return(
    <div>
      <div style={{background:"#f0fdf4",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:12,color:"#166534",lineHeight:1.6}}>
        <strong>Which rules about this transaction mattered most?</strong> LIME works differently from SHAP. Rather than measuring exact feature contributions, it asks: <em>"What simple rules best explain why the model scored this transaction the way it did?"</em> — for example, "amount was above $125" or "distance data was missing". It then fits a local approximation around this transaction and weights each rule by how strongly it influenced the prediction. <strong>These weights are not on the same scale as SHAP</strong> — they reflect rule importance within this local approximation, not departure from a global baseline.
      </div>
      <div style={{display:"flex",gap:16,fontSize:11,color:"#888",marginBottom:10}}>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:12,height:10,borderRadius:2,background:"#c0392b",display:"inline-block"}}/>Condition raises risk</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:12,height:10,borderRadius:2,background:"#1a7a4a",display:"inline-block"}}/>Condition lowers risk</span>
      </div>
      {entries.map((e,i)=>{
        const pct=Math.min(Math.abs(e.v)/maxV*90,90);
        const isPos=e.v>0;
        const col=isPos?"#c0392b":"#1a7a4a";
        const bgCol=isPos?"#fca5a5":"#86efac";
        return(
          <div key={i} style={{marginBottom:10,padding:"8px 10px",background:"#f8fafc",borderRadius:6}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:5,flexWrap:"wrap",gap:4}}>
              <div>
                <div style={{fontWeight:600,color:"#1e293b",marginBottom:2}}>{e.annotation||e.rule}</div>
                <div style={{color:"#94a3b8",fontFamily:"monospace",fontSize:10}}>{e.rule}</div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:11,fontStyle:"italic",color:col}}>{riskLabel(e.v, maxV)}</span>
                <span style={{fontSize:11,fontWeight:700,color:col,minWidth:58,textAlign:"right"}}>{isPos?"+":""}{e.v.toFixed(4)}</span>
              </div>
            </div>
            <div style={{flex:1,height:14,background:"#e2e8f0",borderRadius:4,overflow:"hidden",position:"relative"}}>
              <div style={{position:"absolute",left:0,width:`${pct}%`,height:"100%",background:bgCol,borderRadius:4}}/>
              <div style={{position:"absolute",top:0,bottom:0,left:`${pct}%`,width:3,background:col,borderRadius:2}}/>
            </div>
          </div>
        );
      })}
      <div style={{marginTop:8,fontSize:11,color:"#94a3b8",fontStyle:"italic"}}>LIME approximates the model locally — values reflect this transaction specifically, not global model behaviour.</div>
    </div>
  );
}

function LLMPanel({tx,score}){
  const [text,setText]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [done,setDone]=useState(false);
  const [showPrompt,setShowPrompt]=useState(false);

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
      <div style={{background:"#faf5ff",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:12,color:"#6b21a8",lineHeight:1.6}}>
        <strong>AI-generated narrative.</strong> An AI assistant reads the transaction details and writes a plain-language case summary — similar to how an experienced analyst might brief a colleague. It highlights what stands out and recommends an action.
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <Badge label="llama-3.1-8b-instant" col="#e65c00" bg="#fff3e0"/>
        <Badge label="Groq API" col="#2980b9" bg="#e8f0fe"/>
        <button onClick={()=>setShowPrompt(p=>!p)} style={{marginLeft:"auto",padding:"2px 10px",borderRadius:6,border:"1px solid #ddd6fe",background:"#f5f3ff",color:"#7c3aed",fontSize:11,cursor:"pointer"}}>{showPrompt?"Hide prompt":"View prompt ↗"}</button>
      </div>
      {showPrompt&&(
        <div style={{background:"#f5f3ff",border:"1px solid #ddd6fe",borderRadius:8,padding:"10px 12px",marginBottom:12,fontSize:11,color:"#4c1d95",fontFamily:"monospace",whiteSpace:"pre-wrap",lineHeight:1.6}}>
          {prompt}
        </div>
      )}
      {!done&&!loading&&<button onClick={run} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #6b3fa0",background:"#f9f4ff",color:"#6b3fa0",fontSize:13,cursor:"pointer",fontWeight:500}}>Generate narrative ↗</button>}
      {loading&&<div style={{display:"flex",alignItems:"center",gap:8,color:"#888",fontSize:13}}><div style={{width:13,height:13,border:"2px solid #ccc",borderTopColor:"#6b3fa0",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Generating…</div>}
      {error&&<div style={{color:"#c0392b",fontSize:13,padding:"8px 12px",background:"#fdecea",borderRadius:6}}>{error}</div>}
      {text&&<div><div style={{fontSize:13,lineHeight:1.85,color:"#1e293b",whiteSpace:"pre-wrap"}}>{text}</div><button onClick={run} style={{marginTop:8,padding:"4px 12px",borderRadius:6,border:"1px solid #ddd",background:"#fafafa",color:"#888",fontSize:12,cursor:"pointer"}}>↺ Regenerate</button></div>}
    </div>
  );
}

function CounterfactualPanel({tx}){
  const shap=REAL_EXPLANATIONS[tx.id]?.shap??{};
  const riskDrivers=Object.entries(shap).filter(([k,v])=>v>0&&k!=="addr1").sort((a,b)=>b[1]-a[1]);
  const advice={
    TransactionAmt:{required:"Lower transaction amount",feasible:false,reason:"Cannot be changed retroactively"},
    ProductCD:     {required:"Different transaction channel",feasible:false,reason:"Cannot be changed retroactively"},
    card4:         {required:"Verify card ownership with issuer",feasible:true,reason:"Analyst can contact card issuer"},
    card6:         {required:"Verify card type matches account",feasible:true,reason:"Analyst can check account records"},
    dist1:         {required:"Cardholder confirms travel or foreign purchase",feasible:true,reason:"Analyst can contact cardholder"},
  };
  if(!riskDrivers.length)return<div style={{fontSize:13,color:"#888",padding:"12px 0"}}>No risk-increasing features for this transaction.</div>;
  return(
    <div>
      <div style={{background:"#eff6ff",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:12,color:"#1e40af",lineHeight:1.6}}>
        <strong>What-if analysis.</strong> This view asks: if this transaction had different characteristics, would it still be flagged? It identifies which risk factors could realistically be verified or disputed — helping you decide whether to escalate, block, or approve.
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead>
          <tr style={{background:"#f1f5f9"}}>
            {["Feature","Current value","What would need to change","Analyst can act?"].map(h=>(
              <th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#475569",borderBottom:"2px solid #e2e8f0",whiteSpace:"nowrap"}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {riskDrivers.slice(0,5).map(([k,v],i)=>{
            const a=advice[k]||{required:"No clear counterfactual",feasible:false,reason:""};
            const valMap={TransactionAmt:`$${tx.amount.toFixed(2)}`,ProductCD:CHANNEL_LABELS[tx.product]||tx.product,card4:tx.network,card6:tx.cardType,dist1:tx.dist!==null?`${tx.dist} km`:'N/A'};
            return(
              <tr key={i} style={{background:i%2===0?"#fff":"#f8fafc"}}>
                <td style={{padding:"8px 10px",fontWeight:500,color:"#1e293b"}}>{FEAT_LABELS[k]||k}</td>
                <td style={{padding:"8px 10px",color:"#64748b"}}>{valMap[k]}</td>
                <td style={{padding:"8px 10px",color:"#2563eb"}}>{a.required}</td>
                <td style={{padding:"8px 10px"}}>
                  <span style={{padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:600,background:a.feasible?"#dcfce7":"#f1f5f9",color:a.feasible?"#15803d":"#94a3b8"}}>{a.feasible?"✓ Yes":"✗ No"}</span>
                  {a.reason&&<div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{a.reason}</div>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PeersPanel({tx}){
  const pool = PEER_POOLS[tx.id] || [];
  const others = pool.map(p=>{
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
      <div style={{background:"#f0fdf4",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:12,color:"#166534",lineHeight:1.6}}>
        <strong>Similar past cases.</strong> Shows other transactions from the dataset that share the most characteristics with this alert. If similar cases were previously confirmed as fraud, that raises the likelihood here too — the same reasoning an experienced investigator uses when pattern-matching against known cases. <strong>Click any case to expand it.</strong>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {[["confirmed_fraud","#c0392b","#fdecea"],["legitimate","#1a7a4a","#e8f7ee"]].map(([k,col,bg])=>(
          <div key={k} style={{flex:1,background:bg,borderRadius:8,padding:"10px",textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:700,color:col}}>{others.filter(p=>p.groundTruth===k).length}</div>
            <div style={{fontSize:11,color:col}}>{TRUTH_CFG[k].icon} {TRUTH_CFG[k].label}</div>
          </div>
        ))}
        <div style={{flex:1,background:"#f1f5f9",borderRadius:8,padding:"10px",textAlign:"center"}}>
          <div style={{fontSize:24,fontWeight:700,color:"#475569"}}>{others.length>0?Math.round(fraudCount/others.length*100):0}%</div>
          <div style={{fontSize:11,color:"#64748b"}}>Fraud rate in peers</div>
        </div>
      </div>
      {others.map((p,i)=>{
        const tc=TRUTH_CFG[p.groundTruth];const ps=xgbScore(p);const pr=riskLevel(ps);
        const isOpen=expanded===p.id;
        const flags=getRiskFlags(p,ps);
        return(
          <div key={i} style={{marginBottom:6,borderRadius:8,border:`1px solid ${isOpen?"#93c5fd":"#e2e8f0"}`,overflow:"hidden"}}>
            <div onClick={()=>setExpanded(isOpen?null:p.id)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:isOpen?"#eff6ff":"#f8fafc",cursor:"pointer"}}>
              <div style={{width:38,textAlign:"center"}}>
                <div style={{fontSize:12,fontWeight:700,color:"#475569"}}>{p.sim}%</div>
                <div style={{fontSize:9,color:"#94a3b8"}}>similar</div>
              </div>
              <div style={{width:2,height:32,background:"#e2e8f0",flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:500,color:"#1e293b"}}>TXN {p.id} · ${p.amount.toFixed(2)}</div>
                <div style={{fontSize:11,color:"#64748b"}}>{p.network} {p.cardType} · {CHANNEL_LABELS[p.product]||p.product} · Score: <strong style={{color:pr.col}}>{Math.round(ps*100)}</strong></div>
              </div>
              <Badge label={`${tc.icon} ${tc.label}`} col={tc.col} bg={tc.bg}/>
              <span style={{fontSize:12,color:"#94a3b8",marginLeft:4}}>{isOpen?"▲":"▼"}</span>
            </div>
            {isOpen&&(
              <div style={{padding:"10px 14px",background:"#fff",borderTop:"1px solid #e2e8f0",fontSize:12}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
                  {[
                    ["Amount",`$${p.amount.toFixed(2)}`],
                    ["Channel",CHANNEL_LABELS[p.product]||p.product],
                    ["Network",p.network],
                    ["Card type",p.cardType],
                    ["Distance",p.dist!==null?`${p.dist} km`:'Not available'],
                  ].map(([label,val])=>(
                    <div key={label} style={{background:"#f8fafc",borderRadius:5,padding:"5px 8px"}}>
                      <div style={{fontSize:10,color:"#94a3b8",fontWeight:600}}>{label}</div>
                      <div style={{fontSize:12,color:"#1e293b",fontWeight:500}}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",marginBottom:5}}>Risk flags</div>
                <div style={{display:"flex",flexDirection:"column",gap:3}}>
                  {flags.map((f,fi)=>{
                    const sc=SEV_CFG[f.severity];
                    return(
                      <div key={fi} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",background:sc.bg,borderRadius:5}}>
                        <span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,color:sc.col,minWidth:36}}>{f.code}</span>
                        <span style={{fontSize:11,color:"#1e293b",flex:1}}>{f.label}</span>
                        <span style={{fontSize:9,fontWeight:700,color:sc.col,padding:"1px 6px",borderRadius:8,background:"#fff"}}>{f.severity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TxnPanel({tx}){
  const score=xgbScore(tx);
  const flags=getRiskFlags(tx,score);
  const fields=[
    {label:"Transaction amount (USD)",value:`$${tx.amount.toFixed(2)}`},
    {label:"Channel (ProductCD)",value:CHANNEL_LABELS[tx.product]||tx.product},
    {label:"Card network (card4)",value:tx.network.charAt(0).toUpperCase()+tx.network.slice(1)},
    {label:"Card type (card6)",value:tx.cardType.charAt(0).toUpperCase()+tx.cardType.slice(1)},
    {label:"Distance (dist1)",value:tx.dist!==null?`${tx.dist} km`:'Not available'},
  ];
  return(
    <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,padding:"16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div>
          <div style={{fontSize:10,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>Transaction ID</div>
          <div style={{fontSize:16,fontWeight:700,color:"#1e293b"}}>{tx.id}</div>
        </div>
        <Gauge score={score}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14}}>
        {fields.map(f=>(
          <div key={f.label} style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",background:"#f8fafc",borderRadius:5}}>
            <span style={{fontSize:10,color:"#94a3b8",fontWeight:600}}>{f.label}</span>
            <span style={{fontSize:12,color:"#1e293b",fontWeight:500}}>{f.value}</span>
          </div>
        ))}
      </div>
      <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>Triggered risk flags</div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {flags.map((f,i)=>{
          const sc=SEV_CFG[f.severity];
          return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",background:sc.bg,borderRadius:5,border:`1px solid ${sc.col}22`}}>
              <span style={{fontSize:9,fontFamily:"monospace",fontWeight:700,color:sc.col,minWidth:36}}>{f.code}</span>
              <span style={{fontSize:11,color:"#1e293b",flex:1}}>{f.label}</span>
              <span style={{fontSize:9,fontWeight:700,color:sc.col,padding:"1px 6px",borderRadius:8,background:"#fff",border:`1px solid ${sc.col}44`}}>{f.severity}</span>
            </div>
          );
        })}
      </div>
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
    <div style={{padding:"12px 14px",background:"#f0fdf4",borderRadius:8,border:"1px solid #bbf7d0"}}>
      <div style={{fontSize:12,color:"#166534",fontWeight:600,marginBottom:4}}>✓ Initial classification recorded</div>
      <div style={{fontSize:11,color:"#166534"}}>
        Classification: <strong>{TRUTH_CFG[saved[key].classification]?.label||saved[key].classification}</strong> · Confidence: <strong>{saved[key].confidence}/7</strong>
      </div>
    </div>
  );
  const allDone=cls&&conf;
  return(
    <div style={{padding:"14px",background:"#fafafa",borderRadius:8,border:"1px solid #e8e8e8"}}>
      <div style={{fontSize:13,fontWeight:600,color:"#1e293b",marginBottom:12}}>
        Step 1 — Make your initial classification
        <span style={{fontSize:11,fontWeight:400,color:"#64748b",marginLeft:8}}>Based on the transaction details and risk flags only</span>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,color:"#475569",marginBottom:6,fontWeight:500}}>How would you classify this transaction?</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[{key:"confirmed_fraud",label:"Confirmed fraud",col:"#c0392b",bg:"#fdecea",icon:"⚠"},{key:"suspected",label:"Suspected fraud",col:"#8e44ad",bg:"#f5eeff",icon:"?"},{key:"legitimate",label:"Legitimate",col:"#1a7a4a",bg:"#e8f7ee",icon:"✓"}].map(o=>(
            <button key={o.key} onClick={()=>setCls(o.key)} style={{padding:"8px 14px",borderRadius:10,border:`2px solid ${cls===o.key?o.col:"#ddd"}`,background:cls===o.key?o.bg:"#fff",color:cls===o.key?o.col:"#888",fontSize:12,fontWeight:cls===o.key?600:400,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
              <span>{o.icon}</span>{o.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,color:"#475569",marginBottom:6,fontWeight:500}}>Confidence in your classification (1 = not confident · 7 = very confident)</div>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          <span style={{fontSize:10,color:"#bbb",minWidth:60}}>Not confident</span>
          {[1,2,3,4,5,6,7].map(n=>(<button key={n} onClick={()=>setConf(n)} style={{width:30,height:30,borderRadius:6,border:`1px solid ${conf===n?"#2980b9":"#ddd"}`,background:conf===n?"#e8f0fe":"#fff",color:conf===n?"#2980b9":"#888",fontSize:12,cursor:"pointer",fontWeight:conf===n?700:400}}>{n}</button>))}
          <span style={{fontSize:10,color:"#bbb",minWidth:60}}>Very confident</span>
        </div>
      </div>
      <button onClick={()=>onSave(key,{classification:cls,confidence:conf,latency_s:Math.round((Date.now()-start)/1000),transaction_id:txId})}
        disabled={!allDone}
        style={{padding:"8px 20px",borderRadius:8,border:`1px solid ${allDone?"#2980b9":"#ccc"}`,background:allDone?"#2980b9":"#f5f5f5",color:allDone?"#fff":"#aaa",fontSize:12,cursor:allDone?"pointer":"default",fontWeight:600}}>
        Confirm &amp; unlock explanations →
      </button>
      {!allDone&&<span style={{fontSize:11,color:"#bbb",marginLeft:10}}>Complete both fields to continue</span>}
    </div>
  );
}

function ExpRatingWidget({txId,expTab,saved,onSave}){
  const key=`exprating-${txId}-${expTab}`;
  const [trust,setTrust]=useState(null);
  const [load,setLoad]=useState(null);
  const [tabStart]=useState(()=>Date.now());
  useEffect(()=>{setTrust(null);setLoad(null);},[txId,expTab]);
  const allDone=trust&&load;
  const alreadySaved=!!saved[key];

  const ScaleRow=({label,value,setValue})=>(
    <div style={{marginBottom:14}}>
      <div style={{fontSize:12,color:"#334155",fontWeight:500,marginBottom:8,lineHeight:1.5}}>{label}</div>
      <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,color:"#94a3b8",minWidth:80}}>Strongly disagree</span>
        {[1,2,3,4,5].map(n=>(
          <button key={n} onClick={()=>setValue(n)}
            style={{width:32,height:32,borderRadius:6,border:`1px solid ${value===n?"#2980b9":"#ddd"}`,background:value===n?"#e8f0fe":"#fff",color:value===n?"#2980b9":"#888",fontSize:12,cursor:"pointer",fontWeight:value===n?700:400}}>
            {n}
          </button>
        ))}
        <span style={{fontSize:10,color:"#94a3b8",minWidth:72}}>Strongly agree</span>
        <button onClick={()=>setValue("dk")}
          style={{marginLeft:8,padding:"4px 10px",borderRadius:6,border:`1px solid ${value==="dk"?"#7c3aed":"#ddd"}`,background:value==="dk"?"#ede9fe":"#fff",color:value==="dk"?"#7c3aed":"#888",fontSize:11,cursor:"pointer",fontWeight:value==="dk"?600:400}}>
          I don't know
        </button>
      </div>
    </div>
  );

  return(
    <div style={{marginTop:12,padding:"12px 14px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0"}}>
      <div style={{fontSize:11,fontWeight:600,color:"#475569",marginBottom:12}}>Rate this explanation — {expTab}</div>
      {alreadySaved?(
        <div style={{fontSize:12,color:"#166534",fontWeight:500}}>
          ✓ Rated: Trust <strong>{saved[key].trust}</strong> · Mental load <strong>{saved[key].mental_load}</strong>
        </div>
      ):(
        <>
          <ScaleRow
            label="1. This explanation makes it easier to understand how the AI makes its decisions."
            value={load}
            setValue={setLoad}
          />
          <ScaleRow
            label="2. This explanation increases my trust in the AI's assessment of whether a transaction is fraudulent."
            value={trust}
            setValue={setTrust}
          />
          <div style={{display:"flex",alignItems:"center",gap:10,marginTop:4}}>
            <button onClick={()=>onSave(key,{trust,mental_load:load,exp:expTab,transaction_id:txId,tab_time_s:Math.round((Date.now()-tabStart)/1000)})}
              disabled={!allDone}
              style={{padding:"6px 16px",borderRadius:7,border:`1px solid ${allDone?"#2980b9":"#ccc"}`,background:allDone?"#e8f0fe":"#f5f5f5",color:allDone?"#2980b9":"#aaa",fontSize:12,cursor:allDone?"pointer":"default",fontWeight:500}}>
              Save rating →
            </button>
            {!allDone&&<span style={{fontSize:11,color:"#bbb"}}>Answer both questions to save</span>}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryWidget({txId,initialClass,saved,onSave,txStart}){
  const key=`summary-${txId}`;
  const [reclassify,setReclassify]=useState(null);
  const [bestExp,setBestExp]=useState(null);
  useEffect(()=>{setReclassify(null);setBestExp(null);},[txId]);
  if(saved[key])return(
    <div style={{padding:"12px 14px",background:"#f0fdf4",borderRadius:8,border:"1px solid #bbf7d0"}}>
      <div style={{fontSize:12,color:"#166534",fontWeight:600}}>✓ Summary evaluation recorded for this transaction</div>
    </div>
  );
  const allDone=reclassify&&bestExp;
  const tc=initialClass?TRUTH_CFG[initialClass]:null;
  return(
    <div style={{padding:"14px",background:"#f2eef9",borderRadius:8,border:"1px solid #ddd6fe"}}>
      <div style={{fontSize:13,fontWeight:600,color:"#5b21b6",marginBottom:12}}>Step 3 — Reflect on the explanations</div>
      {tc&&<div style={{fontSize:11,color:"#64748b",marginBottom:12}}>Your initial classification: <Badge label={`${tc.icon} ${tc.label}`} col={tc.col} bg={tc.bg}/></div>}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:500,color:"#374151",marginBottom:6}}>Has your classification changed after reviewing the explanations?</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[{key:"no_change",label:"No change",col:"#475569",bg:"#f1f5f9",icon:"→"},{key:"confirmed_fraud",label:"Confirmed fraud",col:"#c0392b",bg:"#fdecea",icon:"⚠"},{key:"suspected",label:"Suspected fraud",col:"#8e44ad",bg:"#f5eeff",icon:"?"},{key:"legitimate",label:"Legitimate",col:"#1a7a4a",bg:"#e8f7ee",icon:"✓"}].map(o=>(
            <button key={o.key} onClick={()=>setReclassify(o.key)} style={{padding:"6px 12px",borderRadius:10,border:`2px solid ${reclassify===o.key?o.col:"#ddd"}`,background:reclassify===o.key?o.bg:"#fff",color:reclassify===o.key?o.col:"#888",fontSize:12,fontWeight:reclassify===o.key?600:400,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
              <span>{o.icon}</span>{o.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:500,color:"#374151",marginBottom:6}}>Which explanation type was most helpful for your decision?</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {ALL_EXP_TABS.map(t=>(
            <button key={t} onClick={()=>setBestExp(t)} style={{padding:"5px 10px",borderRadius:14,border:`1px solid ${bestExp===t?"#7b5ea7":"#ddd"}`,background:bestExp===t?"#ede9fe":"#fff",color:bestExp===t?"#7b5ea7":"#888",fontSize:11,cursor:"pointer",fontWeight:bestExp===t?600:400}}>{t}</button>
          ))}
        </div>
      </div>
      <button onClick={()=>onSave(key,{reclassification:reclassify,most_helpful_explanation:bestExp,transaction_id:txId,initial_classification:initialClass,total_txn_time_s:Math.round((Date.now()-txStart)/1000)})}
        disabled={!allDone}
        style={{padding:"8px 20px",borderRadius:8,border:`1px solid ${allDone?"#7b5ea7":"#ccc"}`,background:allDone?"#7b5ea7":"#f5f5f5",color:allDone?"#fff":"#aaa",fontSize:12,cursor:allDone?"pointer":"default",fontWeight:600}}>
        Save &amp; complete this transaction →
      </button>
      {!allDone&&<span style={{fontSize:11,color:"#bbb",marginLeft:10}}>Complete all fields to save</span>}
    </div>
  );
}

const EXP_GROUPS=[
  {label:"Explanation methods",col:"#2980b9",bg:"#e8f0fe",
   tabs:[{id:"shap",label:"SHAP"},{id:"lime",label:"LIME"},{id:"llm",label:"LLM"},{id:"counterfactual",label:"Counterfactual"},{id:"peers",label:"Similar Cases (CBR)"}]},
];

function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}

export default function App(){
  const [selected,setSelected]=useState(0);
  const [saved,setSaved]=useState({});
  const [showMeta,setShowMeta]=useState(false);
  const participantId=useState(()=>`P-${Date.now().toString(36).toUpperCase()}`)[0];

  const [txnOrder]=useState(()=>shuffle(ALL_TXN));
  const [tabOrder]=useState(()=>shuffle(EXP_TAB_IDS));
  const [expTab,setExpTab]=useState(()=>tabOrder[0]);
  const [txStartTimes,setTxStartTimes]=useState({[0]:Date.now()});

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
  const goToNextTab=()=>{ if(!isLastTab) setExpTab(tabOrder[currentTabIdx+1]); };

  const handleSave=(k,d)=>{
    setSaved(s=>({...s,[k]:d}));
    fetch(SHEET_URL,{method:"POST",body:JSON.stringify({participant_id:participantId,key:k,...d})}).catch(()=>{});
    if(k.startsWith("exprating-")&&!isLastTab) goToNextTab();
  };

  const completedCount=txnOrder.filter(t=>saved[`summary-${t.id}`]).length;

  return(
    <div style={{fontFamily:"system-ui,sans-serif",padding:"1rem",maxWidth:1300,margin:"0 auto"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{marginBottom:12,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{fontSize:18,fontWeight:700,color:"#1e293b"}}>Fraud Detection — XAI Study</div>
        <button onClick={()=>setShowMeta(m=>!m)} style={{padding:"2px 8px",borderRadius:6,border:"1px solid #ddd",background:"#f9f9f9",color:"#bbb",fontSize:10,cursor:"pointer"}}>{showMeta?"hide":"···"}</button>
        {showMeta&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <Badge label="IEEE-CIS Fraud Detection (Kaggle, 2019)" col="#2980b9" bg="#e8f0fe"/>
          <Badge label="XGBoost · real TreeSHAP & LIME" col="#555" bg="#f0f0f0"/>
          <Badge label="llama-3.1-8b-instant · Groq" col="#e65c00" bg="#fff3e0"/>
        </div>}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:11,color:"#64748b"}}>{completedCount}/4 transactions completed</span>
          <span style={{fontSize:11,color:"#aaa"}}>ID: <strong style={{color:"#555",fontFamily:"monospace"}}>{participantId}</strong></span>
        </div>
      </div>

      <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
        <div style={{fontSize:10,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Select transaction to review</div>
        <div style={{display:"flex",gap:8}}>
          {txnOrder.map((t,i)=>{
            const done=!!saved[`summary-${t.id}`];
            const isCurrent=selected===i;
            return(
              <button key={t.id} onClick={()=>{setSelected(i);setExpTab(tabOrder[0]);setTxStartTimes(s=>({...s,[i]:s[i]??Date.now()}));}}
                style={{flex:1,padding:"10px 8px",borderRadius:8,border:`2px solid ${isCurrent?"#2980b9":done?"#1a7a4a":"#e0e0e0"}`,background:isCurrent?"#eff6ff":done?"#f0fdf4":"#fafafa",cursor:"pointer",textAlign:"center"}}>
                <div style={{fontSize:14,fontWeight:700,color:isCurrent?"#2980b9":done?"#1a7a4a":"#555"}}>TXN {i+1}</div>
                <div style={{fontSize:10,color:isCurrent?"#2980b9":done?"#1a7a4a":"#94a3b8",marginTop:2}}>{done?"✓ Done":isCurrent?"In progress":"Not started"}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{background:"#fefce8",border:"1px solid #fde68a",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#78350f",lineHeight:1.6}}>
        <strong>How to complete each transaction:</strong> (1) Review the details and risk flags on the left → (2) Make your initial classification to unlock explanations → (3) Explore and rate all 5 explanation types → (4) Complete the final reflection at the bottom.
      </div>

      <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:12,alignItems:"start"}}>
        <TxnPanel tx={tx}/>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <ClassifyWidget txId={tx.id} saved={saved} onSave={handleSave}/>
          <div style={{background:"#fff",border:`1px solid ${classified?"#e8e8e8":"#f1f5f9"}`,borderRadius:10,padding:"14px",position:"relative"}}>
            {!classified&&(
              <div style={{position:"absolute",inset:0,background:"rgba(248,250,252,0.92)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10}}>
                <div style={{textAlign:"center",color:"#94a3b8"}}>
                  <div style={{fontSize:28,marginBottom:8}}>🔒</div>
                  <div style={{fontSize:13,fontWeight:600}}>Make your initial classification first</div>
                  <div style={{fontSize:11,marginTop:4}}>Explanations unlock after Step 1 is complete</div>
                </div>
              </div>
            )}
            <div style={{fontSize:10,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Step 2 — Explore explanations</div>
            {EXP_GROUPS.map(g=>(
              <div key={g.label} style={{marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontSize:10,fontWeight:600,color:g.col,minWidth:140,flexShrink:0}}>{g.label}</span>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {g.tabs.filter(t=>tabOrder.includes(t.id)).sort((a,b)=>tabOrder.indexOf(a.id)-tabOrder.indexOf(b.id)).map(t=>{
                      const rated=!!saved[`exprating-${tx.id}-${TAB_ID_TO_LABEL[t.id]||t.id}`];
                      return(
                        <button key={t.id} onClick={()=>setExpTab(t.id)}
                          style={{padding:"3px 10px",fontSize:11,border:`1px solid ${expTab===t.id?g.col:rated?"#1a7a4a":"#e0e0e0"}`,borderRadius:14,background:expTab===t.id?g.bg:rated?"#f0fdf4":"#fff",color:expTab===t.id?g.col:rated?"#1a7a4a":"#888",cursor:"pointer",fontWeight:expTab===t.id?600:400}}>
                          {rated?"✓ ":""}{t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div style={{borderTop:"1px solid #f0f0f0",paddingTop:14,marginTop:6}}>
              {expTab==="shap"           &&<ShapPanel tx={tx}/>}
              {expTab==="lime"           &&<LimePanel tx={tx}/>}
              {expTab==="llm"            &&<LLMPanel key={tx.id} tx={tx} score={score}/>}
              {expTab==="counterfactual" &&<CounterfactualPanel tx={tx}/>}
              {expTab==="peers"          &&<PeersPanel tx={tx}/>}
              <ExpRatingWidget txId={tx.id} expTab={TAB_ID_TO_LABEL[expTab]||expTab} saved={saved} onSave={handleSave}/>
            </div>
          </div>
          {classified&&!allExpRated&&(
            <div style={{padding:"10px 14px",background:"#fefce8",border:"1px solid #fde68a",borderRadius:8,fontSize:12,color:"#92400e"}}>
              📋 Rate all 5 explanations in Step 2 to unlock the final evaluation.
              <span style={{marginLeft:6,color:"#b45309",fontWeight:600}}>{ratedCount}/5 rated</span>
            </div>
          )}
          {classified&&allExpRated&&(
            <SummaryWidget txId={tx.id} initialClass={initialClass} saved={saved} onSave={handleSave} txStart={txStartTimes[selected]??Date.now()}/>
          )}
          {summarised&&(
            <div style={{padding:"12px 14px",background:"#eff6ff",borderRadius:8,border:"1px solid #bfdbfe",fontSize:13,color:"#1e40af",textAlign:"center"}}>
              ✓ Transaction {selected+1} complete.{selected<ALL_TXN.length-1?" Click the next transaction above to continue.":" You have completed all 4 transactions. Thank you!"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}