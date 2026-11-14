import React from 'react';
import { ShieldCheck, Cpu, Sparkles, DownloadCloud } from 'lucide-react';
import { translations } from '../i18n/translations';

interface TrustBadgesProps {
  lang: 'fr' | 'en';
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({ lang }) => {
  const t = translations[lang];

  const items = [
    {
      icon: ShieldCheck,
      title: t.trust_local_title,
      desc: t.trust_local_desc,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      icon: Sparkles,
      title: t.trust_layout_title,
      desc: t.trust_layout_desc,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      icon: Cpu,
      title: t.trust_ocr_title,
      desc: t.trust_ocr_desc,
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      icon: DownloadCloud,
      title: t.trust_download_title,
      desc: t.trust_download_desc,
      color: 'text-purple-500 bg-purple-500/10',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto mt-16 pt-8 border-t border-slate-200/80 dark:border-slate-800/80">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm transition-all hover:border-blue-500/30 hover:shadow-md"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
                {item.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
