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

const TASK2_IDS = ["3053108","3354853","3492704","3557070"];

const REAL_EXPLANATIONS = {
  "3519372":{ score:0.0754, shap:{TransactionAmt:-2.3667,ProductCD:-0.0615,card4:0.7712,card6:0.0789,addr1:-0.4372,dist1:-0.4749}, lime:{"card6 <= 1.00":-0.1407,"TransactionAmt <= 43.32":-0.1163,"ProductCD <= 3.00":0.1095,"card4 <= 2.00":-0.0222,"-1.00 < dist1 <= 5.00":0.015,"addr1 > 327.00":0.0038} },
  "3053108":{ score:0.0096, shap:{TransactionAmt:-0.4179,ProductCD:0.3726,card4:-0.3341,card6:-2.195,addr1:-0.5997,dist1:-1.4414}, lime:{"card6 <= 1.00":-0.1449,"ProductCD <= 3.00":0.1068,"dist1 > 5.00":-0.0815,"184.00 < addr1 <= 272.00":0.0237,"card4 <= 2.00":-0.0144,"68.77 < TransactionAmt <= 125.00":0.001} },
  "3492704":{ score:0.7733, shap:{TransactionAmt:0.2236,ProductCD:1.3541,card4:1.182,card6:-1.804,addr1:0.0501,dist1:0.2379}, lime:{"TransactionAmt > 125.00":0.1466,"card6 <= 1.00":-0.1336,"ProductCD <= 3.00":0.1169,"dist1 <= -1.00":0.0669,"addr1 <= 184.00":-0.0413,"card4 <= 2.00":0.0001} },
  "3560122":{ score:0.6856, shap:{TransactionAmt:-0.6303,ProductCD:1.6618,card4:1.1214,card6:-1.7827,addr1:0.1087,dist1:0.3171}, lime:{"card6 <= 1.00":-0.1328,"ProductCD <= 3.00":0.0974,"dist1 <= -1.00":0.0573,"addr1 <= 184.00":-0.0473,"68.77 < TransactionAmt <= 125.00":0.0112,"card4 <= 2.00":0.0007} },
  "3104673":{ score:0.0424, shap:{TransactionAmt:-1.692,ProductCD:0.1425,card4:0.4111,card6:-0.0928,addr1:-0.7315,dist1:-1.1375}, lime:{"card6 <= 1.00":-0.1366,"ProductCD <= 3.00":0.0962,"addr1 <= 184.00":-0.0508,"43.32 < TransactionAmt <= 68.77":-0.0378,"card4 <= 2.00":-0.0186,"-1.00 < dist1 <= 5.00":0.0181} },
  "3320693":{ score:0.6121, shap:{TransactionAmt:0.0002,ProductCD:1.1516,card4:-0.841,card6:0.4246,addr1:-0.4031,dist1:0.1403}, lime:{"card6 <= 1.00":-0.1373,"TransactionAmt > 125.00":0.1291,"ProductCD <= 3.00":0.1003,"dist1 <= -1.00":0.0651,"addr1 <= 184.00":-0.0519,"card4 <= 2.00":-0.0076} },
  "3407378":{ score:0.2236, shap:{TransactionAmt:-1.2778,ProductCD:0.7817,card4:-0.2332,card6:0.0495,addr1:-0.4284,dist1:-0.1203}, lime:{"card6 <= 1.00":-0.1452,"ProductCD <= 3.00":0.0952,"43.32 < TransactionAmt <= 68.77":-0.039,"272.00 < addr1 <= 327.00":0.0249,"card4 <= 2.00":-0.0141,"-1.00 < dist1 <= 5.00":0.0016} },
  "3044105":{ score:0.2868, shap:{TransactionAmt:-1.7195,ProductCD:0.025,card4:1.1008,card6:0.1131,addr1:-0.0924,dist1:-0.3217}, lime:{"card6 <= 1.00":-0.1314,"ProductCD <= 3.00":0.1027,"TransactionAmt <= 43.32":-0.1016,"-1.00 < dist1 <= 5.00":0.0152,"card4 <= 2.00":-0.0053,"addr1 > 327.00":0.0006} },
  "3557070":{ score:0.015,  shap:{TransactionAmt:-2.1688,ProductCD:0.0755,card4:-0.2918,card6:0.0731,addr1:-0.3374,dist1:-1.5203}, lime:{"card6 <= 1.00":-0.1369,"TransactionAmt <= 43.32":-0.1098,"ProductCD <= 3.00":0.0983,"dist1 > 5.00":-0.0859,"272.00 < addr1 <= 327.00":0.0252,"card4 <= 2.00":-0.0128} },
  "3336054":{ score:0.6288, shap:{TransactionAmt:0.3914,ProductCD:0.7413,card4:0.8316,card6:-1.8774,addr1:0.1754,dist1:0.2811}, lime:{"card6 <= 1.00":-0.1477,"TransactionAmt > 125.00":0.1378,"ProductCD <= 3.00":0.0992,"addr1 <= 184.00":-0.0546,"dist1 <= -1.00":0.052,"card4 <= 2.00":-0.0117} },
  "3330843":{ score:0.6229, shap:{TransactionAmt:-0.1587,ProductCD:0.2424,card4:0.5792,card6:0.2649,addr1:0.0313,dist1:-0.4408}, lime:{"card6 <= 1.00":-0.1357,"dist1 > 5.00":-0.0803,"ProductCD <= 3.00":0.0789,"43.32 < TransactionAmt <= 68.77":-0.0355,"184.00 < addr1 <= 272.00":0.0237,"card4 <= 2.00":-0.0165} },
  "3034548":{ score:0.707,  shap:{TransactionAmt:-0.1665,ProductCD:1.2921,card4:-0.2645,card6:0.2935,addr1:-0.3437,dist1:0.0864}, lime:{"card6 <= 1.00":-0.1427,"TransactionAmt > 125.00":0.1295,"ProductCD <= 3.00":0.0805,"dist1 <= -1.00":0.0609,"addr1 <= 184.00":-0.0504,"card4 <= 2.00":-0.0083} },
  "3354853":{ score:0.8778, shap:{TransactionAmt:-0.6999,ProductCD:1.7578,card4:0.1166,card6:0.4982,addr1:-0.0035,dist1:0.3187}, lime:{"card6 <= 1.00":-0.1348,"ProductCD <= 3.00":0.1209,"dist1 <= -1.00":0.0635,"addr1 <= 184.00":-0.0451,"card4 <= 2.00":-0.0102,"68.77 < TransactionAmt <= 125.00":0.0068} },
  "3124696":{ score:0.2267, shap:{TransactionAmt:-0.7779,ProductCD:0.0365,card4:-0.1829,card6:0.1153,addr1:0.0352,dist1:-0.4366}, lime:{"card6 <= 1.00":-0.1392,"TransactionAmt <= 43.32":-0.1066,"dist1 > 5.00":-0.0894,"ProductCD <= 3.00":0.0821,"272.00 < addr1 <= 327.00":0.0193,"card4 <= 2.00":-0.0151} },
  "3453553":{ score:0.8175, shap:{TransactionAmt:0.171,ProductCD:1.0238,card4:-0.2542,card6:0.346,addr1:-0.0704,dist1:0.3}, lime:{"card6 <= 1.00":-0.1426,"TransactionAmt > 125.00":0.1348,"ProductCD <= 3.00":0.1179,"dist1 <= -1.00":0.0673,"addr1 <= 184.00":-0.0532,"card4 <= 2.00":-0.0052} },
};

