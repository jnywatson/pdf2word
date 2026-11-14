import React, { useState, useEffect, useRef } from 'react';
import {
  Navbar,
  DropZone,
  FileList,
  ResultCard,
  TrustBadges,
  HistoryView,
  SettingsView,
  AboutModal,
} from './components';
import type {
  SelectedFile,
  OcrMode,
  AppSettings,
  SystemDiagnostics,
  ConversionResponse,
} from './types';
import { translations } from './i18n/translations';
import { Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation & Modal states
  const [currentTab, setCurrentTab] = useState<'home' | 'convert' | 'history' | 'settings'>('home');
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  // App Settings
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    language: 'fr',
    naming_pattern: '{basename}.docx',
    custom_output_dir: '',
    ocr_enabled: true,
    ocr_languages: ['fra', 'eng'],
    ocr_dpi: 300,
    enhance_scans: true,
    max_file_size_mb: 50,
  });

  // Diagnostics & History count
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [historyCount, setHistoryCount] = useState<number>(0);

  // Files & Processing states
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [ocrMode, setOcrMode] = useState<OcrMode>('auto');
  const [ocrLang, setOcrLang] = useState<string>('fra+eng');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionResult, setConversionResult] = useState<ConversionResponse | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const fileInputHiddenRef = useRef<HTMLInputElement>(null);

  const lang = settings.language;
  const t = translations[lang];

  // Theme Sync
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Fetch initial Settings, Diagnostics & History Count
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [settingsRes, diagRes, historyRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/settings/diagnostics'),
          fetch('/api/history'),
        ]);

        if (settingsRes.ok) {
          const loadedSettings = await settingsRes.json();
          setSettings(prev => ({ ...prev, ...loadedSettings }));
        }
        if (diagRes.ok) {
          const loadedDiag = await diagRes.json();
          setDiagnostics(loadedDiag);
        }
        if (historyRes.ok) {
          const histData = await historyRes.json();
          setHistoryCount(histData.total || 0);
        }
      } catch (err) {
        console.warn('Initial fetch note:', err);
      }
    };
    fetchInitialData();
  }, []);

  // Update Settings via API
  const handleUpdateSettings = async (newPartial: Partial<AppSettings>) => {
    const updated = { ...settings, ...newPartial };
    setSettings(updated);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  // File Upload & Probing
  const handleFilesAdded = async (newNativeFiles: File[]) => {
    setGlobalError(null);
    setConversionResult(null);

    const mappedFiles: SelectedFile[] = newNativeFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: file.size,
      probing: true,
      status: 'pending',
      progress: 0,
    }));

    setFiles(prev => [...prev, ...mappedFiles]);

    for (const fItem of mappedFiles) {
      try {
        const formData = new FormData();
        formData.append('file', fItem.file);

        const res = await fetch('/api/convert/probe', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const probeData = await res.json();
          setFiles(current =>
            current.map(item =>
              item.id === fItem.id
                ? {
                    ...item,
                    probing: false,
                    pages: probeData.page_count,
                    pageCount: probeData.page_count,
                    is_scanned: probeData.is_scanned,
                    isScanned: probeData.is_scanned,
                    needs_ocr: probeData.needs_ocr,
                    encrypted: probeData.encrypted,
                    errorMessage: probeData.encrypted ? 'Document protégé par mot de passe' : undefined,
                  }
                : item
            )
          );
        } else {
          setFiles(current =>
            current.map(item =>
              item.id === fItem.id ? { ...item, probing: false } : item
            )
          );
        }
      } catch {
        setFiles(current =>
          current.map(item =>
            item.id === fItem.id ? { ...item, probing: false } : item
          )
        );
      }
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearFiles = () => {
    setFiles([]);
    setConversionResult(null);
    setGlobalError(null);
  };

  // Start Conversion Process
  const handleStartConversion = async () => {
    if (files.length === 0 || isConverting || hasEncryptedFile) return;

    setIsConverting(true);
    setGlobalError(null);
    setConversionResult(null);

    setFiles(prev => prev.map(f => ({ ...f, status: 'processing', progress: 30 })));

    try {
      const formData = new FormData();
      files.forEach(f => {
        formData.append('files', f.file);
      });
      formData.append('ocr_mode', ocrMode);
      formData.append('language', ocrLang);

      const res = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Erreur lors de la conversion');
      }

      const data: ConversionResponse = await res.json();
      setConversionResult(data);
      setHistoryCount(prev => prev + data.successful_count);

      setFiles(prev =>
        prev.map(item => {
          const match = data.results.find(r => r.original_filename === item.name);
          if (match) {
            return {
              ...item,
              status: match.status === 'success' ? 'completed' : 'failed',
              errorMessage: match.error,
              progress: 100,
            };
          }
          return item;
        })
      );
    } catch (err: any) {
      setGlobalError(err.message || 'Une erreur est survenue lors de la conversion');
      setFiles(prev => prev.map(f => ({ ...f, status: 'failed', progress: 0 })));
    } finally {
      setIsConverting(false);
    }
  };

  const hasEncryptedFile = files.some(f => f.encrypted);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Hidden file input for "Add more" */}
      <input
        type="file"
        ref={fileInputHiddenRef}
        multiple
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={e => {
          if (e.target.files) {
            handleFilesAdded(Array.from(e.target.files));
          }
          e.target.value = '';
        }}
      />

      {/* Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        theme={settings.theme}
        toggleTheme={() =>
          handleUpdateSettings({
            theme: settings.theme === 'light' ? 'dark' : 'light',
          })
        }
        lang={lang}
        setLang={newLang => handleUpdateSettings({ language: newLang })}
        historyCount={historyCount}
        openAbout={() => setIsAboutOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* VIEW 1 & 2: HOME / CONVERT */}
        {(currentTab === 'home' || currentTab === 'convert') && (
          <div className="space-y-8 animate-fadeIn">
            {/* Hero Header */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nouveau : Moteur OCR haute précision pour documents scannés</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t.hero_title}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg">
                {t.hero_subtitle}
              </p>
            </div>

            {/* Error Banner */}
            {globalError && (
              <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
                <span>{globalError}</span>
                <button
                  onClick={() => setGlobalError(null)}
                  className="text-xs font-semibold underline ml-4 hover:opacity-80"
                >
                  Fermer
                </button>
              </div>
            )}

            {/* Results Card if conversion finished */}
            {conversionResult && (
              <div className="max-w-3xl mx-auto">
                <ResultCard
                  result={conversionResult}
                  lang={lang}
                  onReset={() => {
                    setConversionResult(null);
                    setFiles([]);
                  }}
                />
              </div>
            )}

            {/* Upload & Conversion Section */}
            {!conversionResult && (
              <div className="max-w-3xl mx-auto space-y-6">
                {files.length === 0 ? (
                  <DropZone
                    onFilesSelected={handleFilesAdded}
                    lang={lang}
                    maxSizeMb={settings.max_file_size_mb}
                  />
                ) : (
                  <FileList
                    files={files}
                    onRemoveFile={handleRemoveFile}
                    onClearAll={handleClearFiles}
                    onAddMoreClick={() => fileInputHiddenRef.current?.click()}
                    onConvert={handleStartConversion}
                    isConverting={isConverting}
                    ocrMode={ocrMode}
                    setOcrMode={setOcrMode}
                    ocrLang={ocrLang}
                    setOcrLang={setOcrLang}
                    lang={lang}
                  />
                )}
              </div>
            )}

            {/* Trust Badges */}
            <TrustBadges lang={lang} />
          </div>
        )}

        {/* VIEW 3: HISTORY */}
        {currentTab === 'history' && <HistoryView lang={lang} />}

        {/* VIEW 4: SETTINGS */}
        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            diagnostics={diagnostics}
            onUpdateSettings={handleUpdateSettings}
            onOpenAbout={() => setIsAboutOpen(true)}
            lang={lang}
          />
        )}
      </main>

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        lang={lang}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm py-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © 2026 <strong>PDF2WORD PRO</strong> — Conversion PDF vers Word & Moteur OCR.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAboutOpen(true)}
              className="hover:text-blue-500 transition-colors"
            >
              À propos
            </button>
            <span>•</span>
            <span>Traitement 100% local et sécurisé</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
