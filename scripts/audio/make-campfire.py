"""Original 40-second loop: soft embers and uneven, natural wood crackles."""
import numpy as np,wave
sr=32000;n=40*sr;rng=np.random.default_rng(7781);freq=np.fft.rfftfreq(n,1/sr)
def noise(low,high):
 x=np.fft.irfft(np.fft.rfft(rng.normal(size=n))*(freq/(freq+low))**2*np.exp(-(freq/high)**2),n=n)
 return x/(np.sqrt(np.mean(x*x))+1e-9)
t=np.arange(n)/sr
bed=noise(90,1800)*(.017+.004*np.sin(2*np.pi*t/10))
result=np.column_stack([bed,bed])
for i in range(290):
 length=int(sr*rng.uniform(.015,.16));tt=np.arange(length)/sr
 env=(1-np.exp(-tt/.0018))*np.exp(-tt/rng.uniform(.005,.025))
 crack=rng.normal(size=length);crack=np.convolve(crack,np.ones(5)/5,mode='same')
 crack*=env*rng.uniform(.035,.22)
 start=rng.integers(0,n);pan=rng.uniform(.25,.75)
 for c,g in enumerate([pan,1-pan]):np.add.at(result[:,c],(np.arange(length)+start)%n,crack*g)
result*=.09/np.sqrt(np.mean(result**2));result*=min(1,.75/np.max(np.abs(result)))
with wave.open('/tmp/campfire.wav','wb') as f:
 f.setnchannels(2);f.setsampwidth(2);f.setframerate(sr);f.writeframes((result*32767).astype('<i2').tobytes())
print('fire audio peak',np.max(np.abs(result)))
