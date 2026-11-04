export type SeaCreatureKind='fish'|'coral'|'jelly';
export const seaCreatures=[{kind:'fish' as const,name:'바다 물고기',icon:'🐠'},{kind:'coral' as const,name:'산호 조각',icon:'🪸'},{kind:'jelly' as const,name:'작은 해파리',icon:'🪼'}];
export const deepTreasures=[
 {id:'royal-pearl',name:'왕실의 진주',x:-4,z:9,color:'#e6c77c',gem:'#f8e8de',description:'모래 속에서 반짝이는 작은 왕실의 진주.'},
 {id:'coral-jewel',name:'산호빛 보석',x:-43,z:71,color:'#dcaa8e',gem:'#e8a4ac',description:'산호 숲에서 찾은 따뜻한 빛의 보석.'},
 {id:'moon-compass',name:'달빛 나침반',x:-8,z:34,color:'#c0c9d9',gem:'#b5b0e8',description:'어두운 바다에서도 길을 알려주는 나침반.'},
 {id:'ancient-key',name:'고대의 황금 열쇠',x:59,z:137,color:'#d3ad68',gem:'#96c7bd',description:'오래된 바다 왕국의 문을 여는 열쇠.'},
 {id:'sun-chalice',name:'태양의 잔',x:26,z:72,color:'#e1ba69',gem:'#edc075',description:'햇살을 담아 반짝이는 보물 잔.'},
 {id:'ocean-heart',name:'바다의 심장',x:-52,z:226,color:'#b9d5d3',gem:'#82bdcf',description:'깊고 먼 바다에서 만난 푸른 심장.'}
] as const;
export type CrownId=typeof deepTreasures[number]['id'];
export function isCrownId(id:unknown):id is CrownId{return typeof id==='string'&&deepTreasures.some(t=>t.id===id)}
const clues=[
 ['해변 앞 잔잔한 물결','해변에서 조금 나와, 모래가 밝게 빛나는 얕은 바다를 살펴보세요.'],
 ['산호섬 남쪽 바다','분홍 산호섬에 닿기 전, 남쪽 얕은 물결 아래를 살펴보세요.'],
 ['모닥불 섬 서쪽 바다','모닥불 섬을 왼편으로 돌아, 달빛이 머무는 바다를 살펴보세요.'],
 ['안개섬 남동쪽 바다','돌문이 있는 섬의 남동쪽, 가라앉은 돌길 끝을 찾아보세요.'],
 ['캠핑 섬 동쪽 바다','캠핑 섬의 동쪽을 지나, 햇살이 따뜻하게 스며드는 물속을 찾아보세요.'],
 ['별빛섬 남쪽 바다','가장 먼 별빛 등대를 바라보며, 남쪽의 깊고 푸른 물결을 찾아보세요.']
] as const;
export function treasureClue(id:CrownId){const t=deepTreasures.find(t=>t.id===id)!,i=deepTreasures.indexOf(t);return{name:clues[i][0],hint:clues[i][1],x:Math.round(t.x/12)*12,z:Math.round(t.z/12)*12,radius:10}}
