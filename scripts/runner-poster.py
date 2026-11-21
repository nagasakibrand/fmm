"""Generate a reproducible point-cloud fallback; not a raster image or an AI substitute for the live WebGL runner."""
from PIL import Image,ImageDraw
import random,math
random.seed(20261121)
w,h=800,900
mask=Image.new('L',(w,h),0);d=ImageDraw.Draw(mask)
def capsule(a,b,width):
 d.line((a,b),fill=255,width=width)
 r=width//2
 for x,y in [a,b]:d.ellipse((x-r,y-r,x+r,y+r),fill=255)
def ellipse(cx,cy,rx,ry):d.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),fill=255)
# Anatomical athlete, in a dynamic running stride, facing right.
ellipse(468,181,60,67)            # head
capsule((443,242),(421,296),37)  # neck
# torso and core, intentionally forward-leaning
d.polygon([(372,269),(442,288),(466,351),(438,444),(404,498),(337,472),(333,398)],fill=255)
ellipse(382,475,82,55)
# Far leg: trailing and folded back
capsule((350,508),(232,627),69)
capsule((232,627),(96,555),45)
capsule((96,555),(42,571),27)
# Front leg raised, then shin drops backwards
capsule((395,507),(551,587),76)
capsule((551,587),(470,766),47)
capsule((470,766),(558,778),25)
# Arms pumping opposite to legs
capsule((428,305),(550,369),44)
capsule((550,369),(594,271),31)
ellipse(599,258,22,27)
capsule((361,323),(254,408),43)
capsule((254,408),(217,506),27)
ellipse(213,515,22,26)
coords=[]
for y in range(40,850,2):
 for x in range(10,780,2):
  if mask.getpixel((x,y))>0:coords.append((x,y))
particles=random.sample(coords,min(6900,len(coords)))
# cooler highlights on anterior side, fade at edges
circles=[]
for x,y in particles:
 dx=random.gauss(0,2.1);dy=random.gauss(0,2.1)
 lum=random.random()
 color='#eff7ff' if lum>.91 else ('#bfdafa' if lum>.43 else '#6f9cce')
 rad=round(random.uniform(.67,1.9),2)
 opacity=round(random.uniform(.25,.95),2)
 circles.append(f'<circle cx="{x+dx:.1f}" cy="{y+dy:.1f}" r="{rad}" fill="{color}" opacity="{opacity}"/>')
# trail: dissolving particles behind the runner
for i in range(750):
 x=random.gauss(170,120);y=random.gauss(460,185)
 if random.random()<.12: x=random.gauss(650,80)
 rad=round(random.uniform(.4,1.4),2)
 circles.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rad}" fill="#b9d5ff" opacity="{random.uniform(.06,.35):.2f}"/>')
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" aria-hidden="true"><defs><radialGradient id="halo"><stop stop-color="#9ac7ff" stop-opacity=".17"/><stop offset="1" stop-color="#6ca7eb" stop-opacity="0"/></radialGradient></defs><ellipse cx="402" cy="450" rx="355" ry="380" fill="url(#halo)"/><g>{''.join(circles)}</g></svg>'''
from pathlib import Path
p=Path(__file__).parent.parent/'public/assets/runner-particles.svg';p.write_text(svg)
print(p,round(p.stat().st_size/1024),'KB',len(particles),'body particles')
