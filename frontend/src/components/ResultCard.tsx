import React from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileArchive,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import type { ConversionResponse } from '../types';
import { translations } from '../i18n/translations';

interface ResultCardProps {
  result: ConversionResponse;
  lang: 'fr' | 'en';
  onReset: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, lang, onReset }) => {
  const t = translations[lang];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasSuccessful = result.successful_count > 0;
  const isAllSuccess = result.successful_count === result.total && result.failed_count === 0;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
      {/* Header Banner */}
      <div
        className={`px-6 py-5 border-b flex flex-wrap items-center justify-between gap-4 ${
          isAllSuccess
            ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20'
            : result.failed_count > 0 && hasSuccessful
            ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20'
            : 'bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/20'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              isAllSuccess
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : result.failed_count > 0 && hasSuccessful
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}
          >
            {isAllSuccess ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : result.failed_count > 0 && hasSuccessful ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <XCircle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAllSuccess
                ? t.results_title
                : result.failed_count > 0 && hasSuccessful
                ? 'Conversions partiellement terminées'
                : t.status_failed}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {result.successful_count} sur {result.total} fichier(s) converti(s) en {result.duration_seconds}s
            </p>
          </div>
        </div>

        {/* Global actions: Batch ZIP & Reset */}
        <div className="flex items-center gap-2">
          {result.batch_download_url && (
            <a
              href={result.batch_download_url}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all hover:shadow-blue-500/25"
            >
              <FileArchive className="w-4 h-4" />
              {t.download_all_zip}
            </a>
          )}
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t.convert_another}
          </button>
        </div>
      </div>

      {/* Itemized Results */}
      <div className="p-6 divide-y divide-slate-100 dark:divide-slate-800/60">
        {result.results.map((item, index) => {
          const isSuccess = item.status === 'success';
          const isOcrUsed = (item.method_used || '').toLowerCase().includes('ocr');

          return (
            <div
              key={item.id || index}
              className={`py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                !isSuccess ? 'opacity-90' : ''
              }`}
            >
              {/* File details */}
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isSuccess
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50'
                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white truncate max-w-xs md:max-w-md">
                      {item.output_filename || item.original_filename}
                    </span>

                    {/* Method Badge */}
                    {isSuccess && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          isOcrUsed
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                        }`}
                      >
                        {isOcrUsed ? (
                          <>
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            {t.badge_ocr}
                          </>
                        ) : (
                          t.badge_native
                        )}
                      </span>
                    )}

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        isSuccess
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                      }`}
                    >
                      {isSuccess ? t.status_success : t.status_failed}
                    </span>
                  </div>

                  {/* Metadata line */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                    <span>Source: {item.original_filename}</span>
                    <span>•</span>
                    <span>{item.pages} page(s)</span>
                    {item.file_size_bytes > 0 && (
                      <>
                        <span>•</span>
                        <span>{formatBytes(item.file_size_bytes)}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.duration_seconds}s
                    </span>
                  </div>

                  {/* Error message if failed */}
                  {item.error && (
                    <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 flex items-start gap-1.5">
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{item.error}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action button */}
              {isSuccess && item.download_url && (
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <a
                    href={item.download_url}
                    download={item.output_filename}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm transition-all hover:shadow-emerald-500/25"
                  >
                    <Download className="w-4 h-4" />
                    {t.download_word}
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
