import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { words } from './words';
import { unseenTitle, unseenParagraphs, unseenQuestions } from './unseen';
import './style.css';

const KEY='romi-word-bloom-v1';
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{}}catch{return {}}};
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const speak=t=>{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=.82;speechSynthesis.speak(u)};

function App(){
 const [view,setView]=useState('home'),[stats,setStats]=useState(load),[search,setSearch]=useState('');
 useEffect(()=>localStorage.setItem(KEY,JSON.stringify(stats)),[stats]);
 const known=words.filter(w=>(stats[w.id]?.score||0)>=2).length;
 const shaky=words.filter(w=>(stats[w.id]?.score||0)===1).length;
 const reset=()=>{if(confirm('למחוק את כל ההתקדמות ולהתחיל מחדש?'))setStats({})};
 return <main>
  <header><button className="logo" onClick={()=>setView('home')}><span>WB</span><b>WORD BLOOM</b></button><div className="header-actions"><span className="tiny">{known}/{words.length} מילים בשליטה</span><button className="icon" onClick={reset} title="איפוס">↻</button></div></header>
  {view==='home'&&<Home known={known} shaky={shaky} setView={setView}/>} 
  {view==='learn'&&<Learn stats={stats} setStats={setStats} done={()=>setView('home')}/>} 
  {view==='test'&&<Test stats={stats} setStats={setStats} done={()=>setView('home')}/>} 
  {view==='list'&&<WordList stats={stats} search={search} setSearch={setSearch} back={()=>setView('home')}/>} 
  {view==='unseen'&&<Unseen back={()=>setView('home')}/>} 
 </main>
}

function Home({known,shaky,setView}){const pct=Math.round(known/words.length*100);return <>
 <section className="hero"><div className="eyebrow">היי רומי ✦ הגיע הזמן לפרוח</div><h1>מילים קטנות.<br/><em>ביטחון גדול.</em></h1><p>כל {words.length} המילים מהמבחן שלך, בתרגול קצר וחכם.</p><button className="primary" onClick={()=>setView('learn')}>מתחילים ללמוד <span>←</span></button></section>
 <section className="dashboard"><div className="progress-card"><div><small>ההתקדמות שלי</small><strong>{pct}%</strong></div><div className="bar"><i style={{width:pct+'%'}}/></div><p><b>{known}</b> מילים בשליטה · <b>{shaky}</b> בתרגול</p></div>
 <div className="choices"><button onClick={()=>setView('learn')}><span className="blob coral">✦</span><div><b>תרגול חכם</b><small>כרטיסיות שחוזרות בדיוק בזמן</small></div><i>←</i></button><button onClick={()=>setView('test')}><span className="blob blue">✓</span><div><b>מבחן עצמי</b><small>20 שאלות, ציון ומשוב</small></div><i>←</i></button><button onClick={()=>setView('unseen')}><span className="blob purple">U</span><div><b>תרגול Unseen</b><small>סיפור, הבנת הנקרא ושאלות</small></div><i>←</i></button><button onClick={()=>setView('list')}><span className="blob yellow">A</span><div><b>כל המילים</b><small>חיפוש, תרגום והגייה</small></div><i>←</i></button></div></section>
 </>}

