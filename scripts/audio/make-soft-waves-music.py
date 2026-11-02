"""Original quiet melody over synthetic surf; no uploaded recording.
Run make-soft-waves.py first; requires numpy. Output /tmp/soft-waves-music.wav.
"""
import wave
import numpy as np
sr=32000
seconds=60
size=sr*seconds
mix=np.zeros((size,2),dtype=np.float64)
def add_note(midi,start,duration,level,pan=0,pad=False):
    start*=60/64; duration*=60/64
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

# Lift the original melody and harmony by 4.4 dB above the previous mix.
music=mix*(.020/np.sqrt(np.mean(mix**2)))
with wave.open('/tmp/soft-waves.wav','rb') as f:
    assert f.getframerate()==sr and f.getnchannels()==2 and f.getnframes()==size
    surf=np.frombuffer(f.readframes(size),dtype='<i2').reshape(-1,2).astype(float)/32768
mix=surf+music
assert np.max(np.abs(mix))<.7
with wave.open('/tmp/soft-waves-music.wav','wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(sr);f.writeframes((mix*32767).astype('<i2').tobytes())
print('seconds',seconds,'surf RMS',np.sqrt(np.mean(surf**2)),'music RMS',np.sqrt(np.mean(music**2)),'mix peak',np.max(np.abs(mix)))
