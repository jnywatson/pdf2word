import React from 'react';
import { Eye, Languages, Sparkles } from 'lucide-react';
import { translations } from '../i18n/translations';
import type { OcrMode } from '../types';

interface OcrOptionsBarProps {
  ocrMode: OcrMode;
  setOcrMode: (mode: OcrMode) => void;
  ocrLang: string;
  setOcrLang: (lang: string) => void;
  lang: 'fr' | 'en';
}

export const OcrOptionsBar: React.FC<OcrOptionsBarProps> = ({
  ocrMode,
  setOcrMode,
  ocrLang,
  setOcrLang,
  lang,
}) => {
  const t = translations[lang];

  return (
    <div className="w-full bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 p-4 space-y-3">
      <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span>{t.ocr_section_title}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Mode selector */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Mode de traitement :</span>
          </label>
          <select
            value={ocrMode}
            onChange={(e) => setOcrMode(e.target.value as OcrMode)}
            className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="auto">{t.ocr_mode_auto}</option>
            <option value="force_ocr">{t.ocr_mode_force}</option>
            <option value="no_ocr">{t.ocr_mode_disabled}</option>
          </select>
        </div>

        {/* Language selector */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
            <Languages className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.ocr_lang_label}</span>
          </label>
          <select
            value={ocrLang}
            onChange={(e) => setOcrLang(e.target.value)}
            disabled={ocrMode === 'no_ocr'}
            className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
          >
            <option value="fra+eng">{t.ocr_lang_fra_eng}</option>
            <option value="fra">{t.ocr_lang_fra}</option>
            <option value="eng">{t.ocr_lang_eng}</option>
          </select>
        </div>
      </div>
    </div>
  );
};
