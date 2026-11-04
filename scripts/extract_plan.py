import re,csv,json,unicodedata
from pathlib import Path
src=list(Path('/mnt/data').glob('Math_Worksheet_%*'))[0].read_text()
out=Path('/mnt/data/math_works')
rows=[]
for line in src.splitlines():
 if line.startswith('| `/') and len(line.strip().split('|'))>=7 and ('CONDITIONAL_' in line or '| HOLD |' in line):
  parts=[p.strip() for p in line.strip().strip('|').split('|')]
  if len(parts)>=6:
   slug=parts[0].strip('`/'); kw=parts[3];m=re.search(r'(\d+)\s*/\s*(\d+)',kw)
   if m:
    rows.append({'slug':slug,'tier':parts[2], 'kd':int(m.group(1)), 'volume':int(m.group(2)), 'example':parts[4], 'type':parts[5], 'priority':parts[1]})
print('routes',len(rows),[(r['slug'],r['type']) for r in rows if r['type']=='HOLD'])
(out/'src/data/routes.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
start=src.index('## 14. 全部候选关键词');end=src.index('## ',start+5)
lines=[x for x in src[start:end].splitlines() if x.startswith('|') and not x.startswith('|---') and '关键词 |' not in x]
kw=[]
for x in lines:
 p=[y.strip() for y in x.strip('|').split('|')]
 if len(p)>=7 and re.fullmatch(r'\d+',p[1]) and re.fullmatch(r'\d+',p[2]): kw.append(p[:7])
print('keywords',len(kw))
with (out/'src/data/keyword-evidence.csv').open('w',newline='',encoding='utf8') as f:
 w=csv.writer(f);w.writerow(['keyword','monthly_volume','semrush_kd','competitor_rank_type','estimated_competitor_visits','source','canonical_candidate']);w.writerows(kw)
