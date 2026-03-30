export type UserRole =
  | "participant"
  | "team_leader"
  | "supervisor"
  | "admin"
  | "super_admin";

export interface UserProfile {
  name: string;
  school: string;
  grade: string;
  phone: string;
  email: string;
  profilePicture: string;
  aboutMe: string;
}

export interface VehicleDocument {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface TeamRecord {
  id: string;
  name: string;
  description: string;
  profilePicture: string;
  vehicleDescription: string;
  vehiclePictures: string[];
  vehicleDocuments: VehicleDocument[];
  memberIds: string[];
}

export interface UserRecord {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  teamId?: string;
  profile: UserProfile;
}

export type PublicUserRecord = Omit<UserRecord, "password">;

export interface UpdateUserInput {
  username?: string;
  role?: UserRole;
  teamId?: string | null;
  profile?: Partial<UserProfile>;
}

export interface CreateUserInput {
  username: string;
  password: string;
  role?: UserRole;
  teamId?: string;
  inviteCode?: string;
  profile?: Partial<UserProfile>;
}

export interface TeamInviteRecord {
  id: string;
  teamId: string;
  code: string;
  createdByUserId: string;
  createdAt: string;
  usedByUserId?: string;
  usedAt?: string;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  profilePicture?: string;
  vehicleDescription?: string;
  vehiclePictures?: string[];
  vehicleDocuments?: VehicleDocument[];
}

const USERS_KEY = "ees_cabinet_users_v1";
const TEAMS_KEY = "ees_cabinet_teams_v1";
const TEAM_INVITES_KEY = "ees_cabinet_team_invites_v1";

const seedTeams: TeamRecord[] = [
  {
    id: "team-voltfalcons",
    name: "Volt Falcons",
    description: "Student team focused on efficiency and clean engineering solutions.",
    profilePicture: "",
    vehicleDescription: "Lightweight prototype EV with brushless motor and telemetry.",
    vehiclePictures: [],
    vehicleDocuments: [],
    memberIds: ["user-leader", "user-supervisor", "user-participant-1", "user-participant-2"],
  },
  {
    id: "team-ecospark",
    name: "EcoSpark",
    description: "Technical school team experimenting with regenerative braking setup.",
    profilePicture: "",
    vehicleDescription: "Second-gen EV platform optimized for urban maneuverability.",
    vehiclePictures: [],
    vehicleDocuments: [],
    memberIds: ["user-leader-2", "user-participant-3"],
  },
];

const seedUsers: UserRecord[] = [
  {
    id: "user-participant-1",
    username: "participant1",
    password: "participant1",
    role: "participant",
    teamId: "team-voltfalcons",
    profile: {
      name: "Markuss Berzins",
      school: "Riga State Gymnasium No. 1",
      grade: "Grade 9",
      phone: "+371 22000001",
      email: "markuss.berzins@example.com",
      profilePicture: "",
      aboutMe: "I like EV design and race strategy.",
    },
  },
  {
    id: "user-participant-2",
    username: "participant2",
    password: "participant2",
    role: "participant",
    teamId: "team-voltfalcons",
    profile: {
      name: "Anna Liepa",
      school: "Riga State Gymnasium No. 1",
      grade: "Grade 9",
      phone: "+371 22000002",
      email: "anna.liepa@example.com",
      profilePicture: "",
      aboutMe: "Reserve pilot and documentation support.",
    },
  },
  {
    id: "user-participant-3",
    username: "participant3",
    password: "participant3",
    role: "participant",
    teamId: "team-ecospark",
    profile: {
      name: "Santa Lapsa",
      school: "Jelgava Technical School",
      grade: "Year 1",
      phone: "+371 22000104",
      email: "santa.lapsa@example.com",
      profilePicture: "",
      aboutMe: "Battery management and optimization.",
    },
  },
  {
    id: "user-leader",
    username: "leader1",
    password: "leader1",
    role: "team_leader",
    teamId: "team-voltfalcons",
    profile: {
      name: "Rihards Ozols",
      school: "Riga State Gymnasium No. 1",
      grade: "Grade 9",
      phone: "+371 22000003",
      email: "rihards.ozols@example.com",
      profilePicture: "",
      aboutMe: "Team lead and vehicle assembly coordinator.",
    },
  },
  {
    id: "user-leader-2",
    username: "leader2",
    password: "leader2",
    role: "team_leader",
    teamId: "team-ecospark",
    profile: {
      name: "Edgars Auzins",
      school: "Jelgava Technical School",
      grade: "Year 2",
      phone: "+371 22000101",
      email: "edgars.auzins@example.com",
      profilePicture: "",
      aboutMe: "Team lead and drivetrain engineer.",
    },
  },
  {
    id: "user-supervisor",
    username: "supervisor1",
    password: "supervisor1",
    role: "supervisor",
    teamId: "team-voltfalcons",
    profile: {
      name: "Ilze Ozola",
      school: "Riga State Gymnasium No. 1",
      grade: "",
      phone: "+371 20001001",
      email: "coach@voltfalcons.lv",
      profilePicture: "",
      aboutMe: "Supervisor and safety reviewer.",
    },
  },
  {
    id: "user-admin",
    username: "referee1",
    password: "referee1",
    role: "admin",
    profile: {
      name: "Janis Ref",
      school: "",
      grade: "",
      phone: "+371 25000001",
      email: "referee@example.com",
      profilePicture: "",
      aboutMe: "Track referee and race control.",
    },
  },
  {
    id: "user-super-admin",
    username: "superadmin",
    password: "superadmin",
    role: "super_admin",
    profile: {
      name: "System Admin",
      school: "",
      grade: "",
      phone: "+371 29999999",
      email: "superadmin@example.com",
      profilePicture: "",
      aboutMe: "Global platform administrator.",
    },
  },
  {
    id: "user-legacy-a",
    username: "a",
    password: "b",
    role: "super_admin",
    profile: {
      name: "Legacy Admin",
      school: "",
      grade: "",
      phone: "",
      email: "",
      profilePicture: "",
      aboutMe: "",
    },
  },
];

const seedTeamInvites: TeamInviteRecord[] = [];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return clone(fallback);
    return JSON.parse(raw) as T;
  } catch {
    return clone(fallback);
  }
}

