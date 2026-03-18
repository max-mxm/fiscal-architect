import React from 'react';
import { motion } from 'motion/react';
import { 
  HelpCircle, 
  TrendingUp, 
  Euro, 
  Landmark, 
  Plus, 
  ArrowRight, 
  Info, 
  Laptop, 
  Users, 
  Shield, 
  Sparkles 
} from 'lucide-react';
import { UserProfile } from '../types';
import { cn } from '../utils';

interface ProfileProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
}

export const Profile: React.FC<ProfileProps> = ({ profile, setProfile }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-16 max-w-6xl mx-auto"
    >
      <header>
        <span className="text-secondary font-bold tracking-widest text-xs uppercase mb-4 block">Initialization Phase</span>
        <h2 className="font-headline text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Profile Setup</h2>
        <p className="text-on-surface-variant max-w-2xl text-lg leading-relaxed">
          Configure your fiscal architecture. These parameters will drive your growth simulations and tax projections. 
          Every detail helps refine your daily rate and profitability targets.
        </p>
      </header>

      <form className="space-y-12" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Professional Status */}
          <div className="lg:col-span-2 bg-surface-lowest p-8 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <label className="font-headline text-xl font-bold">Professional Status</label>
              <HelpCircle className="text-slate-300 w-5 h-5 cursor-help" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'micro', label: 'Micro-entrepreneur', desc: 'Simple management, turnover caps apply.' },
                { id: 'sasu', label: 'SASU', desc: 'Optimal for dividend strategies.' },
                { id: 'eurl', label: 'EURL', desc: 'Standard corporate structure (SARL).' },
              ].map((status) => (
                <label 
                  key={status.id}
                  className={cn(
                    "relative flex flex-col p-5 border-2 rounded-2xl cursor-pointer transition-all group",
                    profile.status === status.id 
                      ? "border-secondary bg-white" 
                      : "border-transparent bg-surface-low hover:bg-slate-200"
                  )}
                >
                  <input 
                    type="radio" 
                    name="status" 
                    className="sr-only" 
                    checked={profile.status === status.id}
                    onChange={() => setProfile({ ...profile, status: status.id as any })}
                  />
                  <span className="font-bold text-sm mb-1">{status.label}</span>
                  <span className="text-xs text-on-surface-variant">{status.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* TJM Hero Card */}
          <div className="bg-slate-900 text-white p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <label className="font-headline text-lg font-bold opacity-80">Target TJM</label>
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="flex items-baseline">
                <span className="text-4xl font-extrabold font-headline">€</span>
                <input 
                  type="number" 
                  value={profile.tjm}
                  onChange={(e) => setProfile({ ...profile, tjm: parseInt(e.target.value) || 0 })}
                  className="bg-transparent border-none text-5xl font-extrabold font-headline focus:ring-0 w-full p-0 ml-1 appearance-none border-b-2 border-slate-700"
                />
              </div>
              <p className="text-xs mt-4 opacity-60 font-medium tracking-wide uppercase">Daily Average Rate</p>
            </div>
            <Euro className="absolute -right-4 -bottom-4 opacity-10 w-32 h-32 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Social Security */}
          <div className="bg-white p-8 rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Landmark className="text-secondary w-5 h-5" />
              <h3 className="font-headline font-bold text-lg">Social Security Rates</h3>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-on-surface-variant">URSSAF Contribution</label>
                  <span className="text-sm font-bold">{profile.urssafRate}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  step="0.1"
                  value={profile.urssafRate}
                  onChange={(e) => setProfile({ ...profile, urssafRate: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-surface-highest rounded-lg appearance-none cursor-pointer accent-secondary"
                />
                <p className="text-[10px] text-slate-400 mt-2 italic">Standard micro-entrepreneur rate for services.</p>
              </div>
              <div className="pt-4">
                <label className="block text-sm font-medium text-on-surface-variant mb-3">Income Tax Bracket</label>
                <select 
                  value={profile.incomeTaxBracket}
                  onChange={(e) => setProfile({ ...profile, incomeTaxBracket: e.target.value })}
                  className="w-full bg-surface-low border-none rounded-xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-secondary/20"
                >
                  <option>0% - Non-taxable</option>
                  <option>11% - Moderate Revenue</option>
                  <option>30% - Median Revenue (€27k - €78k)</option>
                  <option>41% - High Revenue</option>
                  <option>45% - Top Bracket</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fixed Costs */}
          <div className="bg-surface-low p-8 rounded-3xl border border-white/50 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-lg">Fixed Monthly Costs</h3>
              <button className="text-secondary text-sm font-bold flex items-center gap-1 hover:underline">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
            <div className="space-y-4">
              {profile.fixedCosts.map((cost) => (
                <div key={cost.id} className="flex items-center justify-between p-4 bg-white rounded-2xl group shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl", cost.color)}>
                      {cost.icon === 'laptop' && <Laptop className="w-5 h-5" />}
                      {cost.icon === 'users' && <Users className="w-5 h-5" />}
                      {cost.icon === 'shield' && <Shield className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{cost.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{cost.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">€{cost.amount}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-outline-variant/30 flex justify-between items-end">
              <span className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">Total Monthly Burndown</span>
              <span className="text-2xl font-black font-headline text-slate-900">
                €{profile.fixedCosts.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-8 flex items-center justify-between">
          <div className="flex items-center gap-4 text-on-surface-variant">
            <Info className="w-5 h-5" />
            <p className="text-xs">Your data is stored locally and used only for simulation purposes.</p>
          </div>
          <div className="flex gap-4">
            <button className="px-8 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">Discard</button>
            <button className="px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2">
              Initialize Profile <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Guide */}
      <footer className="mt-32 pt-16 border-t border-outline-variant/20 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h4 className="font-headline text-sm font-bold text-secondary mb-4 uppercase">The Architect's Guide</h4>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            Understanding the difference between your gross turnover and net profit is essential. 
            For Micro-entrepreneurs, the average real taxation rate (including social security and tax) 
            often sits between 25% and 30%. In SASU, dividends are taxed at the Flat Tax rate of 30%, 
            but corporate social contributions are significantly higher on salaries.
          </p>
        </div>
        <div className="bg-surface-highest/20 p-8 rounded-3xl flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
            <Sparkles className="text-secondary w-8 h-8" />
          </div>
          <div>
            <h5 className="font-bold text-sm mb-1">Smart Suggestions</h5>
            <p className="text-xs text-on-surface-variant">
              Based on your TJM of €{profile.tjm}, we recommend exploring SASU structures once 
              your turnover exceeds €72,600 to optimize your tax strategy.
            </p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};
