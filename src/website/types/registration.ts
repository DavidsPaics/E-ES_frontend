// Types for competition registration form

export type AgeGroup = "U12" | "U16" | "U25" | "tautas";

export type MemberRole = "participant" | "team_leader" | "pilot" | "reserve_pilot";

export interface TeamMember {
  key: string; // unique key for React list
  fullName: string;
  dateOfBirth: string; // ISO date string
  educationalInstitution: string;
  phone: string;
  email: string;
  role: MemberRole;
  secondaryRole?: "pilot" | "reserve_pilot"; // For team_leader who is also pilot/reserve
  classOrYear?: string;
}

export interface ResponsiblePerson {
  fullName: string;
  phone: string;
  email: string;
  status: string; // teacher, parent, guardian, professor, etc.
}

export interface RegistrationFormData {
  // Section 1: General team info
  teamName: string;
  ageGroup: AgeGroup;
  institution?: string;
  cityOrRegion: string;

  // Section 2: Team members
  members: TeamMember[];

  // Section 3: Responsible person
  responsiblePerson: ResponsiblePerson;

  // Section 4: Additional info
  howHeardAbout?: string;
  comments?: string;

  // Section 5: Confirmations
  confirmTruthful: boolean;
  confirmRules: boolean;
  confirmMedia: boolean;
}

// Age limits for validation
export const AGE_GROUP_LIMITS: Record<AgeGroup, { maxAge: number | null; maxGrade: number | null }> = {
  U12: { maxAge: 12, maxGrade: 5 },
  U16: { maxAge: 16, maxGrade: 9 },
  U25: { maxAge: 25, maxGrade: null },
  tautas: { maxAge: null, maxGrade: null },
};

// Minimum team sizes per age group
export const MIN_TEAM_SIZE: Record<AgeGroup, number> = {
  U12: 2,
  U16: 4,
  U25: 4,
  tautas: 2,
};

// Required roles that must be present in a team
export const REQUIRED_ROLES: MemberRole[] = ["pilot", "reserve_pilot", "team_leader"];

// Helper to calculate age from date of birth
export function calculateAge(dateOfBirth: string, referenceDate: Date = new Date()): number {
  const birth = new Date(dateOfBirth);
  let age = referenceDate.getFullYear() - birth.getFullYear();
  const monthDiff = referenceDate.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Validate if a member's age fits the age group
export function isAgeValidForGroup(age: number, ageGroup: AgeGroup): boolean {
  const limit = AGE_GROUP_LIMITS[ageGroup];
  if (limit.maxAge === null) return true;
  return age <= limit.maxAge;
}

// Get the oldest member's age from the team
export function getOldestMemberAge(members: TeamMember[]): number {
  if (members.length === 0) return 0;
  return Math.max(...members.map((m) => calculateAge(m.dateOfBirth)));
}

// Determine the appropriate age group based on oldest member
export function determineAgeGroup(oldestAge: number): AgeGroup {
  if (oldestAge <= 12) return "U12";
  if (oldestAge <= 16) return "U16";
  if (oldestAge <= 25) return "U25";
  return "tautas";
}

// Check if team has all required roles
export function hasRequiredRoles(members: TeamMember[]): { valid: boolean; missing: MemberRole[] } {
  const presentRoles = new Set(members.map((m) => m.role));
  const missing = REQUIRED_ROLES.filter((role) => !presentRoles.has(role));
  return { valid: missing.length === 0, missing };
}

// Check if team meets minimum size requirement
export function meetsMinTeamSize(members: TeamMember[], ageGroup: AgeGroup): boolean {
  return members.length >= MIN_TEAM_SIZE[ageGroup];
}
