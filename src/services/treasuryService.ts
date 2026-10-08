import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Student, Contribution, Expense, Project } from '../types';
import { getInitialStudents } from '../data/studentsData';

const STUDENTS_COL = 'students';
const CONTRIBUTIONS_COL = 'contributions';
const EXPENSES_COL = 'expenses';
const PROJECTS_COL = 'projects';

// Utility: removes any undefined fields before saving to Firestore
function cleanData<T extends Record<string, any>>(obj: T): any {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

// Subscribe in real-time to students
export function subscribeToStudents(callback: (students: Student[]) => void) {
  const colRef = collection(db, STUDENTS_COL);
  return onSnapshot(colRef, async (snapshot) => {
    if (snapshot.empty) {
      // First time initialization: Seed the 38 students with 0 HTG
      const initial = getInitialStudents();
      const batch = writeBatch(db);
      for (const s of initial) {
        batch.set(doc(db, STUDENTS_COL, s.id), cleanData(s));
      }
      await batch.commit();
      callback(initial);
    } else {
      const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Student));
      callback(list);
    }
  }, (err) => {
    console.error('Error subscribing to students:', err);
    callback(getInitialStudents());
  });
}

// Subscribe in real-time to contributions
export function subscribeToContributions(callback: (contributions: Contribution[]) => void) {
  const q = query(collection(db, CONTRIBUTIONS_COL));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Contribution));
    // Sort descending by timestamp/id
    list.sort((a, b) => b.id.localeCompare(a.id));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to contributions:', err);
    callback([]);
  });
}

// Subscribe in real-time to expenses
export function subscribeToExpenses(callback: (expenses: Expense[]) => void) {
  const q = query(collection(db, EXPENSES_COL));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Expense));
    list.sort((a, b) => b.id.localeCompare(a.id));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to expenses:', err);
    callback([]);
  });
}

// Subscribe in real-time to projects
export function subscribeToProjects(callback: (projects: Project[]) => void) {
  const q = query(collection(db, PROJECTS_COL));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Project));
    list.sort((a, b) => b.id.localeCompare(a.id));
    callback(list);
  }, (err) => {
    console.error('Error subscribing to projects:', err);
    callback([]);
  });
}

// Add a contribution and update student total in Firestore
export async function addContributionToDB(
  contribution: Omit<Contribution, 'id'>, 
  currentStudent: Student
) {
  const newRef = doc(collection(db, CONTRIBUTIONS_COL));
  const newContribution: Contribution = {
    ...contribution,
    id: newRef.id
  };
  await setDoc(newRef, cleanData(newContribution));

  // Update student in Firestore
  const updatedStudent: Student = {
    ...currentStudent,
    totalContributed: currentStudent.totalContributed + contribution.amount,
    contributionsCount: currentStudent.contributionsCount + 1,
    lastContributionDate: contribution.date
  };
  await setDoc(doc(db, STUDENTS_COL, currentStudent.id), cleanData(updatedStudent), { merge: true });
}

// Add an expense to Firestore
export async function addExpenseToDB(expense: Omit<Expense, 'id'>) {
  const newRef = doc(collection(db, EXPENSES_COL));
  const newExpense: Expense = {
    ...expense,
    id: newRef.id
  };
  await setDoc(newRef, cleanData(newExpense));
}

// Add a project to Firestore
export async function addProjectToDB(project: Omit<Project, 'id'>) {
  const newRef = doc(collection(db, PROJECTS_COL));
  const newProject: Project = {
    ...project,
    id: newRef.id
  };
  await setDoc(newRef, cleanData(newProject));
}

// Delete a project from Firestore
export async function deleteProjectFromDB(projectId: string) {
  await deleteDoc(doc(db, PROJECTS_COL, projectId));
}

// Reset EVERYTHING to 0 in Firestore across all devices!
export async function resetAllDataInDB() {
  const batch = writeBatch(db);

  // 1. Reset all 38 students to 0
  const initialStudents = getInitialStudents();
  for (const s of initialStudents) {
    batch.set(doc(db, STUDENTS_COL, s.id), cleanData(s));
  }

  // 2. Clear all contributions
  const contribSnap = await getDocs(collection(db, CONTRIBUTIONS_COL));
  contribSnap.forEach(d => batch.delete(d.ref));

  // 3. Clear all expenses
  const expSnap = await getDocs(collection(db, EXPENSES_COL));
  expSnap.forEach(d => batch.delete(d.ref));

  // 4. Clear all projects
  const projSnap = await getDocs(collection(db, PROJECTS_COL));
  projSnap.forEach(d => batch.delete(d.ref));

  await batch.commit();

  // Also clear any localStorage cache
  localStorage.clear();
}
