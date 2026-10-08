import { GradeTier } from '../types';

export const GRADE_TIERS: GradeTier[] = [
  {
    id: 'petit_investisseur',
    name: 'Petit investisseur',
    emoji: '💵',
    minAmount: 1,
    maxAmount: 249,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: '1 HTG – 249 HTG',
    perks: 'Premier pas dans la trésorerie'
  },
  {
    id: 'investisseur_moyen',
    name: 'Investisseur moyen',
    emoji: '🌿',
    minAmount: 250,
    maxAmount: 499,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: '250 HTG – 499 HTG',
    perks: 'Soutien régulier'
  },
  {
    id: 'grand_investisseur',
    name: 'Grand investisseur',
    emoji: '🚀',
    minAmount: 500,
    maxAmount: 999,
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    description: '500 HTG – 999 HTG',
    perks: 'Contribution notable'
  },
  {
    id: 'millionaire',
    name: 'Millionnaire',
    emoji: '💰',
    minAmount: 1000,
    maxAmount: 1499,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: '1 000 HTG – 1 499 HTG',
    perks: 'Pilier financier'
  },
  {
    id: 'milliardaire',
    name: 'Milliardaire',
    emoji: '💎',
    minAmount: 1500,
    maxAmount: 1999,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    description: '1 500 HTG – 1 999 HTG',
    perks: 'Soutien d\'envergure'
  },
  {
    id: 'billionaire',
    name: 'Billionaire',
    emoji: '👑',
    minAmount: 2000,
    maxAmount: 2999,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: '2 000 HTG – 2 999 HTG',
    perks: 'Générosité d\'exception'
  },
  {
    id: 'grand_contributeur',
    name: 'Grand contributeur',
    emoji: '🏆',
    minAmount: 3000,
    maxAmount: 4999,
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    description: '3 000 HTG – 4 999 HTG',
    perks: 'Impact déterminant'
  },
  {
    id: 'vip',
    name: 'VIP',
    emoji: '🌟',
    minAmount: 5000,
    maxAmount: 9999,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description: '5 000 HTG – 9 999 HTG',
    perks: 'Haut prestige'
  },
  {
    id: 'legend',
    name: 'Légende',
    emoji: '🔥',
    minAmount: 10000,
    maxAmount: Infinity,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    description: '10 000 HTG et plus',
    perks: 'Statut suprême de NS1'
  }
];

export function getGradeForAmount(amount: number): GradeTier | null {
  if (amount <= 0) {
    return null;
  }
  for (const tier of GRADE_TIERS) {
    if (amount >= tier.minAmount && amount <= tier.maxAmount) {
      return tier;
    }
  }
  return GRADE_TIERS[GRADE_TIERS.length - 1];
}

export function getNextGrade(amount: number): { nextGrade: GradeTier | null; remaining: number; progressPercent: number } {
  const current = getGradeForAmount(amount);
  if (!current) {
    const firstTier = GRADE_TIERS[0];
    return {
      nextGrade: firstTier,
      remaining: firstTier.minAmount - amount,
      progressPercent: 0
    };
  }

  const currentIndex = GRADE_TIERS.findIndex(t => t.id === current.id);
  const nextTier = GRADE_TIERS[currentIndex + 1] || null;

  if (!nextTier) {
    return { nextGrade: null, remaining: 0, progressPercent: 100 };
  }

  const span = nextTier.minAmount - current.minAmount;
  const currentProgress = amount - current.minAmount;
  const progressPercent = span > 0 ? Math.min(100, Math.max(0, Math.round((currentProgress / span) * 100))) : 0;
  const remaining = Math.max(0, nextTier.minAmount - amount);

  return { nextGrade: nextTier, remaining, progressPercent };
}

export function formatCurrency(amount: number): string {
  return `${amount} HTG`;
}
