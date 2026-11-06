"""R67: inspect actual PDF words and vector pencil lines using PyMuPDF,
then recompute all visible decimal division using independent Fraction.
No OCR; no trust in JavaScript answer map for mathematical correctness.
"""
from __future__ import annotations
from fractions import Fraction
from pathlib import Path
import json
import re
import sys
import fitz

NUM=r"(?:0|[1-9]\d*)(?:\.\d{1,5})?"
QUESTION=re.compile(r"^(\d+)\. Calculate: ("+NUM+r") ÷ ("+NUM+r") = ____$")
ANSWER=re.compile(r"^Answer: ("+NUM+r")$")
SIZES={"a4":(595.28,841.89),"letter":(612.0,792.0)}

def lines_of(doc):
    result=[]
    for page in doc:
        for ln in page.get_text("dict")["blocks"]:
            for line in ln.get("lines",[]):
                result.append(("".join(span["text"] for span in line["spans"]).strip(),
                    fitz.Rect(line["bbox"]),page.number))
    return result

def inspect(folder:Path, fixture:dict):
    source=folder/fixture["filename"]
    if not source.is_file():
        raise AssertionError(f"Missing true PDF: {source}")
    with fitz.open(source) as doc:
        mode=fixture["mode"]
        expected_pages=2 if mode=="steps" else 1
        if len(doc)!=expected_pages:
            raise AssertionError(f"{source}: {len(doc)} pages, expected {expected_pages}")
        width,height=SIZES[fixture["paper"].lower()]
        for page in doc:
            if abs(page.rect.width-width)>.1 or abs(page.rect.height-height)>.1:
                raise AssertionError(f"{source}: wrong paper MediaBox")
        all_lines=lines_of(doc)
        for text,rect,_ in all_lines:
            if rect.x0<35.5 or rect.x1>width-35.5 or rect.y0<26 or rect.y1>height-27:
                raise AssertionError(f"{source}: outside print margins {text} {rect}")
        questions=[]
        answer_lines=[]
        step_checks=[]
        pencil_lines=0
        for page in doc:
            for path in page.get_drawings():
                for item in path["items"]:
                    if item[0]=="l":
                        p,q=item[1:3]
                        if abs(p.y-q.y)<.2 and abs(p.x-q.x)>300:
                            pencil_lines+=1
        for text,rect,page_number in all_lines:
            q=QUESTION.fullmatch(text)
            if q:questions.append((int(q[1]),q[2],q[3],rect,page_number))
            a=ANSWER.fullmatch(text)
            if a:answer_lines.append(a[1])
            if text.startswith("3) Check: "):
                step_checks.append(text)
        if len(questions)!=8:
            raise AssertionError(f"{source}: expected 8 printed questions, got {len(questions)}")
        if [r[0] for r in questions]!=list(range(1,9)):
            raise AssertionError(f"{source}: missing or reordered question numbers")
        expected=fixture["questions"]
        for (index,dividend,divisor,rect,pageno),row in zip(questions,expected):
            if dividend!=row["dividend"] or divisor!=row["divisor"]:
                raise AssertionError(f"{source}: visible question mismatches manifest at {index}")
            quotient=Fraction(dividend)/Fraction(divisor)
            supplied=Fraction(row["answer"])
            if quotient!=supplied:
                raise AssertionError(f"{source}: independent Fraction oracle disagrees on question {index}")
            if Fraction(row["divisor"])*supplied!=Fraction(row["dividend"]):
                raise AssertionError(f"{source}: printed answer fails multiplication crosscheck")
            # Distinct actual arithmetic scaling, no floating approximation.
            shift=row["scaleFactor"]
            if Fraction(row["scaledDividend"],row["scaledDivisor"])!=quotient:
                raise AssertionError(f"{source}: incorrect decimal-shift division {index}")
        if mode=="questions":
            if answer_lines or step_checks or "Answer: " in "\n".join(x[0] for x in all_lines):
                raise AssertionError(f"{source}: ANSWER LEAK on student sheet")
            if pencil_lines!=16:
                raise AssertionError(f"{source}: expected 16 student writing-rule vectors, got {pencil_lines}")
        else:
            if len(answer_lines)!=8:
                raise AssertionError(f"{source}: expected 8 printed answers, got {len(answer_lines)}")
            for actual,row in zip(answer_lines,expected):
                if Fraction(actual)!=Fraction(row["answer"]) or actual!=row["answer"]:
                    raise AssertionError(f"{source}: wrong real PDF answer")
            if pencil_lines:
                raise AssertionError(f"{source}: teacher sheet has student pencil lines")
            if mode=="steps":
                if len(step_checks)!=8:
                    raise AssertionError(f"{source}: missing printed algebra checking steps")
                for check,row in zip(step_checks,expected):
                    if check!="3) Check: "+row["divisor"]+" × "+row["answer"]+" = "+row["dividend"]+".":
                        raise AssertionError(f"{source}: wrong printed multiplication check")
            elif step_checks:
                raise AssertionError(f"{source}: answer-only PDF unexpectedly includes worked steps")
        return {"filename":source.name,"mode":mode,"pageCount":len(doc),
            "realQuestions":len(questions),"printedTeacherAnswers":len(answer_lines),
            "printedWorkedChecks":len(step_checks),"studentWritingVectors":pencil_lines}

def main(folder:Path):
    cases=json.loads((folder/"r67-pdf-manifest.json").read_text())
    if len(cases)!=24:
        raise AssertionError("Expected exactly 24 real decimal division PDF fixtures")
    results=[inspect(folder,case) for case in cases]
    stats={"status":"PASS","pdfCount":24,
        "independentlyRecalculatedQuestions":sum(x["realQuestions"] for x in results),
        "checkedTeacherAnswers":sum(x["printedTeacherAnswers"] for x in results),
        "verifiedCheckEquations":sum(x["printedWorkedChecks"] for x in results),
        "studentWritingLineVectors":sum(x["studentWritingVectors"] for x in results),
        "allStudentPagesNoAnswerLeak":True,
        "realPaperRulerMeasurement":"NOT RUN","teacherSignoff":"NOT RUN",
        "cases":results}
    (folder/"independent-r67-decimal-audit.json").write_text(json.dumps(stats,indent=2)+"\n")
    print("R67 true PDF audit PASS:",stats["pdfCount"],"PDFs,",
      stats["independentlyRecalculatedQuestions"],"visible exact quotient checks,",
      stats["checkedTeacherAnswers"],"teacher answers,",
      stats["studentWritingLineVectors"],"student pencil vectors")

if __name__=="__main__":
    main(Path(sys.argv[1] if len(sys.argv)>1 else "qa-artifacts/r67-decimal-division"))
