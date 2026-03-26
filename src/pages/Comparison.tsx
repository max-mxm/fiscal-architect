import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { History, TrendingUp, Quote, Plus, Settings, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { UserProfile, Scenario, FiscalResult } from '~/types';
import { calcCAannuel, calcNetMicro, calcNetSASU, calcNetEURL, calcTotalChargesFixes } from '~/lib/fiscal';
import { cn } from '~/utils';

interface ComparisonProps {
  profile: UserProfile;
}

const STATUS_LABELS: Record<UserProfile['status'], string> = {
  micro: 'Micro-entreprise',
  sasu: 'SASU',
  eurl: 'EURL',
};

function calcFiscalResult(scenario: Scenario): FiscalResult {
  const ca = calcCAannuel(scenario.tjm, scenario.workingDays);
  const chargesFixes = scenario.fixedCosts * 12;
  switch (scenario.status) {
    case 'sasu':
      return calcNetSASU(ca, chargesFixes);
    case 'eurl':
      return calcNetEURL(ca, chargesFixes);
    case 'micro':
    default:
      return calcNetMicro(ca, scenario.urssafRate, chargesFixes);
  }
}

function formatCurrency(value: number): string {
  return Math.round(value).toLocaleString('fr-FR') + '€';
}

export const Comparison: React.FC<ComparisonProps> = ({ profile }) => {
  const inputsRef = useRef<HTMLDivElement>(null);

  const totalFixedCosts = calcTotalChargesFixes(profile.fixedCosts);

  const [scenarioA, setScenarioA] = useState<Scenario>({
    label: 'Modèle de base',
    status: profile.status,
    tjm: profile.tjm,
    workingDays: profile.workingDays,
    urssafRate: profile.urssafRate,
    fixedCosts: totalFixedCosts,
  });

  const [scenarioB, setScenarioB] = useState<Scenario>({
    label: 'Optimisation',
    status: profile.status,
    tjm: Math.round(profile.tjm * 1.2),
    workingDays: Math.max(1, profile.workingDays - 3),
    urssafRate: profile.urssafRate,
    fixedCosts: totalFixedCosts,
  });

  const [showScenarioC, setShowScenarioC] = useState(false);
  const [scenarioC, setScenarioC] = useState<Scenario>({
    label: 'Scénario C',
    status: 'sasu',
    tjm: profile.tjm,
    workingDays: profile.workingDays,
    urssafRate: profile.urssafRate,
    fixedCosts: totalFixedCosts,
  });

  const resultA = useMemo(() => calcFiscalResult(scenarioA), [scenarioA]);
  const resultB = useMemo(() => calcFiscalResult(scenarioB), [scenarioB]);
  const resultC = useMemo(() => calcFiscalResult(scenarioC), [scenarioC]);

  const netDiff = resultB.netApresIR - resultA.netApresIR;
  const netDiffPercent = resultA.netApresIR !== 0 ? (netDiff / Math.abs(resultA.netApresIR)) * 100 : 0;

  const fiscalSaving = (resultA.ir + resultA.chargesURSSAF) - (resultB.ir + resultB.chargesURSSAF);
  const fiscalSavingPercent = (resultA.ir + resultA.chargesURSSAF) !== 0
    ? (fiscalSaving / (resultA.ir + resultA.chargesURSSAF)) * 100
    : 0;

  const daysDiff = (scenarioB.workingDays - scenarioA.workingDays) * 12;

  // Chart data
  const revenueChartData = [
    { name: 'A', value: resultA.caAnnuel },
    { name: 'B', value: resultB.caAnnuel },
    ...(showScenarioC ? [{ name: 'C', value: resultC.caAnnuel }] : []),
  ];

  const netChartData = [
    { name: 'A', value: Math.round(resultA.netApresIR) },
    { name: 'B', value: Math.round(resultB.netApresIR) },
    ...(showScenarioC ? [{ name: 'C', value: Math.round(resultC.netApresIR) }] : []),
  ];

  const CHART_COLORS = ['#94a3b8', '#006c49', '#6366f1'];

  const handleConfigureClick = () => {
    inputsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleToggleScenarioC = () => {
    setShowScenarioC((prev) => !prev);
  };

  const renderScenarioInputs = (
    scenario: Scenario,
    setScenario: React.Dispatch<React.SetStateAction<Scenario>>,
    result: FiscalResult,
    accent: boolean,
    badge: string,
    icon: React.ReactNode,
  ) => (
    <div className={cn(
      'bg-surface-lowest p-8 rounded-3xl shadow-sm border-b-2',
      accent ? 'border-secondary' : 'border-slate-200',
    )}>
      <div className="flex justify-between items-start mb-8">
        <div>
          <span className={cn(
            'px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider',
            accent ? 'bg-emerald-50 text-secondary' : 'bg-slate-100 text-slate-600',
          )}>{badge}</span>
          <h3 className="font-headline text-2xl font-bold mt-3">{scenario.label}</h3>
        </div>
        {icon}
      </div>
      <div className="space-y-6">
        <div className="pb-4 border-b border-outline-variant/10">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-2">Taux journalier (TJM)</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={scenario.tjm}
              onChange={(e) => setScenario((s) => ({ ...s, tjm: Math.max(0, Number(e.target.value)) }))}
              aria-label={`TJM ${scenario.label}`}
              className={cn(
                'w-full text-3xl font-headline font-black bg-transparent border-b-2 border-slate-200 focus:border-secondary outline-none pb-1 font-mono',
                accent && 'text-secondary',
              )}
            />
            <span className="text-xl font-headline font-black">€</span>
          </div>
        </div>
        <div className="pb-4 border-b border-outline-variant/10">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-2">Jours par mois</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={31}
              value={scenario.workingDays}
              onChange={(e) => setScenario((s) => ({ ...s, workingDays: Math.min(31, Math.max(1, Number(e.target.value))) }))}
              className="w-full text-3xl font-headline font-black bg-transparent border-b-2 border-slate-200 focus:border-secondary outline-none pb-1 font-mono"
            />
            <span className="text-sm font-medium text-on-surface-variant">jours</span>
          </div>
        </div>
        <div className="pb-4 border-b border-outline-variant/10">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-2">Statut juridique</label>
          <select
            value={scenario.status}
            onChange={(e) => setScenario((s) => ({ ...s, status: e.target.value as UserProfile['status'] }))}
            className="w-full text-lg font-headline font-bold bg-transparent border-b-2 border-slate-200 focus:border-secondary outline-none pb-1 cursor-pointer"
          >
            <option value="micro">Micro-entreprise</option>
            <option value="sasu">SASU</option>
            <option value="eurl">EURL</option>
          </select>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-2">Annuel</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">CA brut</span>
                <p className="text-sm font-mono font-bold text-slate-900">{formatCurrency(result.caAnnuel)}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Net avant IR</span>
                <p className={cn('text-sm font-mono font-bold', accent ? 'text-secondary' : 'text-slate-900')}>
                  {formatCurrency(result.caAnnuel - result.chargesURSSAF - result.chargesFixes)}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Net après IR</span>
                <p className={cn('text-sm font-mono font-bold', accent ? 'text-secondary' : 'text-slate-900')}>
                  {formatCurrency(result.netApresIR)}
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-2">Mensuel</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">CA brut</span>
                <p className="text-sm font-mono font-bold text-slate-900">{formatCurrency(Math.round(result.caAnnuel / 12))}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Net avant IR</span>
                <p className={cn('text-sm font-mono font-bold', accent ? 'text-secondary' : 'text-slate-900')}>
                  {formatCurrency(Math.round((result.caAnnuel - result.chargesURSSAF - result.chargesFixes) / 12))}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Net après IR</span>
                <p className={cn('text-sm font-mono font-bold', accent ? 'text-secondary' : 'text-slate-900')}>
                  {formatCurrency(Math.round(result.netApresIR / 12))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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

      <div className="grid grid-cols-12 gap-8" ref={inputsRef}>
        <div className={cn(
          'col-span-12 lg:col-span-8 grid gap-6',
          showScenarioC ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2',
        )}>
          {/* Scenario A */}
          {renderScenarioInputs(
            scenarioA,
            setScenarioA,
            resultA,
            false,
            'Scénario A',
            <History className="text-slate-300 w-6 h-6" />,
          )}

          {/* Scenario B */}
          {renderScenarioInputs(
            scenarioB,
            setScenarioB,
            resultB,
            true,
            'Scénario B',
            <TrendingUp className="text-secondary w-6 h-6" />,
          )}

          {/* Scenario C */}
          {showScenarioC && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="bg-surface-lowest p-8 rounded-3xl shadow-sm border-b-2 border-indigo-400 relative">
                <button
                  onClick={() => setShowScenarioC(false)}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 transition-colors"
                  aria-label="Supprimer le scénario C"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full uppercase tracking-wider">Scénario C</span>
                    <h3 className="font-headline text-2xl font-bold mt-3">{scenarioC.label}</h3>
                  </div>
                  <Settings className="text-indigo-400 w-6 h-6" />
                </div>
                <div className="space-y-6">
                  <div className="pb-4 border-b border-outline-variant/10">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-2">Taux journalier (TJM)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={scenarioC.tjm}
                        onChange={(e) => setScenarioC((s) => ({ ...s, tjm: Math.max(0, Number(e.target.value)) }))}
                        className="w-full text-3xl font-headline font-black bg-transparent border-b-2 border-slate-200 focus:border-indigo-400 outline-none pb-1 font-mono text-indigo-600"
                      />
                      <span className="text-xl font-headline font-black">€</span>
                    </div>
                  </div>
                  <div className="pb-4 border-b border-outline-variant/10">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-2">Jours par mois</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={scenarioC.workingDays}
                        onChange={(e) => setScenarioC((s) => ({ ...s, workingDays: Math.min(31, Math.max(1, Number(e.target.value))) }))}
                        className="w-full text-3xl font-headline font-black bg-transparent border-b-2 border-slate-200 focus:border-indigo-400 outline-none pb-1 font-mono"
                      />
                      <span className="text-sm font-medium text-on-surface-variant">jours</span>
                    </div>
                  </div>
                  <div className="pb-4 border-b border-outline-variant/10">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-2">Statut juridique</label>
                    <select
                      value={scenarioC.status}
                      onChange={(e) => setScenarioC((s) => ({ ...s, status: e.target.value as UserProfile['status'] }))}
                      className="w-full text-lg font-headline font-bold bg-transparent border-b-2 border-slate-200 focus:border-indigo-400 outline-none pb-1 cursor-pointer"
                    >
                      <option value="micro">Micro-entreprise</option>
                      <option value="sasu">SASU</option>
                      <option value="eurl">EURL</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-2">Annuel</label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">CA brut</span>
                          <p className="text-sm font-mono font-bold text-slate-900">{formatCurrency(resultC.caAnnuel)}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Net avant IR</span>
                          <p className="text-sm font-mono font-bold text-indigo-600">
                            {formatCurrency(resultC.caAnnuel - resultC.chargesURSSAF - resultC.chargesFixes)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Net après IR</span>
                          <p className="text-sm font-mono font-bold text-indigo-600">{formatCurrency(resultC.netApresIR)}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest block mb-2">Mensuel</label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">CA brut</span>
                          <p className="text-sm font-mono font-bold text-slate-900">{formatCurrency(Math.round(resultC.caAnnuel / 12))}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Net avant IR</span>
                          <p className="text-sm font-mono font-bold text-indigo-600">
                            {formatCurrency(Math.round((resultC.caAnnuel - resultC.chargesURSSAF - resultC.chargesFixes) / 12))}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Net après IR</span>
                          <p className="text-sm font-mono font-bold text-indigo-600">{formatCurrency(Math.round(resultC.netApresIR / 12))}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Delta Analysis */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-slate-900 text-white p-8 rounded-3xl h-full flex flex-col justify-center">
            <h4 className="font-headline font-bold text-lg mb-8">Analyse de l'écart</h4>
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Écart net annuel</p>
                  <p className="text-3xl font-headline font-extrabold">
                    {netDiff >= 0 ? '+' : ''}{formatCurrency(netDiff)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={netDiff >= 0 ? 'text-secondary font-bold text-sm' : 'text-red-400 font-bold text-sm'}>
                    {netDiff >= 0 ? '+' : ''}{netDiffPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Économie fiscale</p>
                  <p className={cn('text-3xl font-headline font-extrabold', fiscalSaving >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {fiscalSaving >= 0 ? '+' : ''}{formatCurrency(fiscalSaving)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={cn('font-bold text-sm', fiscalSaving >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {fiscalSaving >= 0 ? '+' : ''}{fiscalSavingPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Variation temps de travail</p>
                  <p className={cn('text-3xl font-headline font-extrabold', daysDiff <= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {daysDiff >= 0 ? '+' : ''}{daysDiff} <span className="text-sm font-medium">jours/an</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className={cn('font-bold text-sm', daysDiff <= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {daysDiff <= 0 ? 'RÉCUPÉRÉ' : 'AJOUTÉ'}
                  </span>
                </div>
              </div>
              {showScenarioC && (
                <div className="flex justify-between items-end pt-4 border-t border-slate-700">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Écart C vs A (net)</p>
                    <p className="text-2xl font-headline font-extrabold text-indigo-400">
                      {resultC.netApresIR - resultA.netApresIR >= 0 ? '+' : ''}
                      {formatCurrency(resultC.netApresIR - resultA.netApresIR)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-indigo-400 font-bold text-sm">
                      {resultA.netApresIR !== 0
                        ? `${((resultC.netApresIR - resultA.netApresIR) / Math.abs(resultA.netApresIR) * 100).toFixed(1)}%`
                        : '—'}
                    </span>
                  </div>
                </div>
              )}
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
          <div className="flex-1 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), 'CA annuel']}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {revenueChartData.map((_, index) => (
                    <Cell key={`cell-rev-${index}`} fill={CHART_COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface-low p-8 rounded-3xl flex flex-col justify-between h-64">
          <div>
            <h5 className="font-headline font-bold">Revenu net après IR</h5>
            <p className="text-xs text-on-surface-variant">Comparaison du net annuel</p>
          </div>
          <div className="flex-1 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={netChartData} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), 'Net après IR']}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {netChartData.map((_, index) => (
                    <Cell key={`cell-net-${index}`} fill={CHART_COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {!showScenarioC ? (
          <div className="bg-surface-highest/30 backdrop-blur-md p-8 rounded-3xl border border-outline-variant/20 flex flex-col justify-center text-center">
            <div className="mb-4">
              <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="text-white w-6 h-6" />
              </div>
              <h5 className="font-headline font-bold text-lg">Nouvelle simulation</h5>
              <p className="text-sm text-on-surface-variant px-6">Ajoutez un troisième scénario pour comparer différents niveaux de croissance.</p>
            </div>
            <button
              onClick={handleToggleScenarioC}
              className="mt-2 text-slate-900 font-bold text-sm underline underline-offset-4 hover:text-secondary transition-colors"
            >
              Configurer les paramètres
            </button>
          </div>
        ) : (
          <div className="bg-surface-low p-8 rounded-3xl flex flex-col justify-between h-64">
            <div>
              <h5 className="font-headline font-bold">Statut juridique</h5>
              <p className="text-xs text-on-surface-variant">Comparaison des statuts</p>
            </div>
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">A</span>
                <span className="text-sm font-headline font-bold">{STATUS_LABELS[scenarioA.status]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-secondary">B</span>
                <span className="text-sm font-headline font-bold text-secondary">{STATUS_LABELS[scenarioB.status]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600">C</span>
                <span className="text-sm font-headline font-bold text-indigo-600">{STATUS_LABELS[scenarioC.status]}</span>
              </div>
            </div>
            <button
              onClick={handleConfigureClick}
              className="mt-4 text-slate-900 font-bold text-xs underline underline-offset-4 hover:text-secondary transition-colors"
            >
              Configurer les paramètres
            </button>
          </div>
        )}
      </div>

      {/* Quote */}
      <div className="mt-12 py-12 border-t border-outline-variant/20">
        <div className="max-w-4xl mx-auto text-center">
          <Quote className="w-10 h-10 text-slate-200 mx-auto mb-6" />
          <blockquote className="text-2xl font-headline font-light italic text-on-surface-variant leading-relaxed">
            {netDiff >= 0
              ? <>« Le scénario B génère un gain net de {formatCurrency(netDiff)} par an{fiscalSaving > 0 ? ` avec une économie fiscale de ${formatCurrency(fiscalSaving)}` : ''}. {daysDiff < 0 ? `La réduction de ${Math.abs(daysDiff)} jours travaillés par an se traduit par un ` : 'Ce scénario offre un '}<span className="text-secondary font-bold not-italic">rendement net horaire</span> {daysDiff < 0 ? 'nettement supérieur' : 'optimisé'}. »</>
              : <>« Le scénario B présente un écart négatif de {formatCurrency(Math.abs(netDiff))}. Ajustez les paramètres pour trouver l'équilibre optimal entre <span className="text-secondary font-bold not-italic">rendement net</span> et charge de travail. »</>
            }
          </blockquote>
          <p className="mt-6 font-bold font-headline text-sm uppercase tracking-widest text-slate-900">Conseil de votre conseiller fiscal</p>
        </div>
      </div>
    </motion.div>
  );
};
