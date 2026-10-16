/**
 * CivicConnect admin script (runs on your computer with the Firebase Admin SDK,
 * which bypasses security rules — never ship the service account in the app).
 *
 *   npm run seed                          categories, departments + ~10 demo reports
 *   npm run seed -- --catalog-only        only categories + departments
 *   npm run set-role -- you@mail.com admin     make a user officer/admin/citizen
 *
 * Needs: serviceAccount.json in this folder (Firebase console → Project settings →
 * Service accounts → Generate new private key). Optional: Cloudinary values in
 * .env to upload the sample photos.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { geohashForLocation } from 'geofire-common';
import { defaultCategories, defaultDepartments } from '../src/constants/defaultCatalog';

const root = join(__dirname, '..');
try {
  process.loadEnvFile(join(root, '.env'));
} catch {
  /* .env optional for this script */
}

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || join(root, 'serviceAccount.json');
if (!existsSync(keyPath)) {
  console.error(`\n✖ Service account key not found at ${keyPath}\n  Firebase console → Project settings → Service accounts → Generate new private key,\n  save it as civicconnect-app/serviceAccount.json (it is git-ignored).\n`);
  process.exit(1);
}
initializeApp({ credential: cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
const db = getFirestore();

// ---------------------------------------------------------------- set-role
async function setRole(email: string, role: string) {
  if (!['citizen', 'officer', 'admin'].includes(role)) throw new Error('Role must be citizen, officer or admin');
  const user = await getAuth().getUserByEmail(email);
  const ref = db.doc(`users/${user.uid}`);
  if ((await ref.get()).exists) {
    await ref.update({ role });
  } else {
    // user signed up but never opened the app: create a full profile
    await ref.set({
      name: user.displayName ?? '',
      email: user.email ?? email,
      phone: '',
      role,
      language: 'en',
      textSize: 'default',
      notifyPush: true,
      notifySms: false,
      notifyEmail: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`✔ ${email} is now "${role}". They may need to close and reopen the app.`);
}

// ---------------------------------------------------------------- catalog
async function seedCatalog() {
  const batch = db.batch();
  defaultDepartments.forEach(({ id, ...d }) => batch.set(db.doc(`departments/${id}`), d));
  defaultCategories.forEach(({ id, ...c }) => batch.set(db.doc(`categories/${id}`), c));
  await batch.commit();
  console.log(`✔ ${defaultDepartments.length} departments, ${defaultCategories.length} categories`);
}

// ---------------------------------------------------------------- photos
async function uploadSample(file: string): Promise<string | null> {
  const cloud = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) return null;
  const form = new FormData();
  form.append('file', new Blob([readFileSync(join(__dirname, 'seed-images', file))], { type: 'image/jpeg' }), file);
  form.append('upload_preset', preset);
  form.append('folder', 'civicconnect/seed');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body: form });
  const json = (await res.json()) as { secure_url?: string; error?: { message: string } };
  if (!json.secure_url) {
    console.warn(`  ! photo upload failed (${json.error?.message}); continuing without it`);
    return null;
  }
  return json.secure_url;
}

// ---------------------------------------------------------------- reports
type Sample = {
  categoryId: string;
  lat: number;
  lng: number;
  address: string;
  area: string;
  description: string;
  status: 'submitted' | 'review' | 'assigned' | 'progress' | 'resolved' | 'rejected';
  severity: 'low' | 'medium' | 'high' | null;
  photo?: string;
  daysAgo: number;
  supporters: number;
  remarks?: Partial<Record<Sample['status'], string>>;
};

const samples: Sample[] = [
  { categoryId: 'pothole', lat: 6.9147, lng: 79.8536, address: 'Galle Road, Kollupitiya', area: 'Colombo', description: 'Large pothole near the bus stop causing traffic delays and vehicle damage.', status: 'progress', severity: 'high', photo: 'pothole.jpg', daysAgo: 6, supporters: 24, remarks: { review: 'Checked by the RDA Colombo team.', assigned: 'Assigned to RDA Colombo road maintenance unit.', progress: 'Crew scheduled for Thursday morning. One lane will be closed.' } },
  { categoryId: 'garbage-pile', lat: 6.8915, lng: 79.856, address: 'Marine Drive, Bambalapitiya', area: 'Colombo', description: 'Garbage has not been collected for over a week. Bad smell and stray dogs.', status: 'assigned', severity: 'medium', photo: 'garbage.jpg', daysAgo: 3, supporters: 11, remarks: { review: 'Verified with the ward office.', assigned: 'Sent to Colombo Municipal Council – Solid Waste Division.' } },
  { categoryId: 'streetlight', lat: 6.9344, lng: 79.8428, address: 'York Street, Fort', area: 'Colombo', description: 'Three streetlights in a row are not working. The road is very dark at night.', status: 'resolved', severity: 'medium', photo: 'streetlight.jpg', daysAgo: 12, supporters: 7, remarks: { review: 'Thank you, checking with CEB.', assigned: 'Assigned to CEB Colombo City.', progress: 'Bulbs and a faulty cable are being replaced.', resolved: 'All three lights replaced and tested.' } },
  { categoryId: 'blocked-drain', lat: 6.9147, lng: 79.877, address: 'Baseline Road, Borella', area: 'Colombo', description: 'Drain is blocked with plastic. Water overflows onto the road when it rains.', status: 'review', severity: 'high', photo: 'drain.jpg', daysAgo: 1, supporters: 5, remarks: { review: 'Our team will inspect the drain this week.' } },
  { categoryId: 'damaged-road', lat: 6.8742, lng: 79.8605, address: 'W A Silva Mawatha, Wellawatte', area: 'Colombo', description: 'Road edge has collapsed near the canal. Dangerous for motorbikes.', status: 'submitted', severity: 'high', photo: 'road-damage.jpg', daysAgo: 0, supporters: 2 },
  { categoryId: 'pothole', lat: 7.2906, lng: 80.6337, address: 'Dalada Veediya, Kandy', area: 'Kandy', description: 'Deep pothole in front of the temple entrance.', status: 'progress', severity: 'medium', photo: 'pothole.jpg', daysAgo: 9, supporters: 16, remarks: { review: 'Inspection done.', assigned: 'Assigned to Kandy Municipal Council roads unit.', progress: 'Patching work started today.' } },
  { categoryId: 'illegal-dumping', lat: 7.269, lng: 80.596, address: 'Peradeniya Road, Peradeniya', area: 'Kandy', description: 'People are dumping waste on the empty land next to the river.', status: 'submitted', severity: 'medium', photo: 'garbage.jpg', daysAgo: 2, supporters: 4 },
  { categoryId: 'public-toilet', lat: 7.2936, lng: 80.6413, address: 'Kandy Lake Round, Kandy', area: 'Kandy', description: 'Public toilet near the lake is locked all day.', status: 'rejected', severity: 'low', daysAgo: 15, supporters: 1, remarks: { review: 'Checking ownership.', rejected: 'This toilet is privately run by a hotel. Please contact the hotel management.' } },
  { categoryId: 'flooding', lat: 6.0329, lng: 80.2168, address: 'Main Street, Galle Fort', area: 'Galle', description: 'Street floods after every heavy rain; water enters shops.', status: 'assigned', severity: 'high', photo: 'drain.jpg', daysAgo: 4, supporters: 9, remarks: { review: 'Confirmed by Galle MC engineer.', assigned: 'Assigned to Galle Municipal Council drainage team.' } },
  { categoryId: 'streetlight', lat: 6.0535, lng: 80.221, address: 'Wakwella Road, Galle', area: 'Galle', description: 'Streetlight flickers on and off all night.', status: 'resolved', severity: 'low', photo: 'streetlight.jpg', daysAgo: 20, supporters: 3, remarks: { review: 'Received.', assigned: 'Assigned to CEB Galle.', progress: 'Technician visit scheduled.', resolved: 'Light fitting replaced.' } },
];

const flow: Sample['status'][] = ['submitted', 'review', 'assigned', 'progress', 'resolved'];

async function seedReports() {
  const counterRef = db.doc('counters/reports');
  let next = ((await counterRef.get()).data()?.next as number | undefined) ?? 1000;
  const photoCache = new Map<string, string | null>();

  for (const s of samples) {
    const cat = defaultCategories.find((c) => c.id === s.categoryId)!;
    if (s.photo && !photoCache.has(s.photo)) photoCache.set(s.photo, await uploadSample(s.photo));
    const url = s.photo ? photoCache.get(s.photo) : null;
    const id = `CC${next++}`;
    const created = new Date(Date.now() - s.daysAgo * 86_400_000 - 3 * 3_600_000);
    const fakeSupporters = Array.from({ length: s.supporters }, (_, i) => `seed-supporter-${i + 1}`);

    await db.doc(`reports/${id}`).set({
      reporterId: 'seed-demo-citizen',
      reporterName: 'Demo Citizen',
      isAnonymous: false,
      categoryId: cat.id,
      group: cat.group,
      description: s.description,
      severity: s.severity,
      seenAt: null,
      media: url ? [{ url, type: 'image' }] : [],
      location: { lat: s.lat, lng: s.lng, address: s.address },
      geohash: geohashForLocation([s.lat, s.lng]),
      area: s.area,
      status: s.status,
      departmentId: s.area === 'Kandy' && cat.departmentId === 'cmc' ? 'kmc' : s.area === 'Galle' && cat.departmentId === 'cmc' ? 'gmc' : cat.departmentId,
      supportCount: fakeSupporters.length,
      supporters: fakeSupporters,
      createdAt: Timestamp.fromDate(created),
      updatedAt: Timestamp.fromDate(new Date(created.getTime() + 86_400_000)),
      resolvedConfirmed: null,
    });

    // Timeline entries for each step reached (spaced a few hours apart).
    const steps = s.status === 'rejected' ? (['review', 'rejected'] as const) : flow.slice(1, flow.indexOf(s.status) + 1);
    let t = created.getTime();
    for (const step of steps) {
      t += 5 * 3_600_000;
      await db.collection(`reports/${id}/timeline`).add({
        status: step,
        remark: s.remarks?.[step] ?? '',
        byRole: 'officer',
        byName: 'Demo Officer',
        createdAt: Timestamp.fromMillis(Math.min(t, Date.now())),
      });
    }
    console.log(`  ${id}  ${cat.name_en.padEnd(20)} ${s.status.padEnd(9)} ${s.area}${url ? '  📷' : ''}`);
  }
  await counterRef.set({ next });
  console.log(`✔ ${samples.length} demo reports (next id: CC${next})`);
  if (![...photoCache.values()].some(Boolean)) console.log('  (no photos: add Cloudinary values to .env to include sample images)');
}

// ---------------------------------------------------------------- main
async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'set-role') {
    const [email, role] = args;
    if (!email || !role) throw new Error('Usage: npm run set-role -- user@mail.com officer|admin|citizen');
    return setRole(email, role);
  }
  await seedCatalog();
  if (!process.argv.includes('--catalog-only')) await seedReports();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('✖', e instanceof Error ? e.message : e);
    process.exit(1);
  });
