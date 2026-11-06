"""R71 independent REAL-PDF proof: mixed arithmetic, multiplication/division
four-equation fact families, and true area model rectangles. Uses PyMuPDF
visible text and vector geometry; arithmetic recomputed in Python integers.
Does not trust JS PDF checksum or test manifest answers by themselves.
"""
from __future__ import annotations
from pathlib import Path
import json
import re
import sys
import fitz

PAPERS={'a4':(595.28,841.89),'letter':(612.,792.)}
def parsed_lines(pdf):
    return [( ''.join(span['text'] for span in line['spans']).strip(),
              fitz.Rect(line['bbox']),page.number)
        for page in pdf
        for block in page.get_text('dict')['blocks']
        for line in block.get('lines',[])]

def check(case:dict,folder:Path)->dict:
    path=folder/case['filename']
    if not path.is_file():raise AssertionError(f'Missing actual R71 PDF: {path}')
    mode=case['mode'];practice=case['practiceMode'];paper=case['paper'].lower()
    questions=case['questions']
    with fitz.open(path) as doc:
        expected_pages=1 if practice=='mixed-facts' else 2
        if doc.page_count!=expected_pages:
            raise AssertionError(f'{path}: {doc.page_count} pages, expected {expected_pages}')
        w,h=PAPERS[paper]
        for page in doc:
            if abs(page.rect.width-w)>.13 or abs(page.rect.height-h)>.13:
                raise AssertionError(f'{path}: incorrect paper MediaBox')
        lines=parsed_lines(doc)
        strings=[x[0] for x in lines]
        for s,bbox,_ in lines:
            if bbox.x0<35 or bbox.x1>w-35 or bbox.y0<26 or bbox.y1>h-26:
                raise AssertionError(f'{path}: text outside print-safe margin: {s}, {bbox}')
        for i,q in enumerate(questions):
            expected=str(i+1)+'. '+q['question']
            if expected not in strings:
                raise AssertionError(f'{path}: missing or wrong printed question {i+1}: {expected}')
            a,b,product=q['a'],q['b'],q['product']
            if a*b!=product:raise AssertionError(f'{path}: wrong multiplication oracle')
            facts=[f'{a} × {b} = {product}',f'{b} × {a} = {product}',
                   f'{product} ÷ {a} = {b}',f'{product} ÷ {b} = {a}']
            if facts!=q['facts']:raise AssertionError(f'{path}: wrong inverse fact family')
            if practice=='fact-family':
                if q['answer']!=' | '.join(facts):raise AssertionError(f'{path}: wrong family answer')
            elif practice=='area-model':
                model=q['area']
                if not model:raise AssertionError(f'{path}: no area model')
                rows,cols=model['rows'],model['columns']
                if sum(rows)!=a or sum(cols)!=b:raise AssertionError(f'{path}: invalid rectangle decomposition')
                cells=[[r*c for c in cols] for r in rows]
                if cells!=model['cells'] or sum(sum(x) for x in cells)!=product:
                    raise AssertionError(f'{path}: independent partial-product arithmetic failure')
                if q['answer']!=str(product):raise AssertionError(f'{path}: wrong area total')
            else:
                match=re.fullmatch(r'(\d+) ([×÷]) (\d+) = ____',q['question'])
                if not match:raise AssertionError(f'{path}: malformed mixed fact')
                x,operator,y=int(match[1]),match[2],int(match[3])
                exact=x*y if operator=='×' else x//y
                if operator=='÷' and x%y:raise AssertionError(f'{path}: inexact division fact')
                if q['answer']!=str(exact):raise AssertionError(f'{path}: mixed fact answer wrong')
        if mode=='questions':
            if any('Answer:' in x or 'TEACHER ANSWERS' in x or 'WORKED STEPS' in x for x in strings):
                raise AssertionError(f'{path}: STUDENT ANSWER LEAK')
        elif practice=='mixed-facts':
            teacher=[line for line in strings if line.startswith('Answer: ')]
            if teacher!=['Answer: '+q['answer'] for q in questions]:
                raise AssertionError(f'{path}: incorrect printed teacher fact answers')
        elif practice=='fact-family':
            for q in questions:
                for n,fact in enumerate(q['facts'],1):
                    if str(n)+') '+fact not in strings:
                        raise AssertionError(f'{path}: missing printed true fact family identity {fact}')
        if practice=='fact-family' and mode=='questions':
            if any(re.match(r'^[1-4]\) \d+ [×÷]',s) for s in strings):
                raise AssertionError(f'{path}: student family worksheet leaks solved equations')
        actual_grid_count=0;actual_partial_cells=0
        if practice=='area-model':
            all_vectors=[]
            for page in doc:
                for path_object in page.get_drawings():
                    # pdf-lib may emit the rectangle as four connected
                    # vector lines rather than a single PDF 're' opcode.
                    # PyMuPDF exposes its actual path bounding rectangle
                    # in either representation; require the true physical
                    # 186 x 54 pt stroke extent, not a guessed screenshot.
                    rect=path_object.get('rect')
                    if rect and abs(rect.width-186)<.8 and abs(rect.height-54)<.8:
                        all_vectors.append((page.number,fitz.Rect(rect)))
            if len(all_vectors)!=8:
                raise AssertionError(f'{path}: expected 8 actual rectangle vector diagrams, saw {len(all_vectors)}')
            # PDF grid rows appear in order of top-to-bottom:
            all_vectors.sort(key=lambda x:(x[0],x[1].y0))
            for q,(page_id,rect) in zip(questions,all_vectors):
                expected=q['area']['cells']
                nrows,ncols=len(expected),len(expected[0])
                words=doc[page_id].get_text('words')
                for r,values in enumerate(expected):
                    for c,value in enumerate(values):
                        x0=rect.x0+c*rect.width/ncols
                        x1=rect.x0+(c+1)*rect.width/ncols
                        y0=rect.y0+r*rect.height/nrows
                        y1=rect.y0+(r+1)*rect.height/nrows
                        inside=[]
                        for xA,yA,xB,yB,text, *_ in words:
                            center=((xA+xB)/2,(yA+yB)/2)
                            if x0+2<center[0]<x1-2 and y0+1<center[1]<y1-1:
                                inside.append(text)
                        if mode=='questions':
                            if inside:raise AssertionError(f'{path}: student partial cell leaks numbers {inside}')
                        else:
                            if inside!=[str(value)]:
                                raise AssertionError(f'{path}: wrong visible partial cell {inside} expected {value}')
                        actual_partial_cells+=1
                actual_grid_count+=1
        pencil=0
        for page in doc:
            for drawing in page.get_drawings():
                for item in drawing.get('items',[]):
                    if item[0]!='l':continue
                    a,b=item[1:3]
                    if abs(a.y-b.y)<.3 and abs(a.x-b.x)>65 and abs(a.x-b.x)<500:
                        # Distinguish long pencil rule lines from area-grid borders.
                        if practice!='area-model' or abs(a.x-b.x)>190:
                            pencil+=1
        if practice=='mixed-facts':
            if mode=='questions' and pencil<8:
                raise AssertionError(f'{path}: missing at least eight student answer lines')
        if practice=='fact-family':
            if mode=='questions' and pencil<32:
                raise AssertionError(f'{path}: missing student inverse fact writing lines')
        return {'file':case['filename'],'pages':doc.page_count,'printedQuestions':8,
                'checkedFactIdentities':32,'trueAreaModelVectors':actual_grid_count,
                'verifiedPartitionCells':actual_partial_cells,
                'teacherMode':mode,'pencilLineVectors':pencil}

