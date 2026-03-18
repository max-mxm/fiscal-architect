import React, { useState } from 'react';
import { motion } from 'motion/react';
import { History, TrendingUp, Quote, Plus } from 'lucide-react';
import { UserProfile } from '../types';

interface ComparisonProps {
  profile: UserProfile;
}

export const Comparison: React.FC<ComparisonProps> = ({ profile }) => {
  const scenarioA = {
    tjm: 500,
    days: 15,
    revenue: 500 * 15 * 12,
  };

  const scenarioB = {
    tjm: 600,
    days: 12,
    revenue: 600 * 12 * 12,
  };

  const revenueDiff = scenarioB.revenue - scenarioA.revenue;
  const revenueDiffPercent = (revenueDiff / scenarioA.revenue) * 100;
  const daysDiff = (scenarioB.days - scenarioA.days) * 12;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <section>
        <span className="text-secondary font-bold text-xs tracking-[0.2em] uppercase mb-2 block">Simulation de croissance</span>
        <h2 className="text-5xl font-extrabold font-headline text-slate-900 tracking-tight mb-4">Analyse comparative</h2>
        <p className="text-on-surface-variant max-w-2xl leading-relaxed">
          Évaluez l'impact fiscal de l'ajustement de votre taux journalier par rapport à votre capacité de travail.
          Notre modèle « Et si ? » calcule la rétention nette après implications fiscales.
        </p>
      </section>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scenario A */}
          <div className="bg-surface-lowest p-8 rounded-3xl shadow-sm border-b-2 border-slate-200">
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Scénario A</span>
                <h3 className="font-headline text-2xl font-bold mt-3">Modèle de base</h3>
              </div>
              <History className="text-slate-300 w-6 h-6" />
            </div>
            <div className="space-y-6">
              <div className="pb-4 border-b border-outline-variant/10">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Taux journalier (TJM)</label>
                <p className="text-3xl font-headline font-black">{scenarioA.tjm}€</p>
              </div>
              <div className="pb-4 border-b border-outline-variant/10">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Jours par mois</label>
                <p className="text-3xl font-headline font-black">{scenarioA.days} <span className="text-sm font-medium text-on-surface-variant">jours</span></p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">CA annuel brut</label>
                <p className="text-xl font-headline font-bold">{scenarioA.revenue.toLocaleString()}€</p>
              </div>
            </div>
          </div>

          {/* Scenario B */}
          <div className="bg-surface-lowest p-8 rounded-3xl shadow-sm border-b-2 border-secondary">
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="px-3 py-1 bg-emerald-50 text-secondary text-[10px] font-bold rounded-full uppercase tracking-wider">Scénario B</span>
                <h3 className="font-headline text-2xl font-bold mt-3">Optimisation</h3>
              </div>
              <TrendingUp className="text-secondary w-6 h-6" />
            </div>
            <div className="space-y-6">
              <div className="pb-4 border-b border-outline-variant/10">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Taux journalier (TJM)</label>
                <p className="text-3xl font-headline font-black text-secondary">{scenarioB.tjm}€</p>
              </div>
              <div className="pb-4 border-b border-outline-variant/10">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">Jours par mois</label>
                <p className="text-3xl font-headline font-black">{scenarioB.days} <span className="text-sm font-medium text-on-surface-variant">jours</span></p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-1">CA annuel brut</label>
                <p className="text-xl font-headline font-bold text-secondary">{scenarioB.revenue.toLocaleString()}€</p>
              </div>
            </div>
          </div>
        </div>

        {/* Delta Analysis */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-slate-900 text-white p-8 rounded-3xl h-full flex flex-col justify-center">
            <h4 className="font-headline font-bold text-lg mb-8">Analyse de l'écart</h4>
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Écart net annuel</p>
                  <p className="text-3xl font-headline font-extrabold">{revenueDiff.toLocaleString()}€</p>
                </div>
                <div className="text-right">
                  <span className={revenueDiff >= 0 ? "text-secondary font-bold text-sm" : "text-red-400 font-bold text-sm"}>
                    {revenueDiffPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Économie fiscale</p>
                  <p className="text-3xl font-headline font-extrabold text-emerald-400">+1 240€</p>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold text-sm">+8,2%</span>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Variation temps de travail</p>
                  <p className="text-3xl font-headline font-extrabold text-emerald-400">{daysDiff} <span className="text-sm font-medium">jours/an</span></p>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold text-sm">RÉCUPÉRÉ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-surface-low p-8 rounded-3xl flex flex-col justify-between h-64">
          <div>
            <h5 className="font-headline font-bold">Écart de revenus</h5>
            <p className="text-xs text-on-surface-variant">Comparaison du CA annuel</p>
          </div>
          <div className="flex items-end gap-4 h-32">
            <div className="w-full bg-slate-200 rounded-t-xl" style={{ height: '100%' }}></div>
            <div className="w-full bg-secondary rounded-t-xl" style={{ height: '96%' }}></div>
          </div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
            <span>Scénario A</span>
            <span>Scénario B</span>
          </div>
        </div>

        <div className="bg-surface-low p-8 rounded-3xl flex flex-col justify-between h-64">
          <div>
            <h5 className="font-headline font-bold">Équilibre vie pro</h5>
            <p className="text-xs text-on-surface-variant">Jours facturables annuels</p>
          </div>
          <div className="flex items-end gap-4 h-32">
            <div className="w-full bg-slate-200 rounded-t-xl" style={{ height: '100%' }}></div>
            <div className="w-full bg-secondary rounded-t-xl" style={{ height: '80%' }}></div>
          </div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
            <span>180 jours</span>
            <span className="text-secondary">144 jours</span>
          </div>
        </div>

        <div className="bg-surface-highest/30 backdrop-blur-md p-8 rounded-3xl border border-outline-variant/20 flex flex-col justify-center text-center">
          <div className="mb-4">
            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="text-white w-6 h-6" />
            </div>
            <h5 className="font-headline font-bold text-lg">Nouvelle simulation</h5>
            <p className="text-sm text-on-surface-variant px-6">Ajoutez un troisième scénario pour comparer différents niveaux de croissance.</p>
          </div>
          <button className="mt-2 text-slate-900 font-bold text-sm underline underline-offset-4 hover:text-secondary transition-colors">Configurer les paramètres</button>
        </div>
      </div>

      {/* Quote */}
      <div className="mt-12 py-12 border-t border-outline-variant/20">
        <div className="max-w-4xl mx-auto text-center">
          <Quote className="w-10 h-10 text-slate-200 mx-auto mb-6" />
          <blockquote className="text-2xl font-headline font-light italic text-on-surface-variant leading-relaxed">
            « Bien que le scénario B affiche une baisse de 4% du CA brut, la réduction de 20% des jours travaillés se traduit par un <span className="text-secondary font-bold not-italic">rendement net horaire</span> nettement supérieur. Cette stratégie privilégie une croissance durable à long terme plutôt que le volume immédiat. »
          </blockquote>
          <p className="mt-6 font-bold font-headline text-sm uppercase tracking-widest text-slate-900">Conseil de votre conseiller fiscal</p>
        </div>
      </div>
    </motion.div>
  );
};