function writeJson<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function normalizeInviteCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function compactInviteCode(code: string): string {
  return normalizeInviteCode(code);
}

function toDisplayInviteCode(compact: string): string {
  if (compact.length <= 4) return compact;
  return `${compact.slice(0, 4)}-${compact.slice(4, 8)}`;
}

function makeInviteCode(existingCodes: Set<string>): string {
  while (true) {
    const compact = Math.random().toString(36).slice(2, 10).toUpperCase();
    if (compact.length !== 8) continue;
    if (existingCodes.has(compact)) continue;
    return toDisplayInviteCode(compact);
  }
}

function sanitizeMembership(users: UserRecord[], teams: TeamRecord[]): void {
  const teamMap = new Map<string, TeamRecord>(teams.map((team) => [team.id, team]));

  for (const team of teams) {
    team.memberIds = Array.from(new Set(team.memberIds)).filter((memberId) =>
      users.some((user) => user.id === memberId)
    );
  }

  for (const user of users) {
    if (!user.teamId) continue;
    const team = teamMap.get(user.teamId);
    if (!team) {
      delete user.teamId;
      continue;
    }
    if (!team.memberIds.includes(user.id)) team.memberIds.push(user.id);
  }
}

export function ensureCabinetSeeded(): void {
  const existingUsers = localStorage.getItem(USERS_KEY);
  const existingTeams = localStorage.getItem(TEAMS_KEY);
  const existingInvites = localStorage.getItem(TEAM_INVITES_KEY);
  if (!existingUsers) writeJson(USERS_KEY, seedUsers);
  if (!existingTeams) writeJson(TEAMS_KEY, seedTeams);
  if (!existingInvites) writeJson(TEAM_INVITES_KEY, seedTeamInvites);
}

function readState(): {
  users: UserRecord[];
  teams: TeamRecord[];
  teamInvites: TeamInviteRecord[];
} {
  ensureCabinetSeeded();
  const users = readJson<UserRecord[]>(USERS_KEY, seedUsers);
  const teams = readJson<TeamRecord[]>(TEAMS_KEY, seedTeams);
  const teamInvites = readJson<TeamInviteRecord[]>(TEAM_INVITES_KEY, seedTeamInvites)
    .filter((invite) => teams.some((team) => team.id === invite.teamId))
    .map((invite) => ({
      ...invite,
      code: toDisplayInviteCode(compactInviteCode(invite.code)),
    }));
  sanitizeMembership(users, teams);
  return { users, teams, teamInvites };
}

function writeState(users: UserRecord[], teams: TeamRecord[], teamInvites: TeamInviteRecord[]): void {
  sanitizeMembership(users, teams);
  writeJson(USERS_KEY, users);
  writeJson(TEAMS_KEY, teams);
  writeJson(TEAM_INVITES_KEY, teamInvites);
}

