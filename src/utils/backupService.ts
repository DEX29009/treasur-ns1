import { Student, Contribution, Expense, Project, BackupSnapshot } from '../types';
import { getInitialStudents } from '../data/studentsData';

const CACHE_KEY = 'tresorerie_ns1_live_cache_v4';
const SNAPSHOTS_KEY = 'tresorerie_ns1_backup_snapshots_v4';

export function saveLocalBackup(
  students: Student[],
  contributions: Contribution[],
  expenses: Expense[],
  projects: Project[],
  label: string = 'Automatique'
): BackupSnapshot | null {
  try {
    const totalIn = contributions.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const totalOut = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const balance = totalIn - totalOut;

    const payload = {
      students,
      contributions,
      expenses,
      projects,
      updatedAt: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));

    // Only create a persistent snapshot if there is meaningful data or explicit action
    if (contributions.length > 0 || expenses.length > 0 || label !== 'Automatique') {
      const now = new Date();
      const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} à ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const newSnapshot: BackupSnapshot = {
        id: `snap-${Date.now()}`,
        timestamp: Date.now(),
        dateFormatted,
        label,
        studentsCount: students.length,
        contributionsCount: contributions.length,
        expensesCount: expenses.length,
        projectsCount: projects.length,
        totalIn,
        totalOut,
        balance,
        data: {
          students,
          contributions,
          expenses,
          projects
        }
      };

      const existingRaw = localStorage.getItem(SNAPSHOTS_KEY);
      const snapshots: BackupSnapshot[] = existingRaw ? JSON.parse(existingRaw) : [];

      // Avoid duplicate consecutive snapshots if numbers haven't changed
      const last = snapshots[0];
      if (
        last &&
        last.contributionsCount === contributions.length &&
        last.expensesCount === expenses.length &&
        last.projectsCount === projects.length &&
        last.balance === balance &&
        label === 'Automatique'
      ) {
        return last;
      }

      const updated = [newSnapshot, ...snapshots].slice(0, 10);
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
      return newSnapshot;
    }
    return null;
  } catch (err) {
    console.error('Failed to save local backup:', err);
    return null;
  }
}

export function loadLocalCache(): {
  students: Student[];
  contributions: Contribution[];
  expenses: Expense[];
  projects: Project[];
} {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.students) && parsed.students.length > 0) {
        return {
          students: parsed.students,
          contributions: Array.isArray(parsed.contributions) ? parsed.contributions : [],
          expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
          projects: Array.isArray(parsed.projects) ? parsed.projects : []
        };
      }
    }
  } catch (err) {
    console.error('Failed to read local cache:', err);
  }

  return {
    students: getInitialStudents(),
    contributions: [],
    expenses: [],
    projects: []
  };
}

export function getBackupSnapshots(): BackupSnapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function deleteBackupSnapshot(snapshotId: string): BackupSnapshot[] {
  try {
    const existing = getBackupSnapshots();
    const updated = existing.filter(s => s.id !== snapshotId);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function exportBackupToFile(
  students: Student[],
  contributions: Contribution[],
  expenses: Expense[],
  projects: Project[]
) {
  const totalIn = contributions.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const totalOut = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const backupData = {
    version: '2.0',
    title: 'Sauvegarde Trésorerie Classe NS1',
    exportedAt: now.toISOString(),
    stats: {
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
      contributionsCount: contributions.length,
      expensesCount: expenses.length,
      projectsCount: projects.length,
      studentsCount: students.length
    },
    students,
    contributions,
    expenses,
    projects
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sauvegarde-tresorerie-ns1-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseBackupFile(file: File): Promise<{
  students: Student[];
  contributions: Contribution[];
  expenses: Expense[];
  projects: Project[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);

        if (!json.students || !Array.isArray(json.students)) {
          throw new Error('Le fichier de sauvegarde est invalide (liste des élèves introuvable).');
        }

        resolve({
          students: json.students,
          contributions: Array.isArray(json.contributions) ? json.contributions : [],
          expenses: Array.isArray(json.expenses) ? json.expenses : [],
          projects: Array.isArray(json.projects) ? json.projects : []
        });
      } catch (err: any) {
        reject(new Error(err.message || 'Impossible de lire le fichier de sauvegarde.'));
      }
    };
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier.'));
    reader.readAsText(file);
  });
}
