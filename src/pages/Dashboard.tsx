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
import { UserProfile } from '../types';
import { CHART_DATA } from '../constants';

interface DashboardProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile, setProfile }) => {
  const monthlyGross = profile.tjm * profile.workingDays;
  const urssaf = monthlyGross * (profile.urssafRate / 100);
  const netProfit = monthlyGross - urssaf;
  const annualForecast = monthlyGross * 12;

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
            <p className="text-xs font-semibold tracking-widest text-on-surface-variant uppercase mb-2">CA mensuel projeté</p>
            <h2 className="font-headline text-slate-900 text-[4rem] lg:text-[5rem] font-extrabold leading-none tracking-tighter">
              {monthlyGross.toLocaleString()}<span className="text-secondary">€</span>
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="border-l-2 border-secondary pl-8">
              <p className="text-xs font-medium text-on-surface-variant mb-1">Bénéfice net estimé</p>
              <p className="text-3xl font-headline font-bold text-slate-900">{netProfit.toLocaleString()}€</p>
              <p className="text-xs text-secondary font-semibold mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +12% vs mois dernier
              </p>
            </div>
            <div className="border-l-2 border-outline-variant pl-8">
              <p className="text-xs font-medium text-on-surface-variant mb-1">Provision fiscale (URSSAF/IR)</p>
              <p className="text-3xl font-headline font-bold text-slate-900">{urssaf.toLocaleString()}€</p>
              <p className="text-xs text-on-surface-variant mt-2">Taux de rétention : {(100 - profile.urssafRate).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="space-y-8">
          <div className="bg-surface-low p-8 rounded-2xl">
            <h3 className="font-headline text-lg font-bold mb-8">Paramètres de simulation</h3>

            <div className="space-y-6 mb-10">
              <div className="flex justify-between items-end">
                <label className="text-sm font-semibold text-on-surface-variant">Taux journalier (TJM)</label>
                <span className="text-2xl font-headline font-bold text-secondary">{profile.tjm}€</span>
              </div>
              <input
                type="range"
                min="300"
                max="1500"
                step="10"
                value={profile.tjm}
                onChange={(e) => setProfile({ ...profile, tjm: parseInt(e.target.value) })}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                <span>300€</span>
                <span>Standard</span>
                <span>1500€</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <label className="text-sm font-semibold text-on-surface-variant">Jours travaillés</label>
                <span className="text-2xl font-headline font-bold text-secondary">{profile.workingDays} <span className="text-sm font-medium text-on-surface-variant">jours</span></span>
              </div>
              <input
                type="range"
                min="0"
                max="31"
                value={profile.workingDays}
                onChange={(e) => setProfile({ ...profile, workingDays: parseInt(e.target.value) })}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                <span>0</span>
                <span>Mois complet</span>
                <span>31</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-surface-lowest p-6 rounded-2xl flex justify-between items-center transition-transform hover:scale-[1.02] cursor-pointer shadow-sm">
              <div>
                <p className="text-xs text-on-surface-variant mb-1">Estimation hebdomadaire</p>
                <p className="text-xl font-headline font-bold">{(monthlyGross / 4).toLocaleString()}€</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="bg-surface-lowest p-6 rounded-2xl flex justify-between items-center transition-transform hover:scale-[1.02] cursor-pointer shadow-sm">
              <div>
                <p className="text-xs text-on-surface-variant mb-1">Prévision annuelle</p>
                <p className="text-xl font-headline font-bold">{annualForecast.toLocaleString()}€</p>
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
                <p className="text-sm text-on-surface-variant">CA brut vs bénéfice net (2024)</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                  <span className="text-xs font-semibold text-on-surface-variant">Brut</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary"></div>
                  <span className="text-xs font-semibold text-secondary">Bénéfice net</span>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA}>
                  <defs>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006c49" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#006c49" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="gross"
                    stroke="#e2e8f0"
                    strokeWidth={2}
                    fill="transparent"
                  />
                  <Area
                    type="monotone"
                    dataKey="net"
                    stroke="#006c49"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorNet)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Architecture */}
      <section className="border-t border-outline-variant/20 pt-16">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant mb-12">Architecture fiscale & charges</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {profile.fixedCosts.map((cost) => (
            <div key={cost.id} className="space-y-4">
              <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{cost.name}</p>
              <div className="h-1 bg-surface-highest rounded-full overflow-hidden">
                <div className="h-full bg-secondary w-[20%]"></div>
              </div>
              <p className="text-xl font-headline font-bold text-slate-900">{cost.amount}€ <span className="text-xs font-normal text-on-surface-variant">/ mois</span></p>
              <p className="text-xs text-on-surface-variant leading-relaxed">{cost.description}</p>
            </div>
          ))}
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">Réserve vacances</p>
            <div className="h-1 bg-surface-highest rounded-full overflow-hidden">
              <div className="h-full bg-emerald-300 w-[15%]"></div>
            </div>
            <p className="text-xl font-headline font-bold text-slate-900">980€ <span className="text-xs font-normal text-on-surface-variant">/ mois</span></p>
            <p className="text-xs text-on-surface-variant leading-relaxed">Provision recommandée pour 5 semaines de congés non rémunérés.</p>
          </div>
        </div>
      </section>

      {/* Floating Action */}
      <div className="fixed bottom-24 lg:bottom-10 right-8 z-50">
        <button className="bg-slate-900 text-white h-14 px-8 rounded-full shadow-2xl flex items-center gap-3 font-bold transition-all hover:scale-105 active:scale-95 group">
          <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
          <span>Exporter les prévisions</span>
        </button>
      </div>
    </motion.div>
  );
};