function Learn({stats,setStats,done}){const deck=useMemo(()=>shuffle(words.flatMap(w=>Array(Math.max(1,3-(stats[w.id]?.score||0))).fill(w))),[]);const [n,setN]=useState(0),[flip,setFlip]=useState(false);const w=deck[n%deck.length];const grade=score=>{setStats(s=>({...s,[w.id]:{score,seen:(s[w.id]?.seen||0)+1}}));setFlip(false);if(n+1>=Math.min(deck.length,25))done();else setN(n+1)};return <section className="session"><SessionTop title="תרגול חכם" n={n+1} total={Math.min(deck.length,25)} back={done}/><p className="hint">חשבי על התרגום ואז הפכי את הכרטיס</p><button className={'flash '+(flip?'flipped':'')} onClick={()=>setFlip(!flip)}><div><small>{flip?'התרגום':'ENGLISH'}</small><h2 dir={flip?'rtl':'ltr'}>{flip?w.he:w.en}</h2>{!flip&&<span className="sound" onClick={e=>{e.stopPropagation();speak(w.en)}}>🔊 לשמוע</span>}<p>{flip?'לחצי שוב כדי לחזור':'לחצי כדי לגלות'}</p></div></button>{flip&&<div className="grades"><button onClick={()=>grade(0)}>לא ידעתי<br/><small>עוד מעט שוב</small></button><button onClick={()=>grade(1)}>כמעט<br/><small>צריך עוד חזרה</small></button><button onClick={()=>grade(3)}>ידעתי!<br/><small>מעולה</small></button></div>}</section>}

function SessionTop({title,n,total,back}){return <><div className="session-top"><button onClick={back}>✕</button><b>{title}</b><span>{n} / {total}</span></div><div className="session-bar"><i style={{width:(n/total*100)+'%'}}/></div></>}

function Test({stats,setStats,done}){const qs=useMemo(()=>shuffle(words).slice(0,20).map((w,i)=>{const reverse=i%3===2;const pool=shuffle(words.filter(x=>x.id!==w.id)).slice(0,3);return {w,reverse,answers:shuffle([w,...pool])}}),[]);const [n,setN]=useState(0),[pick,setPick]=useState(null),[correct,setCorrect]=useState(0);const q=qs[n];const answer=id=>{if(pick!==null)return;setPick(id);if(id===q.w.id){setCorrect(c=>c+1);setStats(s=>({...s,[q.w.id]:{score:Math.min(3,(s[q.w.id]?.score||0)+1),seen:(s[q.w.id]?.seen||0)+1}}))}else setStats(s=>({...s,[q.w.id]:{score:0,seen:(s[q.w.id]?.seen||0)+1}}))};const next=()=>{if(n===19)setN(20);else{setN(n+1);setPick(null)}};if(n===20)return <Result score={correct} done={done} retry={()=>{setN(0);setCorrect(0);setPick(null)}}/>;return <section className="session test"><SessionTop title="מבחן עצמי" n={n+1} total={20} back={done}/><div className="question"><small>{q.reverse?'מה המילה באנגלית?':'מה התרגום הנכון?'}</small><h2 dir={q.reverse?'rtl':'ltr'}>{q.reverse?q.w.he:q.w.en}</h2>{!q.reverse&&<button onClick={()=>speak(q.w.en)}>🔊</button>}</div><div className="answers">{q.answers.map(a=><button key={a.id} onClick={()=>answer(a.id)} className={pick===null?'':a.id===q.w.id?'right':a.id===pick?'wrong':'muted'}>{q.reverse?a.en:a.he}</button>)}</div>{pick!==null&&<div className={'feedback '+(pick===q.w.id?'yes':'no')}><b>{pick===q.w.id?'יפה מאוד! 🌟':'כמעט — עכשיו זה יישב בזיכרון'}</b>{pick!==q.w.id&&<span>התשובה: {q.reverse?q.w.en:q.w.he}</span>}<button onClick={next}>{n===19?'לתוצאות':'לשאלה הבאה'} ←</button></div>}</section>}

function Result({score,done,retry}){return <section className="result"><div className="result-ring"><strong>{score*5}</strong><span>מתוך 100</span></div><h1>{score>=18?'וואו, את מוכנה!':score>=14?'עבודה מצוינת!':'התחלה טובה!'}</h1><p>{score} תשובות נכונות מתוך 20. המילים שהתפספסו חזרו אוטומטית לתרגול.</p><button className="primary" onClick={retry}>מבחן נוסף</button><button className="text-btn" onClick={done}>חזרה לדף הבית</button></section>}

