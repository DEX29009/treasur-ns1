import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { getInitialStudents } from '../src/data/studentsData';

async function resetAll() {
  console.log('Connecting to Firestore...');
  const app = initializeApp({
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId,
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
  });

  const db = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

  console.log('Resetting Firestore collections...');

  // 1. Reset all 38 students to 0
  const initialStudents = getInitialStudents();
  const batch1 = writeBatch(db);
  for (const s of initialStudents) {
    batch1.set(doc(db, 'students', s.id), {
      id: s.id,
      name: s.name,
      totalContributed: 0,
      contributionsCount: 0
    });
  }
  await batch1.commit();
  console.log('Students reset to 0.');

  // 2. Delete all contributions
  const contribSnap = await getDocs(collection(db, 'contributions'));
  console.log(`Found ${contribSnap.size} contributions to delete.`);
  const batch2 = writeBatch(db);
  contribSnap.forEach(d => batch2.delete(d.ref));
  if (contribSnap.size > 0) {
    await batch2.commit();
  }

  // 3. Delete all expenses
  const expSnap = await getDocs(collection(db, 'expenses'));
  console.log(`Found ${expSnap.size} expenses to delete.`);
  const batch3 = writeBatch(db);
  expSnap.forEach(d => batch3.delete(d.ref));
  if (expSnap.size > 0) {
    await batch3.commit();
  }

  // 4. Delete all projects
  const projSnap = await getDocs(collection(db, 'projects'));
  console.log(`Found ${projSnap.size} projects to delete.`);
  const batch4 = writeBatch(db);
  projSnap.forEach(d => batch4.delete(d.ref));
  if (projSnap.size > 0) {
    await batch4.commit();
  }

  console.log('Reset completed successfully!');
  process.exit(0);
}

resetAll().catch(err => {
  console.error('Reset failed:', err);
  process.exit(1);
});
