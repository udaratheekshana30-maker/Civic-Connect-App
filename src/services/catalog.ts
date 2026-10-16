import { collection, deleteDoc, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { defaultCategories, defaultDepartments } from '@/constants/defaultCatalog';
import type { Category, Department } from '@/types';
import { db } from './firebase';

export async function fetchCategories(): Promise<Category[]> {
  const snap = await getDocs(collection(db, 'categories'));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Category, 'id'>), id: d.id })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function fetchDepartments(): Promise<Department[]> {
  const snap = await getDocs(collection(db, 'departments'));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Department, 'id'>), id: d.id })).sort((a, b) => a.name.localeCompare(b.name));
}

// --- admin only (enforced by firestore.rules) ---

export const saveCategory = ({ id, ...data }: Category) => setDoc(doc(db, 'categories', id), data);
export const deleteCategory = (id: string) => deleteDoc(doc(db, 'categories', id));
export const saveDepartment = ({ id, ...data }: Department) => setDoc(doc(db, 'departments', id), data);
export const deleteDepartment = (id: string) => deleteDoc(doc(db, 'departments', id));

/** Writes the built-in Sri Lankan catalogue (merges; existing ids are overwritten). */
export async function loadDefaultCatalog() {
  const batch = writeBatch(db);
  defaultDepartments.forEach(({ id, ...d }) => batch.set(doc(db, 'departments', id), d));
  defaultCategories.forEach(({ id, ...c }) => batch.set(doc(db, 'categories', id), c));
  await batch.commit();
}
