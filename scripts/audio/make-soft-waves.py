"""Original synthetic gentle surf: no uploaded recording or musical layer.
Requires numpy. Produces a periodic 60 second stereo WAV at /tmp/soft-waves.wav.
"""
import numpy as np
import wave
sr=32000; seconds=60; n=sr*seconds
rng=np.random.default_rng(2511)
t=np.arange(n)/sr; f=np.fft.rfftfreq(n,1/sr)
def texture(low,high):
    spectrum=np.fft.rfft(rng.normal(size=n))
    curve=(f/(f+low))**3 / np.sqrt(1+f/100) * np.exp(-(f/high)**2)
    curve[0]=0
    a=np.fft.irfft(spectrum*curve,n=n)
    return a/np.sqrt(np.mean(a*a))
# Gentle, slow shore wash. A soft attack and longer retreat, varied over a minute.
env=np.zeros(n)
breaking=np.zeros(n)
for center,strength in [(2,.83),(10,.7),(18.6,1),(27,.77),(35.8,.87),(44.5,.72),(53.4,.94)]:
    delta=(t-center+seconds/2)%seconds-seconds/2
    width=np.where(delta<0,.95,2.1)
    env+=strength*np.exp(-.5*(delta/width)**2)
    # Two soft breaking surges, followed by a long wash back down the shore.
    for delay,level in [(0,1),(.85,.52)]:
        d=(t-center-delay+seconds/2)%seconds-seconds/2
        breaking+=strength*level*np.exp(-.5*(d/np.where(d<0,.13,.48))**2)
env/=env.max()
body=texture(120,1150);foam=texture(260,2400);break_texture=texture(180,1650)
shared=body*(.035+.965*env)*.040 + foam*env**1.8*.011 + break_texture*breaking*.037
left=shared+texture(100,1050)*(.06+.94*env)*.005
right=shared+texture(100,1050)*(.06+.94*env)*.005
mix=np.column_stack([left,right]);mix-=mix.mean(axis=0)
# Conservative peak ceiling; no compression or clipped transients.
mix*=min(1,.5/np.max(np.abs(mix)))
with wave.open('/tmp/soft-waves.wav','wb') as out:
    out.setnchannels(2);out.setsampwidth(2);out.setframerate(sr);out.writeframes((mix*32767).astype('<i2').tobytes())
print('duration',seconds,'peak',np.max(np.abs(mix)),'rms',np.sqrt(np.mean(mix**2)),'seam',np.max(np.abs(mix[-1]-mix[0])))
assert np.max(np.abs(mix))<.51
