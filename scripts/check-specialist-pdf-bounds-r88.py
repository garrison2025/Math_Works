#!/usr/bin/env python3
"""R88: inspect ACTUAL closure and function-graph PDF bytes, not code geometry.

Independent software preflight only. A clean digital PDF does NOT certify
curriculum quality, paper stock, reader accessibility or physical 100% printing.
"""
import json
import math
from pathlib import Path
import sys

try:
    import fitz
except ImportError as exc:
    raise SystemExit("PyMuPDF is required for R88 PDF preflight") from exc

SAFE_PT = 36.0
TOLERANCE_PT = 0.25
SUITES = (
    ("closure", "qa-artifacts/closure-30-actual-worksheet-pdfs",
     "mathworks-closure-30-samples/v1", "exports", "path", 30),
    ("functions", "qa-artifacts/r86-real-function-graphs",
     "mathworks-r86-coordinate-graphs/v1", "samples", "file", 24),
)


def audit(folder: Path, schema: str, records_key: str, path_key: str,
          expected: int, output: Path, label: str):
    manifest = json.loads((folder / "manifest.json").read_text(encoding="utf8"))
    entries = manifest.get(records_key)
    if manifest.get("schema") != schema or not isinstance(entries, list) or len(entries) != expected:
        raise ValueError(f"{label}: invalid manifest or missing PDF records")
    names = [record[path_key] for record in entries]
    if len(set(names)) != expected:
        raise ValueError(f"{label}: duplicate PDF sample name")

    words = drawings = pages = 0
    min_text_margin = min_vector_margin = math.inf
    defects = []
    png_dir = output / "previews"
    png_dir.mkdir(parents=True, exist_ok=True)
    for meta in entries:
        filename = meta[path_key]
        path = folder / filename
        if path.suffix.lower() != ".pdf" or not path.is_file():
            raise ValueError(f"{label}: missing actual PDF {filename}")
        with fitz.open(path) as doc:
            if len(doc) != 4:
                defects.append(f"{filename}: expected 4 physical pages, got {len(doc)}")
            if not doc.is_pdf or doc.is_encrypted:
                defects.append(f"{filename}: invalid or encrypted printable PDF")
            for page_no, page in enumerate(doc, 1):
                pages += 1
                width, height = page.rect.width, page.rect.height
                expected_size = (595.28, 841.89) if meta["paper"] == "A4" else (612.0, 792.0)
                if abs(width - expected_size[0]) > .1 or abs(height - expected_size[1]) > .1:
                    defects.append(f"{filename} p{page_no}: incorrect MediaBox")
                for x0,y0,x1,y1,word,*_ in page.get_text("words"):
                    words += 1
                    margins = (x0, y0, width-x1, height-y1)
                    min_text_margin = min(min_text_margin, *margins)
                    if not all(math.isfinite(z) for z in margins) or min(margins) < SAFE_PT - TOLERANCE_PT:
                        if len(defects) < 40:
                            defects.append(f"{filename} p{page_no}: word {word!r}, bounds {tuple(round(z,2) for z in margins)}pt")
                for path_obj in page.get_drawings():
                    drawings += 1
                    box = path_obj["rect"]
                    margins = (box.x0,box.y0,width-box.x1,height-box.y1)
                    min_vector_margin = min(min_vector_margin, *margins)
                    if not all(math.isfinite(z) for z in margins) or min(margins) < SAFE_PT - TOLERANCE_PT:
                        if len(defects) < 40:
                            defects.append(f"{filename} p{page_no}: vector margin {tuple(round(z,2) for z in margins)}pt")
            # Retain real first-page raster samples for human visual assessment.
            if meta["edition"] == "questions":
                pix = doc[0].get_pixmap(matrix=fitz.Matrix(1,1), alpha=False)
                pix.save(png_dir / (Path(filename).stem + ".png"))
    if words == 0 or drawings == 0:
        defects.append(f"{label}: cannot find actual PDF text and vector strokes")
    return dict(label=label, documents=len(entries), pages=pages, words=words,
                vector_paths=drawings, min_text_margin_pt=round(min_text_margin,2),
                min_vector_margin_pt=round(min_vector_margin,2),
                required_safe_pt=SAFE_PT, status="FAIL" if defects else "PASS",
                defects=defects)


def main():
    root=Path(sys.argv[1]) if len(sys.argv)>1 else Path(".")
    output=root/"qa-artifacts/r88-specialist-print-audit"
    output.mkdir(parents=True, exist_ok=True)
    results=[]
    for label,folder,schema,key,path_key,n in SUITES:
        results.append(audit(root/folder,schema,key,path_key,n,output,label))
    result={"status":"PASS" if all(x["status"]=="PASS" for x in results) else "FAIL",
            "scope":"54 actual A4/Letter student/answer/steps specialist PDFs; digital text/vector preflight only",
            "teacher_review":"NOT RUN","physical_100_percent_print":"NOT RUN",
            "checks":results}
    (output/"audit.json").write_text(json.dumps(result,indent=2)+"\n",encoding="utf8")
    print("R88 specialist physical-margin preflight:",result["status"])
    for row in results:
        print(row["label"],row["documents"],"PDFs",row["pages"],"pages",
              row["words"],"words",row["vector_paths"],"paths",
              "min text margin",row["min_text_margin_pt"],"pt",
              "min vector margin",row["min_vector_margin_pt"],"pt")
        for issue in row["defects"][:15]: print("ERROR:",issue,file=sys.stderr)
    return 0 if result["status"]=="PASS" else 1


if __name__=="__main__":
    sys.exit(main())
