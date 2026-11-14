import React from 'react';
import { X, ShieldCheck, Cpu, FileText } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'fr' | 'en';
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              PDF2WORD <span className="text-blue-600">PRO</span>
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
              Version 2.0 Web & OCR
            </span>
          </div>
        </div>

        {/* Mission Statement */}
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          Application professionnelle conçue pour convertir des documents PDF en fichiers Microsoft Word (.docx) modifiables de manière totalement locale, sécurisée et avec reconnaissance optique de caractères (OCR).
        </p>

        {/* Highlights */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">Confidentialité absolue : </span>
              <span className="text-slate-500 dark:text-slate-400">Aucun fichier n'est transmis vers des tiers ou des API externes. Tout le traitement reste sur votre serveur ou machine hôte.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <Cpu className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">OCR haute précision : </span>
              <span className="text-slate-500 dark:text-slate-400">Prise en charge intégrée des scans, factures et documents numérisés via Tesseract OCR (Français + Anglais).</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Conçu avec rigueur & excellence</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
