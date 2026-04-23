import { useState, useEffect } from "react";

const ALL_TXN = [
  { id:"3053108", amount:152.51, product:"C", network:"visa",       cardType:"credit", addr:null, dist:null, groundTruth:"confirmed_fraud" },
  { id:"3354853", amount:25.95,  product:"W", network:"visa",       cardType:"debit",  addr:324,  dist:8,    groundTruth:"legitimate"      },
  { id:"3492704", amount:230.18, product:"C", network:"visa",       cardType:"debit",  addr:null, dist:null, groundTruth:"confirmed_fraud" },
  { id:"3557070", amount:29.00,  product:"W", network:"visa",       cardType:"debit",  addr:325,  dist:8,    groundTruth:"legitimate"      },
];

const REAL_EXPLANATIONS = {
  "3053108":{ score:0.0096, shap:{TransactionAmt:-0.4179,ProductCD:0.3726,card4:-0.3341,card6:-2.195,addr1:-0.5997,dist1:-1.4414}, lime:{"card6 <= 1.00":-0.1449,"ProductCD <= 3.00":0.1068,"dist1 > 5.00":-0.0815,"184.00 < addr1 <= 272.00":0.0237,"card4 <= 2.00":-0.0144,"68.77 < TransactionAmt <= 125.00":0.001} },
  "3354853":{ score:0.8778, shap:{TransactionAmt:-0.6999,ProductCD:1.7578,card4:0.1166,card6:0.4982,addr1:-0.0035,dist1:0.3187}, lime:{"card6 <= 1.00":-0.1348,"ProductCD <= 3.00":0.1209,"dist1 <= -1.00":0.0635,"addr1 <= 184.00":-0.0451,"card4 <= 2.00":-0.0102,"68.77 < TransactionAmt <= 125.00":0.0068} },
  "3492704":{ score:0.7733, shap:{TransactionAmt:0.2236,ProductCD:1.3541,card4:1.182,card6:-1.804,addr1:0.0501,dist1:0.2379}, lime:{"TransactionAmt > 125.00":0.1466,"card6 <= 1.00":-0.1336,"ProductCD <= 3.00":0.1169,"dist1 <= -1.00":0.0669,"addr1 <= 184.00":-0.0413,"card4 <= 2.00":0.0001} },
  "3557070":{ score:0.015,  shap:{TransactionAmt:-2.1688,ProductCD:0.0755,card4:-0.2918,card6:0.0731,addr1:-0.3374,dist1:-1.5203}, lime:{"card6 <= 1.00":-0.1369,"TransactionAmt <= 43.32":-0.1098,"ProductCD <= 3.00":0.0983,"dist1 > 5.00":-0.0859,"272.00 < addr1 <= 327.00":0.0252,"card4 <= 2.00":-0.0128} },
};

const SHEET_URL = "https://script.google.com/macros/s/AKfycbw40D7CtJKFxD7H8w0BGUVBKVxVhBssaKYzjGTZaim2EJyBiN6lmw135ceAEzuAcDp1OA/exec";

