"""Create an original 64s ambient composition. Requires numpy and ffmpeg.
Input: /tmp/sea-soft.wav, denoised sea recording (32kHz stereo PCM16).
Output: /tmp/healing-sea.wav. All note/reverb tails wrap for continuous looping.
"""
import wave
import numpy as np
sr=32000
seconds=64
size=sr*seconds
mix=np.zeros((size,2),dtype=np.float64)
def add_note(midi,start,duration,level,pan=0,pad=False):
    n=int(duration*sr);t=np.arange(n)/sr
    freq=440*2**((midi-69)/12)
    if pad:
        env=np.sin(np.pi*t/duration)**2
        tone=np.sin(2*np.pi*freq*t)+.16*np.sin(2*np.pi*freq*2*t)
    else:
        env=(1-np.exp(-t/.045))*np.exp(-t/2.1)*(1-np.clip((t-duration+1),0,1))
        tone=np.sin(2*np.pi*freq*t)+.22*np.sin(2*np.pi*freq*2*t)*np.exp(-t)+.06*np.sin(2*np.pi*freq*3*t)*np.exp(-t/.5)
    signal=tone*env*level
    stereo=signal[:,None]*np.array([np.sqrt((1-pan)/2),np.sqrt((1+pan)/2)])[None,:]
    for delay,gain in [(0,1),(.29,.18),(.53,.12),(.89,.07),(1.37,.04)]:
        idx=(np.arange(n)+int((start+delay)*sr))%size
        np.add.at(mix,idx,stereo*gain)
# Slow Cmaj9, Am9, Fmaj9, Gsus: no drums, no sharp attacks.
chords=[[48,55,59,62,64],[45,52,55,59,60],[41,48,52,55,57],[43,50,53,57,60]]
for k,chord in enumerate(chords):
    for j,note in enumerate(chord):add_note(note,k*16-2,20,.032,(-.4+j*.2),True)
melody=[(0,76),(5,74),(10,71),(17,72),(23,71),(28,67),(33,69),(39,67),(45,64),(49,67),(55,69),(60,74)]
for i,(at,note) in enumerate(melody):add_note(note,at,9,.075,(-.25 if i%2 else .25))
with wave.open('/tmp/sea-soft.wav','rb') as f:
    assert f.getframerate()==sr and f.getnchannels()==2
    sea=np.frombuffer(f.readframes(f.getnframes()),dtype='<i2').reshape(-1,2).astype(float)/32768
# Reduce the already denoised recording to a distant background texture.
sea*=.012/max(np.sqrt(np.mean(sea**2)),1e-6)
# Independent offset crossfade grains prevent an audible 14s reset.
span=len(sea);hop=span//2
sea_bed=np.zeros_like(mix)
for start in range(-span,size,hop):
    idx=np.arange(span);valid=(idx+start>=0)&(idx+start<size)
    sea_bed[idx[valid]+start]+=sea[valid]*np.sin(np.pi*idx[valid]/span)[:,None]**2
edge=np.minimum(np.arange(size)/sr/2,(size-1-np.arange(size))/sr/2).clip(0,1)
mix+=sea_bed*edge[:,None]
rms=np.sqrt(np.mean(mix**2));mix*=min(.075/rms,.65/np.max(np.abs(mix)))
with wave.open('/tmp/healing-sea.wav','wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(sr);f.writeframes((mix*32767).astype('<i2').tobytes())
print('seconds',seconds,'rms',np.sqrt(np.mean(mix**2)),'peak',np.max(np.abs(mix)),'seam',np.max(np.abs(mix[-1]-mix[0])))
