import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  HardDrive,
  Cpu,
  Check,
  AlertTriangle,
  FileCheck,
  Info,
} from 'lucide-react';
import type { AppSettings, SystemDiagnostics } from '../types';
import { translations } from '../i18n/translations';

interface SettingsViewProps {
  settings: AppSettings;
  diagnostics: SystemDiagnostics | null;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenAbout: () => void;
  lang: 'fr' | 'en';
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  diagnostics,
  onUpdateSettings,
  onOpenAbout,
  lang,
}) => {
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const t = translations[lang];

  const handleToggle = (key: keyof AppSettings) => {
    onUpdateSettings({ [key]: !settings[key] });
    triggerSaved();
  };

  const handleChange = (key: keyof AppSettings, value: any) => {
    onUpdateSettings({ [key]: value });
    triggerSaved();
  };

  const triggerSaved = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {t.nav_settings}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personnalisez le comportement, l'OCR et la sécurité de PDF2WORD PRO
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-pulse">
            <Check className="w-4 h-4" />
            {t.save_success}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Apparence & Langue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sun className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              {t.settings_appearance}
            </h3>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {t.settings_theme}
              </p>
              <p className="text-xs text-slate-400">Basculer entre le mode clair et sombre</p>
            </div>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => handleChange('theme', 'light')}
                className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                  settings.theme === 'light'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                {t.theme_light}
              </button>
              <button
                onClick={() => handleChange('theme', 'dark')}
                className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                  settings.theme === 'dark'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                {t.theme_dark}
              </button>
            </div>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {t.settings_language}
              </p>
              <p className="text-xs text-slate-400">Langue de l'interface utilisateur</p>
            </div>
            <select
              value={settings.language}
              onChange={e => handleChange('language', e.target.value as 'fr' | 'en')}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* Naming & Limits */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <FileCheck className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              Fichiers & Nommage
            </h3>
          </div>

          {/* Naming Pattern */}
          <div>
            <label className="text-sm font-medium text-slate-800 dark:text-slate-200 block mb-1">
              {t.settings_naming}
            </label>
            <input
              type="text"
              value={settings.naming_pattern || '{basename}.docx'}
              onChange={e => handleChange('naming_pattern', e.target.value)}
              placeholder="{basename}.docx"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Variables disponibles : <code className="text-blue-500">{'{basename}'}</code>, <code className="text-blue-500">{'{date}'}</code>
            </p>
          </div>

          {/* Max File Size */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {t.settings_max_size}
              </label>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {settings.max_file_size_mb} Mo
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={settings.max_file_size_mb}
              onChange={e => handleChange('max_file_size_mb', parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </div>

        {/* OCR & Moteur de Reconnaissance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Cpu className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              {t.settings_ocr}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Enable OCR toggle */}
            <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <div className="pr-3">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {t.settings_enable_ocr}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Détection et lecture des documents numérisés
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.ocr_enabled ?? true}
                onChange={() => handleToggle('ocr_enabled')}
                className="w-5 h-5 accent-blue-600 cursor-pointer mt-1"
              />
            </div>

            {/* DPI Settings */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {t.settings_ocr_dpi}
                </p>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {settings.ocr_dpi} DPI
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">300 DPI recommandé pour une netteté idéale</p>
              <select
                value={settings.ocr_dpi}
                onChange={e => handleChange('ocr_dpi', parseInt(e.target.value))}
                className="w-full px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value={150}>150 DPI (Rapide)</option>
                <option value={200}>200 DPI (Standard)</option>
                <option value={300}>300 DPI (Haute précision)</option>
                <option value={400}>400 DPI (Ultra détaillé)</option>
              </select>
            </div>

            {/* Enhance Scans */}
            <div className="flex items-start justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
              <div className="pr-3">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {t.settings_ocr_enhance}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Nettoyage, rehaussement du contraste et suppression du bruit
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.enhance_scans ?? true}
                onChange={() => handleToggle('enhance_scans')}
                className="w-5 h-5 accent-blue-600 cursor-pointer mt-1"
              />
            </div>
          </div>
        </div>

        {/* Diagnostics Système */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                {t.settings_diagnostics}
              </h3>
            </div>
            <button
              onClick={onOpenAbout}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" />
              {t.settings_about}
            </button>
          </div>

          {diagnostics ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 mb-1">Moteur OCR Tesseract</p>
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                  {diagnostics.tesseract_available ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Opérationnel</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-amber-500">Non détecté</span>
                    </>
                  )}
                </div>
                {diagnostics.tesseract_version && (
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    v{diagnostics.tesseract_version}
                  </p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 mb-1">Langues OCR installées</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {diagnostics.tesseract_languages.length > 0
                    ? diagnostics.tesseract_languages.join(', ')
                    : 'Aucune'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 mb-1">Moteurs documentaires</p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  PyMuPDF + pdfplumber
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 mb-1">Système d'exploitation</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {diagnostics.os_name || diagnostics.os_platform || 'Système hôte'} (Python {diagnostics.python_version})
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Chargement des diagnostics...</p>
          )}
        </div>
      </div>
    </div>
  );
};
