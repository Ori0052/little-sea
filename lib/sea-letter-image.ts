import {resolveLetter,type SavedLetter} from './sea-sleep';
export function letterFilename(letter:SavedLetter){return `little-sea-letter-${letter.date}-${String(resolveLetter(letter).id+1).padStart(2,'0')}.png`}

export async function renderLetterImage(letter:SavedLetter):Promise<File>{
 const story=resolveLetter(letter);
 await document.fonts.load('400 48px "Maru Buri"');
 const image=new Image();image.src=story.file;await image.decode();
 const canvas=document.createElement('canvas');canvas.width=1254;canvas.height=1254;
 const c=canvas.getContext('2d');if(!c)throw Error('image_unavailable');
 c.drawImage(image,0,0,1254,1254);
 c.textAlign='center';c.textBaseline='alphabetic';c.fontKerning='normal';
 if('letterSpacing' in c)c.letterSpacing='0px';
 const center=627,width=720,bodyFont=48,lineHeight=82;
 c.font=`400 ${bodyFont}px "Maru Buri", serif`;
 const lines=wrapLetterText(story.text,t=>c.measureText(t).width,width);
 // Use visible glyph bounds: the date, salutation and title have distinct gaps.
 function metrics(size:number){c!.font=`400 ${size}px "Maru Buri", serif`;const m=c!.measureText('가나다Ag');return {ascent:m.actualBoundingBoxAscent||size*.8,descent:m.actualBoundingBoxDescent||size*.2}}
 const date=metrics(27),greeting=metrics(30),title=metrics(58),body=metrics(bodyFont),sign=metrics(28);
 const height=(m:{ascent:number;descent:number})=>m.ascent+m.descent;
 const bodyHeight=Math.max(0,lines.length-1)*lineHeight+height(body);
 const total=height(date)+24+height(greeting)+42+height(title)+48+bodyHeight+42+height(sign);
 let top=(1254-total)/2;
 function draw(text:string,size:number,color:string,m:{ascent:number;descent:number}){c!.font=`400 ${size}px "Maru Buri", serif`;c!.fillStyle=color;c!.fillText(text,center,top+m.ascent)}
 draw(letter.date,27,'#7b8b91',date);top+=height(date)+24;
 draw('작은 바다에서, 당신에게',30,'#617783',greeting);top+=height(greeting)+42;
 draw(story.title,58,'#3d5665',title);top+=height(title)+48;
 for(const line of lines){draw(line,bodyFont,'#4b6170',body);top+=lineHeight}
 top+=height(body)-lineHeight+42;
 draw('당신의 작은 바다가',28,'#72838d',sign);
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('image_unavailable')),'image/png'));
 return new File([blob],letterFilename(letter),{type:'image/png'});
}

export function wrapLetterText(text:string,measure:(s:string)=>number,width:number){
 const lines:string[]=[];
 for(const paragraph of text.split('\n')){
  const words=paragraph.trim().split(/\s+/).filter(Boolean);if(!words.length)continue;
  // Balance every line, including the last, instead of leaving a one-word tail.
  if(words.every(word=>measure(word)<=width)){
   const costs=Array(words.length+1).fill(Infinity),next=Array(words.length).fill(0);costs[words.length]=0;
   for(let i=words.length-1;i>=0;i--){for(let j=i+1;j<=words.length;j++){const row=words.slice(i,j).join(' '),size=measure(row);if(size>width)break;const cost=(width-size)**2+costs[j];if(cost<costs[i]){costs[i]=cost;next[i]=j}}}
   for(let i=0;i<words.length;i=next[i])lines.push(words.slice(i,next[i]).join(' '));
   continue;
  }
  let line='';for(const word of words){const candidate=line?line+' '+word:word;if(measure(candidate)<=width){line=candidate;continue}if(line){lines.push(line);line=''}if(measure(word)<=width){line=word;continue}for(const char of Array.from(word)){if(line&&measure(line+char)>width){lines.push(line);line=''}line+=char}}if(line)lines.push(line);
 }
 return lines;
}
