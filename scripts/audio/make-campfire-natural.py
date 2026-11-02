"""Original 90s synthesized campfire: irregular ember clusters, wood snaps,
short dry after-crackles and low flame movement. No field recording is used.
Requires numpy. Output: /tmp/campfire-natural.wav, 48kHz stereo PCM.
"""
import numpy as np,wave
sr=48000;seconds=90;n=seconds*sr;rng=np.random.default_rng(20261102)
f=np.fft.rfftfreq(n,1/sr);t=np.arange(n)/sr
def texture(low,high):
    w=rng.normal(size=n)
    y=np.fft.irfft(np.fft.rfft(w)*(f/(f+low))**2*np.exp(-(f/high)**2),n=n)
    return y/(np.sqrt(np.mean(y*y))+1e-9)
# Uneven, slow movement rather than a constant hiss or a regular oscillation.
knots=rng.uniform(.35,1,32);slow=np.interp(t,np.linspace(0,seconds,32),knots)
fade=.5-.5*np.cos(2*np.pi*t/seconds)
slow=slow*fade+(knots[0])*(1-fade)
body=texture(55,440)*(.011+.009*slow)
embers=texture(650,4800)*(.002+.004*slow**2)
out=np.column_stack([body+embers,body+embers])
# Slightly independent stereo beds; avoid wide, distracting ping-pong pops.
for channel in range(2):out[:,channel]+=texture(160,2100)*.0025
def event(at,level,duration,pan,dry=False):
    length=int(sr*duration);tt=np.arange(length)/sr
    w=rng.normal(size=length)
    # Dry broad-band ignition transient plus a warm, damped wood body.
    smooth=np.convolve(w,[.18,.27,.28,.17,.10],mode='same')
    env=(1-np.exp(-tt/rng.uniform(.00015,.0006)))*np.exp(-tt/rng.uniform(.004,.018) if dry else -tt/rng.uniform(.025,.075))
    envelope=env*np.minimum(1,(duration-tt)/.012)
    impulse=(w*.22+smooth*.78)*envelope
    if not dry:
        for hz,weight in [(rng.uniform(110,240),.11),(rng.uniform(380,900),.055)]:
            impulse+=weight*np.sin(2*np.pi*hz*tt+rng.uniform(0,6.28))*(1-np.exp(-tt/.001))*np.exp(-tt/.018)
        # Little ragged tails and sputtering, with tiny gaps between embers.
        tail=np.convolve(rng.normal(size=length),np.ones(7)/7,mode='same')
        rough=np.maximum(0,np.sin(tt*rng.uniform(100,240)+rng.uniform(0,6)))**3
        impulse+=tail*rough*np.exp(-tt/.10)*.15
    impulse*=level
    indices=(int(at*sr)+np.arange(length))%n
    for c,g in enumerate([np.sqrt(1-pan),np.sqrt(pan)]):np.add.at(out[:,c],indices,impulse*g)
# Dense quiet ember ticks in bursts, with breathing spaces between clusters.
for i in range(110):
    start=rng.uniform(0,seconds);count=rng.integers(5,25);span=rng.uniform(.25,1.8)
    for j in range(count):event(start+rng.uniform(0,span),rng.uniform(.012,.055),rng.uniform(.016,.065),rng.uniform(.35,.65),True)
# Fewer wood fractures with a couple of smaller, delayed follow-up crackles.
for i in range(85):
    at=rng.uniform(0,seconds);level=rng.uniform(.09,.24);pan=rng.uniform(.30,.70)
    event(at,level,rng.uniform(.12,.32),pan)
    for j in range(rng.integers(1,4)):event(at+rng.uniform(.025,.24),level*rng.uniform(.12,.38),rng.uniform(.02,.07),pan,True)
out-=out.mean(axis=0)
# Keep steady playback similar in loudness while retaining gentle transients.
out*=min(.064/(np.sqrt(np.mean(out*out))+1e-9),.65/np.max(np.abs(out)))
assert np.isfinite(out).all() and np.max(np.abs(out))<.66
with wave.open('/tmp/campfire-natural.wav','wb') as file:
    file.setnchannels(2);file.setsampwidth(2);file.setframerate(sr);file.writeframes((out*32767).astype('<i2').tobytes())
print({'seconds':seconds,'rms':round(float(np.sqrt(np.mean(out*out))),4),'peak':round(float(np.max(np.abs(out))),4),'loop_boundary_delta':round(float(np.max(np.abs(out[-1]-out[0]))),4)})
