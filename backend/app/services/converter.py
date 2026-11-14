import io
import os
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Tuple, Optional, Callable
import pymupdf
import pdfplumber
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
from pdf2docx import Converter

from app.config import OUTPUTS_DIR, TEMP_DIR, load_settings
from app.services.ocr_engine import ocr_engine
from app.utils.security import sanitize_filename

class PDFConverter:
    @staticmethod
    def probe_pdf(file_path: Path) -> Dict[str, Any]:
        """
        Analyzes a PDF: page count, digital text density, image presence, scanned status.
        """
        try:
            doc = pymupdf.open(str(file_path))
            page_count = len(doc)
            total_chars = 0
            has_images = False

            for page in doc:
                text = page.get_text() or ""
                total_chars += len(text.strip())
                if len(page.get_images()) > 0:
                    has_images = True

            doc.close()
            avg_chars = total_chars / max(page_count, 1)
            # If average chars per page is very low (< 25) and document has pages, it's a scanned/raster document
            is_scanned = (avg_chars < 25)

            return {
                "page_count": page_count,
                "total_chars": total_chars,
                "avg_chars_per_page": round(avg_chars, 1),
                "is_scanned": is_scanned,
                "has_images": has_images,
                "is_valid": True,
                "error": None
            }
        except Exception as e:
            return {
                "page_count": 0,
                "total_chars": 0,
                "avg_chars_per_page": 0,
                "is_scanned": False,
                "has_images": False,
                "is_valid": False,
                "error": str(e)
            }

    @staticmethod
    def generate_docx_filename(original_pdf_name: str, pattern: str) -> str:
        base_name = Path(original_pdf_name).stem
        base_name = sanitize_filename(base_name)
        if base_name.lower().endswith(".pdf"):
            base_name = base_name[:-4]

        if pattern == "original_converti":
            name = f"{base_name}_converti.docx"
        elif pattern == "original_timestamp":
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            name = f"{base_name}_{timestamp}.docx"
        else: # "original"
            name = f"{base_name}.docx"
        return name

    @staticmethod
    def _style_table(table):
        """Applies elegant corporate styling to Word tables."""
        for i, row in enumerate(table.rows):
            for cell in row.cells:
                tcPr = cell._tc.get_or_add_tcPr()
                if i == 0:
                    # Header cell deep blue #1E3A8A
                    shd = parse_xml(r'<w:shd {} w:fill="1E3A8A"/>'.format(nsdecls('w')))
                    tcPr.append(shd)
                    for paragraph in cell.paragraphs:
                        for run in paragraph.runs:
                            run.font.bold = True
                            run.font.color.rgb = RGBColor(255, 255, 255)
                            run.font.size = Pt(9.5)
                else:
                    if i % 2 == 1:
                        shd = parse_xml(r'<w:shd {} w:fill="F8FAFC"/>'.format(nsdecls('w')))
                        tcPr.append(shd)
                    for paragraph in cell.paragraphs:
                        for run in paragraph.runs:
                            run.font.size = Pt(9.5)

    @classmethod
    def _convert_with_fallback(
        cls,
        pdf_path: Path,
        output_docx_path: Path,
        progress_callback: Optional[Callable[[int], None]] = None
    ):
        """
        Structured layout extractor using PyMuPDF + pdfplumber + python-docx.
        Handles text blocks, headings, lists, tables and embedded images.
        """
        doc = Document()
        pdf_doc = pymupdf.open(str(pdf_path))
        page_count = len(pdf_doc)

        with pdfplumber.open(str(pdf_path)) as plumber_pdf:
            for page_idx, (mupdf_page, plumber_page) in enumerate(zip(pdf_doc, plumber_pdf.pages)):
                if progress_callback:
                    pct = int(20 + (page_idx / max(page_count, 1)) * 70)
                    progress_callback(pct)

                if page_idx > 0:
                    doc.add_page_break()

                # Extract tables
                tables = plumber_page.extract_tables()
                table_bboxes = []
                for t in plumber_page.find_tables():
                    table_bboxes.append(t.bbox)

                # Extract blocks
                blocks = mupdf_page.get_text("dict")["blocks"]

                for block in blocks:
                    # Image block
                    if block.get("type") == 1 and "image" in block:
                        try:
                            img_bytes = block["image"]
                            img_stream = io.BytesIO(img_bytes)
                            width_inch = min(5.5, max(1.0, block.get("width", 300) / 72.0))
                            doc.add_picture(img_stream, width=Inches(width_inch))
                            last_p = doc.paragraphs[-1]
                            last_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                        except Exception:
                            pass
                        continue

                    # Text block
                    if block.get("type") == 0:
                        bbox = block.get("bbox", [0, 0, 0, 0])
                        # Prevent duplicate text if inside table
                        inside_table = False
                        for tb in table_bboxes:
                            if (bbox[0] >= tb[0] - 5 and bbox[1] >= tb[1] - 5 and
                                bbox[2] <= tb[2] + 5 and bbox[3] <= tb[3] + 5):
                                inside_table = True
                                break
                        if inside_table:
                            continue

                        block_text = ""
                        max_font_size = 10.0
                        is_bold = False

                        for line in block.get("lines", []):
                            line_text = ""
                            for span in line.get("spans", []):
                                line_text += span.get("text", "")
                                size = span.get("size", 10.0)
                                if size > max_font_size:
                                    max_font_size = size
                                if "bold" in span.get("font", "").lower() or span.get("flags", 0) & 2:
                                    is_bold = True
                            block_text += line_text + " "

                        block_text = block_text.strip()
                        if not block_text:
                            continue

                        # Heading styles
                        if max_font_size >= 18:
                            doc.add_heading(block_text, level=1)
                        elif max_font_size >= 14:
                            doc.add_heading(block_text, level=2)
                        elif max_font_size >= 12 and is_bold:
                            doc.add_heading(block_text, level=3)
                        elif block_text.startswith("•") or block_text.startswith("- ") or block_text.startswith("* "):
                            clean_t = re.sub(r"^[•\-*]\s*", "", block_text)
                            doc.add_paragraph(clean_t, style="List Bullet")
                        else:
                            doc.add_paragraph(block_text)

                # Add extracted tables
                for table_data in tables:
                    if not table_data or len(table_data) == 0:
                        continue
                    num_rows = len(table_data)
                    num_cols = max(len(row) for row in table_data if row)
                    if num_cols == 0:
                        continue

                    t = doc.add_table(rows=num_rows, cols=num_cols)
                    t.style = 'Table Grid'
                    for r_idx, row in enumerate(table_data):
                        for c_idx in range(num_cols):
                            cell_val = row[c_idx] if c_idx < len(row) and row[c_idx] is not None else ""
                            t.cell(r_idx, c_idx).text = str(cell_val).strip()

                    cls._style_table(t)
                    doc.add_paragraph()

        pdf_doc.close()
        doc.save(str(output_docx_path))

    @classmethod
    def convert(
        cls,
        pdf_path: Path,
        original_filename: str,
        ocr_mode: str = "auto", # "auto", "force_ocr", "no_ocr"
        ocr_languages: Optional[str] = None,
        custom_output_dir: Optional[Path] = None,
        progress_callback: Optional[Callable[[int], None]] = None
    ) -> Dict[str, Any]:
        """
        Universal conversion pipeline:
        - Accurately identifies scanned pages vs digital layouts
        - Uses OCR or pdf2docx or structured fallback
        - Returns high-fidelity Word docx and metrics
        """
        start_time = time.time()
        settings = load_settings()

        if progress_callback:
            progress_callback(5)

        probe = cls.probe_pdf(pdf_path)
        if not probe["is_valid"]:
            raise ValueError(f"Fichier PDF invalide : {probe['error']}")

        page_count = probe["page_count"]
        is_scanned = probe["is_scanned"]
        naming_pattern = settings.get("naming_pattern", "original")

        out_dir = custom_output_dir if (custom_output_dir and custom_output_dir.exists()) else OUTPUTS_DIR
        out_dir.mkdir(parents=True, exist_ok=True)

        docx_filename = cls.generate_docx_filename(original_filename, naming_pattern)
        output_docx_path = out_dir / docx_filename

        # Avoid collision
        counter = 1
        base_stem = output_docx_path.stem
        while output_docx_path.exists():
            output_docx_path = out_dir / f"{base_stem}_{counter}.docx"
            docx_filename = output_docx_path.name
            counter += 1

        if progress_callback:
            progress_callback(15)

        ocr_applied = False
        method_used = "digital_native"

        # Determine strategy
        should_use_ocr = False
        if ocr_mode == "force_ocr":
            should_use_ocr = True
        elif ocr_mode == "auto":
            should_use_ocr = is_scanned and settings.get("ocr_enabled", True)
        elif ocr_mode == "no_ocr":
            should_use_ocr = False

        langs = ocr_languages or "+".join(settings.get("ocr_languages", ["fra", "eng"]))
        dpi = settings.get("ocr_dpi", 300)
        enhance = settings.get("enhance_scans", True)

        if should_use_ocr:
            if not ocr_engine.is_available():
                if is_scanned:
                    raise RuntimeError(
                        "Ce document est un PDF scanné, mais le moteur Tesseract OCR n'est pas installé sur ce serveur. "
                        "Veuillez activer Tesseract OCR pour traiter les documents scannés."
                    )
                else:
                    # Digital PDF requested force_ocr but Tesseract missing -> fallback
                    cls._convert_with_fallback(pdf_path, output_docx_path, progress_callback=progress_callback)
            else:
                ocr_engine.convert_scanned_pdf_to_docx(
                    pdf_path=pdf_path,
                    output_docx_path=output_docx_path,
                    lang=langs,
                    dpi=dpi,
                    enhance=enhance,
                    progress_callback=progress_callback
                )
                ocr_applied = True
                method_used = "tesseract_ocr"
        else:
            # Digital conversion: try high fidelity pdf2docx
            try:
                if progress_callback:
                    progress_callback(25)
                cv = Converter(str(pdf_path))
                cv.convert(str(output_docx_path), start=0, end=None)
                cv.close()
                method_used = "pdf2docx_vector"
                if progress_callback:
                    progress_callback(90)
            except Exception:
                if progress_callback:
                    progress_callback(35)
                cls._convert_with_fallback(pdf_path, output_docx_path, progress_callback=progress_callback)
                method_used = "structured_fallback"

        duration = round(time.time() - start_time, 2)
        docx_size = output_docx_path.stat().st_size if output_docx_path.exists() else 0

        if progress_callback:
            progress_callback(100)

        return {
            "success": True,
            "docx_filename": docx_filename,
            "docx_path": str(output_docx_path),
            "docx_size": docx_size,
            "page_count": page_count,
            "duration_seconds": duration,
            "ocr_applied": ocr_applied,
            "is_scanned": is_scanned,
            "method_used": method_used
        }
