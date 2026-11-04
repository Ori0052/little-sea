"""Original synthesized 24-second seamless rain bed, not a field recording."""
import numpy as np,wave
sr=32000;n=sr*24;rng=np.random.default_rng(20261102)
f=np.fft.rfftfreq(n,1/sr);t=np.arange(n)/sr
channels=[]
for seed in range(2):
 noise=rng.normal(size=n);spectrum=np.fft.rfft(noise)
 rain=np.fft.irfft(spectrum*(f/(f+130))**.7/np.sqrt(1+f/1500),n=n)
 rain*=.8+.08*np.sin(2*np.pi*t/24)+.05*np.sin(2*np.pi*t/8+seed)
 for k in range(90):
  start=int(rng.uniform(0,n));length=2200;pulse=np.arange(length)/sr
  drop=np.sin(pulse*(1700+rng.uniform(0,2000))*2*np.pi)*np.exp(-pulse*95)*rng.uniform(.06,.18)
  np.add.at(rain,(start+np.arange(length))%n,drop)
 channels.append(rain)
y=np.column_stack(channels);y=y/np.max(np.abs(y))*.6
with wave.open('/tmp/little-sea-soft-rain.wav','wb')as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((y*32767).astype('<i2').tobytes())