function toPublicUser(user: UserRecord): PublicUserRecord {
  const { password: _password, ...publicUser } = user;
  return publicUser;
}

export function getAllUsers(): PublicUserRecord[] {
  const { users } = readState();
  return users.map(toPublicUser);
}

export function getPrivateUserById(userId: string): UserRecord | null {
  const { users } = readState();
  const user = users.find((item) => item.id === userId);
  return user ? clone(user) : null;
}

export function getUserById(userId: string): PublicUserRecord | null {
  const user = getPrivateUserById(userId);
  return user ? toPublicUser(user) : null;
}

export function getUsersByTeam(teamId: string): PublicUserRecord[] {
  const { users } = readState();
  return users.filter((user) => user.teamId === teamId).map(toPublicUser);
}

export function getAllTeams(): TeamRecord[] {
  const { teams } = readState();
  return clone(teams);
}

export function getTeamById(teamId: string): TeamRecord | null {
  const { teams } = readState();
  const team = teams.find((item) => item.id === teamId);
  return team ? clone(team) : null;
}

export function findUserByCredentials(username: string, password: string): UserRecord | null {
  const { users } = readState();
  const user = users.find((item) => item.username === username && item.password === password);
  return user ? clone(user) : null;
}

function canManageTeamInvites(user: UserRecord, teamId: string): boolean {
  if (user.role === "super_admin") return true;
  if (user.role !== "team_leader" && user.role !== "supervisor") return false;
  return user.teamId === teamId;
}

