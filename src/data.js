export const emotions = ['Anger', 'Happiness', 'Neutral', 'Sadness', 'Fear', 'Disgust', 'Other / mixed', 'Uncertain'];
const codes = {ANG:'Anger',HAP:'Happiness',NEU:'Neutral',SAD:'Sadness'};
const sentences = {DFA:"Don't forget a jacket.",TIE:'That is exactly what happened.'};
export const samples = ['1001','1002'].flatMap(speaker=>Object.entries(sentences).flatMap(([sentence,text])=>Object.entries(codes).map(([code,intended])=>({id:`${speaker}_${sentence}_${code}_XX`,speaker,text,intended,language:'English',source:'CREMA-D',group:`${speaker}_${sentence}`,url:`${import.meta.env.BASE_URL}audio/${speaker}_${sentence}_${code}_XX.wav`})))).filter(c=>c.id!=='1002_TIE_NEU_XX').map((c,i)=>({...c,sourceId:c.id,id:`sample-${String(i+1).padStart(2,'0')}`}));
export const contexts = {
  none:{label:'No added context',text:'Listen to the utterance on its own.'},
  concern:{label:'Concern',text:'Illustrative scenario: The speaker is worried about someone leaving in cold weather. They want that person to stay comfortable.'},
  conflict:{label:'Disagreement',text:'Illustrative scenario: The speaker has been disagreeing with a friend and feels unheard. This line comes after the disagreement.'},
  relief:{label:'Relief',text:'Illustrative scenario: A misunderstanding has just been resolved. The speaker is relieved and the conversation is calming down.'},
  custom:{label:'Your own scenario',text:''}
};
