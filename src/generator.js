const themes = [
  { title: 'The School Garden Project', hero: 'Noa', place: 'the school garden', goal: 'make the neighborhood greener' },
  { title: 'The Mystery at the Community Center', hero: 'Maya', place: 'the community center', goal: 'solve a surprising problem' },
  { title: 'A Small Idea, A Big Change', hero: 'Alex', place: 'a small town', goal: 'help people work together' },
  { title: 'The Future Fair', hero: 'Dana', place: 'the school science fair', goal: 'build a useful new project' },
];
const adverbs = new Set(['artificially','automatically','currently','financially','hardly','increasingly','personally','practically','primarily','virtually']);
const adjectives = new Set(['controversial','developed','efficient','elderly','extreme','impressive','instant','likely','limited','particular','private','promising','rural','self-service','significant','wise']);
const verbs = new Set(['absorb','access','appeal','aspire','avoid','check in','counteract','determine','download','exchange','expand','face','fire','get rid of','interact','keep track of','launch','lower','predict','promote','purchase','recycle','reflect','relate to','research','reverse','review','spray','sponsor','take action','take over']);
const fixed = {
  'believe it or not': h => `Believe it or not, ${h}'s idea soon attracted everyone's attention.`,
  'for the moment': (h,p) => `For the moment, the team decided to test the plan at ${p}.`,
  'in the first place': () => `They remembered why they had started the project in the first place.`,
  'in the long run': () => `In the long run, they hoped their work would help many people.`,
  'in the meantime': h => `In the meantime, ${h} wrote down every new result.`,
  'in theory': () => `In theory, the plan was simple, but real life made it more interesting.`,
  'in place of': () => `They used recycled boxes in place of new plastic containers.`,
  'more and more': () => `More and more students came to help after school.`,
  'make sense': () => `At last, the strange results began to make sense.`,
  'pros and cons': () => `The group discussed the pros and cons before making a decision.`,
  'run out of': () => `Halfway through the work, they began to run out of time.`,
  'set an example': h => `${h} wanted the project to set an example for other schools.`,
  'take seriously': () => `The adults promised to take the students' ideas seriously.`,
  'the reality': () => `The reality was harder than the team had expected.`,
  'with regard to': () => `With regard to safety, the group followed every rule.`,
  'you never know': () => `You never know how far one good idea can travel.`,
  'human rights': () => `They agreed that human rights should guide every important decision.`,
  'take action': () => `Instead of waiting, the students decided to take action.`,
  'take over': h => `When ${h} was tired, a friend offered to take over.`,
  'get rid of': () => `Their first goal was to get rid of unnecessary waste.`,
  'keep track of': h => `${h} used a notebook to keep track of the team's progress.`,
  'relate to': () => `Every student could relate to the problem in a different way.`
};
const sentenceFor = (word, hero, place, index) => {
  const w=word.en;if(fixed[w])return fixed[w](hero,place);
  if(adverbs.has(w))return `The team worked ${w} and compared the new result with the old one.`;
  if(adjectives.has(w))return `Their solution seemed ${w}, so they decided to test it carefully.`;
  if(verbs.has(w))return `For the next step, they needed to ${w} the idea and learn from the result.`;
  return index%2?`The word “${w}” became important when the group discussed the project.`:`${hero} learned that ${w} could change the way people understood the problem.`;
};
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
export function generateReading(selectedWords,mode='unseen'){
 const theme=themes[Math.floor(Math.random()*themes.length)],targets=shuffle(selectedWords).slice(0,mode==='story'?8:10);
 const sentences=targets.map((w,i)=>sentenceFor(w,theme.hero,theme.place,i)),cut=Math.ceil(sentences.length/2);
 const paragraphs=[`${theme.hero} and three friends met at ${theme.place}. They wanted to ${theme.goal}, but they knew that a good result would require patience and teamwork.`,sentences.slice(0,cut).join(' '),sentences.slice(cut).join(' '),`By the end of the day, the project was not perfect, but the team had learned something valuable: asking questions and listening to others can turn a small idea into real change.`].filter(Boolean);
 const vocab=shuffle(targets).slice(0,Math.min(4,targets.length)).map(target=>{const options=shuffle([target,...shuffle(selectedWords.filter(w=>w.id!==target.id)).slice(0,3)]).map(w=>w.he);return{type:'mc',q:`What does “${target.en}” mean?`,options,answer:options.indexOf(target.he)}});
 const questions=mode==='unseen'?[{type:'mc',q:`Where did ${theme.hero} and the friends meet?`,options:shuffle([theme.place,'at the airport','inside a restaurant','on a beach']),answerText:theme.place},{type:'mc',q:'What helped the team make progress?',options:shuffle(['Patience and teamwork','Winning a prize','Working alone','Buying expensive tools']),answerText:'Patience and teamwork'},...vocab,{type:'open',q:'What lesson did the team learn?',model:'They learned that asking questions and listening to others can turn a small idea into real change.'},{type:'open',q:'Choose one highlighted word and write a new sentence with it.',model:'Check that the word fits the meaning of your sentence.'}].map(q=>q.type==='mc'&&q.answerText?{...q,answer:q.options.indexOf(q.answerText)}:q):[];
 return{title:theme.title,paragraphs,questions,targets};
}
