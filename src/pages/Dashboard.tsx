import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, Wallet, History, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '~/types';
import {
  calcCAMensuel,
  calcTotalChargesFixes,
  calcCAannuel,
  calcNetMicro,
  calcMonthlyBreakdown,
  calcReserveVacances,
  generateChartData,
} from '~/lib/fiscal';
import { formatEuro } from '~/lib/format';
import { useCallback } from 'react';

interface DashboardProps {
  profile: UserProfile;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile }) => {
  // Calculs via moteur fiscal centralisé
  const monthlyGross = calcCAMensuel(profile.tjm, profile.workingDays);
  const totalChargesFixes = calcTotalChargesFixes(profile.fixedCosts);
  const annualForecast = calcCAannuel(profile.tjm, profile.workingDays);
  const resultAnnuel = calcNetMicro(annualForecast, profile.urssafRate, totalChargesFixes * 12, profile.versementLiberatoire);
  const monthBreakdown = calcMonthlyBreakdown(monthlyGross, profile.urssafRate, totalChargesFixes, profile.versementLiberatoire);
  const netProfit = monthBreakdown.net;

  const chartData = generateChartData(profile);

  const reserveVacances = calcReserveVacances(netProfit, profile.workingDays);

  // Export CSV
  const handleExportCSV = useCallback(() => {
    const header = 'Mois,CA Brut (€),Bénéfice Net (€)\n';
    const rows = chartData.map((d) => `${d.month},${d.brut},${d.net}`).join('\n');
    const totals = `\nTotal annuel,${chartData.reduce((s, d) => s + d.brut, 0)},${chartData.reduce((s, d) => s + d.net, 0)}`;
    const csv = header + rows + totals;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `previsions-${new Date().getFullYear()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [chartData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-16"
    >
      {/* Hero Metrics */}
      <section>
        <div className="grid grid-cols-12 gap-8 items-end">
          <div className="col-span-12 lg:col-span-5">
            <p className="text-sm font-semibold tracking-widest text-on-surface-variant uppercase mb-2">CA mensuel projeté</p>
            <h2 className="font-headline text-slate-900 text-[4rem] lg:text-[5rem] font-extrabold leading-none tracking-tighter">
              {formatEuro(monthlyGross)}<span className="text-secondary">€</span>
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="border-l-2 border-secondary pl-8">
              <p className="text-xs font-medium text-on-surface-variant mb-1">Bénéfice net estimé</p>
              <p className="text-3xl font-mono font-bold text-slate-900">{formatEuro(netProfit)}€</p>
              <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Charges fixes : {formatEuro(totalChargesFixes)}€/mois
              </p>
            </div>
            <div className="border-l-2 border-outline-variant pl-8">
              <p className="text-xs font-medium text-on-surface-variant mb-1">Provisions (URSSAF + IR)</p>
              <p className="text-3xl font-mono font-bold text-slate-900">{formatEuro((resultAnnuel.chargesURSSAF + resultAnnuel.ir) / 12)}€</p>
              <p className="text-xs text-on-surface-variant mt-2">Taux de rétention : {annualForecast > 0 ? ((resultAnnuel.netApresIR / annualForecast) * 100).toFixed(1) : '0.0'}%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Read-only info cards */}
        <div className="space-y-8">
          <div className="bg-surface-low p-8 rounded-2xl">
            <h3 className="font-headline text-lg font-bold mb-8">Aperçu simulation</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <label className="text-sm font-semibold text-on-surface-variant">Taux journalier (TJM)</label>
                <span className="text-2xl font-headline font-bold text-secondary">{profile.tjm}€</span>
              </div>
              <div className="flex justify-between items-end">
                <label className="text-sm font-semibold text-on-surface-variant">Jours travaillés</label>
                <span className="text-2xl font-headline font-bold text-secondary">{profile.workingDays} <span className="text-sm font-medium text-on-surface-variant">jours</span></span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-surface-lowest p-6 rounded-2xl flex justify-between items-center shadow-sm">
              <div>
                <p className="text-sm text-on-surface-variant mb-1">Estimation hebdomadaire</p>
                <p className="text-xl font-mono font-bold">{formatEuro(monthlyGross / 4)}€</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-surface-lowest p-6 rounded-2xl flex justify-between items-center shadow-sm">
              <div>
                <p className="text-sm text-on-surface-variant mb-1">Prévision annuelle</p>
                <p className="text-xl font-mono font-bold">{formatEuro(annualForecast)}€</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <History className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2">
          <div className="bg-surface-lowest p-10 rounded-2xl h-full shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h3 className="font-headline text-2xl font-bold">Dynamique des revenus</h3>
                <p className="text-sm text-on-surface-variant">CA brut vs bénéfice net ({new Date().getFullYear()})</p>
              </div>
              <div className="flex gap-5">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-slate-200"></div>
                  <span className="text-sm font-semibold text-on-surface-variant">Brut</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-secondary"></div>
                  <span className="text-sm font-semibold text-secondary">Bénéfice net</span>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006c49" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#006c49" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 500, fill: '#94a3b8' }}
                    tickFormatter={(value: number) => value >= 1000 ? `${(value / 1000).toFixed(0)}k€` : `${value}€`}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => `${Number(value).toLocaleString('fr-FR')}€`}
                  />
                  <Area
                    type="monotone"
                    dataKey="brut"
                    stroke="#e2e8f0"
                    strokeWidth={2}
                    fill="transparent"
                    name="CA Brut"
                  />
                  <Area
                    type="monotone"
                    dataKey="net"
                    stroke="#006c49"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorNet)"
                    name="Bénéfice Net"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Architecture — read-only */}
      <section className="border-t border-outline-variant/20 pt-16">
        <div className="flex justify-between items-center mb-12">
          <h4 className="text-sm font-black uppercase tracking-[0.15em] text-on-surface-variant">Architecture fiscale & charges</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {profile.fixedCosts.map((cost) => (
            <div key={cost.id} className="space-y-4">
              <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{cost.name}</p>
              <div className="h-2 bg-surface-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full transition-all"
                  style={{ width: `${Math.min(100, monthlyGross > 0 ? (cost.amount / monthlyGross) * 100 : 0)}%` }}
                ></div>
              </div>
              <p className="text-xl font-mono font-bold text-slate-900">{cost.amount}€ <span className="text-xs font-sans font-normal text-on-surface-variant">/ mois</span></p>
              <p className="text-xs text-on-surface-variant leading-relaxed">{cost.description}</p>
            </div>
          ))}
          {/* Réserve vacances calculée */}
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">Réserve vacances</p>
            <div className="h-2 bg-surface-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-300 rounded-full transition-all"
                style={{ width: `${Math.min(100, monthlyGross > 0 ? (reserveVacances / monthlyGross) * 100 : 0)}%` }}
              ></div>
            </div>
            <p className="text-xl font-mono font-bold text-slate-900">{formatEuro(reserveVacances)}€ <span className="text-xs font-sans font-normal text-on-surface-variant">/ mois</span></p>
            <p className="text-xs text-on-surface-variant leading-relaxed">Provision pour 5 semaines de congés non rémunérés.</p>
          </div>
        </div>
      </section>

      {/* Floating Action — Export CSV */}
      <div className="fixed bottom-24 lg:bottom-10 right-8 z-50">
        <button
          onClick={handleExportCSV}
          className="bg-slate-900 text-white h-14 px-8 rounded-full shadow-2xl flex items-center gap-3 font-bold transition-all hover:scale-105 active:scale-95 group"
        >
          <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
          <span>Exporter les prévisions</span>
        </button>
      </div>
    </motion.div>
  );
};