const SHEET_URL = "https://script.google.com/macros/s/AKfycbw40D7CtJKFxD7H8w0BGUVBKVxVhBssaKYzjGTZaim2EJyBiN6lmw135ceAEzuAcDp1OA/exec";

const FEAT_LABELS = {
  TransactionAmt:"Transaction amount (USD)",
  ProductCD:"Transaction channel (ProductCD)",
  card4:"Card network (card4)",
  card6:"Card type (card6)",
  addr1:"Billing region code (addr1)",
  dist1:"Distance: billing to transaction location, km (dist1)",
};
const CHANNEL_LABELS = { W:"Web purchase", C:"Card payment", H:"Home purchase", R:"Retail", S:"Service" };
const TAB_ID_TO_LABEL = {shap:"SHAP",lime:"LIME",llm:"LLM",counterfactual:"Counterfactual",peers:"Case-Based Reasoning (CBR)"};
const ALL_EXP_TABS = Object.values(TAB_ID_TO_LABEL);

const TRUTH_CFG = {
  confirmed_fraud:{label:"Confirmed fraud",col:"#c0392b",bg:"#fdecea",icon:"⚠"},
  legitimate:     {label:"Legitimate",     col:"#1a7a4a",bg:"#e8f7ee",icon:"✓"},
  suspected:      {label:"Suspected fraud",col:"#8e44ad",bg:"#f5eeff",icon:"?"},
};

const WORKFLOW = [
  {id:"triage",  icon:"🔍",label:"1 · Alert triage",         col:"#4a7c59",bg:"#e8f5ee"},
  {id:"escalate",icon:"📋",label:"2 · Evaluate explanations",col:"#7b5ea7",bg:"#f2eef9"},
];

const TASK_METRICS = {
  triage:[
    {lbl:"Based on the transaction details and risk score, how would you classify this alert?", type:"classification"},
    {lbl:"Confidence in your classification (1 = not confident, 7 = very confident)", type:"l7"},
  ],
  escalate:[
    {lbl:"After reviewing this explanation, has your classification changed?", type:"reclassify"},
    {lbl:"Which explanation type was most helpful for your decision?", type:"best_exp"},
    {lbl:"On a scale of 1 to 5, how clear was this explanation?", type:"clarity"},
    {lbl:"On a scale of 1 to 5, how complete was this explanation?", type:"completeness"},
  ],
};

function shuffleArray(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
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
  const lime=REAL_EXPLANATIONS[tx.id]?.lime??{};
  return Object.entries(lime).map(([k,v])=>({rule:k,v})).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));
}

function Badge({label,col="#888",bg="#f0f0f0",sz=11}){
  return <span style={{fontSize:sz,padding:"2px 8px",borderRadius:10,background:bg,color:col,fontWeight:500,whiteSpace:"nowrap"}}>{label}</span>;
}

