import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Paintbrush, Sparkles, Type, Sliders, X, RotateCcw, Check, 
  MousePointer, HelpCircle, Eye, Moon, Sun, Flame, Award, Lightbulb
} from 'lucide-react';

interface AestheticsStudioProps {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

// Predefined cinematic color grades
export interface ColorGradePreset {
  id: string;
  name: string;
  description: string;
  filter: string; // CSS Filter value
  accentColor: string; // Gold, Rose, Emerald, Teal, Indigo etc.
  backgroundTint: string; // Extra subtle hue for backgrounds
}

const PRESETS: ColorGradePreset[] = [
  {
    id: 'default',
    name: 'Liturgical Gold (Default)',
    description: 'High-contrast clean sacred design with amber gold accents',
    filter: 'none',
    accentColor: '#cca755',
    backgroundTint: 'rgba(204, 167, 85, 0.02)'
  },
  {
    id: 'cinematic',
    name: 'Teal & Orange',
    description: 'Classic cinema look with vibrant warmth and deep cool tones',
    filter: 'contrast(1.08) saturate(1.04) hue-rotate(-3deg)',
    accentColor: '#f97316',
    backgroundTint: 'rgba(13, 148, 136, 0.04)'
  },
  {
    id: 'cathedral',
    name: 'Warm Cathedral',
    description: 'Dreamy soft contrast with an amber-tinted candlelight filter',
    filter: 'sepia(0.18) saturate(1.05) contrast(0.96)',
    accentColor: '#d97706',
    backgroundTint: 'rgba(251, 191, 36, 0.05)'
  },
  {
    id: 'mystic',
    name: 'Cathedral Rose',
    description: 'Ethereal purple and violet highlights for a peaceful sanctuary feel',
    filter: 'contrast(1.02) saturate(1.05) hue-rotate(335deg)',
    accentColor: '#ec4899',
    backgroundTint: 'rgba(219, 39, 119, 0.04)'
  },
  {
    id: 'emerald',
    name: 'Sacred Emerald',
    description: 'Subtle forest green tones with deep organic contrast',
    filter: 'contrast(1.04) saturate(0.98) hue-rotate(85deg) sepia(0.05)',
    accentColor: '#10b981',
    backgroundTint: 'rgba(16, 185, 129, 0.03)'
  },
  {
    id: 'noir',
    name: 'Silver Nitrate Film',
    description: 'Dramatic silver nitrate monochrome aesthetic with rich contrast',
    filter: 'grayscale(1) contrast(1.15) brightness(0.95)',
    accentColor: '#ffffff',
    backgroundTint: 'rgba(255, 255, 255, 0.02)'
  }
];

const FONTS_HEADING = [
  { name: 'Playfair Display', value: '"Playfair Display", Georgia, serif' },
  { name: 'Cinzel', value: '"Cinzel", "Times New Roman", serif' },
  { name: 'Cormorant Garamond', value: '"Cormorant Garamond", serif' },
  { name: 'Instrument Serif', value: '"Instrument Serif", Georgia, serif' },
  { name: 'Syne', value: '"Syne", sans-serif' },
  { name: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans", sans-serif' },
  { name: 'Inter', value: '"Inter", sans-serif' }
];

const FONTS_BODY = [
  { name: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans", sans-serif' },
  { name: 'Inter', value: '"Inter", sans-serif' },
  { name: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  { name: 'Georgia', value: 'Georgia, serif' }
];

export default function AestheticsStudio({ theme, onThemeChange }: AestheticsStudioProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string>(() => localStorage.getItem('studio_preset') || 'default');
  
  // Base customizable values
  const [headingFont, setHeadingFont] = useState(() => localStorage.getItem('studio_font_heading') || '"Playfair Display", Georgia, serif');
  const [bodyFont, setBodyFont] = useState(() => localStorage.getItem('studio_font_body') || '"Plus Jakarta Sans", sans-serif');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('studio_accent_color') || '#cca755');
  const [contrast, setContrast] = useState(() => Number(localStorage.getItem('studio_contrast') || '100'));
  const [warmth, setWarmth] = useState(() => Number(localStorage.getItem('studio_warmth') || '0'));
  const [saturation, setSaturation] = useState(() => Number(localStorage.getItem('studio_saturation') || '100'));
  
  // Custom Cursor / Wand mode settings
  const [wandMode, setWandMode] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredElementInfo, setHoveredElementInfo] = useState<{ tag: string; text: string; font: string; size: string; color: string } | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
  
  // Local element contextual picker
  const [pickerAnchor, setPickerAnchor] = useState<{ x: number; y: number; target: HTMLElement } | null>(null);

  // Load Google Fonts
  useEffect(() => {
    const fontLink = document.getElementById('dynamic-google-fonts') || document.createElement('link');
    fontLink.id = 'dynamic-google-fonts';
    (fontLink as HTMLLinkElement).rel = 'stylesheet';
    (fontLink as HTMLLinkElement).href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400..700&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=Instrument+Serif:ital@0;1&family=Syne:wght@400..800&family=JetBrains+Mono:wght@300..700&family=Plus+Jakarta+Sans:wght@300..800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap';
    if (!document.getElementById('dynamic-google-fonts')) {
      document.head.appendChild(fontLink);
    }
  }, []);

  // Sync to CSS variables and Filters in real-time!
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply selected Fonts
    root.style.setProperty('--font-heading-family', headingFont);
    root.style.setProperty('--font-body-family', bodyFont);
    
    // Redefine standard font-serif and font-sans outputs
    root.style.setProperty('--font-serif', headingFont);
    root.style.setProperty('--font-sans', bodyFont);
    
    // Set custom gold/accent values
    root.style.setProperty('--color-gold-300', accentColor);
    root.style.setProperty('--color-gold-400', accentColor);
    
    // Apply visual filter chain representing the Color Grade
    const selectedPreset = PRESETS.find(p => p.id === activePreset);
    let baseFilter = selectedPreset ? selectedPreset.filter : 'none';
    
    // Layer custom slider modifications
    let filterString = '';
    if (baseFilter !== 'none') {
      filterString += `${baseFilter} `;
    }
    
    // Add dynamic warmth via sepia, and user sliders
    if (warmth > 0) {
      filterString += `sepia(${warmth / 100}) `;
    }
    if (contrast !== 100) {
      filterString += `contrast(${contrast / 100}) `;
    }
    if (saturation !== 100) {
      filterString += `saturate(${saturation / 100}) `;
    }
    
    // Apply filter dynamically to the root layout element
    const layoutContainer = document.getElementById('root');
    if (layoutContainer) {
      layoutContainer.style.filter = filterString.trim() || 'none';
    }

    // Save state
    localStorage.setItem('studio_preset', activePreset);
    localStorage.setItem('studio_font_heading', headingFont);
    localStorage.setItem('studio_font_body', bodyFont);
    localStorage.setItem('studio_accent_color', accentColor);
    localStorage.setItem('studio_contrast', String(contrast));
    localStorage.setItem('studio_warmth', String(warmth));
    localStorage.setItem('studio_saturation', String(saturation));

  }, [activePreset, headingFont, bodyFont, accentColor, contrast, warmth, saturation]);

