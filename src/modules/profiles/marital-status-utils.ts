/**
 * Marital Status Utilities
 * 
 * Provides functions to normalize and validate marital statuses
 * based on gender to ensure data consistency.
 */

// Gender-specific marital status lists (must match frontend constants)
export const FEMALE_MARITAL_STATUSES = [
  'عزباء',
  'مطلقة',
  'أرملة',
  'مطلقة - بدون أولاد',
  'مطلقة - مع أولاد',
  'منفصلة بدون طلاق',
  'أرملة - بدون أولاد',
  'أرملة - مع أولاد',
] as const;

export const MALE_MARITAL_STATUSES = [
  'أعزب',
  'مطلق',
  'أرمل',
  'مطلق - بدون أولاد',
  'مطلق - مع أولاد',
  'منفصل بدون طلاق',
  'أرمل - بدون أولاد',
  'أرمل - مع أولاد',
] as const;

/**
 * Normalize marital status based on profile gender
 * Fixes incorrect data where female profiles have male statuses or vice versa
 */
export function normalizeMaritalStatusForGender(
  status: string | undefined | null,
  profileGender: 'male' | 'female',
): string | undefined {
  if (!status || status === '') {
    return undefined;
  }

  // Mapping for gender-specific statuses (with and without children information)
  const statusMap: Record<string, { female: string; male: string }> = {
    'عزباء': { female: 'عزباء', male: 'أعزب' },
    'أعزب': { female: 'عزباء', male: 'أعزب' },
    'مطلقة': { female: 'مطلقة', male: 'مطلق' },
    'مطلق': { female: 'مطلقة', male: 'مطلق' },
    'أرملة': { female: 'أرملة', male: 'أرمل' },
    'أرمل': { female: 'أرملة', male: 'أرمل' },
    'مطلقة - بدون أولاد': { female: 'مطلقة - بدون أولاد', male: 'مطلق - بدون أولاد' },
    'مطلق - بدون أولاد': { female: 'مطلقة - بدون أولاد', male: 'مطلق - بدون أولاد' },
    'مطلقة - مع أولاد': { female: 'مطلقة - مع أولاد', male: 'مطلق - مع أولاد' },
    'مطلق - مع أولاد': { female: 'مطلقة - مع أولاد', male: 'مطلق - مع أولاد' },
    'منفصلة بدون طلاق': { female: 'منفصلة بدون طلاق', male: 'منفصل بدون طلاق' },
    'منفصل بدون طلاق': { female: 'منفصلة بدون طلاق', male: 'منفصل بدون طلاق' },
    'أرملة - بدون أولاد': { female: 'أرملة - بدون أولاد', male: 'أرمل - بدون أولاد' },
    'أرمل - بدون أولاد': { female: 'أرملة - بدون أولاد', male: 'أرمل - بدون أولاد' },
    'أرملة - مع أولاد': { female: 'أرملة - مع أولاد', male: 'أرمل - مع أولاد' },
    'أرمل - مع أولاد': { female: 'أرملة - مع أولاد', male: 'أرمل - مع أولاد' },
  };

  const mapped = statusMap[status];
  if (mapped) {
    return profileGender === 'female' ? mapped.female : mapped.male;
  }

  // If not in map, return as-is (might be valid)
  return status;
}

/**
 * Get gender-appropriate marital statuses for search
 * Returns only the statuses that match the target gender
 */
export function getMaritalStatusesForGender(
  targetGender: 'male' | 'female',
): readonly string[] {
  return targetGender === 'female' ? FEMALE_MARITAL_STATUSES : MALE_MARITAL_STATUSES;
}

/**
 * Check if a marital status is valid for a given gender
 */
export function isMaritalStatusValidForGender(
  status: string,
  gender: 'male' | 'female',
): boolean {
  const validStatuses = getMaritalStatusesForGender(gender);
  return validStatuses.includes(status as any);
}



