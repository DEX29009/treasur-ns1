export type UserRole = 'student' | 'committee';

export interface Student {
  id: string;
  name: string;
  totalContributed: number;
  contributionsCount: number;
  lastContributionDate?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  hasTarget: boolean;
  targetAmount?: number;
  deadline?: string;
  status?: 'active' | 'completed' | 'paid';
  paidAt?: string;
  paidAmount?: number;
  createdAt: string;
}

export interface Contribution {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  date: string;
  motif: string;
  paymentMethod: 'Espèces' | 'MonCash' | 'Natcash' | 'Virement';
  recordedBy: string;
  receiptNumber: string;
  projectId?: string;
  projectName?: string;
}

export interface Expense {
  id: string;
  amount: number;
  date: string;
  motif: string;
  category: 'Fournitures' | 'Pédagogique' | 'Événement' | 'Photocopies' | 'Entretien' | 'Urgence' | 'Autre';
  beneficiary?: string;
  authorizedBy: string;
  pinVerified: boolean;
  projectId?: string;
  projectName?: string;
}

export interface GradeTier {
  id: string;
  name: string;
  emoji: string;
  minAmount: number;
  maxAmount: number;
  badgeColor: string;
  description: string;
  perks: string;
}

export interface BackupSnapshot {
  id: string;
  timestamp: number;
  dateFormatted: string;
  label: string;
  studentsCount: number;
  contributionsCount: number;
  expensesCount: number;
  projectsCount: number;
  totalIn: number;
  totalOut: number;
  balance: number;
  data: {
    students: Student[];
    contributions: Contribution[];
    expenses: Expense[];
    projects: Project[];
  };
}
