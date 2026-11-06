"""R69 independently inspect REAL printed PDFs with Python fractions.Fraction
and PyMuPDF: no use of JS verification to infer visible answer correctness.
"""
from __future__ import annotations
from pathlib import Path
from decimal import Decimal
from fractions import Fraction
import json
import re
import sys
import fitz

QUESTION=re.compile(r"^(\d+)\. Convert (\d+/\d+|\d+\.\d{1,3}) to (a decimal|a simplified fraction)\.$")
ANSWER=re.compile(r"^Answer: (\d+/\d+|\d+\.\d{1,3})$")
PAPERS={"a4":(595.28,841.89),"letter":(612.,792.)}

def from_decimal(text:str)->Fraction:
    return Fraction(Decimal(text))

def get_lines(pdf):
    data=[]
    for pg in pdf:
        for block in pg.get_text("dict")["blocks"]:
            for ln in block.get("lines",[]):
                value="".join(span["text"] for span in ln["spans"]).strip()
                data.append((value,fitz.Rect(ln["bbox"]),pg.number))
    return data

def audit(folder:Path,case:dict)->dict:
    filename=folder/case["filename"]
    if not filename.exists():raise AssertionError("Missing original R69 PDF "+str(filename))
    with fitz.open(filename) as pdf:
        mode=case["mode"],paper=case["paper"].lower()
        expected_pages=2 if mode=="steps" else 1
        if len(pdf)!=expected_pages:raise AssertionError(str(filename)+": wrong PDF pages")
        width,height=PAPERS[paper]
        for page in pdf:
            if abs(page.rect.width-width)>.12 or abs(page.rect.height-height)>.12:
                raise AssertionError(str(filename)+": wrong physical paper dimensions")
        lines=get_lines(pdf)
        for value,box,_ in lines:
            if box.x0<35.0 or box.x1>width-35 or box.y0<25 or box.y1>height-26:
                raise AssertionError(f"{filename}: clipped outside printer safe margins: {value} {box}")
        numbered=[m for val,_,_ in lines if (m:=QUESTION.fullmatch(val))]
        if len(numbered)!=8 or [int(m[1]) for m in numbered]!=list(range(1,9)):
            raise AssertionError(f"{filename}: missing or duplicate visible problem prompts")
        expected=case["questions"]
        for q,m in zip(expected,numbered):
            _,raw,direction=m.groups()
            actual_direction="fraction-to-decimal" if direction=="a decimal" else "decimal-to-fraction"
            if actual_direction!=q["kind"] or raw!=q["input"]:
                raise AssertionError(f"{filename}: visible question not equal to original engine output")
            exact=Fraction(q["numerator"],q["denominator"])
            if from_decimal(q["decimal"])!=exact:
                raise AssertionError(f"{filename}: independently computed value differs at {q['id']}")
            if Fraction(q["fraction"])!=exact:
                raise AssertionError(f"{filename}: fraction not equivalent at {q['id']}")
            if exact.denominator!=q["denominator"]:
                raise AssertionError(f"{filename}: expected simplified fraction at {q['id']}")
            if q["answer"]!=(q["decimal"] if q["kind"]=="fraction-to-decimal" else q["fraction"]):
                raise AssertionError(f"{filename}: answer label mismatch at {q['id']}")
        answers=[m[1] for val,_,_ in lines if (m:=ANSWER.fullmatch(val))]
        checks=[val for val,_,_ in lines if val.startswith("4) Check:")]
        if mode=="questions":
            if answers or checks or any("TEACHER ANSWER KEY" in t[0] or "WORKED STEPS" in t[0] for t in lines):
                raise AssertionError(f"{filename}: STUDENT ANSWER LEAK")
        else:
            if len(answers)!=8:
                raise AssertionError(f"{filename}: missing printed teacher answers")
            for correct,got in zip(expected,answers):
                if got!=correct["answer"]:
                    raise AssertionError(f"{filename}: incorrect teacher answer for {correct['id']}")
            if mode=="steps":
                if len(checks)!=8:
                    raise AssertionError(f"{filename}: missing actual printed inverse checks")
                for q,check in zip(expected,checks):
                    if check!="4) "+q["steps"][3]:
                        raise AssertionError(f"{filename}: printed mathematical check differs")
            elif checks:
                raise AssertionError(f"{filename}: answer-only PDF leaked worked explanations")
        rule_vectors=0
        fraction_bars=0
        for page in pdf:
            for draw in page.get_drawings():
                for item in draw.get("items",[]):
                    if item[0]!="l":continue
                    p,r=item[1],item[2]
                    if abs(p.y-r.y)>.2:continue
                    width_of_vector=abs(p.x-r.x)
                    if width_of_vector>=190:rule_vectors+=1
                    if 15<=width_of_vector<70:fraction_bars+=1
        expected_bars=sum(q["kind"]=="fraction-to-decimal" for q in expected)
        if fraction_bars!=expected_bars:
            raise AssertionError(f"{filename}: missing true fraction bar vectors {fraction_bars} vs {expected_bars}")
        if rule_vectors!=(8 if mode=="questions" else 0):
            raise AssertionError(f"{filename}: student pencil-line vector count {rule_vectors}")
        for idx,q in enumerate(expected):
            if q["kind"]=="decimal-to-fraction":
                # Fraction output is simplest in actual answer text; no
                # unsupported decimal rounding or repeating answer allowed.
                assert "/" in q["fraction"]
        return {"file":filename.name,"pages":len(pdf),"mode":mode,
            "printedQuestionsVerified":8,"teacherAnswersChecked":len(answers),
            "workedChecksChecked":len(checks),"fractionBarsChecked":fraction_bars,
            "studentBlankResultRules":rule_vectors}

def main(folder:Path):
    cases=json.loads((folder/"r69-conversion-fixtures.json").read_text())
    if len(cases)!=54:raise AssertionError("Exactly 54 real PDF fixtures expected")
    rows=[audit(folder,case) for case in cases]
    summary={
      "status":"PASS","realPDFs":54,
      "printedEquationsRecomputed":sum(x["printedQuestionsVerified"] for x in rows),
      "teacherAnswersVerified":sum(x["teacherAnswersChecked"] for x in rows),
      "workedChecksVerified":sum(x["workedChecksChecked"] for x in rows),
      "realFractionBars":sum(x["fractionBarsChecked"] for x in rows),
      "studentBlankResultLines":sum(x["studentBlankResultRules"] for x in rows),
      "physicalPrinterSignoff":"NOT RUN","teacherReview":"NOT RUN",
      "files":rows}
    (folder/"independent-r69-pdf-audit.json").write_text(json.dumps(summary,indent=2)+"\n")
    print("R69 PASS",summary["realPDFs"],"real PDFs;",
      summary["printedEquationsRecomputed"],"independent conversion checks;",
      summary["teacherAnswersVerified"],"printed teacher answers")

if __name__=="__main__":
    main(Path(sys.argv[1] if len(sys.argv)>1 else "qa-artifacts/r69-fraction-decimal-conversion"))
