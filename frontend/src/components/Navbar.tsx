import React from 'react';
import { 
  FileText, 
  History, 
  Settings, 
  Sun, 
  Moon, 
  Home, 
  Sparkles,
  Info,
  Menu,
  X,
  Cloud
} from 'lucide-react';
import { translations } from '../i18n/translations';

interface NavbarProps {
  currentTab: 'home' | 'convert' | 'history' | 'settings';
  setCurrentTab: (tab: 'home' | 'convert' | 'history' | 'settings') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  lang: 'fr' | 'en';
  setLang: (lang: 'fr' | 'en') => void;
  historyCount: number;
  openAbout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  theme,
  toggleTheme,
  lang,
  setLang,
  historyCount,
  openAbout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const t = translations[lang];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => { setCurrentTab('home'); setMobileMenuOpen(false); }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white">
                  PDF2WORD
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                  PRO
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:flex">
                <Cloud className="w-3 h-3 text-emerald-500" />
                <span>Version Web & OCR Haute Résolution</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setCurrentTab('home')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'home'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>{t.nav_home}</span>
            </button>

            <button
              onClick={() => setCurrentTab('convert')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'convert'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span>{t.nav_convert}</span>
            </button>

            <button
              onClick={() => setCurrentTab('history')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
                currentTab === 'history'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>{t.nav_history}</span>
              {historyCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                  {historyCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'settings'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>{t.nav_settings}</span>
            </button>
          </nav>

          {/* Right actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            <button
              onClick={openAbout}
              title={t.nav_about}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Language switch */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setLang('fr')}
                className={`px-2 py-1 rounded-md transition-all ${
                  lang === 'fr' 
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                FR
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-md transition-all ${
                  lang === 'en' 
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                EN
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
            <button
              onClick={() => { setCurrentTab('home'); setMobileMenuOpen(false); }}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Home className="w-4 h-4 text-blue-600" />
              <span>{t.nav_home}</span>
            </button>
            <button
              onClick={() => { setCurrentTab('convert'); setMobileMenuOpen(false); }}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>{t.nav_convert}</span>
            </button>
            <button
              onClick={() => { setCurrentTab('history'); setMobileMenuOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-blue-600" />
                <span>{t.nav_history}</span>
              </div>
              {historyCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                  {historyCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { setCurrentTab('settings'); setMobileMenuOpen(false); }}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Settings className="w-4 h-4 text-blue-600" />
              <span>{t.nav_settings}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
