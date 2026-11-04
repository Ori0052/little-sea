import {amuletStyle} from './amulet-catalog';
import {amuletImageUrl} from './amulet-image';
export function AmuletArt({id}:{id:string}){const s=amuletStyle(id);return <img className="amulet-paper-art" data-amulet-style={s.id} src={amuletImageUrl(s.id)} alt={`${s.title}. ${s.message}`} width={1024} height={1536} loading="lazy" decoding="async"/>}