export function getTeamInvites(teamId: string): TeamInviteRecord[] {
  const { teamInvites } = readState();
  return clone(
    teamInvites
      .filter((invite) => invite.teamId === teamId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export function createTeamInvite(teamId: string, createdByUserId: string): TeamInviteRecord {
  const { users, teams, teamInvites } = readState();
  const team = teams.find((item) => item.id === teamId);
  if (!team) throw new Error("Team not found");

  const creator = users.find((item) => item.id === createdByUserId);
  if (!creator) throw new Error("User not found");
  if (!canManageTeamInvites(creator, teamId)) {
    throw new Error("Invite creation is not allowed");
  }

  const existingCodes = new Set(teamInvites.map((invite) => compactInviteCode(invite.code)));
  const invite: TeamInviteRecord = {
    id: `invite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    teamId,
    code: makeInviteCode(existingCodes),
    createdByUserId,
    createdAt: new Date().toISOString(),
  };

  teamInvites.push(invite);
  writeState(users, teams, teamInvites);
  return clone(invite);
}

export function revokeTeamInvite(inviteId: string, requestedByUserId: string): void {
  const { users, teams, teamInvites } = readState();
  const invite = teamInvites.find((item) => item.id === inviteId);
  if (!invite) throw new Error("Invite not found");

  const actor = users.find((item) => item.id === requestedByUserId);
  if (!actor) throw new Error("User not found");
  if (!canManageTeamInvites(actor, invite.teamId)) {
    throw new Error("Invite revocation is not allowed");
  }

  const nextInvites = teamInvites.filter((item) => item.id !== inviteId);
  writeState(users, teams, nextInvites);
}

export function createUser(input: CreateUserInput): PublicUserRecord {
  const { users, teams, teamInvites } = readState();

  const username = input.username.trim();
  const password = input.password.trim();
  if (!username) throw new Error("Username is required");
  if (!password) throw new Error("Password is required");

  const usernameTaken = users.some((candidate) => candidate.username.toLowerCase() === username.toLowerCase());
  if (usernameTaken) throw new Error("Username already in use");

  let resolvedTeamId = input.teamId;
  let inviteToUse: TeamInviteRecord | null = null;
  const inviteCode = input.inviteCode?.trim();
  if (inviteCode) {
    inviteToUse =
      teamInvites.find((invite) => compactInviteCode(invite.code) === compactInviteCode(inviteCode)) || null;
    if (!inviteToUse) throw new Error("Invite code is invalid");
    if (inviteToUse.usedByUserId) throw new Error("Invite code is already used");
    if (resolvedTeamId && resolvedTeamId !== inviteToUse.teamId) {
      throw new Error("Invite code does not match selected team");
    }
    resolvedTeamId = inviteToUse.teamId;
  }

  if (resolvedTeamId && !teams.some((team) => team.id === resolvedTeamId)) {
    throw new Error("Team not found");
  }

  const profile: UserProfile = {
    name: input.profile?.name?.trim() || username,
    school: input.profile?.school?.trim() || "",
    grade: input.profile?.grade?.trim() || "",
    phone: input.profile?.phone?.trim() || "",
    email: input.profile?.email?.trim() || "",
    profilePicture: input.profile?.profilePicture?.trim() || "",
    aboutMe: input.profile?.aboutMe?.trim() || "",
  };

  const generatedId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const user: UserRecord = {
    id: generatedId,
    username,
    password,
    role: input.role ?? "participant",
    profile,
    ...(resolvedTeamId ? { teamId: resolvedTeamId } : {}),
  };

  users.push(user);
  if (resolvedTeamId) {
    const team = teams.find((item) => item.id === resolvedTeamId);
    if (team && !team.memberIds.includes(user.id)) {
      team.memberIds.push(user.id);
    }
  }

  if (inviteToUse) {
    inviteToUse.usedByUserId = user.id;
    inviteToUse.usedAt = new Date().toISOString();
  }

  writeState(users, teams, teamInvites);
  return toPublicUser(user);
}

export function updateUser(userId: string, input: UpdateUserInput): PublicUserRecord {
  const { users, teams, teamInvites } = readState();
  const user = users.find((item) => item.id === userId);
  if (!user) throw new Error("User not found");

  if (input.username && input.username !== user.username) {
    const usernameTaken = users.some(
      (candidate) => candidate.id !== userId && candidate.username.toLowerCase() === input.username!.toLowerCase()
    );
    if (usernameTaken) throw new Error("Username already in use");
    user.username = input.username;
  }

  if (input.role) user.role = input.role;
  if (input.profile) user.profile = { ...user.profile, ...input.profile };

  if (Object.prototype.hasOwnProperty.call(input, "teamId")) {
    const previousTeamId = user.teamId;
    const nextTeamId = input.teamId || undefined;

    if (nextTeamId && !teams.some((team) => team.id === nextTeamId)) {
      throw new Error("Team not found");
    }

    if (previousTeamId) {
      const previousTeam = teams.find((team) => team.id === previousTeamId);
      if (previousTeam) previousTeam.memberIds = previousTeam.memberIds.filter((id) => id !== user.id);
    }

    if (nextTeamId) {
      const nextTeam = teams.find((team) => team.id === nextTeamId);
      if (nextTeam && !nextTeam.memberIds.includes(user.id)) nextTeam.memberIds.push(user.id);
      user.teamId = nextTeamId;
    } else {
      delete user.teamId;
    }
  }

  writeState(users, teams, teamInvites);
  return toPublicUser(user);
}

export function removeUserFromTeam(userId: string): PublicUserRecord {
  return updateUser(userId, { teamId: null });
}

export function deleteUser(userId: string): void {
  const { users, teams, teamInvites } = readState();
  const filteredUsers = users.filter((user) => user.id !== userId);
  for (const team of teams) {
    team.memberIds = team.memberIds.filter((memberId) => memberId !== userId);
  }
  writeState(filteredUsers, teams, teamInvites);
}

export function updateTeam(teamId: string, input: UpdateTeamInput): TeamRecord {
  const { users, teams, teamInvites } = readState();
  const team = teams.find((item) => item.id === teamId);
  if (!team) throw new Error("Team not found");

  if (typeof input.name === "string") team.name = input.name;
  if (typeof input.description === "string") team.description = input.description;
  if (typeof input.profilePicture === "string") team.profilePicture = input.profilePicture;
  if (typeof input.vehicleDescription === "string") team.vehicleDescription = input.vehicleDescription;
  if (Array.isArray(input.vehiclePictures)) team.vehiclePictures = input.vehiclePictures;
  if (Array.isArray(input.vehicleDocuments)) team.vehicleDocuments = input.vehicleDocuments;

  writeState(users, teams, teamInvites);
  return clone(team);
}

export function deleteTeam(teamId: string): void {
  const { users, teams, teamInvites } = readState();
  const filteredTeams = teams.filter((team) => team.id !== teamId);
  for (const user of users) {
    if (user.teamId === teamId) delete user.teamId;
  }
  const filteredInvites = teamInvites.filter((invite) => invite.teamId !== teamId);
  writeState(users, filteredTeams, filteredInvites);
}

export function kickTeamMember(teamId: string, memberId: string): void {
  const { users, teams, teamInvites } = readState();
  const team = teams.find((item) => item.id === teamId);
  if (!team) throw new Error("Team not found");

  team.memberIds = team.memberIds.filter((id) => id !== memberId);
  const member = users.find((item) => item.id === memberId);
  if (member && member.teamId === teamId) delete member.teamId;

  writeState(users, teams, teamInvites);
}
