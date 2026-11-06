"""R68 independent actual PDF oracle for decimal column arithmetic.
Reads REAL visible PDF text and Courier glyph centers, not generated source
answers. Checks exact Decimal math, printed column decimal-point alignment,
regrouping/borrowing semantics, answer isolation and page margins.
"""
from __future__ import annotations
from pathlib import Path
from decimal import Decimal
import json
import re
import sys
import fitz

PAT=re.compile(r"^(\d+)\. (\d+\.\d{1,2}) ([+-]) (\d+\.\d{1,2})$")
PAPERS={"a4":(595.28,841.89),"letter":(612.,792.)}

def digits_carry(a:int,b:int,op:str)->bool:
    carry,found=0,False
    while a or b:
        da,db=a%10,b%10
        if op=="+":
            value=da+db+carry
            if value>=10:found=True
            carry=1 if value>=10 else 0
        else:
            if da-carry<db:
                found=True;carry=1
            else:carry=0
        a//=10;b//=10
    return found

def line_list(page):
    return [("".join(span["text"] for span in ln["spans"]).strip(),fitz.Rect(ln["bbox"]))
      for blk in page.get_text("dict")["blocks"] for ln in blk.get("lines",[])]

def mono_spans(page):
    results=[]
    for blk in page.get_text("rawdict")["blocks"]:
        for ln in blk.get("lines",[]):
            for span in ln["spans"]:
                if "courier" not in span["font"].lower():continue
                chars=span.get("chars",[])
                string="".join(c["c"] for c in chars)
                dots=[(c["bbox"][0]+c["bbox"][2])/2 for c in chars if c["c"]=="."]
                results.append({"text":string,"dots":dots,"box":fitz.Rect(span["bbox"])})
    return results

