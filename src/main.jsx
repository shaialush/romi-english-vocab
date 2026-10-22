import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { words, romiReviewEnglish } from './words';
import { unseenTitle, unseenParagraphs, unseenQuestions } from './unseen';
import { generateReading } from './generator';
import './style.css';
import './manage.css';

const KEY='romi-word-bloom-v1';
const LIST_KEY='romi-word-bloom-list-v1';
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{}}catch{return {}}};
const defaultSelected=words.filter(w=>romiReviewEnglish.includes(w.en)).map(w=>w.id);
const loadList=()=>{try{const saved=JSON.parse(localStorage.getItem(LIST_KEY));return saved&&Array.isArray(saved.selected)&&Array.isArray(saved.custom)?saved:{selected:defaultSelected,custom:[]}}catch{return {selected:defaultSelected,custom:[]}}};
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const speak=t=>{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=.82;speechSynthesis.speak(u)};

function App(){
 const [view,setView]=useState('home'),[stats,setStats]=useState(load),[search,setSearch]=useState(''),[wordList,setWordList]=useState(loadList);
 useEffect(()=>localStorage.setItem(KEY,JSON.stringify(stats)),[stats]);
 useEffect(()=>localStorage.setItem(LIST_KEY,JSON.stringify(wordList)),[wordList]);
 const allWords=useMemo(()=>[...words,...wordList.custom], [wordList.custom]);
 const activeWords=useMemo(()=>allWords.filter(w=>wordList.selected.includes(w.id)),[allWords,wordList.selected]);
 const known=activeWords.filter(w=>(stats[w.id]?.score||0)>=2).length;
 const shaky=activeWords.filter(w=>(stats[w.id]?.score||0)===1).length;
 const reset=()=>{if(confirm('למחוק את כל ההתקדמות ולהתחיל מחדש?'))setStats({})};
 return <main>
  <header><button className="logo" onClick={()=>setView('home')}><span>WB</span><b>WORD BLOOM</b></button><div className="header-actions"><span className="tiny">{known}/{activeWords.length} מילים בשליטה</span><button className="icon" onClick={reset} title="איפוס">↻</button></div></header>
  {view==='home'&&<Home known={known} shaky={shaky} total={activeWords.length} setView={setView}/>}
  {view==='learn'&&<Learn words={activeWords} stats={stats} setStats={setStats} done={()=>setView('home')}/>}
  {view==='test'&&<Test words={activeWords} stats={stats} setStats={setStats} done={()=>setView('home')}/>}
  {view==='recall'&&<RecallCheck words={activeWords} stats={stats} setStats={setStats} done={()=>setView('home')}/>}
  {view==='list'&&<WordList words={allWords} focusIds={wordList.selected} stats={stats} search={search} setSearch={setSearch} back={()=>setView('home')}/>}
  {view==='manage'&&<ManageWords allWords={allWords} wordList={wordList} setWordList={setWordList} back={()=>setView('home')}/>}
  {view==='unseen'&&<Unseen words={activeWords} back={()=>setView('home')}/>}
  {view==='create'&&<ReadingStudio words={activeWords} back={()=>setView('home')}/>}
 </main>
}

