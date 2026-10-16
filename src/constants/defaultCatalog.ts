import type { Category, Department } from '@/types';

// Starting catalogue for Sri Lanka. Used by:
//  - scripts/seed.ts and the admin "Load default catalogue" button, and
//  - the app as a fallback while Firestore `categories` is empty/unreachable,
//    so the report flow works before the database is seeded.

// Demo contact details: hotlines 1987 (CEB) and 1939 (NWSDB) are public; the
// other phone numbers/emails are placeholders — confirm with each authority
// (or edit in Admin → Departments) before real use.
export const defaultDepartments: Department[] = [
  { id: 'rda', name: 'Road Development Authority', phone: '+94112862428', email: 'info@rda.gov.lk', area: 'National' },
  { id: 'cmc', name: 'Colombo Municipal Council', phone: '+94112684291', email: 'mc@colombo.mc.gov.lk', area: 'Colombo' },
  { id: 'kmc', name: 'Kandy Municipal Council', phone: '+94812222275', email: 'info@kandymc.lk', area: 'Kandy' },
  { id: 'gmc', name: 'Galle Municipal Council', phone: '+94912234210', email: 'info@gallemc.lk', area: 'Galle' },
  { id: 'nwsdb', name: 'National Water Supply & Drainage Board', phone: '1939', email: 'info@waterboard.lk', area: 'National' },
  { id: 'ceb', name: 'Ceylon Electricity Board', phone: '1987', email: 'info@ceb.lk', area: 'National' },
  { id: 'ds', name: 'Divisional Secretariat', phone: '+94112696211', email: 'info@moha.gov.lk', area: 'National' },
];

type Seed = Omit<Category, 'order'>;

const seeds: Seed[] = [
  // Roads & Transport
  { id: 'pothole', group: 'roads', name_en: 'Pothole', name_si: 'වළවල්', name_ta: 'குழி', subtitle_en: 'Holes or sunken patches in the road', subtitle_si: 'මාර්ගයේ වළවල් හෝ ගිලුණු ස්ථාන', subtitle_ta: 'சாலையில் குழிகள்', suggested: true, departmentId: 'rda', isEmergency: false },
  { id: 'damaged-road', group: 'roads', name_en: 'Damaged road or pavement', name_si: 'හානි වූ මාර්ගය හෝ පදික වේදිකාව', name_ta: 'சேதமடைந்த சாலை / நடைபாதை', subtitle_en: 'Cracks, broken kerbs, washed-out roads', departmentId: 'rda', isEmergency: false },
  { id: 'road-sign', group: 'roads', name_en: 'Broken sign or signal', name_si: 'කැඩුණු සංඥා', name_ta: 'உடைந்த அறிவிப்பு / சமிக்ஞை', subtitle_en: 'Traffic lights, road signs, crossings', departmentId: 'rda', isEmergency: false },
  // Waste & Cleanliness
  { id: 'garbage-pile', group: 'waste', name_en: 'Garbage pile', name_si: 'කසළ ගොඩ', name_ta: 'குப்பைக் குவியல்', subtitle_en: 'Rubbish left on the roadside or in public places', subtitle_si: 'මාර්ගය අසල කසළ', subtitle_ta: 'சாலையோரக் குப்பை', suggested: true, departmentId: 'cmc', isEmergency: false },
  { id: 'missed-collection', group: 'waste', name_en: 'Missed collection', name_si: 'කසළ එකතු නොකිරීම', name_ta: 'சேகரிக்கப்படாத குப்பை', subtitle_en: 'Garbage truck did not come', departmentId: 'cmc', isEmergency: false },
  { id: 'illegal-dumping', group: 'waste', name_en: 'Illegal dumping', name_si: 'නීති විරෝධී කසළ බැහැර කිරීම', name_ta: 'சட்டவிரோத குப்பைக் கொட்டல்', subtitle_en: 'Waste dumped in canals, empty land or forests', departmentId: 'cmc', isEmergency: false },
  // Water & Drainage
  { id: 'blocked-drain', group: 'drainage', name_en: 'Blocked drain', name_si: 'අවහිර වූ කාණුව', name_ta: 'அடைபட்ட வடிகால்', subtitle_en: 'Clogged drains, overflowing gutters', subtitle_si: 'අවහිර වූ කාණු', subtitle_ta: 'அடைபட்ட வடிகால்கள்', suggested: true, departmentId: 'cmc', isEmergency: false },
  { id: 'flooding', group: 'drainage', name_en: 'Flooding', name_si: 'ගංවතුර', name_ta: 'வெள்ளம்', subtitle_en: 'Water collecting on roads or homes', departmentId: 'cmc', isEmergency: false },
  { id: 'water-leak', group: 'drainage', name_en: 'Broken water pipe', name_si: 'කැඩුණු ජල නළය', name_ta: 'உடைந்த நீர்க் குழாய்', subtitle_en: 'Leaks, burst pipes, no water supply', departmentId: 'nwsdb', isEmergency: false },
  // Electricity & Streetlights
  { id: 'streetlight', group: 'electricity', name_en: 'Broken streetlight', name_si: 'කැඩුණු වීදි ලාම්පුව', name_ta: 'உடைந்த தெருவிளக்கு', subtitle_en: 'Light not working or flickering', subtitle_si: 'ලාම්පුව ක්‍රියා නොකරයි', subtitle_ta: 'விளக்கு எரியவில்லை', suggested: true, departmentId: 'ceb', isEmergency: false },
  { id: 'fallen-wire', group: 'electricity', name_en: 'Fallen power line', name_si: 'වැටුණු විදුලි රැහැන', name_ta: 'விழுந்த மின் கம்பி', subtitle_en: 'Danger — call CEB 1987 now', subtitle_si: 'අනතුරුදායකයි — ලංවිම 1987 අමතන්න', subtitle_ta: 'ஆபத்து — 1987 அழைக்கவும்', departmentId: 'ceb', isEmergency: true },
  { id: 'damaged-pole', group: 'electricity', name_en: 'Damaged pole', name_si: 'හානි වූ කණුව', name_ta: 'சேதமடைந்த கம்பம்', subtitle_en: 'Leaning or cracked electricity pole', departmentId: 'ceb', isEmergency: false },
  // Public Facilities
  { id: 'bus-stop', group: 'facilities', name_en: 'Bus stop', name_si: 'බස් නැවතුම', name_ta: 'பேருந்து நிறுத்தம்', subtitle_en: 'Damaged shelter, seating or signboard', departmentId: 'cmc', isEmergency: false },
  { id: 'park', group: 'facilities', name_en: 'Park or playground', name_si: 'උද්‍යානය හෝ ක්‍රීඩා පිටිය', name_ta: 'பூங்கா / விளையாட்டுத் திடல்', subtitle_en: 'Broken equipment, overgrown grass', departmentId: 'cmc', isEmergency: false },
  { id: 'public-toilet', group: 'facilities', name_en: 'Public toilet', name_si: 'පොදු වැසිකිළිය', name_ta: 'பொது கழிப்பறை', subtitle_en: 'Unclean, locked or broken', departmentId: 'cmc', isEmergency: false },
  // Other
  { id: 'other', group: 'other', name_en: 'Other', name_si: 'වෙනත්', name_ta: 'மற்றவை', subtitle_en: "Something that doesn't fit above — describe it", subtitle_si: 'විස්තර කරන්න', subtitle_ta: 'விவரிக்கவும்', departmentId: 'ds', isEmergency: false },
];

export const defaultCategories: Category[] = seeds.map((c, order) => ({ ...c, order }));
