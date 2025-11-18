export const GENDERS = ['male', 'female'] as const;
export type Gender = (typeof GENDERS)[number];

export const RELIGIONS = ['الإسلام', 'المسيحية', 'أخرى'] as const;
export type Religion = (typeof RELIGIONS)[number];

export const RELIGIOSITY_LEVELS = [
  'منخفض',
  'متوسط',
  'ملتزم',
  'ملتزم جدا',
] as const;
export type ReligiosityLevel = (typeof RELIGIOSITY_LEVELS)[number];

export const MARITAL_STATUSES = [
  'أعزب',
  'مطلق - بدون أولاد',
  'مطلق - مع أولاد',
  'منفصل بدون طلاق',
  'أرمل - بدون أولاد',
  'أرمل - مع أولاد',
] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

export const MARRIAGE_TYPES = [
  'زواج تقليدي',
  'زواج بشروط خاصة',
] as const;
export type MarriageType = (typeof MARRIAGE_TYPES)[number];

export const POLYGAMY_OPTIONS = [
  'اقبل بالتعدد',
  'لا اقبل بالتعدد',
  'حسب الظروف',
] as const;
export type PolygamyOption = (typeof POLYGAMY_OPTIONS)[number];

export const COMPATIBILITY_OPTIONS = ['نعم', 'لا'] as const;
export type CompatibilityOption = (typeof COMPATIBILITY_OPTIONS)[number];


