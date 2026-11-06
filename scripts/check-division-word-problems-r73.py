"""R73 third-party PDF audit. Read REAL printable PDF text and vector lines.
Compute quotients/remainders in Python, then independently verify units
and whether the story requires full groups, round-up or leftovers.
"""
from __future__ import annotations
from pathlib import Path
import json
import re
import sys
import fitz

SIZE={"a4":(595.28,841.89),"letter":(612.,792.)}
def normalize(s:str)->str:
    return re.sub(r"\s+"," ",s).strip()
def independent(p:dict):
    total=int(p["dividend"]);divisor=int(p["divisor"])
    q,r=divmod(total,divisor)
    if divisor<2 or divisor>9 or q!=p["quotient"] or r!=p["remainder"]:
        raise AssertionError("Invalid independent quotient or remainder")
    kind=p["type"]
    if kind=="equal-sharing":
        if r!=0 or "per " not in p["answer"] or not p["answer"].startswith(str(q)+" "):
            raise AssertionError("Wrong equal-sharing contextual answer")
    elif kind=="full-groups":
        if r<=0 or not p["answer"].startswith(str(q)+" full ") or ("and "+str(r)+" ") not in p["answer"]:
            raise AssertionError("Wrong full-group+remainder interpretation")
    elif kind=="round-up":
        if r<=0 or not p["answer"].startswith(str(q+1)+" ") or not p["answer"].endswith(("minibuses","shuttles")):
            raise AssertionError("Round-up must seat all remaining students")
    elif kind=="leftovers":
        if r<=0 or not p["answer"].startswith(str(r)+" ") or not p["answer"].endswith("left over"):
            raise AssertionError("Leftover story must report just remainder")
    else:
        raise AssertionError("Unknown real story type")
    if str(total) not in p["question"] or str(divisor) not in p["question"]:
        raise AssertionError("Actual story lacks necessary quantities")
    if p["steps"][1]!="Check: "+str(divisor)+" × "+str(q)+" + "+str(r)+" = "+str(total)+".":
        raise AssertionError("Bad whole-number multiplication proof")

def audit_pdf(folder:Path,case:dict)->dict:
    file=folder/case["file"]
    if not file.is_file():
        raise AssertionError("Missing real printable PDF "+str(file))
    with fitz.open(file) as pdf:
        mode=case["mode"]
        if len(pdf)!=2:
            raise AssertionError(f"{file}: expected two pages for 8 word problems")
        width,height=SIZE[case["paper"].lower()]
        text_all=[]
        pencil=0
        for page in pdf:
            if abs(page.rect.width-width)>.1 or abs(page.rect.height-height)>.1:
                raise AssertionError(f"{file}: wrong printable paper size")
            for blk in page.get_text("dict")["blocks"]:
                for ln in blk.get("lines",[]):
                    value="".join(span["text"] for span in ln["spans"]).strip()
                    rect=fitz.Rect(ln["bbox"])
                    if rect.x0<33 or rect.x1>width-33 or rect.y0<24 or rect.y1>height-27:
                        raise AssertionError(f"{file}: clipped text outside margin: {value} {rect}")
            text_all.append(page.get_text("text"))
            for drawing in page.get_drawings():
                for item in drawing.get("items",[]):
                    if item[0]!="l":continue
                    a,b=item[1],item[2]
                    if abs(a.y-b.y)<.3 and abs(a.x-b.x)>210:
                        pencil+=1
        text=normalize(" ".join(text_all))
        problems=case["problems"]
        if len(problems)!=8:raise AssertionError("Fixture must contain 8 source problems")
        types=set()
        for i,p in enumerate(problems,1):
            independent(p)
            types.add(p["type"])
            expected=normalize(str(i)+". "+p["question"])
            if expected not in text:
                raise AssertionError(f"{file}: visible question {i} missing or altered: {expected}")
            if mode!="questions" and normalize("Answer: "+p["answer"]) not in text:
                raise AssertionError(f"{file}: real teacher answer missing for Q{i}")
            if mode=="steps":
                for k,step in enumerate(p["steps"],1):
                    if normalize(str(k)+") "+step) not in text:
                        raise AssertionError(f"{file}: printed worked arithmetic line {k} missing for Q{i}")
        if case["task"]=="mixed" and len(types)!=4:
            raise AssertionError("Mixed printable stories do not contain all 4 interpretation types")
        if mode=="questions":
            if "Answer:" in text or re.search(r"\b[123]\) (Divide|Check|The)",text):
                raise AssertionError(f"{file}: answer key or teacher steps leaked")
            if pencil!=16:raise AssertionError(f"{file}: incorrect student equation/answer writing rules {pencil}")
        else:
            if pencil:raise AssertionError(f"{file}: unwanted writing rules in answer key {pencil}")
            if mode=="answers" and re.search(r"\b[123]\) (Divide|Check|The)",text):
                raise AssertionError(f"{file}: answer-only PDF includes worked steps")
        return {"file":file.name,"mode":mode,"pages":len(pdf),
            "independentlyCheckedRealQuestions":len(problems),
            "printedTeacherAnswers":8 if mode!="questions" else 0,
            "printedWorkedCheckEquations":8 if mode=="steps" else 0,
            "studentWritingRules":pencil,"uniqueMathStoryTypes":len(types)}

def main(folder:Path):
    cases=json.loads((folder/"r73-pdf-manifest.json").read_text())
    if len(cases)!=30:raise AssertionError("Expected exactly 30 real printable PDFs")
    checked=[audit_pdf(folder,case) for case in cases]
    report={
      "status":"PASS","realPDFs":30,
      "independentlyCheckedPrintedStoryAnswers":sum(x["independentlyCheckedRealQuestions"] for x in checked),
      "visibleTeacherAnswers":sum(x["printedTeacherAnswers"] for x in checked),
      "printedWorkedCheckEquations":sum(x["printedWorkedCheckEquations"] for x in checked),
      "realStudentPencilVectors":sum(x["studentWritingRules"] for x in checked),
      "physicalPrinterMeasured":"NOT RUN","teacherSignedOff":"NOT RUN",
      "cases":checked}
    (folder/"independent-r73-pdf-audit.json").write_text(json.dumps(report,indent=2)+"\n")
    print("R73 DIVISION STORY PDF PASS:",report["realPDFs"],"real PDFs,",
      report["independentlyCheckedPrintedStoryAnswers"],"real question calculations,",
      report["visibleTeacherAnswers"],"teacher answers,",
      report["realStudentPencilVectors"],"student writing rules")

if __name__=="__main__":
    main(Path(sys.argv[1] if len(sys.argv)>1 else "qa-artifacts/r73-division-word-problems"))