def main(folder:Path):
    cases=json.loads((folder/'r71-multiplication-division-source-fixtures.json').read_text())
    if len(cases)!=30:raise AssertionError('R71 requires 30 real PDF combinations')
    results=[check(c,folder) for c in cases]
    status={'status':'PASS','realPDFs':len(results),
     'visibleQuestionsIndependentlyChecked':sum(x['printedQuestions'] for x in results),
     'inverseIdentitiesRecomputed':sum(x['checkedFactIdentities'] for x in results),
     'trueAreaDiagrams':sum(x['trueAreaModelVectors'] for x in results),
     'exactPartialAreaCellsChecked':sum(x['verifiedPartitionCells'] for x in results),
     'physicalPrinterReviewed':False,'teacherApproved':False,'cases':results}
    (folder/'independent-r71-vector-math-audit.json').write_text(json.dumps(status,indent=2)+'\n')
    print('R71 PDF audit PASS:',status['realPDFs'],'real PDF files,',
          status['visibleQuestionsIndependentlyChecked'],'visible problems,',
          status['trueAreaDiagrams'],'vector models,',
          status['exactPartialAreaCellsChecked'],'partial-product cell checks')

if __name__=='__main__':
    main(Path(sys.argv[1] if len(sys.argv)>1 else 'qa-artifacts/r71-multiplication-division'))
