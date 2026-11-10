"""Original short, soft shimmer for the aurora powder action; no sampled material."""
import numpy as np,subprocess,pathlib,json,hashlib
rate=44100;seconds=2.2;t=np.arange(int(rate*seconds))/rate;s=np.zeros_like(t)
for i,f in enumerate([523.251,659.255,783.991,1046.502,1174.659]):
 u=t-i*.085;active=u>=0;u=np.maximum(u,0);env=(1-np.exp(-u*90))*np.exp(-u*4.8)*active
 s+=env*(np.sin(2*np.pi*f*u)+.22*np.sin(2*np.pi*f*2.01*u)+.06*np.sin(2*np.pi*f*3.98*u))*.19
for delay,gain in[(.11,.16),(.23,.1),(.37,.05)]:
 n=int(rate*delay);s[n:]+=s[:-n].copy()*gain
s*=np.minimum(1,np.maximum(0,(seconds-t)/.3));s*=.48/max(np.max(np.abs(s)),1e-9);stereo=np.stack([s,np.roll(s,int(rate*.006))*.97],axis=1).astype(np.float32)
p=pathlib.Path('public/audio/v6/aurora.mp3');subprocess.run(['ffmpeg','-y','-v','error','-f','f32le','-ar',str(rate),'-ac','2','-i','pipe:0','-map_metadata','-1','-c:a','libmp3lame','-b:a','96k',str(p)],input=stereo.tobytes(),check=True)
m=pathlib.Path('public/audio/v6/manifest.json');d=json.loads(m.read_text());d['generated']=[{'id':'aurora','file':'aurora.mp3','title':'오로라 반짝임','seconds':seconds,'outputBytes':p.stat().st_size,'outputSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'source':'scripts/audio/create-aurora-chime.py','credit':'서비스용 직접 합성 효과음 — 외부 샘플 없음'}];m.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
