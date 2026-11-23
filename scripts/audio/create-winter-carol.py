"""Original soft synthetic piano performance of the public-domain Silent Night melody.
No third-party sound samples or recordings. Run from the project root. Requires numpy/scipy and ffmpeg.
Melody source: Mutopia-2008/02/19-1295, public domain; our own accompaniment and synthesis.
"""
from pathlib import Path
import numpy as np
from scipy.signal import butter,sosfilt
import subprocess,json,hashlib
rate=44100;unit=.5;rng=np.random.default_rng(1818)
# Durations are eighth notes; C major melody, played a minor third lower for a warm register.
a=[('G4',3),('A4',1),('G4',2),('E4',6)]
b=[('D5',4),('D5',2),('B4',6)]
c=[('C5',4),('C5',2),('G4',6)]
d=[('A4',4),('A4',2),('C5',3),('B4',1),('A4',2)]
e=[('D5',4),('D5',2),('F5',3),('D5',1),('B4',2),('C5',6)]
f=[('C5',3),('G4',1),('E4',2),('G4',3),('F4',1),('D4',2),('C4',6)]
phrases=[a,a,b,c,d,a,d,a,e,f]
chords=[['C3','G3','E4'],['C3','G3','E4'],['G2','D3','B3'],['C3','G3','E4'],['F2','C3','A3'],['C3','G3','E4'],['F2','C3','A3'],['C3','G3','E4'],['G2','D3','B3'],['C3','G3','E4']]
notes=[];cursor=2.0
for index,phrase in enumerate(phrases):
 phrase_len=sum(length for _,length in phrase)*unit
 for offset in np.arange(0,phrase_len,3):
  for j,note in enumerate(chords[index]):notes.append((note,cursor+offset+j*.17,2.8,.14 if j==0 else .1,-.3))
 for j,(note,length) in enumerate(phrase):
  duration=length*unit;notes.append((note,cursor,duration,.47*(.94+rng.random()*.12),.18));cursor+=duration
 cursor+=.22
seconds=cursor+6;mix=np.zeros((int(seconds*rate),2),dtype=np.float64)
pitch={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
def add(note,start,duration,velocity,pan):
 midi=(int(note[-1])+1)*12+pitch[note[0]]-3;freq=440*2**((midi-69)/12)
 life=min(6.5,duration+3.8);t=np.arange(int(life*rate))/rate;signal=np.zeros_like(t)
 for harmonic,weight in enumerate([1,.24,.075,.025,.009],1):
  frequency=freq*harmonic*(1+.000035*harmonic*harmonic)
  envelope=(1-np.exp(-t/0.026))*np.exp(-t/(2.2/(harmonic**.45)))
  release=np.exp(-np.maximum(t-duration,0)/1.15)
  signal+=np.sin(2*np.pi*frequency*t)*envelope*release*weight
 signal*=velocity*.14
 start_n=int(start*rate);stop=min(len(mix),start_n+len(signal));signal=signal[:stop-start_n]
 mix[start_n:stop,0]+=signal*np.sqrt((1-pan)/2);mix[start_n:stop,1]+=signal*np.sqrt((1+pan)/2)
for event in notes:add(*event)
mix=sosfilt(butter(2,3600,fs=rate,output='sos'),mix,axis=0)
dry=mix.copy()
for delay,gain in [(.13,.12),(.217,.09),(.359,.075),(.587,.05),(.907,.03)]:
 count=int(delay*rate);mix[count:]+=dry[:-count,::-1]*gain
# Gentle mastered level and quiet edges, leaving headroom for existing ocean ambience.
rms=np.sqrt(np.mean(mix**2));mix*=min(.078/max(rms,1e-9),.29/max(np.max(np.abs(mix)),1e-9))
fade_in=np.minimum(1,np.arange(len(mix))/rate/2);fade_out=np.minimum(1,(len(mix)-1-np.arange(len(mix)))/rate/4)
mix*=np.minimum(fade_in,fade_out)[:,None]
out=Path('public/audio/seasonal');out.mkdir(parents=True,exist_ok=True);p=out/'silent-night-v1.mp3'
subprocess.run(['ffmpeg','-y','-v','error','-f','f32le','-ar',str(rate),'-ac','2','-i','pipe:0','-map_metadata','-1','-c:a','libmp3lame','-b:a','128k',str(p)],input=mix.astype(np.float32).tobytes(),check=True)
manifest={'id':'winter-carol','title':'고요한 밤 · 작은 바다 피아노','file':'/audio/seasonal/silent-night-v1.mp3','composer':'Franz Xaver Gruber (1787–1863)','melodySource':'https://www.mutopiaproject.org/ftp/GruberFX/stille_nacht/stille_nacht-let.pdf','melodyLicense':'Public Domain','recording':'서비스용 직접 편곡·피아노 톤 합성; 외부 녹음·샘플 없음','generator':'scripts/audio/create-winter-carol.py','seconds':round(seconds,3),'outputBytes':p.stat().st_size,'outputSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'peak':round(float(np.max(np.abs(mix))),5),'rms':round(float(np.sqrt(np.mean(mix**2))),6)}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(manifest,ensure_ascii=False))
