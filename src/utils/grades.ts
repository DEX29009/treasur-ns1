import { GradeTier } from '../types';

export const NON_COTISE_TIER: GradeTier = {
  id: 'non_cotise',
  name: 'Non cotisé',
  emoji: '⚪',
  minAmount: 0,
  maxAmount: 0,
  badgeColor: 'bg-slate-100 text-slate-500 border-slate-200',
  description: '0 HTG',
  perks: 'Aucun versement enregistré'
};

export const GRADE_TIERS: GradeTier[] = [
  {
    id: 'petit_investisseur',
    name: 'Petit investisseur',
    emoji: '💵',
    minAmount: 1,
    maxAmount: 249,
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: '1 HTG – 249 HTG',
    perks: 'Premier pas dans la trésorerie'
  },
  {
    id: 'investisseur_moyen',
    name: 'Investisseur moyen',
    emoji: '🌿',
    minAmount: 250,
    maxAmount: 499,
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: '250 HTG – 499 HTG',
    perks: 'Soutien régulier'
  },
  {
    id: 'grand_investisseur',
    name: 'Grand investisseur',
    emoji: '🚀',
    minAmount: 500,
    maxAmount: 999,
    badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
    description: '500 HTG – 999 HTG',
    perks: 'Contribution notable'
  },
  {
    id: 'millionaire',
    name: 'Millionnaire',
    emoji: '💰',
    minAmount: 1000,
    maxAmount: 1499,
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    description: '1 000 HTG – 1 499 HTG',
    perks: 'Pilier financier'
  },
  {
    id: 'milliardaire',
    name: 'Milliardaire',
    emoji: '💎',
    minAmount: 1500,
    maxAmount: 1999,
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    description: '1 500 HTG – 1 999 HTG',
    perks: 'Soutien d\'envergure'
  },
  {
    id: 'billionaire',
    name: 'Billionaire',
    emoji: '👑',
    minAmount: 2000,
    maxAmount: 2999,
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    description: '2 000 HTG – 2 999 HTG',
    perks: 'Générosité d\'exception'
  },
  {
    id: 'grand_contributeur',
    name: 'Grand contributeur',
    emoji: '🏆',
    minAmount: 3000,
    maxAmount: 4999,
    badgeColor: 'bg-orange-50 text-orange-800 border-orange-200',
    description: '3 000 HTG – 4 999 HTG',
    perks: 'Impact déterminant'
  },
  {
    id: 'vip',
    name: 'VIP',
    emoji: '🌟',
    minAmount: 5000,
    maxAmount: 9999,
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description: '5 000 HTG – 9 999 HTG',
    perks: 'Haut prestige'
  },
  {
    id: 'legend',
    name: 'Légende',
    emoji: '🔥',
    minAmount: 10000,
    maxAmount: Infinity,
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    description: '10 000 HTG et plus',
    perks: 'Statut suprême de NS1'
  }
];

export function getGradeForAmount(amount: number): GradeTier {
  const numericAmount = Number(amount) || 0;
  if (numericAmount <= 0) {
    return NON_COTISE_TIER;
  }
  for (const tier of GRADE_TIERS) {
    if (numericAmount >= tier.minAmount && numericAmount <= tier.maxAmount) {
      return tier;
    }
  }
  return GRADE_TIERS[GRADE_TIERS.length - 1];
}

export function getNextGrade(amount: number): { nextGrade: GradeTier | null; remaining: number; progressPercent: number } {
  const numericAmount = Number(amount) || 0;
  if (numericAmount <= 0) {
    const firstTier = GRADE_TIERS[0];
    return {
      nextGrade: firstTier,
      remaining: firstTier.minAmount,
      progressPercent: 0
    };
  }

  const current = getGradeForAmount(numericAmount);
  if (current.id === NON_COTISE_TIER.id) {
    const firstTier = GRADE_TIERS[0];
    return {
      nextGrade: firstTier,
      remaining: firstTier.minAmount,
      progressPercent: 0
    };
  }

  const currentIndex = GRADE_TIERS.findIndex(t => t.id === current.id);
  const nextTier = GRADE_TIERS[currentIndex + 1] || null;

  if (!nextTier) {
    return { nextGrade: null, remaining: 0, progressPercent: 100 };
  }

  const span = nextTier.minAmount - current.minAmount;
  const currentProgress = numericAmount - current.minAmount;
  const progressPercent = span > 0 ? Math.min(100, Math.max(0, Math.round((currentProgress / span) * 100))) : 0;
  const remaining = Math.max(0, nextTier.minAmount - numericAmount);

  return { nextGrade: nextTier, remaining, progressPercent };
}

export function formatCurrency(amount: number): string {
  const num = Number(amount) || 0;
  return `${new Intl.NumberFormat('fr-FR').format(num)} HTG`;
}
