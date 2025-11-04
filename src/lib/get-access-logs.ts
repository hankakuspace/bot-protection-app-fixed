// src/lib/get-access-logs.ts
import { collection, getDocs, getFirestore, query, orderBy } from 'firebase/firestore';
import { app } from '@/lib/firebase'; // ✅ 修正ポイント

export async function getAccessLogs() {
  const db = getFirestore(app);
  const logsRef = collection(db, 'access_logs');
  const q = query(logsRef, orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
