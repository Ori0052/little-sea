const adjectives=['느긋한','반짝이는','고요한','둥실둥실','나른한','작은','포근한','달빛'];
const friends=['수달','고래','해파리','조개','돌고래','갈매기','물개','파도'];
export function cleanSeaName(value:string){return Array.from(value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,'').replace(/\s+/g,' ').trim()).slice(0,16).join('')}
export function randomSeaName(){return `${adjectives[Math.floor(Math.random()*adjectives.length)]} ${friends[Math.floor(Math.random()*friends.length)]} ${Math.floor(10+Math.random()*90)}`}