function Home({known,shaky,total,setView}){const pct=total?Math.round(known/total*100):0;return <>
 <section className="hero"><div className="eyebrow">היי רומי ✦ הגיע הזמן לפרוח</div><h1>מילים קטנות.<br/><em>ביטחון גדול.</em></h1><p>{total} מילות מיקוד שבחרת, בתרגול קצר וחכם.</p><button className="primary" disabled={!total} onClick={()=>setView('learn')}>מתחילים ללמוד <span>←</span></button></section>
 <section className="dashboard"><div className="progress-card"><div><small>ההתקדמות שלי</small><strong>{pct}%</strong></div><div className="bar"><i style={{width:pct+'%'}}/></div><p><b>{known}</b> מילים בשליטה · <b>{shaky}</b> בתרגול</p></div>
 <div className="choices"><button disabled={!total} onClick={()=>setView('learn')}><span className="blob coral">✦</span><div><b>תרגול חכם</b><small>כרטיסיות ממילות המיקוד</small></div><i>←</i></button><button disabled={!total} onClick={()=>setView('recall')}><span className="blob green">✎</span><div><b>בדיקת הבנת מילים</b><small>כותבים תרגום, ואם צריך מקבלים אפשרויות</small></div><i>←</i></button><button disabled={!total} onClick={()=>setView('test')}><span className="blob blue">✓</span><div><b>מבחן עצמי</b><small>עד 20 שאלות, ציון ומשוב</small></div><i>←</i></button><button disabled={!total} onClick={()=>setView('create')}><span className="blob purple">✨</span><div><b>יוצרים סיפור או Unseen</b><small>קטע חדש בלייב ממילות המיקוד</small></div><i>←</i></button><button onClick={()=>setView('unseen')}><span className="blob purple">U</span><div><b>Unseen מלא</b><small>קטע ארוך מוכן עם שאלות</small></div><i>←</i></button><button onClick={()=>setView('list')}><span className="blob yellow">A</span><div><b>כל המילים</b><small>המאגר המלא, תרגום והגייה</small></div><i>←</i></button><button onClick={()=>setView('manage')}><span className="blob pink">＋</span><div><b>בחירת מילות מיקוד</b><small>סימון, הוספה והסרה של מילים</small></div><i>←</i></button></div></section>
 </>}

function Learn({words,stats,setStats,done}){const deck=useMemo(()=>shuffle(words.flatMap(w=>Array(Math.max(1,3-(stats[w.id]?.score||0))).fill(w))),[]);const [n,setN]=useState(0),[flip,setFlip]=useState(false);const w=deck[n%deck.length];const grade=score=>{setStats(s=>({...s,[w.id]:{score,seen:(s[w.id]?.seen||0)+1}}));setFlip(false);if(n+1>=Math.min(deck.length,25))done();else setN(n+1)};return <section className="session"><SessionTop title="תרגול חכם" n={n+1} total={Math.min(deck.length,25)} back={done}/><p className="hint">חשבי על התרגום ואז הפכי את הכרטיס</p><button className={'flash '+(flip?'flipped':'')} onClick={()=>setFlip(!flip)}><div><small>{flip?'התרגום':'ENGLISH'}</small><h2 dir={flip?'rtl':'ltr'}>{flip?w.he:w.en}</h2>{!flip&&<span className="sound" onClick={e=>{e.stopPropagation();speak(w.en)}}>🔊 לשמוע</span>}<p>{flip?'לחצי שוב כדי לחזור':'לחצי כדי לגלות'}</p></div></button>{flip&&<div className="grades"><button onClick={()=>grade(0)}>לא ידעתי<br/><small>עוד מעט שוב</small></button><button onClick={()=>grade(1)}>כמעט<br/><small>צריך עוד חזרה</small></button><button onClick={()=>grade(3)}>ידעתי!<br/><small>מעולה</small></button></div>}</section>}

function SessionTop({title,n,total,back}){return <><div className="session-top"><button onClick={back}>✕</button><b>{title}</b><span>{n} / {total}</span></div><div className="session-bar"><i style={{width:(n/total*100)+'%'}}/></div></>}

