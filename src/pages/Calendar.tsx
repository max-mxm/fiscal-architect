import React from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Sparkles,
  Trash2,
  Share2,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  Plus,
  BarChart3,
  Flag
} from 'lucide-react';
import { UserProfile } from '../types';
import { cn } from '../utils';

interface CalendarProps {
  profile: UserProfile;
}

export const Calendar: React.FC<CalendarProps> = ({ profile }) => {
  const months = [
    { name: 'Janvier', days: 18, status: 'worked' },
    { name: 'Février', days: 20, status: 'worked' },
    { name: 'Mars', days: 0, status: 'planning' },
    { name: 'Avril', days: 3, status: 'ready' },
  ];

  const renderDays = (count: number, active: number, status: string) => {
    return Array.from({ length: 14 }).map((_, i) => {
      const day = i + 1;
      const isWeekend = day % 7 === 6 || day % 7 === 0;
      const isActive = day <= active;

      return (
        <div
          key={i}
          className={cn(
            "h-10 w-full rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer",
            isWeekend ? "bg-surface-highest/30 text-slate-300" : "bg-surface-highest/10 text-slate-400",
            isActive && status === 'worked' && "bg-secondary text-white shadow-lg shadow-secondary/20",
            isActive && status === 'ready' && "bg-secondary/20 text-secondary border-2 border-secondary/20",
            status === 'planning' && day <= 5 && "bg-surface-highest text-slate-900 border border-outline-variant/20"
          )}
        >
          {day}
        </div>
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-16"
    >
      <div className="flex flex-col md:flex-row justify-between items-end gap-8">
        <div>
          <h2 className="text-on-surface-variant text-sm font-medium tracking-widest uppercase mb-4">Année fiscale 2026</h2>
          <h1 className="font-headline font-extrabold text-[3.5rem] leading-none tracking-tighter text-slate-900">
            82 450,00€ <span className="text-secondary text-2xl font-bold ml-2">Projeté</span>
          </h1>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 rounded-xl bg-surface-lowest text-on-surface-variant hover:text-slate-900 transition-colors font-semibold text-sm flex items-center gap-2 shadow-sm">
            <Sparkles className="w-4 h-4" /> Remplir jours ouvrés
          </button>
          <button className="px-6 py-3 rounded-xl bg-surface-lowest text-on-surface-variant hover:text-red-500 transition-colors font-semibold text-sm flex items-center gap-2 shadow-sm">
            <Trash2 className="w-4 h-4" /> Tout effacer
          </button>
          <button className="px-8 py-3 rounded-xl bg-slate-900 text-white hover:opacity-90 transition-opacity font-bold text-sm flex items-center gap-2 shadow-lg">
            <Share2 className="w-4 h-4" /> Exporter les prévisions
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
            {months.map((month) => (
              <div key={month.name} className="space-y-6">
                <h3 className="font-headline text-lg font-bold flex justify-between items-center">
                  {month.name}
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    month.status === 'worked' ? "text-secondary" : "text-slate-400 italic"
                  )}>
                    {month.days > 0 ? `${month.days} jours travaillés` : month.status === 'planning' ? 'Planification requise' : 'Prêt à facturer'}
                  </span>
                </h3>
                <div className="grid grid-cols-7 gap-2">
                  {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map(d => (
                    <div key={d} className="text-[10px] text-slate-300 font-bold uppercase text-center pb-2">{d}</div>
                  ))}
                  {renderDays(31, month.days, month.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Threshold Card */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="bg-white/10 px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">Prévision plafond</span>
              </div>
              <h3 className="font-headline text-2xl font-bold mb-2">Seuil micro-entreprise</h3>
              <p className="text-slate-400 text-sm mb-8 font-medium">Selon votre planning actuel, vous atteindrez le plafond de CA de 77 700€ le :</p>
              <div className="flex items-baseline space-x-2 mb-8">
                <span className="text-4xl font-black font-headline tracking-tight">14 octobre</span>
                <span className="text-secondary font-bold text-sm">2026</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                  <span>Progression</span>
                  <span>54 300€ / 77 700€</span>
                </div>
                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: '69%' }}></div>
                </div>
                <p className="text-[10px] text-secondary/80 font-medium leading-relaxed">Conseil : il vous reste environ 45 jours facturables avant le passage obligatoire à la TVA.</p>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-secondary/20 blur-[80px] rounded-full"></div>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            <div className="bg-surface-lowest p-6 rounded-3xl shadow-sm border-b-2 border-transparent focus-within:border-secondary">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Taux journalier (TJM)</label>
              <div className="flex items-center">
                <span className="text-2xl font-headline font-black text-slate-900">€</span>
                <input
                  className="w-full bg-transparent border-none focus:ring-0 text-3xl font-headline font-black p-0 ml-1 text-slate-900"
                  type="text"
                  defaultValue="650"
                />
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/10">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-on-surface-variant">Revenu hebdomadaire</span>
                <Sparkles className="text-secondary w-5 h-5" />
              </div>
              <div className="text-2xl font-headline font-extrabold text-slate-900">3 250,00€</div>
              <div className="mt-4 flex items-center space-x-2">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">5 jours planifiés</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/10">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-on-surface-variant">Prévision mensuelle (Aoû)</span>
                <BarChart3 className="text-slate-300 w-5 h-5" />
              </div>
              <div className="text-2xl font-headline font-extrabold text-slate-900">11 700,00€</div>
              <div className="mt-4 flex items-center space-x-2">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">18 jours planifiés</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-outline-variant/20">
            <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-4">Aperçu rapide</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-4 py-2 rounded-full bg-surface-highest/20 text-xs font-semibold text-slate-900">Moy. 9 400€/mois</span>
              <span className="px-4 py-2 rounded-full bg-surface-highest/20 text-xs font-semibold text-slate-900">220 jours ouvrés</span>
              <span className="px-4 py-2 rounded-full bg-emerald-100 text-secondary text-xs font-bold italic">Top 1% des revenus</span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-24 lg:bottom-10 right-10 flex flex-col items-end space-y-4">
        <button className="group flex items-center space-x-3 bg-secondary p-4 px-6 rounded-full shadow-2xl text-white hover:scale-105 active:scale-95 transition-all">
          <Plus className="w-5 h-5" />
          <span className="font-headline font-bold text-sm">Ajouter un projet</span>
        </button>
      </div>
    </motion.div>
  );
};