function Gauge({score}){
  const pct=Math.round(Math.min(score,0.99)*100);
  const r=riskLevel(score);
  const cx=80,cy=72,radius=54,startDeg=210,sweepDeg=120;
  const toRad=d=>d*Math.PI/180;
  const nx=cx+(radius-8)*Math.cos(toRad(startDeg+(pct/100)*sweepDeg));
  const ny=cy+(radius-8)*Math.sin(toRad(startDeg+(pct/100)*sweepDeg));
  const x1=cx+radius*Math.cos(toRad(startDeg)),y1=cy+radius*Math.sin(toRad(startDeg));
  const x2=cx+radius*Math.cos(toRad(330)),y2=cy+radius*Math.sin(toRad(330));
  const fa=startDeg+(pct/100)*sweepDeg;
  const fx=cx+radius*Math.cos(toRad(fa)),fy=cy+radius*Math.sin(toRad(fa));
  const la=(pct/100)*sweepDeg>180?1:0;
  return(
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

function AttrBar({v,maxV=2.5}){
  const pct=Math.min(Math.abs(v)/maxV*100,100);
  return(
    <div style={{flex:1,background:"#f5f5f5",borderRadius:3,height:11,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",left:v>0?`${50-pct/2}%`:"50%",width:`${pct/2}%`,height:"100%",background:v>0?"#c0392b":"#1a7a4a"}}/>
      <div style={{position:"absolute",left:"50%",top:0,height:"100%",width:1,background:"#ccc"}}/>
    </div>
  );
}

const SEV_CFG = {HIGH:{col:"#c0392b",bg:"#fdecea"},MED:{col:"#b7770d",bg:"#fef3cd"},LOW:{col:"#1a7a4a",bg:"#e8f7ee"}};

function getRiskFlags(tx,score){
  const f=[];
  if(score>=0.7)                                          f.push({code:"RF-01",label:"High fraud score",severity:"HIGH"});
  if(tx.amount>150)                                       f.push({code:"RF-02",label:"Transaction amount above threshold",severity:"HIGH"});
  if(tx.dist!==null&&tx.dist>100)                         f.push({code:"RF-03",label:"Suspicious transaction distance",severity:"HIGH"});
  if(tx.dist!==null&&tx.dist>20&&tx.dist<=100)            f.push({code:"RF-03",label:"Elevated transaction distance",severity:"MED"});
  if(tx.addr===null)                                      f.push({code:"RF-04",label:"Billing address not confirmed",severity:"MED"});
  if(tx.product==="C"&&score>0.3)                         f.push({code:"RF-05",label:"Card payment — elevated risk pattern",severity:"MED"});
  if(tx.product==="W"&&tx.dist!==null&&tx.dist>5)         f.push({code:"RF-06",label:"Web purchase with distance anomaly",severity:"MED"});
  if(score>=0.4&&score<0.7)                               f.push({code:"RF-07",label:"Medium fraud score — review required",severity:"MED"});
  if(f.length===0)                                        f.push({code:"RF-00",label:"No rules triggered — transaction within normal parameters",severity:"LOW"});
  return f;
}

function TxnDetail({tx,showTruth}){
  const tc=TRUTH_CFG[tx.groundTruth];
  const score=xgbScore(tx);
  const flags=getRiskFlags(tx,score);
  const fields=[
    {label:"Transaction amount (USD)",                    value:`$${tx.amount.toFixed(2)}`},
    {label:"Transaction channel (ProductCD)",             value:CHANNEL_LABELS[tx.product]||tx.product},
    {label:"Card network (card4)",                        value:tx.network.charAt(0).toUpperCase()+tx.network.slice(1)},
    {label:"Card type (card6)",                           value:tx.cardType.charAt(0).toUpperCase()+tx.cardType.slice(1)},
    {label:"Billing region code (addr1)",                 value:tx.addr??'Not provided'},
    {label:"Distance: billing → transaction, km (dist1)", value:tx.dist!==null?`${tx.dist} km`:'Not available'},
  ];
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,marginBottom:14}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <div style={{fontSize:15,fontWeight:600,color:"#1e293b"}}>Transaction {tx.id}</div>
            {showTruth&&<Badge label={`${tc.icon} ${tc.label}`} col={tc.col} bg={tc.bg} sz={12}/>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 16px"}}>
            {fields.map(f=>(
              <div key={f.label} style={{padding:"6px 10px",background:"#f8fafc",borderRadius:6,borderLeft:"3px solid #e2e8f0"}}>
                <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,marginBottom:2}}>{f.label}</div>
                <div style={{fontSize:13,color:"#1e293b",fontWeight:500}}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
        <Gauge score={score}/>
      </div>
      <div style={{borderTop:"1px solid #f0f0f0",paddingTop:12}}>
        <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Triggered risk flags</div>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {flags.map((f,i)=>{
            const sc=SEV_CFG[f.severity];
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:sc.bg,borderRadius:6,border:`1px solid ${sc.col}22`}}>
                <span style={{fontSize:10,fontFamily:"monospace",fontWeight:700,color:sc.col,minWidth:42}}>{f.code}</span>
                <span style={{width:1,height:14,background:sc.col,opacity:0.3,flexShrink:0}}/>
                <span style={{fontSize:12,color:"#1e293b",flex:1}}>{f.label}</span>
                <span style={{fontSize:10,fontWeight:700,color:sc.col,padding:"1px 7px",borderRadius:8,background:"#fff",border:`1px solid ${sc.col}44`}}>{f.severity}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ShapPanel({tx}){
  const entries=getShapEntries(tx);
  const maxV=Math.max(...entries.map(e=>Math.abs(e.shap)),0.01);
  return(
    <div>
      <div style={{fontSize:12,color:"#888",marginBottom:6}}>Per-feature SHAP values from the trained XGBoost model (TreeSHAP — exact). Each bar shows how much a feature pushed the fraud score up or down from the base rate.</div>
      <div style={{display:"flex",gap:12,fontSize:11,color:"#888",marginBottom:10}}>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,background:"#c0392b",borderRadius:2,display:"inline-block"}}/>Increases fraud risk</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,background:"#1a7a4a",borderRadius:2,display:"inline-block"}}/>Decreases fraud risk</span>
      </div>
      {entries.map((e,i)=>(
        <div key={i} style={{marginBottom:8,padding:"8px 10px",background:"#f8fafc",borderRadius:6}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
            <span style={{color:"#1e293b",fontWeight:500}}>{e.label}</span>
            <span style={{color:"#94a3b8"}}>Value: <strong>{e.value}</strong></span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <AttrBar v={e.shap} maxV={maxV}/>
            <span style={{fontSize:11,color:e.shap>0?"#c0392b":"#1a7a4a",minWidth:56,textAlign:"right",fontWeight:600}}>{e.shap>0?"+":""}{e.shap.toFixed(3)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function LimePanel({tx}){
  const entries=getLimeEntries(tx);
  const maxV=Math.max(...entries.map(e=>Math.abs(e.v)),0.01);
  return(
    <div>
      <div style={{fontSize:12,color:"#888",marginBottom:6}}>Local linear surrogate fitted around this transaction using 500 perturbed neighbours (LIME). Rules show which feature conditions drove the local prediction.</div>
      <div style={{display:"flex",gap:12,fontSize:11,color:"#888",marginBottom:10}}>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,background:"#c0392b",borderRadius:2,display:"inline-block"}}/>Increases fraud risk</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,background:"#1a7a4a",borderRadius:2,display:"inline-block"}}/>Decreases fraud risk</span>
      </div>
      {entries.map((e,i)=>(
        <div key={i} style={{marginBottom:8,padding:"8px 10px",background:"#f8fafc",borderRadius:6}}>
          <div style={{fontSize:11,color:"#1e293b",fontWeight:500,marginBottom:4}}>{e.rule}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <AttrBar v={e.v} maxV={maxV}/>
            <span style={{fontSize:11,color:e.v>0?"#c0392b":"#1a7a4a",minWidth:56,textAlign:"right",fontWeight:600}}>{e.v>0?"+":""}{e.v.toFixed(4)}</span>
          </div>
        </div>
      ))}
      <div style={{marginTop:8,fontSize:11,color:"#bbb",fontStyle:"italic"}}>Note: LIME is a local approximation — values may differ from SHAP which computes exact contributions.</div>
    </div>
  );
}

function LLMPanel({tx,score}){
  const [text,setText]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [done,setDone]=useState(false);
  const run=async()=>{
    setLoading(true);setError("");setText("");setDone(false);
    const r=riskLevel(score);
    const shap=REAL_EXPLANATIONS[tx.id]?.shap??{};
    const topFeats=Object.entries(shap).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,4)
      .map(([k,v])=>`${FEAT_LABELS[k]||k}: SHAP value ${v>0?"+":""}${v.toFixed(3)} (${v>0?"increases":"decreases"} risk)`).join("; ");
    const prompt=`You are an AI assistant in a bank fraud detection system helping anti-fraud analysts.\n\nTransaction details:\n- Amount: $${tx.amount.toFixed(2)}\n- Channel: ${CHANNEL_LABELS[tx.product]||tx.product}\n- Card: ${tx.network} ${tx.cardType}\n- Billing region: ${tx.addr??"not provided"}\n- Distance from billing address: ${tx.dist!==null?tx.dist+"km":"unavailable"}\n- XGBoost fraud score: ${Math.round(score*100)}/100 (${r.text})\n- Top SHAP features: ${topFeats}\n\nWrite 3 concise paragraphs for a fraud analyst: (1) Overall risk assessment and the 2-3 most important drivers based on the SHAP values, (2) What the model detected and any features that seem inconsistent with the score, (3) A recommended action proportionate to the risk — low scores should suggest approval, high scores should suggest blocking or escalation. Be direct and analytical. No bullet points.`;
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
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:11,color:"#888"}}>Generated by</span>
        <Badge label="llama-3.1-8b-instant" col="#e65c00" bg="#fff3e0"/>
        <Badge label="Groq API" col="#2980b9" bg="#e8f0fe"/>
      </div>
      <div style={{fontSize:12,color:"#888",marginBottom:10}}>Natural language narrative generated by a large language model, based on the transaction features and XGBoost score above.</div>
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
    dist1:         {required:"Cardholder confirms travel or foreign purchase",feasible:true,reason:"Analyst can contact cardholder directly"},
  };
  if(!riskDrivers.length)return<div style={{fontSize:13,color:"#888",padding:"12px 0"}}>No risk-increasing features found for this transaction.</div>;
  return(
    <div>
      <div style={{fontSize:12,color:"#888",marginBottom:12}}>Features currently increasing the fraud score, and what would need to change to reduce risk. Based on SHAP values from the trained model.</div>
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
    if(t.product===tx.product)sim+=25;
    if(t.network===tx.network)sim+=20;
    if(t.cardType===tx.cardType)sim+=20;
    if(Math.abs(t.amount-tx.amount)<tx.amount*0.4)sim+=25;
    if((t.dist===null)===(tx.dist===null))sim+=10;
    return{...t,sim};
  }).sort((a,b)=>b.sim-a.sim).slice(0,6);
  const fraudCount=others.filter(p=>p.groundTruth==="confirmed_fraud").length;
  return(
    <div>
      <div style={{fontSize:12,color:"#888",marginBottom:10}}>Most similar historical transactions from the dataset, ranked by feature similarity (channel, card type, network, amount).</div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {[["confirmed_fraud","#c0392b","#fdecea"],["legitimate","#1a7a4a","#e8f7ee"]].map(([k,col,bg])=>(
          <div key={k} style={{flex:1,background:bg,borderRadius:8,padding:"10px",textAlign:"center",border:`1px solid ${col}22`}}>
            <div style={{fontSize:22,fontWeight:700,color:col}}>{others.filter(p=>p.groundTruth===k).length}</div>
            <div style={{fontSize:11,color:col}}>{TRUTH_CFG[k].icon} {TRUTH_CFG[k].label}</div>
          </div>
        ))}
        <div style={{flex:1,background:"#f1f5f9",borderRadius:8,padding:"10px",textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:700,color:"#475569"}}>{Math.round(fraudCount/others.length*100)}%</div>
          <div style={{fontSize:11,color:"#64748b"}}>Fraud rate in peers</div>
        </div>
      </div>
      {others.map((p,i)=>{
        const tc=TRUTH_CFG[p.groundTruth];
        const ps=xgbScore(p);const pr=riskLevel(ps);
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

function MetricInput({m,val,onChange,triageDecision}){
  switch(m.type){
    case "classification": return(
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {[{key:"confirmed_fraud",label:"Confirmed fraud",col:"#c0392b",bg:"#fdecea",icon:"⚠"},{key:"suspected",label:"Suspected fraud",col:"#8e44ad",bg:"#f5eeff",icon:"?"},{key:"legitimate",label:"Legitimate",col:"#1a7a4a",bg:"#e8f7ee",icon:"✓"}].map(o=>(
          <button key={o.key} onClick={()=>onChange(o.key)} style={{padding:"9px 16px",borderRadius:10,border:`2px solid ${val===o.key?o.col:"#ddd"}`,background:val===o.key?o.bg:"#fff",color:val===o.key?o.col:"#888",fontSize:13,fontWeight:val===o.key?600:400,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            <span>{o.icon}</span>{o.label}
          </button>
        ))}
      </div>
    );
    case "reclassify": return(
      <div>
        {triageDecision&&<div style={{fontSize:11,color:"#64748b",marginBottom:8}}>Your initial classification: <Badge label={TRUTH_CFG[triageDecision]?.label||triageDecision} col={TRUTH_CFG[triageDecision]?.col} bg={TRUTH_CFG[triageDecision]?.bg}/></div>}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[{key:"no_change",label:"No change",col:"#475569",bg:"#f1f5f9",icon:"→"},{key:"confirmed_fraud",label:"Confirmed fraud",col:"#c0392b",bg:"#fdecea",icon:"⚠"},{key:"suspected",label:"Suspected fraud",col:"#8e44ad",bg:"#f5eeff",icon:"?"},{key:"legitimate",label:"Legitimate",col:"#1a7a4a",bg:"#e8f7ee",icon:"✓"}].map(o=>(
            <button key={o.key} onClick={()=>onChange(o.key)} style={{padding:"7px 14px",borderRadius:10,border:`2px solid ${val===o.key?o.col:"#ddd"}`,background:val===o.key?o.bg:"#fff",color:val===o.key?o.col:"#888",fontSize:12,fontWeight:val===o.key?600:400,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
              <span>{o.icon}</span>{o.label}
            </button>
          ))}
        </div>
      </div>
    );
    case "best_exp": return(
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {ALL_EXP_TABS.map(t=>(
          <button key={t} onClick={()=>onChange(t)} style={{padding:"5px 12px",borderRadius:16,border:`1px solid ${val===t?"#7b5ea7":"#ddd"}`,background:val===t?"#f5f3ff":"#fff",color:val===t?"#7b5ea7":"#888",fontSize:12,cursor:"pointer",fontWeight:val===t?600:400}}>{t}</button>
        ))}
      </div>
    );
    case "l7": return(
      <div style={{display:"flex",gap:5,alignItems:"center"}}>
        <span style={{fontSize:10,color:"#bbb",minWidth:65}}>Not confident</span>
        {[1,2,3,4,5,6,7].map(n=>(<button key={n} onClick={()=>onChange(n)} style={{width:32,height:32,borderRadius:6,border:`1px solid ${val===n?"#2980b9":"#ddd"}`,background:val===n?"#e8f0fe":"#fff",color:val===n?"#2980b9":"#888",fontSize:12,cursor:"pointer",fontWeight:val===n?700:400}}>{n}</button>))}
        <span style={{fontSize:10,color:"#bbb",minWidth:65}}>Very confident</span>
      </div>
    );
    case "clarity": return(
      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,color:"#aaa",minWidth:70}}>Very unclear</span>
        {[1,2,3,4,5].map(n=>(<button key={n} onClick={()=>onChange(n)} style={{width:32,height:32,borderRadius:6,border:`1px solid ${val===n?"#2980b9":"#ddd"}`,background:val===n?"#e8f0fe":"#fff",color:val===n?"#2980b9":"#888",fontSize:13,cursor:"pointer"}}>{n}</button>))}
        <span style={{fontSize:10,color:"#aaa",minWidth:60}}>Very clear</span>
      </div>
    );
    case "completeness": return(
      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:10,color:"#aaa",minWidth:80}}>Very incomplete</span>
        {[1,2,3,4,5].map(n=>(<button key={n} onClick={()=>onChange(n)} style={{width:32,height:32,borderRadius:6,border:`1px solid ${val===n?"#2980b9":"#ddd"}`,background:val===n?"#e8f0fe":"#fff",color:val===n?"#2980b9":"#888",fontSize:13,cursor:"pointer"}}>{n}</button>))}
        <span style={{fontSize:10,color:"#aaa",minWidth:70}}>Very complete</span>
      </div>
    );
    default: return null;
  }
}

function EscalateEvalWidget({expTab,expTabStartTime,txId,saved,onSave,triageDecision}){
  const [open,setOpen]=useState(false);
  const [vals,setVals]=useState({});
  const key=`escalate-${txId}-${expTab}`;
  useEffect(()=>{setVals({});setOpen(false);},[expTab,txId]);
  if(saved[key])return<div style={{marginTop:10,padding:"8px 12px",borderRadius:8,background:"#e8f7ee",fontSize:12,color:"#1a7a4a"}}>✓ Evaluation saved for <strong>{expTab}</strong></div>;
  const metrics=TASK_METRICS.escalate;
  const allDone=metrics.every(m=>vals[m.lbl]!==undefined);
  return(
    <div style={{marginTop:10,border:"1px solid #e8e8e8",borderRadius:10,overflow:"hidden"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",padding:"10px 14px",background:open?"#f2eef9":"#fafafa",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13,color:"#7b5ea7",fontWeight:500}}>
        <span>📋 Rate this explanation — {expTab}</span>
        <span style={{fontSize:11,color:"#aaa"}}>{open?"▲ collapse":"▼ expand"}</span>
      </button>
      {open&&(
        <div style={{padding:"14px"}}>
          {metrics.map((m,i)=>(
            <div key={i} style={{marginBottom:16}}>
              <div style={{fontSize:12,color:"#444",marginBottom:8,fontWeight:500}}>{m.lbl}</div>
              <MetricInput m={m} val={vals[m.lbl]} onChange={v=>setVals(p=>({...p,[m.lbl]:v}))} triageDecision={triageDecision}/>
            </div>
          ))}
          <button onClick={()=>onSave(key,{...vals,reading_time_s:Math.round((Date.now()-expTabStartTime)/1000),exp:expTab,transaction_id:txId,task:"escalate"})}
            disabled={!allDone}
            style={{padding:"8px 20px",borderRadius:8,border:`1px solid ${allDone?"#7b5ea7":"#ccc"}`,background:allDone?"#f2eef9":"#f5f5f5",color:allDone?"#7b5ea7":"#aaa",fontSize:12,cursor:allDone?"pointer":"default",fontWeight:500}}>
            Save evaluation →
          </button>
          {!allDone&&<span style={{fontSize:11,color:"#bbb",marginLeft:10}}>Complete all items to save</span>}
        </div>
      )}
    </div>
  );
}

function EvalWidget({step,expTab,saved,onSave,txId}){
  const task=WORKFLOW.find(w=>w.id===step)||WORKFLOW[0];
  const metrics=TASK_METRICS[step]||[];
  const key=`${step}-${txId}`;
  const [vals,setVals]=useState({});
  const [startTime]=useState(Date.now());
  useEffect(()=>{setVals({});},[key]);
  if(saved[key])return<div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #f0f0f0"}}><div style={{fontSize:12,color:"#1a7a4a"}}>✓ Evaluation recorded</div></div>;
  const allDone=metrics.every(m=>vals[m.lbl]!==undefined);
  return(
    <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #f0f0f0"}}>
      {metrics.map((m,i)=>(
        <div key={i} style={{marginBottom:16}}>
          <div style={{fontSize:12,color:"#444",marginBottom:8,fontWeight:500}}>{m.lbl}</div>
          <MetricInput m={m} val={vals[m.lbl]} onChange={v=>setVals(prev=>({...prev,[m.lbl]:v}))}/>
        </div>
      ))}
      <button onClick={()=>onSave(key,{...vals,latency_s:Math.round((Date.now()-startTime)/1000),task:step,transaction_id:txId})}
        disabled={!allDone}
        style={{padding:"8px 20px",borderRadius:8,border:`1px solid ${allDone?"#2980b9":"#ccc"}`,background:allDone?"#e8f0fe":"#f5f5f5",color:allDone?"#2980b9":"#aaa",fontSize:12,cursor:allDone?"pointer":"default",fontWeight:500}}>
        Save & continue →
      </button>
      {!allDone&&<span style={{fontSize:11,color:"#bbb",marginLeft:10}}>Complete all items to save</span>}
    </div>
  );
}

function SingleNav({txns,selected,onSelect}){
  const idx=Math.min(selected,txns.length-1);
  const tx=txns[idx];if(!tx)return null;
  return(
    <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
      <div style={{fontSize:10,color:"#bbb",textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>Current alert</div>
      <div style={{fontSize:13,fontWeight:500,color:"#333",marginBottom:2}}>TXN {tx.id}</div>
      <div style={{fontSize:11,color:"#888",marginBottom:8}}>${tx.amount.toFixed(2)} · {tx.network} {tx.cardType}</div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <button onClick={()=>onSelect(Math.max(0,idx-1))} disabled={idx===0} style={{flex:1,padding:"6px 0",borderRadius:7,border:"1px solid #e0e0e0",background:idx===0?"#fafafa":"#fff",color:idx===0?"#ccc":"#555",fontSize:12,cursor:idx===0?"default":"pointer"}}>← Prev</button>
        <span style={{fontSize:11,color:"#aaa"}}>{idx+1}/{txns.length}</span>
        <button onClick={()=>onSelect(Math.min(txns.length-1,idx+1))} disabled={idx===txns.length-1} style={{flex:1,padding:"6px 0",borderRadius:7,border:"1px solid #e0e0e0",background:idx===txns.length-1?"#fafafa":"#fff",color:idx===txns.length-1?"#ccc":"#555",fontSize:12,cursor:idx===txns.length-1?"default":"pointer"}}>Next →</button>
      </div>
    </div>
  );
}

const EXP_GROUPS=[
  {label:"Post-hoc explainability",col:"#2980b9",bg:"#e8f0fe",desc:"Applied after model prediction",
   tabs:[{id:"shap",label:"SHAP"},{id:"lime",label:"LIME"},{id:"llm",label:"LLM"},{id:"counterfactual",label:"Counterfactual"}]},
  {label:"Case-based reasoning",col:"#16a085",bg:"#e8f8f5",desc:"Comparison with historical cases",
   tabs:[{id:"peers",label:"Case-Based Reasoning (CBR)"}]},
];

export default function App(){
  const [selected,setSelected]=useState(0);
  const [step,setStep]=useState("triage");
  const [expTab,setExpTab]=useState("shap");
  const [expTabStartTime,setExpTabStartTime]=useState(Date.now());
  const [saved,setSaved]=useState({});
  const [showMeta,setShowMeta]=useState(false);
  const participantId=useState(()=>`P-${Date.now().toString(36).toUpperCase()}`)[0];

  const [task1Txns]=useState(()=>shuffleArray(ALL_TXN));
  const [task2Txns]=useState(()=>shuffleArray(ALL_TXN.filter(t=>TASK2_IDS.includes(t.id))));

  const txns=step==="escalate"?task2Txns:task1Txns;
  const tx=txns[Math.min(selected,txns.length-1)]||txns[0];
  const score=xgbScore(tx);
  const isTriage=step==="triage";
  const triageKey=`triage-${tx.id}`;
  const triageDecision=saved[triageKey]?.["Based on the transaction details and risk score, how would you classify this alert?"];

  const handleExpTabChange=(tabId)=>{setExpTab(tabId);setExpTabStartTime(Date.now());};
  const handleSave=(k,d)=>{
    setSaved(s=>({...s,[k]:d}));
    fetch(SHEET_URL,{method:"POST",body:JSON.stringify({participant_id:participantId,key:k,...d})}).catch(()=>{});
  };

  return(
    <div style={{fontFamily:"system-ui,sans-serif",padding:"1rem 0",maxWidth:1200,margin:"0 auto"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{marginBottom:12,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{fontSize:20,fontWeight:700,color:"#1e293b"}}>Fraud Detection — XAI Study Dashboard</div>
        <button onClick={()=>setShowMeta(m=>!m)} style={{padding:"2px 8px",borderRadius:6,border:"1px solid #ddd",background:"#f9f9f9",color:"#bbb",fontSize:10,cursor:"pointer"}}>{showMeta?"hide":"···"}</button>
        {showMeta&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <Badge label="IEEE-CIS Fraud Detection dataset (Kaggle, 2019)" col="#2980b9" bg="#e8f0fe"/>
          <Badge label="XGBoost · real TreeSHAP & LIME values" col="#555" bg="#f0f0f0"/>
          <Badge label="llama-3.1-8b-instant · Groq API" col="#e65c00" bg="#fff3e0"/>
        </div>}
        <div style={{marginLeft:"auto"}}>
          <span style={{fontSize:11,color:"#aaa"}}>Participant ID: <strong style={{color:"#555",fontFamily:"monospace"}}>{participantId}</strong></span>
        </div>
      </div>

      {isTriage&&<div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
        {Object.entries(TRUTH_CFG).map(([k,v])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:8,background:v.bg,border:`1px solid ${v.col}30`}}>
            <span style={{fontSize:13,color:v.col,fontWeight:700}}>{v.icon}</span>
            <span style={{fontSize:11,color:v.col,fontWeight:500}}>{v.label}</span>
          </div>
        ))}
      </div>}

      {/* Workflow stepper */}
      <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,padding:"10px 14px",marginBottom:12}}>
        <div style={{fontSize:10,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Evaluation workflow — 2 tasks</div>
        <div style={{display:"flex",gap:6,marginBottom:8}}>
          {WORKFLOW.map((w,i)=>(
            <div key={w.id} style={{flex:1,display:"flex",alignItems:"center"}}>
              <button onClick={()=>{setStep(w.id);setSelected(0);}} style={{flex:1,padding:"8px 4px",border:`1px solid ${step===w.id?w.col:"#e8e8e8"}`,borderRadius:8,background:step===w.id?w.bg:"#fafafa",cursor:"pointer",textAlign:"center"}}>
                <div style={{fontSize:15}}>{w.icon}</div>
                <div style={{fontSize:11,color:step===w.id?w.col:"#666",fontWeight:step===w.id?600:400}}>{w.label}</div>
              </button>
              {i<WORKFLOW.length-1&&<div style={{width:12,height:1,background:"#ddd",flexShrink:0}}/>}
            </div>
          ))}
        </div>
        {isTriage&&(
          <div style={{fontSize:15,fontWeight:500,color:"#334155",lineHeight:1.6,padding:"10px 14px",background:"#f9f9f9",borderRadius:6}}>
            Review the transaction details and fraud risk score below. Based only on this information, classify the alert and record your confidence. Do not proceed to explanations yet.
          </div>
        )}
        {!isTriage&&(
          <div>
            <div style={{fontSize:15,fontWeight:500,color:"#334155",lineHeight:1.6,padding:"10px 14px",background:"#f9f9f9",borderRadius:6,marginBottom:8}}>
              Review all 5 explanation types for each of the 4 transactions. For each explanation, rate its clarity and completeness, and record whether it changed your initial classification.
            </div>
            <div style={{display:"flex",gap:6}}>
              {task2Txns.map((t,i)=>{
                const isCurrent=txns[selected]?.id===t.id;
                const allRated=ALL_EXP_TABS.every(tab=>saved[`escalate-${t.id}-${tab}`]);
                return(
                  <div key={t.id} onClick={()=>setSelected(i)} style={{flex:1,padding:"12px 8px",borderRadius:8,border:`2px solid ${isCurrent?"#7b5ea7":allRated?"#1a7a4a":"#e0e0e0"}`,background:isCurrent?"#f2eef9":allRated?"#f0fdf4":"#fafafa",cursor:"pointer",textAlign:"center"}}>
                    <div style={{fontSize:15,fontWeight:700,color:isCurrent?"#7b5ea7":allRated?"#1a7a4a":"#555"}}>TXN {i+1}</div>
                    {allRated&&<div style={{fontSize:11,color:"#1a7a4a",marginTop:4,fontWeight:600}}>✓ Done</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main layout */}
      <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:12}}>
        <SingleNav txns={txns} selected={selected} onSelect={setSelected}/>
        <div>
          <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,padding:"16px",marginBottom:12}}>
            <TxnDetail tx={tx} showTruth={!isTriage}/>
          </div>

          {isTriage&&(
            <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,padding:"14px",marginBottom:12}}>
              <EvalWidget step={step} expTab={expTab} saved={saved} onSave={handleSave} txId={tx.id}/>
            </div>
          )}

          {!isTriage&&(
            <div style={{background:"#fff",border:"1px solid #e8e8e8",borderRadius:10,padding:"14px",marginBottom:12}}>
              <div style={{fontSize:10,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Explanation view</div>
              {EXP_GROUPS.map(g=>(
                <div key={g.label} style={{marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontSize:10,fontWeight:600,color:g.col,minWidth:170,flexShrink:0}}>{g.label}</span>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {g.tabs.map(t=>(
                        <button key={t.id} onClick={()=>handleExpTabChange(t.id)}
                          style={{padding:"4px 12px",fontSize:11,border:`1px solid ${expTab===t.id?g.col:"#e0e0e0"}`,borderRadius:16,background:expTab===t.id?g.bg:"#fff",color:expTab===t.id?g.col:"#888",cursor:"pointer",fontWeight:expTab===t.id?600:400}}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <span style={{fontSize:10,color:"#ccc",fontStyle:"italic",marginLeft:"auto"}}>{g.desc}</span>
                  </div>
                </div>
              ))}
              <div style={{borderTop:"1px solid #f0f0f0",paddingTop:14,marginTop:6}}>
                {expTab==="shap"           &&<ShapPanel tx={tx}/>}
                {expTab==="lime"           &&<LimePanel tx={tx}/>}
                {expTab==="llm"            &&<LLMPanel key={tx.id} tx={tx} score={score}/>}
                {expTab==="counterfactual" &&<CounterfactualPanel tx={tx}/>}
                {expTab==="peers"          &&<PeersPanel tx={tx}/>}
              </div>
              <EscalateEvalWidget
                expTab={TAB_ID_TO_LABEL[expTab]||expTab}
                expTabStartTime={expTabStartTime}
                txId={tx.id}
                saved={saved}
                onSave={handleSave}
                triageDecision={triageDecision}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}