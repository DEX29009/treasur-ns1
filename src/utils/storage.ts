import { Student, Contribution, Expense, Project } from '../types';
import { getInitialStudents, INITIAL_CONTRIBUTIONS, INITIAL_EXPENSES } from '../data/studentsData';

const STORAGE_KEYS = {
  STUDENTS: 'tresorerie_ns1_students_zero_v2',
  CONTRIBUTIONS: 'tresorerie_ns1_contributions_zero_v2',
  EXPENSES: 'tresorerie_ns1_expenses_zero_v2',
  PROJECTS: 'tresorerie_ns1_projects_v1',
  ROLE: 'tresorerie_ns1_role_v1'
};

export const COMMITTEE_PASSWORD = 'comité20262027';
export const EXPENSE_PIN = '29009';

export function verifyCommitteePassword(input: string): boolean {
  const normalized = input.trim().toLowerCase();
  return normalized === 'comité20262027' || normalized === 'comite20262027';
}

export function verifyExpensePin(input: string): boolean {
  return input.trim() === EXPENSE_PIN;
}

export function loadStoredStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) return getInitialStudents();
    return JSON.parse(raw);
  } catch {
    return getInitialStudents();
  }
}

export function loadStoredContributions(): Contribution[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTRIBUTIONS);
    if (!raw) return INITIAL_CONTRIBUTIONS;
    return JSON.parse(raw);
  } catch {
    return INITIAL_CONTRIBUTIONS;
  }
}

export function loadStoredExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) return INITIAL_EXPENSES;
    return JSON.parse(raw);
  } catch {
    return INITIAL_EXPENSES;
  }
}

export function loadStoredProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveState(
  students: Student[], 
  contributions: Contribution[], 
  expenses: Expense[], 
  projects: Project[]
) {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    localStorage.setItem(STORAGE_KEYS.CONTRIBUTIONS, JSON.stringify(contributions));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function recalculateStudentsFromContributions(students: Student[], contributions: Contribution[]): Student[] {
  return students.map(student => {
    const studentContributions = contributions.filter(c => c.studentId === student.id);
    const total = studentContributions.reduce((sum, c) => sum + c.amount, 0);
    const lastDate = studentContributions.length > 0 
      ? [...studentContributions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
      : undefined;

    return {
      ...student,
      totalContributed: total,
      contributionsCount: studentContributions.length,
      lastContributionDate: lastDate
    };
  });
}
