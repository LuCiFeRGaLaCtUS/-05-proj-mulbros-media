/**
 * Authoritative Film Tax Incentive Data — MulBros Media OS
 * Sources: MPAA, Film Tax Incentives Database, State Film Offices (as of Q1 2026)
 * Used to ground the Incentive Analyst AI so it never hallucinates credit rates.
 */

export const JURISDICTIONS = [
  // ─── United States ──────────────────────────────────────────────────────────
  {
    location: 'Georgia, US',
    flag: '🇺🇸',
    creditRate: '20–30%',
    creditRateNum: 30,
    type: 'Tax Credit',
    refundable: false,
    transferable: true,
    minSpend: '$500,000',
    minSpendNum: 500000,
    cap: 'Uncapped',
    qualifiedSpend: 'All in-state spend on production + 10% promo bonus if using Georgia logo',
    notes: '20% base + up to 10% additional for including Georgia Entertainment Promotion logo. No annual cap. Largest volume state for production.',
    bestFor: ['Drama', 'Action', 'Thriller', 'Horror', 'Sci-Fi'],
  },
  {
    location: 'New Mexico, US',
    flag: '🇺🇸',
    creditRate: '25–35%',
    creditRateNum: 35,
    type: 'Refundable Tax Credit',
    refundable: true,
    transferable: false,
    minSpend: '$1,000,000',
    minSpendNum: 1000000,
    cap: '$110M/year',
    qualifiedSpend: 'Direct production expenditures in New Mexico on resident labor and goods',
    notes: '25% base, up to 35% with additional bonuses for filming in rural areas or using NM crew. Refundable — state pays back excess.',
    bestFor: ['Western', 'Thriller', 'Action', 'Drama'],
  },
  {
    location: 'Louisiana, US',
    flag: '🇺🇸',
    creditRate: '25–40%',
    creditRateNum: 40,
    type: 'Tax Credit',
    refundable: false,
    transferable: true,
    minSpend: '$300,000',
    minSpendNum: 300000,
    cap: '$180M/year',
    qualifiedSpend: '25% on all spend + 15% additional for in-state labor exceeding 50% of total labor',
    notes: 'One of the highest credit rates available. Strong crew base. Annual cap of $180M. Credits are transferable and can be sold at ~88 cents on the dollar.',
    bestFor: ['Drama', 'Horror', 'Action', 'Comedy'],
  },
  {
    location: 'New York, US',
    flag: '🇺🇸',
    creditRate: '25–35%',
    creditRateNum: 35,
    type: 'Refundable Tax Credit',
    refundable: true,
    transferable: false,
    minSpend: '$1,000,000',
    minSpendNum: 1000000,
    cap: '$700M/year',
    qualifiedSpend: '25% on below-the-line NY costs + 10% additional for production outside NYC (upstate bonus)',
    notes: 'Largest annual cap in the US. Refundable. Strong union crew availability. Upstate bonus makes it attractive for rural/nature projects.',
    bestFor: ['Drama', 'Documentary', 'Indie', 'Thriller'],
  },
  {
    location: 'California, US',
    flag: '🇺🇸',
    creditRate: '20–25%',
    creditRateNum: 25,
    type: 'Tax Credit',
    refundable: false,
    transferable: true,
    minSpend: '$1,000,000',
    minSpendNum: 1000000,
    cap: '$330M/year',
    qualifiedSpend: '20% base on qualified CA expenditures; 25% for independent films under $10M',
    notes: 'Competitive but oversubscribed — allocation is by lottery/application score. Best for projects with strong CA-based talent. Credits are transferable.',
    bestFor: ['Indie', 'Drama', 'Sci-Fi', 'Documentary'],
  },
  {
    location: 'Ohio, US',
    flag: '🇺🇸',
    creditRate: '30%',
    creditRateNum: 30,
    type: 'Refundable Tax Credit',
    refundable: true,
    transferable: false,
    minSpend: '$300,000',
    minSpendNum: 300000,
    cap: '$40M/year',
    qualifiedSpend: '30% on qualified Ohio expenditures including resident labor and Ohio goods/services',
    notes: 'Excellent for mid-budget films ($300K–$2M). Refundable credit — state cuts a check. Growing crew base in Cleveland, Columbus, Cincinnati.',
    bestFor: ['Drama', 'Indie', 'Thriller', 'Documentary'],
  },
  {
    location: 'Massachusetts, US',
    flag: '🇺🇸',
    creditRate: '25%',
    creditRateNum: 25,
    type: 'Tax Credit',
    refundable: false,
    transferable: true,
    minSpend: '$50,000',
    minSpendNum: 50000,
    cap: 'Uncapped',
    qualifiedSpend: '25% on all Massachusetts production expenditures above $50K threshold',
    notes: 'Low minimum spend threshold — accessible for smaller budget films. Transferable credits can be sold. Boston has strong crew base.',
    bestFor: ['Drama', 'Thriller', 'Indie', 'Horror'],
  },
  {
    location: 'Illinois, US',
    flag: '🇺🇸',
    creditRate: '30%',
    creditRateNum: 30,
    type: 'Tax Credit',
    refundable: false,
    transferable: true,
    minSpend: '$100,000',
    minSpendNum: 100000,
    cap: 'Uncapped',
    qualifiedSpend: '30% on Illinois qualified spend including labor, locations, goods/services',
    notes: 'Chicago has world-class studio infrastructure. Uncapped program. Strong crew union base. Credits are transferable.',
    bestFor: ['Drama', 'Thriller', 'Action', 'Comedy'],
  },
  {
    location: 'Pennsylvania, US',
    flag: '🇺🇸',
    creditRate: '25%',
    creditRateNum: 25,
    type: 'Tax Credit',
    refundable: false,
    transferable: true,
    minSpend: '$100,000',
    minSpendNum: 100000,
    cap: '$100M/year',
    qualifiedSpend: '25% on all PA qualified production expenditures',
    notes: 'Philadelphia and Pittsburgh both offer strong locations. Credits are transferable. Growing production infrastructure.',
    bestFor: ['Drama', 'Horror', 'Thriller', 'Indie'],
  },
  {
    location: 'North Carolina, US',
    flag: '🇺🇸',
    creditRate: '25%',
    creditRateNum: 25,
    type: 'Refundable Grant',
    refundable: true,
    transferable: false,
    minSpend: '$250,000',
    minSpendNum: 250000,
    cap: '$31M/year',
    qualifiedSpend: '25% grant on qualifying NC spend including labor, equipment, locations',
    notes: 'Issued as a grant (not a tax credit) — paid directly after audit. EUE/Screen Gems Studios in Wilmington provides studio infrastructure.',
    bestFor: ['Action', 'Drama', 'Sci-Fi', 'Thriller'],
  },
  {
    location: 'Montana, US',
    flag: '🇺🇸',
    creditRate: '20–25%',
    creditRateNum: 25,
    type: 'Refundable Tax Credit',
    refundable: true,
    transferable: false,
    minSpend: '$300,000',
    minSpendNum: 300000,
    cap: '$12M/year',
    qualifiedSpend: '20% base + 5% bonus for hiring Montana residents; applies to MT production costs',
    notes: 'Ideal for Westerns, nature documentaries, outdoor narratives. Stunning locations. Lower crew density than major markets.',
    bestFor: ['Western', 'Documentary', 'Drama', 'Adventure'],
  },
  {
    location: 'Nevada, US',
    flag: '🇺🇸',
    creditRate: '15–25%',
    creditRateNum: 25,
    type: 'Transferable Tax Credit',
    refundable: false,
    transferable: true,
    minSpend: '$500,000',
    minSpendNum: 500000,
    cap: '$10M/year',
    qualifiedSpend: '15% base on qualified NV production costs; 25% for productions over $1M with significant NV crew',
    notes: 'Las Vegas and desert locations. Growing production hub. Smaller cap but competitive for mid-budget projects.',
    bestFor: ['Action', 'Thriller', 'Documentary', 'Drama'],
  },

  // ─── International ───────────────────────────────────────────────────────────
  {
    location: 'Ontario, Canada',
    flag: '🇨🇦',
    creditRate: '35–58%',
    creditRateNum: 58,
    type: 'Combined Federal + Provincial Credit',
    refundable: true,
    transferable: false,
    minSpend: '$1,000,000 CAD',
    minSpendNum: 740000,
    cap: 'Uncapped',
    qualifiedSpend: '35% Ontario labor credit (OFTTC) + 16–25% federal CPTC on Canadian labor costs',
    notes: 'Highest effective rate in North America when federal (CPTC ~25%) + provincial (OFTTC ~35%) are combined. Only applies to Canadian labor costs, not total budget. Toronto has world-class crew and studio infrastructure.',
    bestFor: ['Drama', 'Sci-Fi', 'Action', 'Documentary', 'Thriller'],
  },
  {
    location: 'British Columbia, Canada',
    flag: '🇨🇦',
    creditRate: '28–58%',
    creditRateNum: 58,
    type: 'Combined Federal + Provincial Credit',
    refundable: true,
    transferable: false,
    minSpend: '$1,000,000 CAD',
    minSpendNum: 740000,
    cap: 'Uncapped',
    qualifiedSpend: 'BC FIBC 28–35% on BC labor + federal CPTC on Canadian labor; regional bonuses available',
    notes: 'Vancouver is the third-largest film production center in North America. Stunning Pacific Northwest locations. Combined federal + provincial makes it extremely competitive.',
    bestFor: ['Sci-Fi', 'Action', 'Drama', 'Fantasy', 'Thriller'],
  },
  {
    location: 'United Kingdom',
    flag: '🇬🇧',
    creditRate: '25–45%',
    creditRateNum: 45,
    type: 'Audio Visual Expenditure Credit (AVEC)',
    refundable: true,
    transferable: false,
    minSpend: '£1,000,000 / 10% UK spend',
    minSpendNum: 1260000,
    cap: 'Uncapped',
    qualifiedSpend: '34% credit on UK qualifying expenditure for films; enhanced 39% for visual effects spend',
    notes: 'Replaced the old Film Tax Relief in 2024. 34% on UK core expenditure, 39% on VFX. At least 10% of total budget must be UK spend. World-class facilities at Pinewood, Shepperton. Strong co-production treaty network.',
    bestFor: ['Drama', 'Thriller', 'Sci-Fi', 'Historical', 'Fantasy'],
  },
  {
    location: 'Australia',
    flag: '🇦🇺',
    creditRate: '16.5–40%',
    creditRateNum: 40,
    type: 'Producer Offset + Location Offset',
    refundable: true,
    transferable: false,
    minSpend: 'AUD $1,000,000 (feature)',
    minSpendNum: 650000,
    cap: 'Uncapped',
    qualifiedSpend: '40% Producer Offset on Australian spend for feature films; 20% Location Offset on all Australian spend for non-Australian productions',
    notes: 'Two separate programs: 40% for Australian-controlled productions; 20% location offset for foreign productions with $15M+ Australian spend. Favorable AUD exchange rate amplifies effective value.',
    bestFor: ['Action', 'Sci-Fi', 'Drama', 'Documentary', 'Adventure'],
  },
  {
    location: 'Ireland',
    flag: '🇮🇪',
    creditRate: '32%',
    creditRateNum: 32,
    type: 'Section 481 Tax Credit',
    refundable: true,
    transferable: false,
    minSpend: '€125,000',
    minSpendNum: 135000,
    cap: '€70M per project',
    qualifiedSpend: '32% on eligible Irish expenditure including labor, services, and studio costs',
    notes: 'Very low minimum spend threshold. EU co-production access. Strong English-speaking crew. Dublin and County Wicklow offer diverse locations. Section 481 is well-established and filmmaker-friendly.',
    bestFor: ['Drama', 'Thriller', 'Historical', 'Indie', 'Documentary'],
  },
  {
    location: 'New Zealand',
    flag: '🇳🇿',
    creditRate: '20–25%',
    creditRateNum: 25,
    type: 'Screen Production Grant',
    refundable: true,
    transferable: false,
    minSpend: 'NZD $15,000,000',
    minSpendNum: 8800000,
    cap: 'Uncapped',
    qualifiedSpend: '20% base grant on NZ spend; 25% with PDV (post/digital/VFX) uplift; 5% additional for significant NZ content',
    notes: 'High minimum spend threshold — best for larger productions. World-renowned locations. Peter Jackson\'s Weta Digital and Park Road Post provide top-tier VFX and post-production.',
    bestFor: ['Fantasy', 'Adventure', 'Sci-Fi', 'Action'],
  },
];