  // Track cursor position globally for Custom Wand follower
  useEffect(() => {
    if (!wandMode) {
      setHoveredElementInfo(null);
      setHoveredRect(null);
      document.body.classList.remove('studio-wand-active');
      return;
    }

    document.body.classList.add('studio-wand-active');

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      // Scan element under the cursor
      const elem = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (elem && elem.id !== 'studio-custom-cursor' && !elem.closest('#studio-floating-panel') && !elem.closest('#studio-wand-menu')) {
        const computed = window.getComputedStyle(elem);
        const fontName = computed.fontFamily.split(',')[0].replace(/"/g, '').trim();
        const textContent = elem.innerText || elem.textContent || '';
        
        setHoveredElementInfo({
          tag: elem.tagName.toLowerCase(),
          text: textContent.length > 30 ? textContent.slice(0, 30) + '...' : textContent,
          font: fontName,
          size: computed.fontSize,
          color: computed.color
        });

        const rect = elem.getBoundingClientRect();
        setHoveredRect(rect);
      } else {
        setHoveredElementInfo(null);
        setHoveredRect(null);
      }
    };

    // Override clicks in inspect mode to trigger dynamic font change panel!
    const handleGlobalClick = (e: MouseEvent) => {
      if (!wandMode) return;
      
      const target = e.target as HTMLElement;
      if (target.closest('#studio-floating-panel') || target.closest('#studio-wand-menu')) {
        return; // Click inside studio panels does not override
      }

      e.preventDefault();
      e.stopPropagation();

      // Open localized cursor palette
      setPickerAnchor({
        x: e.clientX,
        y: e.clientY,
        target: target
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleGlobalClick, true);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleGlobalClick, true);
      document.body.classList.remove('studio-wand-active');
    };
  }, [wandMode]);

