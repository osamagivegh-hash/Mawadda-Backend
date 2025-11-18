/**
 * Unified Profile Constants for Backend
 * 
 * This file contains all selectable values for profiles.
 * Must match frontend/src/lib/profile-constants.ts exactly.
 */

export const GENDERS = ['male', 'female'] as const;
export type Gender = (typeof GENDERS)[number];

export const RELIGIONS = ['الإسلام', 'المسيحية', 'أخرى'] as const;
export type Religion = (typeof RELIGIONS)[number];

export const EDUCATION_LEVELS = [
  'غير متعلم',
  'ابتدائي',
  'متوسط',
  'ثانوي',
  'دبلوم',
  'بكالوريوس',
  'ماجستير',
  'دكتوراه',
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const OCCUPATIONS = [
  'طبيب',
  'ممرضة',
  'مهندس',
  'معلم',
  'مهندس برمجيات',
  'محاسب',
  'محامي',
  'مهندس مدني',
  'مهندس معماري',
  'مهندس كهرباء',
  'محاضر جامعي',
  'مدير مشاريع',
  'رائد أعمال',
  'ربة منزل',
  'طالب',
  'موظف حكومي',
  'موظف قطاع خاص',
  'أعمال حرة',
  'أخرى',
] as const;
export type Occupation = (typeof OCCUPATIONS)[number];

export const ALL_MARITAL_STATUSES = [
  'عزباء',
  'أعزب',
  'مطلقة',
  'مطلق',
  'أرملة',
  'أرمل',
  'مطلق - بدون أولاد',
  'مطلق - مع أولاد',
  'منفصل بدون طلاق',
  'أرمل - بدون أولاد',
  'أرمل - مع أولاد',
] as const;
export type MaritalStatus = (typeof ALL_MARITAL_STATUSES)[number];

export const RELIGIOSITY_LEVELS = [
  'منخفض',
  'متوسط',
  'ملتزم',
  'ملتزم جدا',
] as const;
export type ReligiosityLevel = (typeof RELIGIOSITY_LEVELS)[number];

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

