#!/usr/bin/env python3
"""R37: inspect ALL stress-PDF text placement; make sampled MANUAL review boards."""
import json
import math
import sys
from collections import Counter
from pathlib import Path
try:
    import fitz
except ImportError as error:
    raise SystemExit('PyMuPDF required for R37 PDF visual preflight') from error

MIN_OVERLAP_PT=1.75
MIN_OVERLAP_FRACTION=.44

def text_issues(page):
    """Detect severe text overlaps, not near-touching line-height font bboxes."""
    spans,issues=[],[]
    for block in page.get_text('dict',sort=False)['blocks']:
        for line in block.get('lines',[]):
            for span in line.get('spans',[]):
                value=span['text'].strip()
                if not value:
                    continue
                # The actual PDF exporter sanitizes unsupported glyphs;
                # a replacement marker or midpoint fallback indicates corruption.
                if '\ufffd' in value or '\u25a1' in value or '\u00b7' in value:
                    issues.append(f'Missing/replacement glyph in {value!r}')
                box=fitz.Rect(span['bbox'])
                if not all(math.isfinite(v) for v in box):
                    issues.append(f'Non-finite text box: {value!r}')
                    continue
                if box.width<=0 or box.height<=0:
                    issues.append(f'Empty glyph box: {value!r}')
                    continue
                spans.append((box,value))
    spans.sort(key=lambda item:item[0].y0)
    for i,(a,av) in enumerate(spans):
        for b,bv in spans[i+1:]:
            if b.y0>=a.y1:
                break
            xi=min(a.x1,b.x1)-max(a.x0,b.x0)
            yi=min(a.y1,b.y1)-max(a.y0,b.y0)
            if (xi>max(MIN_OVERLAP_PT,min(a.width,b.width)*MIN_OVERLAP_FRACTION)
                    and yi>max(MIN_OVERLAP_PT,min(a.height,b.height)*MIN_OVERLAP_FRACTION)):
                issues.append(f'Overlapping text {av[:32]!r} + {bv[:32]!r}, bbox={a} / {b}')
                if len(issues)>=8:
                    return issues,len(spans)
    return issues,len(spans)

def build_contact_sheet(folder,files):
    """A4 challenge questions/answers/steps, their first and last pages."""
    wanted=[record for record in files if record['paper']=='A4' and record['difficulty']=='challenge']
    if len({record['topic'] for record in wanted})!=51:
        raise AssertionError('Visual-review sample cannot omit live topics')
    result=fitz.open()
    width,height,columns,rows=1200,1697,2,3
    margin,gap,label_h=26,18,18
    cell_w=(width-2*margin-(columns-1)*gap)/columns
    cell_h=(height-2*margin-(rows-1)*gap)/rows
    capacity=columns*rows
    samples=[]
    for record in wanted:
        with fitz.open(folder/record['name']) as src:
            for pi in sorted(set([0,len(src)-1])):
                index=len(samples)
                if index%capacity==0:
                    result.new_page(width=width,height=height)
                panel=result[-1]
                slot=index%capacity
                x=margin+(slot%columns)*(cell_w+gap)
                y=margin+(slot//columns)*(cell_h+gap)
                label=f"{record['topic']} | {record['mode']} | p{pi+1}/{len(src)}"
                panel.insert_text((x,y+12),label,fontsize=9,fontname='helv',color=(.08,.16,.28))
                target=fitz.Rect(x,y+label_h,x+cell_w,y+cell_h)
                panel.show_pdf_page(target,src,pi,keep_proportion=True)
                samples.append({'source':record['name'],'source_page':pi+1,
                                'contact_page':len(result),'tile':slot+1})
    output=folder/'visual-review-contact-sheet.pdf'
    result.set_metadata({'title':'Math Works print contact sheet - MANUAL SIGN-OFF REQUIRED'})
    result.save(output,garbage=4,deflate=True)
    count=len(result)
    result.close()
    return samples,count

def run(folder):
    manifest=json.loads((folder/'manifest.json').read_text(encoding='utf8'))
    files=manifest['files']
    if manifest['summary']['topics']!=51 or len(manifest['cases'])!=102 or len(files)<408:
        raise AssertionError('Full-catalog stress scope mandatory')
    issues,topics=[],Counter()
    documents=pages=spans=issue_count=0
    for record in files:
        with fitz.open(folder/record['name']) as doc:
            if len(doc)!=record['pages']:
                raise AssertionError(f"{record['name']}: page count mismatch")
            for pn,page in enumerate(doc,1):
                pages+=1
                found,count=text_issues(page)
                spans+=count
                if count==0:
                    found.append('Blank PDF page: no extractable text')
                issue_count+=len(found)
                for entry in found:
                    if len(issues)<40:
                        issues.append(f"{record['name']} p{pn}: {entry}")
                topics[record['topic']]+=1
            documents+=1
    if (documents!=manifest['summary']['documents'] or
            pages!=manifest['summary']['pages'] or len(topics)!=51):
        raise AssertionError('Did not cover the exact complete PDF manifest')
    report={'status':'FAIL' if issue_count else 'PASS',
            'documents':documents,'pages':pages,'text_spans':spans,
            'topics':len(topics),'visual_text_issues':issue_count,
            'examples':issues,
            'limitations':'No text-versus-vector collision detection; human visual/physical printer acceptance still required.'}
    if issue_count==0:
        samples,contact_pages=build_contact_sheet(folder,files)
        report['manual_visual_review']={'status':'NOT REVIEWED',
            'contact_sheet':'visual-review-contact-sheet.pdf',
            'sampled_pages':len(samples),'contact_pages':contact_pages,'samples':samples}
    (folder/'visual-preflight-audit.json').write_text(
        json.dumps(report,indent=2,ensure_ascii=False),encoding='utf8')
    print(f"R37 visual preflight {report['status']}: {documents} PDFs, {pages} pages, {spans} text spans, {issue_count} issues")
    for entry in issues[:12]:
        print('ERROR:',entry,file=sys.stderr)
    return 1 if issue_count else 0

if __name__=='__main__':
    sys.exit(run(Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/pdf-stress')))