def inspect(folder:Path,case:dict):
    path=folder/case["file"]
    if not path.exists():raise AssertionError("Missing R68 PDF "+str(path))
    paper=case["paper"].lower();width,height=PAPERS[paper]
    mode=case["mode"];expected_pages=2 if mode=="steps" else 1
    with fitz.open(path) as pdf:
        if len(pdf)!=expected_pages:raise AssertionError(f"{path}: wrong page count {len(pdf)}")
        texts,monos=[],[]
        all_text=[]
        for page in pdf:
            if abs(page.rect.width-width)>.1 or abs(page.rect.height-height)>.1:
                raise AssertionError(f"{path}: wrong physical paper size")
            text=page.get_text();all_text.append(text)
            for string,box in line_list(page):
                if box.x0<35.3 or box.x1>width-35.3 or box.y0<27 or box.y1>height-27:
                    raise AssertionError(f"{path}: printed text clipped outside 35pt margin: {string} {box}")
                texts.append(string)
            monos.extend(mono_spans(page))
        numbered=[PAT.fullmatch(t) for t in texts if PAT.fullmatch(t)]
        if len(numbered)!=8:raise AssertionError(f"{path}: actual horizontal headers {len(numbered)} != 8")
        all_questions=case["questions"]
        if [int(m[1]) for m in numbered]!=list(range(1,9)):
            raise AssertionError(f"{path}: lost/reordered printed problem numbers")
        for m,q in zip(numbered,all_questions):
            n,a,op,b=m.groups()
            if a!=q["a"] or b!=q["b"] or (op=="+" and q["operation"]!="addition") or (op=="-" and q["operation"]!="subtraction"):
                raise AssertionError(f"{path}: manifest and actually printed expression differ")
            # Independent decimal.Decimal mathematical oracle. No binary floats.
            x,y=Decimal(a),Decimal(b)
            expected=x+y if op=="+" else x-y
            if expected!=Decimal(q["answer"]) or expected<=0:
                raise AssertionError(f"{path}: incorrect exact arithmetic at {n}")
            actual_places=len(a.split(".")[1])
            if len(b.split(".")[1])!=actual_places or len(q["answer"].split(".")[1])!=actual_places:
                raise AssertionError(f"{path}: inconsistent number of decimal places")
            scale=10**actual_places
            units_a,units_b=int((x*scale).to_integral_exact()),int((y*scale).to_integral_exact())
            if digits_carry(units_a,units_b,op)!=q["regrouping"]:
                raise AssertionError(f"{path}: independent carry/borrow oracle disagrees")
        want_per_question=2 if mode=="questions" else 3
        if len(monos)!=8*want_per_question:
            raise AssertionError(f"{path}: missing/extra real Courier column text: {len(monos)}")
        for i,q in enumerate(all_questions):
            group=monos[i*want_per_question:(i+1)*want_per_question]
            expected=[q["a"],q["b"]]+([] if mode=="questions" else [q["answer"]])
            if [m["text"] for m in group]!=expected:
                raise AssertionError(f"{path}: printed columns or answer mispaired at {i+1}: {[m['text'] for m in group]}")
            if any(len(m["dots"])!=1 for m in group):
                raise AssertionError(f"{path}: column number lacks one printed decimal point")
            xpoints=[m["dots"][0] for m in group]
            if max(xpoints)-min(xpoints)>.45:
                raise AssertionError(f"{path}: decimal points not aligned vertically in actual PDF at {i+1}: {xpoints}")
        text="\n".join(all_text)
        check_count=len(re.findall(r"3\) Check:",text))
        if mode=="questions":
            if check_count or "WORKED SOLUTIONS" in text or "TEACHER ANSWER KEY" in text:
                raise AssertionError(f"{path}: student PDF leaked answers or worked steps")
        elif mode=="answers":
            if check_count:raise AssertionError(f"{path}: answer key leaked worked solutions")
        elif check_count!=8:
            raise AssertionError(f"{path}: worked-step PDF missing check lines: {check_count}")
        vector_lines=0
        for page in pdf:
            for draw in page.get_drawings():
                for item in draw["items"]:
                    if item[0]=="l":
                        p,q=item[1:3]
                        if abs(p.y-q.y)<.2 and abs(p.x-q.x)>=80:
                            vector_lines+=1
        want_lines=16 if mode=="questions" else 8
        if vector_lines!=want_lines:
            raise AssertionError(f"{path}: expected {want_lines} visible column rules, got {vector_lines}")
        return {"file":path.name,"mode":mode,"pages":len(pdf),"exactPrintedExpressions":len(numbered),
            "checkedCourierColumnCells":len(monos),"columnDecimalPointsAligned":True,
            "studentResultCellsEmpty":8 if mode=="questions" else 0,
            "actualTeacherResultCells":0 if mode=="questions" else 8,
            "printedInverseCheckSteps":check_count,"columnRuleVectors":vector_lines}

def main(folder:Path):
    cases=json.loads((folder/"r68-pdf-fixtures.json").read_text())
    if len(cases)!=36:raise AssertionError("Expected 36 source-backed R68 sample PDFs")
    data=[inspect(folder,x) for x in cases]
    report={"status":"PASS","actualPDFs":len(data),
        "independentlySolvedPrintedExpressions":sum(x["exactPrintedExpressions"] for x in data),
        "printedColumnCellsChecked":sum(x["checkedCourierColumnCells"] for x in data),
        "studentEmptyAnswerCells":sum(x["studentResultCellsEmpty"] for x in data),
        "teacherExactAnswerCells":sum(x["actualTeacherResultCells"] for x in data),
        "independentlyCheckedColumnRuleVectors":sum(x["columnRuleVectors"] for x in data),
        "physicalPrinterCheck":"NOT RUN","teacherSignoff":"NOT RUN",
        "cases":data}
    (folder/"independent-r68-column-audit.json").write_text(json.dumps(report,indent=2)+"\n")
    print("R68 PDF PASS: 36 A4/Letter exact vector PDFs,",
      report["independentlySolvedPrintedExpressions"],"printed equation calculations,",
      report["printedColumnCellsChecked"],"monospace aligned-number cells")

if __name__=="__main__":
    main(Path(sys.argv[1] if len(sys.argv)>1 else "qa-artifacts/r68-decimal-add-sub"))