const FEAT_LABELS = {
  TransactionAmt:"Transaction amount (USD)",
  ProductCD:"Transaction channel (ProductCD)",
  card4:"Card network (card4)",
  card6:"Card type (card6)",
  addr1:"Billing region code (addr1)",
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
  const vals={TransactionAmt:`$${tx.amount.toFixed(2)}`,ProductCD:CHANNEL_LABELS[tx.product]||tx.product,card4:tx.network,card6:tx.cardType,addr1:tx.addr??'N/A',dist1:tx.dist!==null?`${tx.dist} km`:'N/A'};
  return Object.entries(shap).map(([k,v])=>({key:k,label:FEAT_LABELS[k]||k,value:vals[k],shap:v})).sort((a,b)=>Math.abs(b.shap)-Math.abs(a.shap));
}
function getLimeEntries(tx){
  if(!tx)return[];
  return Object.entries(REAL_EXPLANATIONS[tx.id]?.lime??{}).map(([k,v])=>({rule:k,v})).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));
}
function getRiskFlags(tx,score){
  const f=[];
  if(score>=0.7)                               f.push({code:"RF-01",label:"High fraud score",severity:"HIGH"});
  if(tx.amount>150)                            f.push({code:"RF-02",label:"Transaction amount above threshold",severity:"HIGH"});
  if(tx.dist!==null&&tx.dist>100)              f.push({code:"RF-03",label:"Suspicious transaction distance",severity:"HIGH"});
  if(tx.dist!==null&&tx.dist>20&&tx.dist<=100) f.push({code:"RF-03",label:"Elevated transaction distance",severity:"MED"});
  if(tx.addr===null)                           f.push({code:"RF-04",label:"Billing address not confirmed",severity:"MED"});
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

function ShapPanel({tx}){
  const entries=getShapEntries(tx);
  const maxV=Math.max(...entries.map(e=>Math.abs(e.shap)),0.01);
  return(
    <div>
      <div style={{background:"#f0f7ff",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:12,color:"#1e40af",lineHeight:1.6}}>
        <strong>Feature contribution breakdown.</strong> Each row shows one piece of transaction data and how strongly it raised or lowered the fraud score. Think of it as the model's explanation of <em>why</em> this transaction received its score — similar to how a senior analyst would highlight which factors stood out.
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
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:5}}>
              <span style={{color:"#1e293b",fontWeight:600}}>{e.label.split(" (")[0]}</span>
              <span style={{color:"#94a3b8"}}>Value: <strong style={{color:"#334155"}}>{e.value}</strong></span>
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
        <strong>Condition-based breakdown.</strong> Rather than individual data points, this view shows which conditions about the transaction were most telling — for example, whether the amount fell above or below a typical threshold. Each condition is weighted by how much it shifted the fraud score for this specific alert.
      </div>
      <div style={{display:"flex",gap:16,fontSize:11,color:"#888",marginBottom:10}}>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:12,height:10,borderRadius:2,background:"#c0392b",display:"inline-block"}}/>Condition increases risk</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:12,height:10,borderRadius:2,background:"#1a7a4a",display:"inline-block"}}/>Condition decreases risk</span>
      </div>
      {entries.map((e,i)=>{
        const pct=Math.min(Math.abs(e.v)/maxV*90,90);
        const isPos=e.v>0;
        return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <div style={{width:220,fontSize:10,color:"#334155",fontFamily:"monospace",background:"#f1f5f9",padding:"3px 7px",borderRadius:4,flexShrink:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}} title={e.rule}>{e.rule}</div>
            <div style={{flex:1,height:18,background:"#f1f5f9",borderRadius:4,overflow:"hidden",position:"relative"}}>
              <div style={{position:"absolute",[isPos?"left":"right"]:0,width:`${pct}%`,height:"100%",background:isPos?"#fca5a5":"#86efac",borderRadius:4}}/>
              <div style={{position:"absolute",top:0,bottom:0,[isPos?"left":"right"]:`${pct}%`,width:3,background:isPos?"#c0392b":"#1a7a4a",borderRadius:2}}/>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:isPos?"#c0392b":"#1a7a4a",minWidth:58,textAlign:"right"}}>{isPos?"+":""}{e.v.toFixed(4)}</span>
          </div>
        );
      })}
      <div style={{marginTop:8,fontSize:11,color:"#94a3b8",fontStyle:"italic"}}>LIME is a local approximation — may differ slightly from SHAP which uses exact model values.</div>
    </div>
  );
}