/**
 * Returns a formatted string of the jurisdiction table
 * suitable for injection into an AI system prompt.
 */
export const getJurisdictionPromptContext = () => {
  const rows = JURISDICTIONS.map(j =>
    `• ${j.flag} ${j.location}: ${j.creditRate} ${j.type} | Refundable: ${j.refundable ? 'Yes' : 'No'} | Min Spend: ${j.minSpend} | Cap: ${j.cap} | Best for: ${j.bestFor.join(', ')} | Notes: ${j.notes}`
  ).join('\n');

  return `
AUTHORITATIVE FILM TAX INCENTIVE DATA (Q1 2026) — use these exact figures, do not estimate or hallucinate rates:

${rows}

When generating a benchmark:
- Use ONLY the credit rates above. Never invent a rate not listed here.
- Calculate savings as: budget × (qualified spend percentage) × (credit rate). Assume 70% of budget is qualified spend unless otherwise specified.
- Prioritize refundable credits for productions under $3M (cash is king at lower budgets).
- Prioritize uncapped programs for large-budget productions.
- Match location to genre where the "bestFor" list aligns.
- Always note the minimum spend requirement — if the project budget is below it, exclude that jurisdiction.
`.trim();
};

/**
 * Returns jurisdictions sorted by credit rate, optionally filtered by min budget
 */
export const getTopJurisdictions = (budgetUSD = 0, limit = 5) => {
  return JURISDICTIONS
    .filter(j => j.minSpendNum <= budgetUSD)
    .sort((a, b) => b.creditRateNum - a.creditRateNum)
    .slice(0, limit);
};
