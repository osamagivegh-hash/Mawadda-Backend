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
  'مطلق - بدون أولاد',
  'مطلق - مع أولاد',
  'منفصل بدون طلاق',
  'أرمل - بدون أولاد',
  'أرمل - مع أولاد',
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

  // Gender-neutral statuses (with children info) - keep as-is
  if (
    status.includes('بدون أولاد') ||
    status.includes('مع أولاد') ||
    status.includes('منفصل')
  ) {
    return status;
  }

  // Mapping for gender-specific statuses
  const statusMap: Record<string, { female: string; male: string }> = {
    'عزباء': { female: 'عزباء', male: 'أعزب' },
    'أعزب': { female: 'عزباء', male: 'أعزب' },
    'مطلقة': { female: 'مطلقة', male: 'مطلق' },
    'مطلق': { female: 'مطلقة', male: 'مطلق' },
    'أرملة': { female: 'أرملة', male: 'أرمل' },
    'أرمل': { female: 'أرملة', male: 'أرمل' },
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