function WordList({stats,search,setSearch,back}){const list=words.filter(w=>(w.en+' '+w.he).toLowerCase().includes(search.toLowerCase()));return <section className="word-page"><div className="list-head"><button onClick={back}>→</button><div><small>LOOKING BACK</small><h1>כל המילים</h1></div></div><div className="search">⌕<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="חיפוש בעברית או באנגלית..."/></div><p className="count">{list.length} מילים</p><div className="word-grid">{list.map(w=><article key={w.id}><button onClick={()=>speak(w.en)}>🔊</button><div><b dir="ltr">{w.en}</b><span>{w.he}</span></div><i className={(stats[w.id]?.score||0)>=2?'known':(stats[w.id]?.score||0)?'learning':''}>{(stats[w.id]?.score||0)>=2?'✓':'•'}</i></article>)}</div></section>}

const targetWords=[...words].sort((a,b)=>b.en.length-a.en.length);
function MarkedText({text}){const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const pattern=new RegExp(`(${targetWords.map(w=>escape(w.en)).join('|')})`,'gi');return text.split(pattern).map((part,i)=>{const w=targetWords.find(x=>x.en.toLowerCase()===part.toLowerCase());return w?<mark key={i} title={w.he}>{part}</mark>:part})}

function Unseen({back}){const [answers,setAnswers]=useState({}),[checked,setChecked]=useState(false),[showWords,setShowWords]=useState(true);const multiple=unseenQuestions.filter(q=>q.type==='mc');const score=multiple.reduce((n,q,i)=>n+(Number(answers[i])===q.answer?1:0),0);return <section className="unseen-page">
 <div className="list-head"><button onClick={back}>→</button><div><small>READING PRACTICE</small><h1>תרגול Unseen</h1></div></div>
 <div className="unseen-intro"><div><span>כ־10 דקות קריאה</span><h2>{unseenTitle}</h2><p>קראי את הסיפור ועני באנגלית. נסי להבין מההקשר לפני שאת בודקת מילה.</p></div><button onClick={()=>setShowWords(v=>!v)}>{showWords?'הסתרת':'הצגת'} מילות המבחן</button></div>
 <article className={'passage '+(showWords?'show-marks':'')} dir="ltr" lang="en">{unseenParagraphs.map((p,i)=><p key={i}><span>{i+1}</span><MarkedText text={p}/></p>)}</article>
 <section className="unseen-questions"><div className="questions-title"><small>COMPREHENSION</small><h2>Questions</h2><p>Answer the questions according to the text.</p></div>{unseenQuestions.map((q,i)=><div className="unseen-question" key={i} dir="ltr"><b>{i+1}. {q.q}</b>{q.type==='mc'?<div className="unseen-options">{q.options.map((o,j)=><label className={checked?(j===q.answer?'correct':Number(answers[i])===j?'incorrect':''):''} key={o}><input type="radio" name={'q'+i} checked={Number(answers[i])===j} onChange={()=>!checked&&setAnswers(a=>({...a,[i]:j}))}/><span>{o}</span></label>)}</div>:<><textarea value={answers[i]||''} onChange={e=>setAnswers(a=>({...a,[i]:e.target.value}))} disabled={checked} placeholder="Write your answer in English..."/>{checked&&<div className="model-answer"><b>Check your answer:</b> {q.model}</div>}</>}</div>)}
 {!checked?<button className="primary check-unseen" onClick={()=>setChecked(true)}>בדיקת תשובות</button>:<div className="unseen-result"><strong>{score}/{multiple.length}</strong><div><b>{score>=7?'Excellent reading! 🌟':score>=5?'Nice work — read the corrections carefully':'Good start — go back to the marked paragraphs'}</b><p>זה הציון על השאלות הסגורות. בשאלות הפתוחות השווי לתשובת הבדיקה.</p></div><button onClick={()=>{setAnswers({});setChecked(false);scrollTo({top:0,behavior:'smooth'})}}>לנסות מחדש</button></div>}
 </section></section>}

createRoot(document.getElementById('root')).render(<App/>);
