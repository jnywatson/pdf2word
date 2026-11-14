import io
import os
import subprocess
import time
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image, ImageEnhance, ImageFilter
import pymupdf
import pytesseract
from pytesseract import Output
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

from app.config import find_tesseract_path

class OCREngine:
    def __init__(self):
        self.tesseract_cmd = find_tesseract_path()
        if self.tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = self.tesseract_cmd

    def is_available(self) -> bool:
        if not self.tesseract_cmd:
            return False
        return os.path.exists(self.tesseract_cmd)

    def get_version(self) -> str:
        if not self.is_available():
            return "Non installé"
        try:
            output = subprocess.check_output([self.tesseract_cmd, "--version"], text=True, stderr=subprocess.STDOUT)
            return output.splitlines()[0]
        except Exception:
            return "Installé (version non résolue)"

    def get_available_languages(self) -> List[str]:
        if not self.is_available():
            return []
        try:
            langs = pytesseract.get_languages()
            return [l for l in langs if l != "osd"]
        except Exception:
            return []

    def preprocess_image(self, pil_img: Image.Image, enhance: bool = True) -> Image.Image:
        """
        Enhances scanned page image for maximum OCR accuracy:
        1. Grayscale conversion
        2. Contrast boosting (makes faint text dark, background white)
        3. Sharpening filter
        """
        if not enhance:
            return pil_img

        # 1. Grayscale
        gray = pil_img.convert("L")

        # 2. Contrast enhancement
        enhancer = ImageEnhance.Contrast(gray)
        enhanced = enhancer.enhance(1.8)

        # 3. Sharpen
        sharpened = enhanced.filter(ImageFilter.SHARPEN)

        return sharpened

    def render_page_to_image(self, page: pymupdf.Page, dpi: int = 300) -> Image.Image:
        """
        Renders PyMuPDF page to high-res PIL Image.
        Default 300 DPI gives optimal balance for OCR.
        """
        zoom = dpi / 72.0
        mat = pymupdf.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_bytes = pix.tobytes("png")
        return Image.open(io.BytesIO(img_bytes))

    def resolve_languages(self, requested_lang: str) -> str:
        """
        Validates requested languages against installed tessdata.
        Falls back smoothly to 'eng' or first available.
        """
        available = self.get_available_languages()
        if not available:
            return "eng"

        selected = []
        for l in requested_lang.replace(",", "+").split("+"):
            l_clean = l.strip()
            if l_clean in available:
                selected.append(l_clean)

        if selected:
            return "+".join(selected)
        return "fra" if "fra" in available else ("eng" if "eng" in available else available[0])

    def ocr_page(
        self,
        page: pymupdf.Page,
        lang: str = "fra+eng",
        dpi: int = 300,
        enhance: bool = True
    ) -> Dict[str, Any]:
        """
        Performs full OCR on a PyMuPDF page:
        Returns extracted text, detected paragraphs, estimated confidence score.
        """
        if not self.is_available():
            raise RuntimeError(
                "Le moteur Tesseract OCR n'est pas disponible sur le système. "
                "Veuillez l'installer pour convertir les PDF scannés."
            )

        actual_lang = self.resolve_languages(lang)
        img = self.render_page_to_image(page, dpi=dpi)
        processed_img = self.preprocess_image(img, enhance=enhance)

        # Extract structured data
        data = pytesseract.image_to_data(processed_img, lang=actual_lang, output_type=Output.DICT)

        # Parse blocks & lines
        n_boxes = len(data['text'])
        blocks: Dict[int, List[str]] = {}
        confidences: List[float] = []

        for i in range(n_boxes):
            text = data['text'][i].strip()
            conf = float(data['conf'][i])
            if conf > 0:
                confidences.append(conf)

            if text:
                block_num = data['block_num'][i]
                if block_num not in blocks:
                    blocks[block_num] = []
                blocks[block_num].append(text)

        paragraphs = [" ".join(words) for words in blocks.values() if words]
        full_text = "\n\n".join(paragraphs)
        avg_conf = round(sum(confidences) / max(len(confidences), 1), 1)

        return {
            "text": full_text,
            "paragraphs": paragraphs,
            "confidence": avg_conf,
            "languages": actual_lang,
            "image_width": img.width,
            "image_height": img.height
        }

    def convert_scanned_pdf_to_docx(
        self,
        pdf_path: Path,
        output_docx_path: Path,
        lang: str = "fra+eng",
        dpi: int = 300,
        enhance: bool = True,
        progress_callback = None
    ) -> Dict[str, Any]:
        """
        Converts an entire scanned PDF into an editable Word document with formatted paragraphs.
        """
        start_time = time.time()
        doc = pymupdf.open(str(pdf_path))
        page_count = len(doc)

        word_doc = Document()

        # Configure default page margins (1 inch)
        for section in word_doc.sections:
            section.top_margin = Inches(1)
            section.bottom_margin = Inches(1)
            section.left_margin = Inches(1)
            section.right_margin = Inches(1)

        total_words = 0
        confidences = []

        for page_idx, page in enumerate(doc):
            if progress_callback:
                pct = int(10 + (page_idx / max(page_count, 1)) * 80)
                progress_callback(pct)

            if page_idx > 0:
                word_doc.add_page_break()

            res = self.ocr_page(page, lang=lang, dpi=dpi, enhance=enhance)
            total_words += len(res["text"].split())
            if res["confidence"] > 0:
                confidences.append(res["confidence"])

            # Add structured paragraphs
            for p_text in res["paragraphs"]:
                p_text_clean = p_text.strip()
                if not p_text_clean:
                    continue

                # Heading detection heuristic (all caps or short and uppercase)
                if len(p_text_clean) < 80 and p_text_clean.isupper() and len(p_text_clean.split()) <= 10:
                    p = word_doc.add_heading(p_text_clean, level=2)
                elif p_text_clean.startswith("•") or p_text_clean.startswith("- "):
                    clean_item = p_text_clean.lstrip("•- ").strip()
                    word_doc.add_paragraph(clean_item, style="List Bullet")
                else:
                    word_doc.add_paragraph(p_text_clean)

        doc.close()
        word_doc.save(str(output_docx_path))

        duration = round(time.time() - start_time, 2)
        avg_conf = round(sum(confidences) / max(len(confidences), 1), 1)

        return {
            "success": True,
            "page_count": page_count,
            "words_extracted": total_words,
            "average_confidence": avg_conf,
            "duration_seconds": duration,
            "languages_used": lang
        }

ocr_engine = OCREngine()