const cleanHebrew=s=>s.trim().replace(/[־–—]/g,'-').replace(/[׳']/g,"'").replace(/[\s.,!?]/g,'').replace(/^(ל|ה)(?=.{2,})/,'');
const acceptedTranslations=he=>he.split(/[;،]/).flatMap(part=>part.split('/')).map(cleanHebrew).filter(Boolean);
function translationMatches(input,he){const typed=cleanHebrew(input);return typed.length>1&&acceptedTranslations(he).some(answer=>typed===answer||typed.includes(answer)||answer.includes(typed))}

function RecallCheck({words,stats,setStats,done}){
 const total=Math.min(15,words.length);
 const deck=useMemo(()=>shuffle([...words].sort((a,b)=>(stats[a.id]?.score||0)-(stats[b.id]?.score||0)).slice(0,45)).slice(0,total),[]);
 const [n,setN]=useState(0),[typed,setTyped]=useState(''),[stage,setStage]=useState('write'),[result,setResult]=useState(null),[score,setScore]=useState(0);
 const w=deck[n];
 const options=useMemo(()=>w?shuffle([w,...shuffle(words.filter(x=>x.id!==w.id)).slice(0,3)]):[],[w]);
 const updateWord=(success,points)=>setStats(s=>({...s,[w.id]:{score:success?Math.min(3,(s[w.id]?.score||0)+points):0,seen:(s[w.id]?.seen||0)+1}}));
 const checkTyped=e=>{e?.preventDefault();if(!typed.trim())return;const right=translationMatches(typed,w.he);if(right){setResult('typed-right');setScore(x=>x+2);updateWord(true,2)}else{setStage('choices');setResult('try-again')}};
 const choose=id=>{if(result==='choice-right'||result==='choice-wrong')return;const right=id===w.id;setResult(right?'choice-right':'choice-wrong');if(right){setScore(x=>x+1);updateWord(true,1)}else updateWord(false,0)};
 const next=()=>{if(n+1===total){setN(total);return}setN(x=>x+1);setTyped('');setStage('write');setResult(null)};
 if(n===total)return <section className="result"><div className="result-ring"><strong>{score}</strong><span>מתוך {total*2}</span></div><h1>{score>=26?'שליפה מעולה!':score>=19?'עבודה יפה!':'יש לנו מה לחזק'}</h1><p>תשובה מהזיכרון שווה 2 נקודות, וזיהוי מתוך אפשרויות שווה נקודה. מילים קשות יחזרו בתרגול החכם.</p><button className="primary" onClick={done}>חזרה לדף הבית</button></section>;
 return <section className="session recall"><SessionTop title="בדיקת הבנת מילים" n={n+1} total={total} back={done}/><div className="recall-score">ניקוד: <b>{score}</b> · נסי קודם לשלוף מהזיכרון</div><div className="question"><small>מה פירוש המילה?</small><h2 dir="ltr">{w.en}</h2><button onClick={()=>speak(w.en)}>🔊</button></div>
 {stage==='write'?<form className="recall-form" onSubmit={checkTyped}><label htmlFor="translation">כתבי את התרגום בעברית</label><div><input id="translation" autoFocus autoComplete="off" value={typed} onChange={e=>setTyped(e.target.value)} placeholder="התשובה שלי..."/><button disabled={!typed.trim()}>בדיקה</button></div><button type="button" className="dont-know" onClick={()=>{setStage('choices');setResult('try-again')}}>לא יודעת עדיין — תנו לי אפשרויות</button></form>:<><div className="recall-nudge">{result==='try-again'?'כמעט — עכשיו בחרי את התרגום הנכון:':'בחרי את התרגום הנכון:'}</div><div className="answers">{options.map(a=><button key={a.id} onClick={()=>choose(a.id)} className={!['choice-right','choice-wrong'].includes(result)?'':a.id===w.id?'right':result==='choice-wrong'?'muted':''}>{a.he}</button>)}</div></>}
 {result==='typed-right'&&<div className="feedback yes"><b>בדיוק! שלפת מהזיכרון 🌟</b><span>{w.en} = {w.he}</span><button onClick={next}>{n+1===total?'לתוצאות':'למילה הבאה'} ←</button></div>}
 {['choice-right','choice-wrong'].includes(result)&&<div className={'feedback '+(result==='choice-right'?'yes':'no')}><b>{result==='choice-right'?'מצוין — עכשיו זה יישב טוב יותר':'לא נורא — הנה התשובה הנכונה'}</b><span>{w.en} = {w.he}</span><button onClick={next}>{n+1===total?'לתוצאות':'למילה הבאה'} ←</button></div>}
 </section>
}

function Test({words,stats,setStats,done}){const qs=useMemo(()=>shuffle(words).slice(0,20).map((w,i)=>{const reverse=i%3===2;const pool=shuffle(words.filter(x=>x.id!==w.id)).slice(0,3);return {w,reverse,answers:shuffle([w,...pool])}}),[]);const total=qs.length;const [n,setN]=useState(0),[pick,setPick]=useState(null),[correct,setCorrect]=useState(0);const q=qs[n];const answer=id=>{if(pick!==null)return;setPick(id);if(id===q.w.id){setCorrect(c=>c+1);setStats(s=>({...s,[q.w.id]:{score:Math.min(3,(s[q.w.id]?.score||0)+1),seen:(s[q.w.id]?.seen||0)+1}}))}else setStats(s=>({...s,[q.w.id]:{score:0,seen:(s[q.w.id]?.seen||0)+1}}))};const next=()=>{if(n===total-1)setN(total);else{setN(n+1);setPick(null)}};if(n===total)return <Result score={correct} total={total} done={done} retry={()=>{setN(0);setCorrect(0);setPick(null)}}/>;return <section className="session test"><SessionTop title="מבחן עצמי" n={n+1} total={total} back={done}/><div className="question"><small>{q.reverse?'מה המילה באנגלית?':'מה התרגום הנכון?'}</small><h2 dir={q.reverse?'rtl':'ltr'}>{q.reverse?q.w.he:q.w.en}</h2>{!q.reverse&&<button onClick={()=>speak(q.w.en)}>🔊</button>}</div><div className="answers">{q.answers.map(a=><button key={a.id} onClick={()=>answer(a.id)} className={pick===null?'':a.id===q.w.id?'right':a.id===pick?'wrong':'muted'}>{q.reverse?a.en:a.he}</button>)}</div>{pick!==null&&<div className={'feedback '+(pick===q.w.id?'yes':'no')}><b>{pick===q.w.id?'יפה מאוד! 🌟':'כמעט — עכשיו זה יישב בזיכרון'}</b>{pick!==q.w.id&&<span>התשובה: {q.reverse?q.w.en:q.w.he}</span>}<button onClick={next}>{n===total-1?'לתוצאות':'לשאלה הבאה'} ←</button></div>}</section>}

function Result({score,total,done,retry}){const grade=Math.round(score/total*100);return <section className="result"><div className="result-ring"><strong>{grade}</strong><span>מתוך 100</span></div><h1>{grade>=90?'וואו, את מוכנה!':grade>=70?'עבודה מצוינת!':'התחלה טובה!'}</h1><p>{score} תשובות נכונות מתוך {total}. המילים שהתפספסו חזרו אוטומטית לתרגול.</p><button className="primary" onClick={retry}>מבחן נוסף</button><button className="text-btn" onClick={done}>חזרה לדף הבית</button></section>}

function WordList({words,focusIds,stats,search,setSearch,back}){const list=words.filter(w=>(w.en+' '+w.he).toLowerCase().includes(search.toLowerCase()));return <section className="word-page"><div className="list-head"><button onClick={back}>→</button><div><small>ALL WORDS</small><h1>כל המילים</h1></div></div><div className="search">⌕<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="חיפוש בעברית או באנגלית..."/></div><p className="count">{list.length} מילים · 🌸 מסמן מילת מיקוד</p><div className="word-grid">{list.map(w=><article key={w.id}><button onClick={()=>speak(w.en)}>🔊</button><div><b dir="ltr">{w.en}</b><span>{w.he}</span></div><i className={focusIds.includes(w.id)?'focus':(stats[w.id]?.score||0)>=2?'known':(stats[w.id]?.score||0)?'learning':''}>{focusIds.includes(w.id)?'🌸':(stats[w.id]?.score||0)>=2?'✓':'•'}</i></article>)}</div></section>}

function ManageWords({allWords,wordList,setWordList,back}){
 const [query,setQuery]=useState(''),[en,setEn]=useState(''),[he,setHe]=useState('');
 const visible=allWords.filter(w=>(w.en+' '+w.he).toLowerCase().includes(query.toLowerCase()));
 const toggle=id=>setWordList(s=>({...s,selected:s.selected.includes(id)?s.selected.filter(x=>x!==id):[...s.selected,id]}));
 const restore=()=>setWordList(s=>({...s,selected:[...defaultSelected]}));
 const add=e=>{e.preventDefault();const english=en.trim(),hebrew=he.trim();if(!english||!hebrew)return;const existing=allWords.find(w=>w.en.toLowerCase()===english.toLowerCase());if(existing){setWordList(s=>({...s,selected:s.selected.includes(existing.id)?s.selected:[...s.selected,existing.id]}))}else{const w={id:'custom-'+Date.now(),en:english,he:hebrew};setWordList(s=>({...s,custom:[...s.custom,w],selected:[...s.selected,w.id]}))}setEn('');setHe('')};
 const removeCustom=id=>setWordList(s=>({...s,custom:s.custom.filter(w=>w.id!==id),selected:s.selected.filter(x=>x!==id)}));
 return <section className="word-page manage-page"><div className="list-head"><button onClick={back}>→</button><div><small>FOCUS WORDS</small><h1>בחירת מילות מיקוד</h1></div></div>
  <div className="manage-summary"><div><strong>{wordList.selected.length}</strong><span>מילים מסומנות לתרגול וליצירת קטעים</span></div><button onClick={restore}>בחירת 54 המילים של רומי</button></div>
  <form className="add-word" onSubmit={add}><div><b>הוספת מילה חדשה</b><small>המילה תיבחר אוטומטית לתרגול</small></div><input dir="ltr" value={en} onChange={e=>setEn(e.target.value)} placeholder="English word"/><input value={he} onChange={e=>setHe(e.target.value)} placeholder="תרגום בעברית"/><button disabled={!en.trim()||!he.trim()}>הוספה +</button></form>
  <div className="manage-tools"><div className="search">⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="חיפוש ברשימה..."/></div><button onClick={()=>setWordList(s=>({...s,selected:allWords.map(w=>w.id)}))}>בחירת הכול</button><button onClick={()=>setWordList(s=>({...s,selected:[]}))}>ניקוי הכול</button></div>
  <div className="select-grid">{visible.map(w=><article className={wordList.selected.includes(w.id)?'selected':''} key={w.id}><label><input type="checkbox" checked={wordList.selected.includes(w.id)} onChange={()=>toggle(w.id)}/><span className="checkmark">✓</span><span><b dir="ltr">{w.en}</b><small>{w.he}</small></span></label>{String(w.id).startsWith('custom-')&&<button className="delete-word" onClick={()=>removeCustom(w.id)} title="מחיקה">×</button>}</article>)}</div>
 </section>
}

function MarkedText({text,words}){const targetWords=[...words].sort((a,b)=>b.en.length-a.en.length);if(!targetWords.length)return text;const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const pattern=new RegExp(`(${targetWords.map(w=>escape(w.en)).join('|')})`,'gi');return text.split(pattern).map((part,i)=>{const w=targetWords.find(x=>x.en.toLowerCase()===part.toLowerCase());return w?<mark key={i} title={w.he}>{part}</mark>:part})}

function ReadingStudio({words,back}){
 const [mode,setMode]=useState('unseen'),[reading,setReading]=useState(()=>generateReading(words,'unseen')),[answers,setAnswers]=useState({}),[checked,setChecked]=useState(false);
 const create=next=>{const chosen=next||mode;setMode(chosen);setReading(generateReading(words,chosen));setAnswers({});setChecked(false);scrollTo({top:0,behavior:'smooth'})};
 const multiple=reading.questions.filter(q=>q.type==='mc'),score=multiple.reduce((n,q,i)=>n+(Number(answers[i])===q.answer?1:0),0);
 return <section className="unseen-page studio-page"><div className="list-head"><button onClick={back}>→</button><div><small>LIVE READING STUDIO</small><h1>יוצרים קטע מהמילים שלי</h1></div></div>
  <div className="studio-controls"><div><b>מה ליצור?</b><p>כל יצירה משתמשת בעד 10 ממילות המיקוד שבחרת.</p></div><div className="mode-switch"><button className={mode==='story'?'active':''} onClick={()=>create('story')}>סיפור קצר</button><button className={mode==='unseen'?'active':''} onClick={()=>create('unseen')}>Unseen + שאלות</button></div><button className="generate" onClick={()=>create()}>✨ יצירה חדשה</button></div>
  <div className="used-words">{reading.targets.map(w=><span key={w.id} title={w.he}>{w.en}</span>)}</div>
  <article className="passage show-marks" dir="ltr" lang="en"><h2>{reading.title}</h2>{reading.paragraphs.map((p,i)=><p key={i}><span>{i+1}</span><MarkedText text={p} words={reading.targets}/></p>)}</article>
  {mode==='story'?<div className="story-finish"><b>Story challenge ✍️</b><p>בחרי שתי מילים מודגשות והמשיכי את הסיפור בעוד שני משפטים באנגלית.</p></div>:<section className="unseen-questions"><div className="questions-title"><small>COMPREHENSION</small><h2>Questions</h2></div>{reading.questions.map((q,i)=><div className="unseen-question" key={i} dir="ltr"><b>{i+1}. {q.q}</b>{q.type==='mc'?<div className="unseen-options">{q.options.map((o,j)=><label className={checked?(j===q.answer?'correct':Number(answers[i])===j?'incorrect':''):''} key={o}><input type="radio" name={'live'+i} checked={Number(answers[i])===j} onChange={()=>!checked&&setAnswers(a=>({...a,[i]:j}))}/><span>{o}</span></label>)}</div>:<><textarea value={answers[i]||''} onChange={e=>setAnswers(a=>({...a,[i]:e.target.value}))} disabled={checked} placeholder="Write your answer in English..."/>{checked&&<div className="model-answer"><b>Check your answer:</b> {q.model}</div>}</>}</div>)}
  {!checked?<button className="primary check-unseen" onClick={()=>setChecked(true)}>בדיקת תשובות</button>:<div className="unseen-result"><strong>{score}/{multiple.length}</strong><div><b>{score===multiple.length?'Excellent! 🌟':'Nice work — check the corrections'}</b><p>זה הציון על השאלות הסגורות.</p></div><button onClick={()=>create()}>קטע חדש</button></div>}</section>}
 </section>
}

function Unseen({words,back}){const [answers,setAnswers]=useState({}),[checked,setChecked]=useState(false),[showWords,setShowWords]=useState(true);const multiple=unseenQuestions.filter(q=>q.type==='mc');const score=multiple.reduce((n,q,i)=>n+(Number(answers[i])===q.answer?1:0),0);return <section className="unseen-page">
 <div className="list-head"><button onClick={back}>→</button><div><small>READING PRACTICE</small><h1>תרגול Unseen</h1></div></div>
 <div className="unseen-intro"><div><span>כ־10 דקות קריאה</span><h2>{unseenTitle}</h2><p>קראי את הסיפור ועני באנגלית. נסי להבין מההקשר לפני שאת בודקת מילה.</p></div><button onClick={()=>setShowWords(v=>!v)}>{showWords?'הסתרת':'הצגת'} מילות המבחן</button></div>
 <article className={'passage '+(showWords?'show-marks':'')} dir="ltr" lang="en">{unseenParagraphs.map((p,i)=><p key={i}><span>{i+1}</span><MarkedText text={p} words={words}/></p>)}</article>
 <section className="unseen-questions"><div className="questions-title"><small>COMPREHENSION</small><h2>Questions</h2><p>Answer the questions according to the text.</p></div>{unseenQuestions.map((q,i)=><div className="unseen-question" key={i} dir="ltr"><b>{i+1}. {q.q}</b>{q.type==='mc'?<div className="unseen-options">{q.options.map((o,j)=><label className={checked?(j===q.answer?'correct':Number(answers[i])===j?'incorrect':''):''} key={o}><input type="radio" name={'q'+i} checked={Number(answers[i])===j} onChange={()=>!checked&&setAnswers(a=>({...a,[i]:j}))}/><span>{o}</span></label>)}</div>:<><textarea value={answers[i]||''} onChange={e=>setAnswers(a=>({...a,[i]:e.target.value}))} disabled={checked} placeholder="Write your answer in English..."/>{checked&&<div className="model-answer"><b>Check your answer:</b> {q.model}</div>}</>}</div>)}
 {!checked?<button className="primary check-unseen" onClick={()=>setChecked(true)}>בדיקת תשובות</button>:<div className="unseen-result"><strong>{score}/{multiple.length}</strong><div><b>{score>=7?'Excellent reading! 🌟':score>=5?'Nice work — read the corrections carefully':'Good start — go back to the marked paragraphs'}</b><p>זה הציון על השאלות הסגורות. בשאלות הפתוחות השווי לתשובת הבדיקה.</p></div><button onClick={()=>{setAnswers({});setChecked(false);scrollTo({top:0,behavior:'smooth'})}}>לנסות מחדש</button></div>}
 </section></section>}

createRoot(document.getElementById('root')).render(<App/>);
