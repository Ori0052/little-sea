"""Rebuild optimized assets from a local JSON [{name,path,size}] input list.
Usage: python scripts/audio/prepare-uploaded-sounds.py /tmp/sea-audio-inputs.json
Raw uploads are kept outside Git. The manifest records source hashes and edits.
"""
import json,sys,subprocess,hashlib,pathlib,concurrent.futures,numpy as np
inputs=json.loads(pathlib.Path(sys.argv[1]).read_text());byname={r['name']:r for r in inputs};out=pathlib.Path('public/audio/v6');out.mkdir(parents=True,exist_ok=True)
specs=[('waves','기본 파도.wav',None,True),('night','밤바다.wav',None,True),('beach','해변파도-모래사장 위로 부드럽게 올라오는 파도소리.wav',None,True),('rain','빗소리.mp3',None,True),('rowing','노 젓기.wav',None,True),('fire','불소리 1.m4a',None,True),('thunder','먼 천둥소리.mp3',12,False),('step','모래 발걸음.wav',.7,False),('potato','군고구마 먹기.wav',3.8,False),('fish','생선 먹기.wav',5.2,False),('wrap','고구마 포일 감싸기.wav',1.2,False),('unwrap','고구마 포일 벗기기.wav',1.6,False),('boarding','배 타고 내리기.wav',2,False),('intro','도입부 사운드.wav',3,False),('intro-music','도입부 앱 시작 시 나오는 노래.wav',20,False),('treasure','밝은 보상 획득.wav',None,False),('discovery','새 아이템 발견.wav',None,False),('gear','새로운 옷,똇목 획득 시.mp3',None,False),('collect','일반 소집품 획득 시 사운드(종이배에서획득).wav',None,False),('achievement','성취 축하음.wav',None,False),('bite','낚시 입질.wav',None,False)]
known={'waves':{'author':'simong1006','license':'CC BY 4.0','source':'https://freesound.org/people/simong1006/sounds/566459/'},'night':{'author':'BonnyOrbit','license':'CC0','source':'https://freesound.org/people/BonnyOrbit/sounds/465435/'},'rowing':{'author':'Fenodyrie','license':'CC0','source':'https://freesound.org/people/Fenodyrie/sounds/588308/'},'collect':{'author':'Porphyr','title':'Synthetic Waterdrop','license':'CC BY 3.0','source':'https://freesound.org/people/Porphyr/'},'step':{'author':'Nox_Sound'}}
def build(spec):
 key,name,cap,loop=spec;row=byname[name];p=pathlib.Path(row['path']);probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:format_tags','-of','json',str(p)]));duration=float(probe['format']['duration']);start=0
 if cap and cap<duration:
  raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-ac','1','-ar','11025','-f','f32le','-']);a=np.frombuffer(raw,dtype=np.float32);hop=1102;n=len(a)//hop;rms=np.sqrt(np.mean(a[:n*hop].reshape(n,hop)**2,axis=1));bins=np.where(rms>max(float(rms.max())*.16,.0005))[0]
  start=max(0,(int(np.argmax(rms))*hop/11025-2) if key=='thunder' else (int(bins[0])*hop/11025-.03 if len(bins) else 0));start=min(start,max(0,duration-cap))
 length=min(cap or duration,duration-start);normal='loudnorm=I=-24:TP=-3:LRA=9,aresample=44100' if loop else 'loudnorm=I=-21:TP=-3:LRA=9,aresample=44100'
 dest=out/(key+'.mp3')
 if loop:
  channels=int(json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=channels','-of','json',str(p)]))['streams'][0]['channels'])
  raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-af',normal,'-ar','44100','-ac',str(channels),'-f','f32le','-'])
  pcm=np.frombuffer(raw,dtype=np.float32).reshape(-1,channels);n=44100;t=np.linspace(0,1,n,dtype=np.float32)[:,None]
  seam=pcm[-n:]*np.sqrt(1-t)+pcm[:n]*np.sqrt(t);joined=np.concatenate([pcm[n:-n],seam]).astype(np.float32)
  subprocess.run(['ffmpeg','-y','-v','error','-f','f32le','-ar','44100','-ac',str(channels),'-i','pipe:0','-af','alimiter=limit=0.55:level=false:latency=true','-map_metadata','-1','-c:a','libmp3lame','-b:a','128k',str(dest)],input=joined.tobytes(),check=True)
 else:
  graph=f'[0:a]{normal},afade=t=in:d=0.008,afade=t=out:st={max(0,length-.12)}:d=0.12,alimiter=limit=0.55:level=false:latency=true[a]'
  subprocess.run(['ffmpeg','-y','-v','error','-ss',str(start),'-t',str(length),'-i',str(p),'-filter_complex',graph,'-map','[a]','-map_metadata','-1','-c:a','libmp3lame','-b:a','96k','-ar','44100',str(dest)],check=True)
 data=dest.read_bytes();output_duration=float(json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(dest)]))['format']['duration']);r={'id':key,'inputName':name,'inputSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'inputBytes':p.stat().st_size,'inputDuration':duration,'start':round(start,4),'selectedDuration':round(length,4),'loop':loop,'file':key+'.mp3','outputDuration':output_duration,'outputBytes':len(data),'outputSha256':hashlib.sha256(data).hexdigest(),'edits':'음량 정규화, MP3 변환, '+('반복 경계 1초 교차 편집' if loop else '행동 길이에 맞춘 구간 편집 및 시작/끝 페이드'),'credit':known.get(key,{}),'embeddedSourceTags':probe['format'].get('tags',{})};print(key,len(data),flush=True);return r
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:assets=list(pool.map(build,specs))
(out/'manifest.json').write_text(json.dumps({'version':6,'received':22,'available':21,'unavailable':['불소리 2.wav — 원본 32MiB 전송 한도 초과'],'assets':assets},ensure_ascii=False,indent=2)+'\n');print('TOTAL',sum(x['outputBytes'] for x in assets))
