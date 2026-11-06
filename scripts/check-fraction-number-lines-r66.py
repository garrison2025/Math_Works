"""R66 independent test: inspect actual printed fraction number-line PDF vectors.
Does not trust the generator's dot coordinates, PDF manifest answers, or a raster
snapshot. PyMuPDF reads the real physical-vector PDF operations and text.
"""
from __future__ import annotations
from pathlib import Path
import json
import math
import re
import sys
import fitz

SIZES={"a4":(595.28,841.89),"letter":(612.,792.)}
def near(a:float,b:float,tolerance=.5)->bool:
    return abs(a-b)<=tolerance

def inspect_case(folder:Path, case:dict)->dict:
    path=folder/case["filename"]
    with fitz.open(path) as pdf:
        if pdf.page_count!=1:
            raise AssertionError(f"{path}: 8 questions must fit one PDF page")
        page=pdf[0]
        width,height=SIZES[case["paper"].lower()]
        if not near(page.rect.width,width,.1) or not near(page.rect.height,height,.1):
            raise AssertionError(f"{path}: wrong physical page size")
        text=page.get_text()
        if text.count("Write the fraction marked by the dot.")+text.count("Plot ")<8:
            raise AssertionError(f"{path}: missing student-facing questions")
        for row,q in enumerate(case["questions"]):
            if q["prompt"] not in text:
                raise AssertionError(f"{path}: question missing: {q['prompt']}")
            if q["answer"]!=f"{q['numerator']}/{q['denominator']}":
                raise AssertionError(f"{path}: manifest fraction inconsistent")
        mode,task=case["mode"],case["task"]
        if mode=="questions":
            if "Answer 1:" in text or re.search(r"Answer\s+\d+:",text):
                raise AssertionError(f"{path}: student answers leaked")
        else:
            for i,q in enumerate(case["questions"],1):
                expected="Answer "+str(i)+": "+q["answer"]
                if expected not in text:
                    raise AssertionError(f"{path}: teacher answer not printed {expected}")
        for word in page.get_text("words"):
            if word[0]<35.4 or word[2]>width-35.4 or word[1]<26 or word[3]>height-27:
                raise AssertionError(f"{path}: text violates print margins: {word}")
        plot_start=76.
        plot_width=width-152.
        segments=[]
        dots=[]
        for drawing in page.get_drawings():
            for obj in drawing.get("items",[]):
                if obj[0]=="l":
                    segments.append((obj[1],obj[2]))
            bounds=drawing.get("rect")
            if (bounds and near(bounds.width,9.,.3) and near(bounds.height,9.,.3)
                 and drawing.get("fill") is not None):
                dots.append(((bounds.x0+bounds.x1)/2,(bounds.y0+bounds.y1)/2))
        for i,q in enumerate(case["questions"]):
            y=172.+i*76.
            max_value=1 if case["range"]=="zero-one" else 2
            d=q["denominator"]
            if q["numerator"]<=0 or q["numerator"]>=d*max_value:
                raise AssertionError(f"{path}: fraction outside graph")
            axis=any(near(p.y,y,.3) and near(r.y,y,.3) and
                near(min(p.x,r.x),plot_start,.3) and
                near(max(p.x,r.x),plot_start+plot_width,.3)
                for p,r in segments)
            if not axis:
                raise AssertionError(f"{path}: missing visible line {i+1}")
            expected_ticks=d*max_value+1
            present=0
            for tick in range(expected_ticks):
                x=plot_start+(tick/(d*max_value))*plot_width
                if any(near(p.x,x,.3) and near(r.x,x,.3) and
                    near((p.y+r.y)/2,y,.3) and
                    near(abs(p.y-r.y),11,.3)
                    for p,r in segments):
                    present+=1
            if present!=expected_ticks:
                raise AssertionError(f"{path}: {i+1} only {present}/{expected_ticks} tick vectors")
            x=plot_start+(q["numerator"]/(d*max_value))*plot_width
            mark=any(near(cx,x,.45) and near(cy,y,.45) for cx,cy in dots)
            if mode=="answers" or task=="identify":
                if not mark:
                    raise AssertionError(f"{path}: wrong/missing exact fraction dot {i+1}")
            elif mark:
                raise AssertionError(f"{path}: student plot task leaks target dot {i+1}")
        expected_dot_count=8 if mode=="answers" or task=="identify" else 0
        if len(dots)!=expected_dot_count:
            raise AssertionError(f"{path}: unexpected circle vectors: {len(dots)} vs {expected_dot_count}")
        return {"name":path.name,"pageCount":1,"horizontalNumberLines":8,
            "independentlyVerifiedFractionTickLocations":sum(
                q["denominator"]*(1 if case["range"]=="zero-one" else 2)+1
                for q in case["questions"]),
            "visibleDots":len(dots),"teacherFractions":8 if mode=="answers" else 0}

def main(folder:Path):
    cases=json.loads((folder/"r66-vector-fixtures.json").read_text())
    if len(cases)!=32:
        raise AssertionError("Expected exactly 32 real source PDFs")
    observations=[inspect_case(folder,case) for case in cases]
    report={"status":"PASS","pdfs":len(observations),
        "printedFractionNumberLines":sum(x["horizontalNumberLines"] for x in observations),
        "vectorTicksChecked":sum(x["independentlyVerifiedFractionTickLocations"] for x in observations),
        "visibleDotCentersChecked":sum(x["visibleDots"] for x in observations),
        "teacherAnswersChecked":sum(x["teacherFractions"] for x in observations),
        "noTeacherDotsInPlotStudentFiles":True,
        "physicalPrintMeasurement":"NOT RUN","teacherSignoff":"NOT RUN",
        "cases":observations}
    (folder/"independent-r66-vector-audit.json").write_text(json.dumps(report,indent=2)+"\n")
    print("R66 FRACTION NUMBER LINE AUDIT PASS:",len(observations),"real PDFs,",
          report["printedFractionNumberLines"],"actual lines,",
          report["vectorTicksChecked"],"independent fraction tick positions,",
          report["teacherAnswersChecked"],"teacher answers")

if __name__=="__main__":
    main(Path(sys.argv[1] if len(sys.argv)>1 else "qa-artifacts/r66-fraction-number-lines"))