function LLMPanel({tx,score}){
  const [text,setText]=useState("");const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");const [done,setDone]=useState(false);
  const run=async()=>{
    setLoading(true);setError("");setText("");setDone(false);
    const r=riskLevel(score);
    const shap=REAL_EXPLANATIONS[tx.id]?.shap??{};
    const topFeats=Object.entries(shap).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,4)
      .map(([k,v])=>`${FEAT_LABELS[k]||k}: SHAP ${v>0?"+":""}${v.toFixed(3)} (${v>0?"increases":"decreases"} risk)`).join("; ");
    const prompt=`You are an AI assistant in a bank fraud detection system helping anti-fraud analysts.\n\nTransaction: $${tx.amount.toFixed(2)} | ${CHANNEL_LABELS[tx.product]||tx.product} | ${tx.network} ${tx.cardType} | Billing region: ${tx.addr??"not provided"} | Distance: ${tx.dist!==null?tx.dist+"km":"unavailable"} | Score: ${Math.round(score*100)}/100 (${r.text})\nTop SHAP features: ${topFeats}\n\nWrite 3 concise paragraphs: (1) Overall risk and top 2-3 drivers, (2) What the model detected and any inconsistencies, (3) Recommended action proportionate to risk. Be direct, no bullet points.`;
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
        <strong>AI-generated narrative.</strong> An AI assistant reads the transaction data and model scores, then writes a plain-language summary — similar to how an experienced analyst might brief a colleague. It highlights the key risk drivers and suggests a proportionate action.
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <Badge label="llama-3.1-8b-instant" col="#e65c00" bg="#fff3e0"/>
        <Badge label="Groq API" col="#2980b9" bg="#e8f0fe"/>
      </div>
      {!done&&!loading&&<button onClick={run} style={{padding:"8px 18px",borderRadius:8,border:"1px solid #6b3fa0",background:"#f9f4ff",color:"#6b3fa0",fontSize:13,cursor:"pointer",fontWeight:500}}>Generate narrative ↗</button>}
      {loading&&<div style={{display:"flex",alignItems:"center",gap:8,color:"#888",fontSize:13}}><div style={{width:13,height:13,border:"2px solid #ccc",borderTopColor:"#6b3fa0",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>Generating…</div>}
      {error&&<div style={{color:"#c0392b",fontSize:13,padding:"8px 12px",background:"#fdecea",borderRadius:6}}>{error}</div>}
      {text&&<div><div style={{fontSize:13,lineHeight:1.85,color:"#1e293b",whiteSpace:"pre-wrap"}}>{text}</div><button onClick={run} style={{marginTop:8,padding:"4px 12px",borderRadius:6,border:"1px solid #ddd",background:"#fafafa",color:"#888",fontSize:12,cursor:"pointer"}}>↺ Regenerate</button></div>}
    </div>
  );
}

function CounterfactualPanel({tx}){
  const shap=REAL_EXPLANATIONS[tx.id]?.shap??{};
  const riskDrivers=Object.entries(shap).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  const advice={
    TransactionAmt:{required:"Lower transaction amount",feasible:false,reason:"Cannot be changed retroactively"},
    ProductCD:     {required:"Different transaction channel",feasible:false,reason:"Cannot be changed retroactively"},
    card4:         {required:"Verify card ownership with issuer",feasible:true,reason:"Analyst can contact card issuer"},
    card6:         {required:"Verify card type matches account",feasible:true,reason:"Analyst can check account records"},
    addr1:         {required:"Confirm billing address on file",feasible:true,reason:"Analyst can request cardholder verification"},
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
            {["Feature","Current value","SHAP impact","What would need to change","Analyst can act?"].map(h=>(
              <th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#475569",borderBottom:"2px solid #e2e8f0",whiteSpace:"nowrap"}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {riskDrivers.slice(0,5).map(([k,v],i)=>{
            const a=advice[k]||{required:"No clear counterfactual",feasible:false,reason:""};
            const valMap={TransactionAmt:`$${tx.amount.toFixed(2)}`,ProductCD:CHANNEL_LABELS[tx.product]||tx.product,card4:tx.network,card6:tx.cardType,addr1:tx.addr??'N/A',dist1:tx.dist!==null?`${tx.dist} km`:'N/A'};
            return(
              <tr key={i} style={{background:i%2===0?"#fff":"#f8fafc"}}>
                <td style={{padding:"8px 10px",fontWeight:500,color:"#1e293b"}}>{FEAT_LABELS[k]||k}</td>
                <td style={{padding:"8px 10px",color:"#64748b"}}>{valMap[k]}</td>
                <td style={{padding:"8px 10px",color:"#c0392b",fontWeight:600}}>+{v.toFixed(3)}</td>
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
  const others=ALL_TXN.filter(t=>t.id!==tx.id).map(t=>{
    let sim=0;
    if(t.product===tx.product)sim+=25;if(t.network===tx.network)sim+=20;
    if(t.cardType===tx.cardType)sim+=20;if(Math.abs(t.amount-tx.amount)<tx.amount*0.4)sim+=25;
    if((t.dist===null)===(tx.dist===null))sim+=10;return{...t,sim};
  }).sort((a,b)=>b.sim-a.sim);
  const fraudCount=others.filter(p=>p.groundTruth==="confirmed_fraud").length;
  return(
    <div>
      <div style={{background:"#f0fdf4",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:12,color:"#166534",lineHeight:1.6}}>
        <strong>Similar past cases.</strong> Shows other transactions from the dataset that share the most characteristics with this alert. If similar cases were previously confirmed as fraud, that raises the likelihood here too — the same reasoning an experienced investigator uses when pattern-matching against known cases.
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
        return(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",marginBottom:6,background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0"}}>
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
    {label:"Billing region (addr1)",value:tx.addr??'Not provided'},
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

function ExpRatingWidget({txId, expTab, expTabId, saved, onSave, onNext, isLastTab}){
  const key=`exprating-${txId}-${expTab}`;
  const [clarity,setClarity]=useState(null);
  const [completeness,setCompleteness]=useState(null);
  useEffect(()=>{setClarity(null);setCompleteness(null);},[txId,expTab]);

  const allDone=clarity&&completeness;
  const alreadySaved=!!saved[key];

  return(
    <div style={{marginTop:12,padding:"12px 14px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0"}}>
      <div style={{fontSize:11,fontWeight:600,color:"#475569",marginBottom:10}}>Rate this explanation — {expTab}</div>

      {alreadySaved ? (
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div style={{fontSize:12,color:"#166534",fontWeight:500}}>
            ✓ Rated: Clarity <strong>{saved[key].clarity}/5</strong> · Completeness <strong>{saved[key].completeness}/5</strong>
          </div>
          {!isLastTab && (
            <button
              onClick={onNext}
              style={{display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:8,border:"1px solid #2980b9",background:"#e8f0fe",color:"#2980b9",fontSize:12,fontWeight:600,cursor:"pointer"}}
            >
              Next explanation <span style={{fontSize:15,lineHeight:1}}>→</span>
            </button>
          )}
          {isLastTab && (
            <span style={{fontSize:11,color:"#94a3b8",fontStyle:"italic"}}>All explanations rated ✓</span>
          )}
        </div>
      ) : (
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
            <div>
              <div style={{fontSize:11,color:"#64748b",marginBottom:5}}>Clarity (1–5)</div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <span style={{fontSize:9,color:"#bbb"}}>Unclear</span>
                {[1,2,3,4,5].map(n=>(<button key={n} onClick={()=>setClarity(n)} style={{width:28,height:28,borderRadius:5,border:`1px solid ${clarity===n?"#2980b9":"#ddd"}`,background:clarity===n?"#e8f0fe":"#fff",color:clarity===n?"#2980b9":"#888",fontSize:12,cursor:"pointer"}}>{n}</button>))}
                <span style={{fontSize:9,color:"#bbb"}}>Clear</span>
              </div>
            </div>
            <div>
              <div style={{fontSize:11,color:"#64748b",marginBottom:5}}>Completeness (1–5)</div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <span style={{fontSize:9,color:"#bbb"}}>Incomplete</span>
                {[1,2,3,4,5].map(n=>(<button key={n} onClick={()=>setCompleteness(n)} style={{width:28,height:28,borderRadius:5,border:`1px solid ${completeness===n?"#2980b9":"#ddd"}`,background:completeness===n?"#e8f0fe":"#fff",color:completeness===n?"#2980b9":"#888",fontSize:12,cursor:"pointer"}}>{n}</button>))}
                <span style={{fontSize:9,color:"#bbb"}}>Complete</span>
              </div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>onSave(key,{clarity,completeness,exp:expTab,transaction_id:txId})}
              disabled={!allDone}
              style={{padding:"6px 16px",borderRadius:7,border:`1px solid ${allDone?"#2980b9":"#ccc"}`,background:allDone?"#e8f0fe":"#f5f5f5",color:allDone?"#2980b9":"#aaa",fontSize:12,cursor:allDone?"pointer":"default",fontWeight:500}}>
              Save rating →
            </button>
            {!allDone&&<span style={{fontSize:11,color:"#bbb"}}>Rate both dimensions to save</span>}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryWidget({txId,initialClass,saved,onSave}){
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
      <button onClick={()=>onSave(key,{reclassification:reclassify,most_helpful_explanation:bestExp,transaction_id:txId,initial_classification:initialClass})}
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

export default function App(){
  const [selected,setSelected]=useState(0);
  const [expTab,setExpTab]=useState("shap");
  const [saved,setSaved]=useState({});
  const [showMeta,setShowMeta]=useState(false);
  const participantId=useState(()=>`P-${Date.now().toString(36).toUpperCase()}`)[0];

  const tx=ALL_TXN[selected];
  const score=xgbScore(tx);
  const classifyKey=`classify-${tx.id}`;
  const summaryKey=`summary-${tx.id}`;
  const classified=!!saved[classifyKey];
  const summarised=!!saved[summaryKey];
  const initialClass=saved[classifyKey]?.classification;
  const allExpRated=ALL_EXP_TABS.every(tab=>saved[`exprating-${tx.id}-${tab}`]);
  const ratedCount=ALL_EXP_TABS.filter(tab=>saved[`exprating-${tx.id}-${tab}`]).length;

  const currentTabIdx=EXP_TAB_IDS.indexOf(expTab);
  const isLastTab=currentTabIdx===EXP_TAB_IDS.length-1;
  const goToNextTab=()=>{
    if(!isLastTab) setExpTab(EXP_TAB_IDS[currentTabIdx+1]);
  };

  const handleSave=(k,d)=>{
    setSaved(s=>({...s,[k]:d}));
    fetch(SHEET_URL,{method:"POST",body:JSON.stringify({participant_id:participantId,key:k,...d})}).catch(()=>{});
  };

  const completedCount=ALL_TXN.filter(t=>saved[`summary-${t.id}`]).length;

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
          {ALL_TXN.map((t,i)=>{
            const done=!!saved[`summary-${t.id}`];
            const isCurrent=selected===i;
            return(
              <button key={t.id} onClick={()=>{setSelected(i);setExpTab("shap");}}
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

          {/* Step 2: explanations */}
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
                    {g.tabs.map(t=>{
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
              <ExpRatingWidget
                txId={tx.id}
                expTab={TAB_ID_TO_LABEL[expTab]||expTab}
                expTabId={expTab}
                saved={saved}
                onSave={handleSave}
                onNext={goToNextTab}
                isLastTab={isLastTab}
              />
            </div>
          </div>

          {/* Step 3: locked until all 5 rated */}
          {classified&&!allExpRated&&(
            <div style={{padding:"10px 14px",background:"#fefce8",border:"1px solid #fde68a",borderRadius:8,fontSize:12,color:"#92400e"}}>
              📋 Rate all 5 explanations in Step 2 to unlock the final evaluation.
              <span style={{marginLeft:6,color:"#b45309",fontWeight:600}}>{ratedCount}/5 rated</span>
            </div>
          )}

          {classified&&allExpRated&&(
            <SummaryWidget txId={tx.id} initialClass={initialClass} saved={saved} onSave={handleSave}/>
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