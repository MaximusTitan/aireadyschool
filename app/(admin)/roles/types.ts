export const ALLOWED_ROLES = ['Admin', 'Student', 'School', 'Teacher'] as const;
export type UserRole = typeof ALLOWED_ROLES[number];

export const USER_STATUSES = ['disabled', 'active'] as const;
export type UserStatus = typeof USER_STATUSES[number];

export interface Filters {
  roles: UserRole[];
  status: UserStatus[];
}

export const DEFAULT_FILTERS: Filters = {
  roles: [],
  status: [],
} as const;
