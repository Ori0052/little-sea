"""Generate same-origin standard PNG cards; no SVG/Blob decoder is needed on mobile."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,math
root=Path(__file__).resolve().parents[1];items=json.loads((root/'public/amulets/catalog.json').read_text());font='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
def F(n):return ImageFont.truetype(font,n,index=1)
def star(cx,cy,r):return [(cx+math.sin(i*math.pi/5)*r*(1 if i%2==0 else .43),cy-math.cos(i*math.pi/5)*r*(1 if i%2==0 else .43))for i in range(10)]
for s in items:
 im=Image.new('RGB',(1080,1440),s['light']);d=ImageDraw.Draw(im);a=s['accent'];cream='#fff4d8';d.rounded_rectangle((42,42,1038,1398),radius=24,outline=a,width=3)
 def text(y,t,n,col=a):d.text((540,y),t,font=F(n),fill=col,anchor='mt')
 text(115,'나의 작은 바다',28);text(210,s['title'],46);d.ellipse((496,330,584,418),outline=a,width=10);d.line((540,418,540,470),fill=a,width=9);d.polygon([(540,450),(740,570),(740,800),(540,920),(340,800),(340,570)],fill=s['color'],outline='#d9c795',width=10);d.line([(540,477),(716,584),(716,786),(540,893),(364,786),(364,584),(540,477)],fill=cream,width=4)
 cx,cy=540,685;k=s['kind']
 if k=='wave':
  for y in [690,740]:d.line([(x,y+18*math.sin((x-420)*math.pi/100))for x in range(420,661)],fill=cream,width=10)
  d.polygon(star(540,603,36),fill=cream)
 elif k=='sun':
  d.ellipse((480,625,600,745),outline=cream,width=10)
  for i in range(8):q=i*math.pi/4;d.line([(cx+math.cos(q)*85,cy+math.sin(q)*85),(cx+math.cos(q)*118,cy+math.sin(q)*118)],fill=cream,width=9)
 elif k=='clover':
  for dx,dy in [(-35,-35),(35,-35),(-35,35),(35,35)]:d.ellipse((cx+dx-40,cy+dy-40,cx+dx+40,cy+dy+40),outline=cream,width=8)
  d.line((cx,cy,cx,cy+125),fill=cream,width=8)
 elif k=='star':d.polygon(star(cx,cy,110),outline=cream,width=9)
 elif k=='shell':
  d.pieslice((428,584,652,784),180,360,outline=cream,width=8)
  for x in [440,490,540,590,640]:d.line((540,795,x,670),fill=cream,width=7)
  d.line((440,685,540,795,640,685),fill=cream,width=8)
 elif k=='fish':
  d.ellipse((440,620,620,750),outline=cream,width=8);d.polygon([(620,685),(680,625),(680,745)],outline=cream,width=8);d.ellipse((475,650,490,665),fill=cream);d.line((520,625,565,590,590,630),fill=cream,width=7)
 elif k=='feather':
  d.ellipse((470,565,610,770),outline=cream,width=8);d.line((455,810,590,590),fill=cream,width=9)
  for y in [650,700,745]:d.line((510,y,590,y-20),fill=cream,width=6)
 elif k=='chest':
  d.rounded_rectangle((430,640,650,790),radius=18,outline=cream,width=8);d.arc((430,590,650,705),180,360,fill=cream,width=8);d.line((435,685,645,685),fill=cream,width=8);d.rectangle((520,670,560,717),fill=cream);d.polygon(star(655,580,35),fill=cream)
 elif k=='cloud':
  d.ellipse((445,620,535,710),fill=cream);d.ellipse((490,580,600,710),fill=cream);d.ellipse((565,625,650,710),fill=cream);d.rounded_rectangle((455,650,640,745),radius=35,fill=cream)
  for x in [505,575]:d.line((x-10,680,x+10,700),fill=a,width=5);d.line((x+10,680,x-10,700),fill=a,width=5)
  d.line((522,720,558,720),fill=a,width=5)
 elif k=='boat':
  d.polygon([(430,705),(540,745),(655,705),(610,800),(470,800)],outline=cream,width=8);d.polygon([(540,575),(450,690),(630,690)],outline=cream,width=8);d.line((540,575,540,740),fill=cream,width=8)
 text(1020,s['message'],34);text(1140,s['result']+' · 작은 바다에서 전하는 한 장',25);text(1290,'나의 작은 바다 · 함께 쉬어가는 곳',23)
 im.save(root/'public/amulets'/f"{s['id']}.png",optimize=True)
print('Generated',len(items),'standard PNG cards')
