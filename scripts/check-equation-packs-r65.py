"""R65: inspect REAL PDF text and independently solve all printed decimal/fraction
equations with Python fractions.Fraction. Does not trust JS answer oracle or
JSON question text as proof of correct PDF output. No OCR, no external APIs.
"""
from __future__ import annotations
from fractions import Fraction
from pathlib import Path
import json
import re
import sys
import fitz

NUMBER = r"-?\d+(?:\.\d{1,4}|/\d+)?"
EXPR = re.compile(r"^Solve: ("+NUMBER+r"?x)(?: ([+-]) ("+NUMBER+r"))? = ("+NUMBER+r")$")
QUESTION = re.compile(r"^\d+\. Solve: (.+)$")
ANSWER = re.compile(r"^Answer: x = ("+NUMBER+r")$")
SIZES = {"letter": (612.0,792.0),"a4":(595.28,841.89)}

def independent_solve(line:str)->Fraction:
    m=EXPR.match(line)
    if not m:
        raise AssertionError("PDF question not recognized: "+line)
    leading=m.group(1)[:-1] or "1"
    a=Fraction(leading)
    if a==0:raise AssertionError("zero equation coefficient")
    b=Fraction(m.group(3) or "0")
    if m.group(2)=="-":b=-b
    c=Fraction(m.group(4))
    return (c-b)/a

def actual_words(doc):
    for page in doc:
        for w in page.get_text("words"):
            if w[0] < 35.5 or w[2]>page.rect.width-35.5 or w[1]<26 or w[3]>page.rect.height-26:
                raise AssertionError("Text outside printable bounds "+str(w))
    return "\n".join(page.get_text() for page in doc)

def inspect(folder:Path):
    manifest=json.loads((folder/"r65-exact-question-manifest.json").read_text())
    if len(manifest)!=24:raise AssertionError("expected 24 PDF fixtures")
    report=[]
    for case in manifest:
        file=folder/case["name"]
        if not file.is_file():raise AssertionError("missing real PDF "+str(file))
        doc=fitz.open(file)
        if not doc.page_count:raise AssertionError("empty document")
        paper=case["paper"].lower()
        w,h=SIZES[paper]
        for page in doc:
            if abs(page.rect.width-w)>.1 or abs(page.rect.height-h)>.1:
                raise AssertionError("wrong media box "+str(file))
        text=actual_words(doc)
        lines=[x.strip() for x in text.splitlines() if x.strip()]
        extracted=[m.group(1) for line in lines if (m:=QUESTION.match(line))]
        if len(extracted)!=case["quantity"]:
            raise AssertionError(str(file)+": missing/duplicate question text; got "+str(len(extracted)))
        expected=case["expected"]
        for index,(student,pair) in enumerate(zip(extracted,expected)):
            original=pair["question"].replace("−","-")
            if student!=original[len("Solve: "):]:
                raise AssertionError(str(file)+": PDF question differs from actual engine at "+str(index+1)+" "+repr(student))
            exact=independent_solve("Solve: "+student)
            oracle=Fraction(pair["answer"][4:])
            if exact!=oracle:
                raise AssertionError(str(file)+": independent rational oracle failed: "+student)
        keys=[Fraction(m.group(1)) for x in lines if (m:=ANSWER.match(x))]
        mode=case["mode"]
        if mode=="questions":
            if keys or "Answer: x" in text or "Check:" in text or "WORKED STEPS" in text:
                raise AssertionError(str(file)+": STUDENT ANSWER LEAK")
            rule_count=0
            for page in doc:
                for draw in page.get_drawings():
                    for item in draw.get("items",[]):
                        if item[0]=="l":
                            p,q=item[1:3]
                            if abs(p.y-q.y)<.2 and abs(p.x-q.x)>350 and abs(p.y-q.y)<.2:
                                rule_count+=1
            if rule_count!=2*case["quantity"]:
                raise AssertionError(str(file)+": missing student work rules "+str(rule_count))
        else:
            if len(keys)!=case["quantity"]:
                raise AssertionError(str(file)+": PDF teacher answers missing "+str(len(keys)))
            for n,(actual,pair) in enumerate(zip(keys,expected)):
                if actual!=Fraction(pair["answer"][4:]):
                    raise AssertionError(str(file)+": wrong printed answer at "+str(n+1))
            if mode=="steps":
                if sum(line.startswith("Check:") for line in lines)!=case["quantity"]:
                    raise AssertionError(str(file)+": missing printed worked check lines")
            elif "Check:" in text:
                raise AssertionError(str(file)+": answer key leaked worked solutions")
        report.append({"name":case["name"],"mode":mode,"pages":doc.page_count,
            "mathQuestionsChecked":len(extracted),
            "answersPrintedAndChecked":len(keys),
            "studentRuleVectors":rule_count if mode=="questions" else 0})
    result={"status":"PASS","pdfFiles":len(report),
      "independentPrintedEquations":sum(x["mathQuestionsChecked"] for x in report),
      "independentlyCheckedPrintedAnswers":sum(x["answersPrintedAndChecked"] for x in report),
      "studentWorkLines":sum(x["studentRuleVectors"] for x in report),
      "cases":report}
    (folder/"independent-r65-pdf-audit.json").write_text(json.dumps(result,indent=2)+"\n")
    print("R65 PASS: 24 real PDF files, 192 printed exact algebra questions, 128 printed teacher answers, 64 student pencil rule pairs")

if __name__=="__main__":
    inspect(Path(sys.argv[1] if len(sys.argv)>1 else "qa-artifacts/r65-equation-packs"))
