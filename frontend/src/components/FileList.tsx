import React from 'react';
import { 
  FileText, 
  Trash2, 
  Plus, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Layers,
  FileSearch
} from 'lucide-react';
import type { SelectedFile, OcrMode } from '../types';
import { translations } from '../i18n/translations';
import { OcrOptionsBar } from './OcrOptionsBar';

interface FileListProps {
  files: SelectedFile[];
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  onAddMoreClick: () => void;
  onConvert: () => void;
  isConverting: boolean;
  ocrMode: OcrMode;
  setOcrMode: (mode: OcrMode) => void;
  ocrLang: string;
  setOcrLang: (lang: string) => void;
  lang: 'fr' | 'en';
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onRemoveFile,
  onClearAll,
  onAddMoreClick,
  onConvert,
  isConverting,
  ocrMode,
  setOcrMode,
  ocrLang,
  setOcrLang,
  lang,
}) => {
  const t = translations[lang];

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 o';
    const k = 1024;
    const sizes = ['o', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasScannedFiles = files.some(f => f.isScanned || f.is_scanned);
  const totalPages = files.reduce((acc, f) => acc + (f.pageCount || f.pages || 0), 0);

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 space-y-6 transition-all">
      {/* Header of file list */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <span>{t.files_to_convert}</span>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full">
              {files.length} {files.length > 1 ? t.files : t.file}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {totalPages > 0 ? `${totalPages} page(s) au total` : 'Prêt pour la conversion'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onAddMoreClick}
            disabled={isConverting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.add_more}</span>
          </button>
          <button
            onClick={onClearAll}
            disabled={isConverting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clear_all}</span>
          </button>
        </div>
      </div>

      {/* Scanned warning notice */}
      {hasScannedFiles && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start space-x-3 text-amber-900 dark:text-amber-200 text-xs">
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">{t.scanned_alert_title}</p>
            <p className="text-amber-800/90 dark:text-amber-200/90 leading-relaxed">
              {t.scanned_alert_desc}
            </p>
          </div>
        </div>
      )}

      {/* File Items Table / Cards */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {files.map((fileItem) => {
          const isScanned = fileItem.isScanned || fileItem.is_scanned;
          const pages = fileItem.pageCount || fileItem.pages;

          return (
            <div
              key={fileItem.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:border-blue-400/50 dark:hover:border-blue-500/50 transition group"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-xs sm:max-w-md">
                      {fileItem.name}
                    </p>
                    {isScanned && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center space-x-1 shrink-0">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Scanné</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    <span>{formatFileSize(fileItem.size)}</span>
                    {pages !== undefined && (
                      <>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Layers className="w-3 h-3" />
                          <span>{pages} p.</span>
                        </span>
                      </>
                    )}
                    {fileItem.probing && (
                      <>
                        <span>•</span>
                        <span className="text-blue-500 flex items-center space-x-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Analyse...</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status or Remove Button */}
              <div className="flex items-center space-x-3 shrink-0 ml-3">
                {fileItem.status === 'processing' && (
                  <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">{t.status_converting}</span>
                  </div>
                )}
                {fileItem.status === 'failed' && (
                  <div className="flex items-center space-x-1 text-xs font-medium text-rose-500" title={fileItem.errorMessage}>
                    <AlertCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.status_failed}</span>
                  </div>
                )}
                {fileItem.status === 'pending' && (
                  <button
                    onClick={() => onRemoveFile(fileItem.id)}
                    disabled={isConverting}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-700/60 transition"
                    title={t.delete_action}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* OCR Options Bar */}
      <OcrOptionsBar
        ocrMode={ocrMode}
        setOcrMode={setOcrMode}
        ocrLang={ocrLang}
        setOcrLang={setOcrLang}
        lang={lang}
      />

      {/* Convert Action Button */}
      <div className="pt-2">
        <button
          onClick={onConvert}
          disabled={isConverting || files.length === 0}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 cursor-pointer"
        >
          {isConverting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t.converting_btn}</span>
            </>
          ) : (
            <>
              <FileSearch className="w-5 h-5" />
              <span>{t.convert_btn} ({files.length})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
