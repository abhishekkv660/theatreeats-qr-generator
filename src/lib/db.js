import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export async function getScreens() {
  const q = query(collection(db, 'screens'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getSeatsByScreen(screenId) {
  const q = query(collection(db, 'seats'), where('screenId', '==', screenId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
