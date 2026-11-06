"""R64: independent PyMuPDF inspection of real exported A4/Letter multiplication tables.
Checks all 169 grid squares, all 25 headers, exactly 144 empty student cells
versus 144 correctly printed answer cells, without trusting the JS manifest.
"""
from __future__ import annotations
import json
import math
import sys
from pathlib import Path
import fitz

PAPERS = {"letter": (612.0, 792.0), "a4": (595.28, 841.89)}
MODES = ("blank", "key")


def cell_of(word: tuple, width: float, height: float):
    cell = min((width-86.0)/13.0, 38.0)
    x0 = (width-13*cell)/2
    left = (word[0]+word[2])/2
    top = (word[1]+word[3])/2
    col = math.floor((left-x0)/cell)
    row = math.floor((top-181)/cell)
    if not 0 <= row <= 12 or not 0 <= col <= 12:
        return None
    if not (x0 + col*cell <= left <= x0+(col+1)*cell and
            181+row*cell <= top <= 181+(row+1)*cell):
        return None
    return row, col


def check_pdf(path: Path, paper: str, mode: str) -> dict:
    doc = fitz.open(path)
    if len(doc)!=1:
        raise AssertionError(f"{path}: expected one page, got {len(doc)}")
    page = doc[0]
    width,height = PAPERS[paper]
    assert abs(page.rect.width-width)<0.1, f"{path}: incorrect paper width"
    assert abs(page.rect.height-height)<0.1, f"{path}: incorrect paper height"
    cell=min((width-86)/13,38)
    origin_x=(width-13*cell)/2
    if origin_x<36 or 181+13*cell>height-36:
        raise AssertionError(f"{path}: 13x13 chart violates paper safe margins")
    rectangles=[]
    for draw in page.get_drawings():
        for item in draw.get("items",[]):
            if item[0]=="re":
                box=item[1]
                if abs(box.width-cell)<.2 and abs(box.height-cell)<.2:
                    rectangles.append(box)
    if len(rectangles)!=169:
        raise AssertionError(f"{path}: expected 169 actual grid rectangle vectors, got {len(rectangles)}")
    positions=set()
    for rect in rectangles:
        col=round((rect.x0-origin_x)/cell)
        row=round((rect.y0-181)/cell)
        if not (0<=col<=12 and 0<=row<=12):
            raise AssertionError(f"{path}: vector rectangle is outside chart {rect}")
        if abs(rect.x0-(origin_x+col*cell))>.3 or abs(rect.y0-(181+row*cell))>.3:
            raise AssertionError(f"{path}: displaced grid cell {row},{col}")
        positions.add((row,col))
    if len(positions)!=169:
        raise AssertionError(f"{path}: vector rectangles duplicate or omit a cell")
    seen={}
    for word in page.get_text("words"):
        position=cell_of(word,width,height)
        if position is None:continue
        if position in seen:
            raise AssertionError(f"{path}: two text words in one grid cell {position}")
        seen[position]=word[4]
    for row in range(13):
        for col in range(13):
            actual=seen.get((row,col))
            if row==0 and col==0:
                # PDF WinAnsi encoding can represent the multiplication symbol.
                if actual not in ("×","x","X"):
                    raise AssertionError(f"{path}: missing multiplication symbol {actual!r}")
            elif row==0:
                if actual!=str(col):
                    raise AssertionError(f"{path}: column header {col} is {actual!r}")
            elif col==0:
                if actual!=str(row):
                    raise AssertionError(f"{path}: row header {row} is {actual!r}")
            elif mode=="blank":
                if actual is not None:
                    raise AssertionError(f"{path}: student chart leaks answer at ({row},{col}): {actual!r}")
            else:
                if actual!=str(row*col):
                    raise AssertionError(f"{path}: wrong product ({row},{col}): expected {row*col}, got {actual!r}")
    if len(seen)!=(25 if mode=="blank" else 169):
        raise AssertionError(f"{path}: unexpected printed grid word count {len(seen)}")
    if "blank" in path.name and mode!="blank":
        raise AssertionError(f"{path}: mislabeled answer sheet")
    return {"name":path.name,"paper":paper,"mode":mode,"pageCount":1,
      "vectorCellCount":len(rectangles),"headerCells":25,
      "blankStudentProducts":144 if mode=="blank" else 0,
      "independentlyCheckedAnswerProducts":144 if mode=="key" else 0}


def main(folder: Path):
    results=[]
    for paper in PAPERS:
        for mode in MODES:
            name=f"multiplication-chart-1-12-{paper}-{mode}.pdf"
            path=folder/name
            if not path.is_file():
                raise AssertionError(f"Missing required PDF: {path}")
            results.append(check_pdf(path,paper,mode))
    report={"status":"PASS","pdfs":4,"vectorCells":676,
      "studentEmptyProductCells":288,"individuallyCheckedTeacherProducts":288,
      "checkedPaperSizes":list(PAPERS),"cases":results}
    (folder/"independent-pdf-audit.json").write_text(json.dumps(report,indent=2)+"\n")
    print("R64 multiplication chart PDF AUDIT PASS: 4 PDFs, 676 real vector cells, 288 blank student products, 288 mathematically verified answer products")


if __name__=="__main__":
    main(Path(sys.argv[1] if len(sys.argv)>1 else "qa-artifacts/r64-multiplication-grid"))
