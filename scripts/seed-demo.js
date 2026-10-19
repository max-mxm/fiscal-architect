// Jeu de démonstration entièrement fictif : « Studio Lumen ». Aucune donnée réelle.
// Attention : efface toutes les données « fiscal-* » du navigateur avant de semer la démo.
// À lancer dans une fenêtre privée ou un profil dédié, jamais là où vous gardez vos vraies données.
(() => {
  const Y = 2026;
  const feries = new Set(['0-1', '3-6', '4-1', '4-8', '4-14', '4-25', '6-14', '7-15', '10-1', '10-11', '11-25']);
  const isWorkday = (m, d) => {
    const wd = new Date(Y, m, d).getDay();
    return wd !== 0 && wd !== 6 && !feries.has(`${m}-${d}`);
  };
  // Jours non travaillés par mois (congés, intercontrats), demi-journées.
  const off = { 0: [2, 30], 1: [16, 17, 18, 19, 20], 2: [27], 3: [], 4: [15, 22], 5: [], 6: [24, 27, 28, 29, 30, 31], 7: 'all-but-6', 8: [], 9: [] };
  const half = { 2: [13], 4: [29], 8: [11, 25], 9: [9] };
  const months = [];
  for (let m = 0; m < 12; m++) {
    const workedDays = [];
    const halfDays = [];
    const days = new Date(Y, m + 1, 0).getDate();
    if (m <= 9) {
      for (let d = 1; d <= days; d++) {
        if (!isWorkday(m, d)) continue;
        if (m === 9 && d > 16) continue; // octobre : saisi jusqu'au 16
        if (m === 7) {
          if (d <= 6) workedDays.push(d);
          continue;
        }
        if ((off[m] || []).includes(d)) continue;
        if ((half[m] || []).includes(d)) halfDays.push(d);
        else workedDays.push(d);
      }
    }
    months.push({ month: m, year: Y, workedDays, halfDays, entries: [] });
  }
  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  Object.keys(localStorage).filter((k) => k.startsWith('fiscal-')).forEach((k) => localStorage.removeItem(k));
  set('fiscal-profile', {
    schemaVersion: 1,
    name: 'Studio Lumen',
    role: 'Design produit',
    creationDate: '2023-03-01',
    partsFiscales: 1.5,
    declarationPeriod: 'monthly',
    onboardingDone: true,
  });
  set('fiscal-years-index', { schemaVersion: 1, years: [Y], activeYear: Y });
  set(`fiscal-year-config-${Y}`, {
    schemaVersion: 5,
    year: Y,
    urssafRate: 25.6,
    seuilMicro: 83600,
    tjm: 460,
    tjmByMonth: { 8: 500, 9: 500, 10: 500, 11: 500 },
    workingDays: 17,
    revenueModel: 'days',
    paymentDelayDays: 30,
    paymentDelayMode: 'net',
    endOfMonthCalculation: 'delayThenMonthEnd',
    activities: [{ id: 'act-default', type: 'liberalSsi', isPrimary: true, label: 'Design produit' }],
    fixedCosts: [
      { id: '1', name: 'Logiciels et abonnements', description: '', amount: 78, icon: 'receipt', color: '' },
      { id: '2', name: 'Atelier partagé', description: '', amount: 290, icon: 'receipt', color: '' },
      { id: '3', name: 'RC Pro et prévoyance', description: '', amount: 112, icon: 'receipt', color: '' },
    ],
    versementLiberatoire: false,
    acreEnabled: false,
    tvaAssujetti: true,
    tvaRate: 0.2,
    tvaEffectiveDate: `${Y}-03-01`,
    cfpEnabled: true,
    taxeConsulaireEnabled: false,
    ijOption: false,
    rfrN2: 31200,
    missionStart: `${Y}-01-05`,
  });
  set(`fiscal-calendar-${Y}`, { schemaVersion: 1, year: Y, months });
  localStorage.setItem('fiscal-pwa-install-dismissed', 'true');
  return 'seeded';
})();