  const handleReset = () => {
    setActivePreset('default');
    setHeadingFont('"Playfair Display", Georgia, serif');
    setBodyFont('"Plus Jakarta Sans", sans-serif');
    setAccentColor('#cca755');
    setContrast(100);
    setWarmth(0);
    setSaturation(100);
    setWandMode(false);
    setPickerAnchor(null);
  };

  const handlePresetSelect = (p: ColorGradePreset) => {
    setActivePreset(p.id);
    setAccentColor(p.accentColor);
  };

  // Modify local style or global variables via the cursor picker
  const applyLocalStyleChange = (type: 'font-heading' | 'font-body' | 'color', value: string) => {
    if (type === 'font-heading') {
      setHeadingFont(value);
    } else if (type === 'font-body') {
      setBodyFont(value);
    } else if (type === 'color') {
      setAccentColor(value);
    }
  };

  return (
    <>
      {/* Dynamic Overlay Highlighter when Wand Mode is active */}
      <AnimatePresence>
        {wandMode && hoveredRect && !pickerAnchor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed pointer-events-none z-[9998] border-2 border-dashed border-gold-400 bg-gold-400/5 rounded transition-all duration-150"
            style={{
              left: hoveredRect.left,
              top: hoveredRect.top,
              width: hoveredRect.width,
              height: hoveredRect.height
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating Aesthetic Follower Cursor */}
      <AnimatePresence>
        {wandMode && (
          <motion.div
            id="studio-custom-cursor"
            className="fixed pointer-events-none z-[9999] flex flex-col items-start gap-1"
            style={{
              left: mousePos.x + 12,
              top: mousePos.y + 12
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            {/* Custom Crosshair Dot */}
            <div className="absolute -left-3.5 -top-3.5 w-7 h-7 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-gold-400 rounded-full" />
              <div className="absolute inset-0 border border-gold-400/40 rounded-full animate-ping" />
            </div>

            {/* Float Info Box */}
            <div className="bg-slate-900/95 text-white text-[11px] font-mono px-2.5 py-1.5 rounded-lg border border-gold-400/30 shadow-xl backdrop-blur-md flex flex-col gap-1 min-w-[140px] pointer-events-none">
              <div className="flex items-center gap-1.5 border-b border-white/10 pb-1 font-bold text-gold-300">
                <Sparkles className="w-3 h-3 text-gold-300" />
                <span>STYLE INSPECTOR</span>
              </div>
              {hoveredElementInfo ? (
                <>
                  <span className="text-white/60">Tag: <span className="text-amber-400 font-bold">&lt;{hoveredElementInfo.tag}&gt;</span></span>
                  <span className="text-white/90">Font: <span className="text-white font-bold">{hoveredElementInfo.font}</span></span>
                  <span className="text-white/60">Size: {hoveredElementInfo.size}</span>
                  <span className="text-white/50 text-[10px] italic mt-0.5 max-w-[180px] truncate">"{hoveredElementInfo.text}"</span>
                </>
              ) : (
                <span className="text-white/40 italic">Move over text to inspect</span>
              )}
              <div className="text-[9px] text-gold-400/80 mt-1 border-t border-white/5 pt-1 text-center">
                Click element to change style
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Palette / Wand Action Button to open Drawer */}
      <div className="fixed bottom-6 right-6 z-[9990] flex flex-col gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 border backdrop-blur-md cursor-pointer ${
            isOpen 
              ? 'bg-gold-400 text-slate-950 border-gold-300 scale-105' 
              : 'bg-slate-900/90 text-gold-300 hover:text-gold-100 border-gold-400/30 hover:border-gold-400 hover:scale-105'
          }`}
        >
          <Paintbrush className="w-5 h-5 animate-pulse" />
          <span className="font-serif font-bold text-xs tracking-wider uppercase">
            Aesthetics Studio
          </span>
        </button>
      </div>

      {/* Localized Click-Picker Menu when clicking elements under Wand mode */}
      <AnimatePresence>
        {pickerAnchor && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[9997]" onClick={() => setPickerAnchor(null)}>
            <motion.div
              id="studio-wand-menu"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="absolute bg-slate-900 text-white rounded-xl shadow-2xl border border-gold-400/50 p-4 w-[320px]"
              style={{
                left: Math.min(pickerAnchor.x, window.innerWidth - 340),
                top: Math.min(pickerAnchor.y, window.innerHeight - 340)
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gold-400 animate-pulse" />
                  <h4 className="font-serif font-bold text-sm text-gold-300">Wand Quick Stylist</h4>
                </div>
                <button 
                  onClick={() => setPickerAnchor(null)}
                  className="text-white/40 hover:text-white p-1 rounded-md hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-sans">
                {/* Heading Font Choices */}
                <div>
                  <span className="text-white/60 block mb-1.5 font-bold">Apply Heading Font Family:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FONTS_HEADING.map((f) => (
                      <button
                        key={f.name}
                        onClick={() => applyLocalStyleChange('font-heading', f.value)}
                        className={`py-1.5 px-2 rounded border text-left truncate transition-all text-[11px] ${
                          headingFont === f.value 
                            ? 'border-gold-400 bg-gold-400/10 text-gold-300 font-bold' 
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5 text-white/80'
                        }`}
                        style={{ fontFamily: f.value }}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body Font Choices */}
                <div>
                  <span className="text-white/60 block mb-1.5 font-bold">Apply Body Font Family:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {FONTS_BODY.map((f) => (
                      <button
                        key={f.name}
                        onClick={() => applyLocalStyleChange('font-body', f.value)}
                        className={`py-1.5 px-2 rounded border text-left truncate transition-all text-[11px] ${
                          bodyFont === f.value 
                            ? 'border-gold-400 bg-gold-400/10 text-gold-300 font-bold' 
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5 text-white/80'
                        }`}
                        style={{ fontFamily: f.value }}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Accents Choices */}
                <div>
                  <span className="text-white/60 block mb-1.5 font-bold">Select Accent Color Grade:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['#cca755', '#ec4899', '#10b981', '#f97316', '#3b82f6', '#ffffff'].map((color) => (
                      <button
                        key={color}
                        onClick={() => applyLocalStyleChange('color', color)}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center transition-transform hover:scale-110 ${
                          accentColor === color ? 'border-white scale-105' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {accentColor === color && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3px]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exit Customizer Info */}
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-white/5 text-[10px] text-white/60 leading-relaxed flex gap-2">
                  <Sliders className="w-4 h-4 text-gold-400 shrink-0" />
                  <span>These quick adjustments update CSS custom properties dynamically across the entire application workspace instantly.</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Studio Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for focused visual styling */}
            <div className="fixed inset-0 bg-black/30 backdrop-blur-xs z-[9985]" onClick={() => setIsOpen(false)} />
            
            <motion.div
              id="studio-floating-panel"
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-[380px] bg-slate-900 text-white z-[9988] shadow-2xl border-l border-white/10 flex flex-col select-none"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-gold-400 text-slate-950">
                    <Paintbrush className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-white">Aesthetics Studio</h3>
                    <p className="text-[10px] font-mono text-gold-400">VISUAL COLOR GRADING & TYPOGRAPHY</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable controls */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* Interactive cursor selector tool */}
                <div className="bg-slate-800/50 border border-gold-400/30 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MousePointer className="w-4.5 h-4.5 text-gold-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-gold-300 font-serif">Wand Cursor Stylist</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-gold-400 text-slate-950 font-bold uppercase">PRO</span>
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    Transforms your pointer into a design wand. Hover to view styles, click elements directly to instantly alter fonts and accent colors in real-time.
                  </p>
                  <button
                    onClick={() => setWandMode(!wandMode)}
                    className={`w-full py-2.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      wandMode 
                        ? 'bg-gold-400 text-slate-950 border-gold-300 font-extrabold shadow-inner shadow-black/25'
                        : 'bg-slate-800 hover:bg-slate-750 border-white/10 text-white hover:border-gold-400/40'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    {wandMode ? 'DEACTIVATE WAND POINTER' : 'ACTIVATE WAND POINTER'}
                  </button>
                  {wandMode && (
                    <p className="text-[10px] text-amber-400 text-center animate-pulse">
                      ● Wand active! Move cursor over the page text to begin.
                    </p>
                  )}
                </div>

                {/* Section 1: Color Grade Presets */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Atmosphere Color Grade</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESETS.map((p) => {
                      const isActive = activePreset === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handlePresetSelect(p)}
                          className={`p-3 rounded-xl border text-left transition-all relative flex flex-col gap-1 cursor-pointer ${
                            isActive 
                              ? 'border-gold-400 bg-white/5 text-white' 
                              : 'border-white/5 hover:border-white/10 bg-slate-950/40 text-white/70 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold truncate pr-1">{p.name}</span>
                            {isActive && <Check className="w-3.5 h-3.5 text-gold-400 shrink-0" />}
                          </div>
                          <span className="text-[10px] text-white/40 leading-tight">{p.description}</span>
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.accentColor }} />
                            <span className="text-[9px] font-mono text-white/30">{p.accentColor}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Fonts Customizer */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-gold-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Global Typography</span>
                  </div>

                  {/* Heading Font */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-white/50 block">Serif Headings Font Family</label>
                    <div className="relative">
                      <select
                        value={headingFont}
                        onChange={(e) => setHeadingFont(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 text-xs rounded-lg p-2.5 outline-none focus:border-gold-400/50 appearance-none cursor-pointer text-white"
                      >
                        {FONTS_HEADING.map((f) => (
                          <option key={f.name} value={f.value} className="bg-slate-900 text-white">
                            {f.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/40">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Body Font */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-white/50 block">Sans-Serif Body Font Family</label>
                    <div className="relative">
                      <select
                        value={bodyFont}
                        onChange={(e) => setBodyFont(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 text-xs rounded-lg p-2.5 outline-none focus:border-gold-400/50 appearance-none cursor-pointer text-white"
                      >
                        {FONTS_BODY.map((f) => (
                          <option key={f.name} value={f.value} className="bg-slate-900 text-white">
                            {f.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/40">
                        ▼
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Fine-Tuning Sliders */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-gold-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Film Grade Fine-Tuning</span>
                  </div>

                  {/* Contrast */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/50">Contrast</span>
                      <span className="font-mono text-gold-400">{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="75"
                      max="130"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full accent-gold-400 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Saturation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/50">Saturation</span>
                      <span className="font-mono text-gold-400">{saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      className="w-full accent-gold-400 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Sepia/Warmth */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/50">Warmth Amber Glow</span>
                      <span className="font-mono text-gold-400">{warmth}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={warmth}
                      onChange={(e) => setWarmth(Number(e.target.value))}
                      className="w-full accent-gold-400 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Section 4: Design tips */}
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-white/5 text-[11px] text-white/50 space-y-2 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold text-gold-300">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Liturgy Design Inspiration</span>
                  </div>
                  <p>
                    For a solemn sacred experience, pair <strong>Cinzel</strong> or <strong>Cormorant Garamond</strong> with <strong>Warm Cathedral</strong> or <strong>Liturgical Gold</strong>. High contrast enhances devotional readability.
                  </p>
                </div>

              </div>

              {/* Footer */}
              <div className="p-5 border-t border-white/10 bg-slate-950/40 flex items-center justify-between">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-white/60 hover:text-white cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore Defaults
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="py-1.5 px-4 rounded-lg bg-gold-400 hover:bg-gold-500 text-slate-950 text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  Save Configuration
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
