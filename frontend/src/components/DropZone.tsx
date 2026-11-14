import React, { useRef, useState } from 'react';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { translations } from '../i18n/translations';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  lang: 'fr' | 'en';
  maxSizeMb: number;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  lang,
  maxSizeMb,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const filterAndAddFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);

    const validFiles: File[] = [];
    let invalidCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        validFiles.push(file);
      } else {
        invalidCount++;
      }
    }

    if (invalidCount > 0) {
      setErrorMsg(
        lang === 'fr'
          ? `${invalidCount} fichier(s) ignoré(s) : seuls les fichiers PDF (.pdf) sont acceptés.`
          : `${invalidCount} file(s) ignored: only PDF files (.pdf) are accepted.`
      );
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    filterAndAddFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    filterAndAddFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 bg-white dark:bg-slate-900/70 shadow-sm ${
          isDragging
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 ring-4 ring-blue-500/20 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {t.dropzone_title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
              {t.dropzone_subtitle}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all pointer-events-none"
            >
              {t.dropzone_button}
            </button>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md pt-1">
            {t.dropzone_hint} {maxSizeMb} Mo.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 flex items-center space-x-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-xl border border-amber-200 dark:border-amber-900">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
