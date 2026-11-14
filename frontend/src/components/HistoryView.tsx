import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  Download,
  AlertCircle,
  Sparkles,
  FileText,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import type { HistoryItem } from '../types';
import { translations } from '../i18n/translations';

interface HistoryViewProps {
  lang: 'fr' | 'en';
}

export const HistoryView: React.FC<HistoryViewProps> = ({ lang }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const t = translations[lang];

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/history');
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error('Fetch history error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm(t.confirm_clear_history)) return;
    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      if (res.ok) {
        setItems([]);
      }
    } catch (err) {
      console.error('Clear history error', err);
    }
  };

  const filteredItems = items.filter(item => {
    const targetName = item.output_filename || item.docx_filename || item.original_filename;
    const matchesSearch =
      item.original_filename.toLowerCase().includes(search.toLowerCase()) ||
      targetName.toLowerCase().includes(search.toLowerCase());

    const isSuccess = item.status === 'completed' || item.status === 'success';
    const isOcr = item.ocr_applied || (item.method_used && item.method_used.toLowerCase().includes('ocr'));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'success' && isSuccess) ||
      (statusFilter === 'failed' && item.status === 'failed') ||
      (statusFilter === 'ocr' && isOcr);

    return matchesSearch && matchesStatus;
  });

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {t.history_title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.history_subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t.clear_history}
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.search_history}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          >
            <option value="all">{t.filter_all}</option>
            <option value="success">{t.filter_success}</option>
            <option value="failed">{t.filter_failed}</option>
            <option value="ocr">Mode OCR uniquement</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
          <p className="text-sm">Chargement de l'historique...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8">
          <History className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
            {t.no_history}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Vos conversions récentes apparaîtront ici avec possibilité de retélécharger les documents.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredItems.map(item => {
            const isSuccess = item.status === 'completed' || item.status === 'success';
            const isOcr = item.ocr_applied || ((item.method_used || '').toLowerCase().includes('ocr'));
            const outputName = item.output_filename || item.docx_filename || item.original_filename;
            const fileSize = item.file_size_bytes || item.docx_size || item.file_size || 0;
            const pagesCount = item.pages || item.page_count || 1;
            const downloadUrl = item.download_url || `/api/download/${encodeURIComponent(outputName)}`;

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSuccess
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                        {outputName}
                      </span>

                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {isSuccess ? t.status_success : t.status_failed}
                      </span>

                      {/* Method */}
                      {isOcr && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          <Sparkles className="w-3 h-3" />
                          OCR
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      <span>{formatDate(item.timestamp)}</span>
                      <span>•</span>
                      <span>{pagesCount} p.</span>
                      {fileSize > 0 && (
                        <>
                          <span>•</span>
                          <span>{formatBytes(fileSize)}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{item.duration_seconds}s</span>
                    </div>

                    {/* File expired warning */}
                    {isSuccess && !item.exists_on_disk && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{t.file_expired}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {isSuccess && item.exists_on_disk && (
                    <a
                      href={downloadUrl}
                      download={outputName}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t.download_word}
                    </a>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Supprimer de l'historique"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
