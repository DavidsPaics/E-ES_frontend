import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Image,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  SaveOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/webapp/authentification/AuthContext";
import { storeAuthUser } from "@/webapp/authentification/credentials";
import { ENDPOINT_ACCOUNT, ENDPOINT_ACCOUNTS, ENDPOINT_TEAMS } from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";
import {
  deleteTeam,
  deleteUser,
  getAllTeams,
  getAllUsers,
  getUsersByTeam,
  kickTeamMember,
  removeUserFromTeam,
  type PublicUserRecord,
  type TeamRecord,
  type UserRole,
  type VehicleDocument,
  updateTeam,
  updateUser,
} from "@/shared/cabinet/store";
import { formatDisplayDate } from "@/utils/dateFormat";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const { Text, Title } = Typography;

interface ProfileFormValues {
  username: string;
  name: string;
  dateOfBirth: string;
  school: string;
  grade: string;
  phone: string;
  email: string;
  profilePicture: string;
}

interface TeamFormValues {
  name: string;
  description: string;
  profilePicture: string;
  vehicleDescription: string;
}

interface AdminUserFormValues extends ProfileFormValues {
  role: UserRole;
  teamId?: string;
}

interface TeamModerationMember {
  key: string;
  fullName: string;
  role?: string;
  dateOfBirth?: string;
  educationalInstitution?: string;
  phone?: string;
  email?: string;
  classOrYear?: string;
}

interface TeamModerationRecord extends TeamRecord {
  ageGroup?: string;
  institution?: string;
  cityOrRegion?: string;
  status?: string;
  appliedAt?: string;
  responsiblePerson?: {
    fullName?: string;
    phone?: string;
    email?: string;
    status?: string;
  };
  comments?: string;
  howHeardAbout?: string;
  members: TeamModerationMember[];
}

const DATE_INPUT_FORMAT = "DD.MM.YYYY";

function formatDateInput(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 8)}`;
}

function parseDateString(input: string) {
  const formatted = formatDateInput(input);
  if (formatted.length < 10) return null;
  const parsed = dayjs(formatted, DATE_INPUT_FORMAT, true);
  return parsed.isValid() && !parsed.isAfter(dayjs(), "day") ? parsed : null;
}

function formatDateForInput(value?: string): string {
  if (!value) return "";

  const isoDate = dayjs(value, "YYYY-MM-DD", true);
  if (isoDate.isValid()) return isoDate.format(DATE_INPUT_FORMAT);

  const displayDate = dayjs(value, DATE_INPUT_FORMAT, true);
  if (displayDate.isValid()) return displayDate.format(DATE_INPUT_FORMAT);

  const looseDate = dayjs(value);
  return looseDate.isValid() ? looseDate.format(DATE_INPUT_FORMAT) : "";
}

function getApiDateOfBirth(values: ProfileFormValues, fallback?: string): string {
  const parsed = parseDateString(values.dateOfBirth || "");
  if (parsed) return parsed.format("YYYY-MM-DD");
  return fallback || "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function firstString(values: unknown[], fallback = ""): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function normalizeUserRole(value: unknown): UserRole {
  if (
    value === "participant" ||
    value === "team_leader" ||
    value === "pilot" ||
    value === "reserve_pilot" ||
    value === "supervisor" ||
    value === "admin" ||
    value === "super_admin"
  ) {
    return value;
  }
  if (value === "member") return "participant";
  return "participant";
}

function normalizeAccountInfo(value: unknown, index: number): PublicUserRecord | null {
  if (!isRecord(value)) return null;

  const data = isRecord(value.dati)
    ? value.dati
    : isRecord(value.cilveks)
      ? value.cilveks
      : isRecord(value.profile)
        ? value.profile
        : value;
  const username = firstString(
    [value.lietotajvards, value.username, value.login, value.epasts, value.email],
    `account-${index + 1}`
  );
  const accountId = firstString(
    [value.key, value.id, value.ID, value.accountId, data.key, data.userId],
    username
  );
  const role = normalizeUserRole(data.role ?? value.role ?? value.type);

  return {
    id: accountId,
    username,
    role,
    teamId: firstString([value.teamId, value.team_id, value.komandasId, data.teamId, data.ID, data.id], "") || undefined,
    profile: {
      name: firstString([data.fullName, data.name, data.full_name], username),
      dateOfBirth: firstString([data.dateOfBirth, data.dzimsanasDatums], "") || undefined,
      school: firstString([data.educationalInstitution, data.school], ""),
      grade: firstString([data.classOrYear, data.grade], ""),
      phone: firstString([value.telefonanumurs, value.phoneNumber, data.phone, data.phoneNumber], ""),
      email: firstString([value.epasts, value.email, data.email], ""),
      profilePicture: firstString([data.profilePicture, data.avatar], ""),
      aboutMe: firstString([data.aboutMe, data.bio], ""),
    },
  };
}

function toTeamModerationId(name: string, fallback: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function normalizeTeamMember(value: unknown, index: number, teamId: string): TeamModerationMember | null {
  if (!isRecord(value)) return null;

  const fullName = firstString([value.fullName, value.vardsUzvards, value.pilnsVards, value.name, value.full_name], "");
  if (!fullName) return null;

  return {
    key: firstString([value.key, value.id, value.ID, value.userId], `${teamId}-member-${index + 1}`),
    fullName,
    role: firstString([value.role, value.loma], "") || undefined,
    dateOfBirth: firstString([value.dateOfBirth, value.dzimsanasDatums], "") || undefined,
    educationalInstitution: firstString(
      [value.educationalInstitution, value.izglitibasIestade, value.school],
      ""
    ) || undefined,
    phone: firstString([value.phone, value.phoneNumber, value.telefonanumurs, value.talrunis], "") || undefined,
    email: firstString([value.email, value.epasts], "") || undefined,
    classOrYear: firstString([value.classOrYear, value.klaseVaiKurss, value.grade], "") || undefined,
  };
}

function normalizeVehicleDocuments(value: unknown, teamId: string): VehicleDocument[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item, index) => ({
      id: firstString([item.id], `${teamId}-document-${index + 1}`),
      name: firstString([item.name], `Document ${index + 1}`),
      type: firstString([item.type], ""),
      dataUrl: firstString([item.dataUrl, item.url], ""),
      uploadedAt: firstString([item.uploadedAt], ""),
    }));
}

function normalizeTeamApplication(value: unknown, index: number): TeamModerationRecord | null {
  if (!isRecord(value)) return null;

  const name = firstString(
    [value.teamName, value.komandasNosaukums, value.name],
    `Team ${index + 1}`
  );
  const id = firstString(
    [value.key, value.id, value.ID, value.teamId],
    toTeamModerationId(name, `team-${index + 1}`)
  );
  const rawMembers = Array.isArray(value.members)
    ? value.members
    : Array.isArray(value.dalibnieki)
      ? value.dalibnieki
      : Array.isArray(value.cilveki)
        ? value.cilveki
        : [];
  const members = rawMembers
    .map((member, memberIndex) => normalizeTeamMember(member, memberIndex, id))
    .filter((member): member is TeamModerationMember => member !== null);
  const rawResponsiblePerson = isRecord(value.responsiblePerson)
    ? value.responsiblePerson
    : isRecord(value.atbildigaPersona)
      ? value.atbildigaPersona
      : undefined;
  const responsiblePerson = rawResponsiblePerson
    ? {
        fullName: firstString([rawResponsiblePerson.fullName, rawResponsiblePerson.vardsUzvards, rawResponsiblePerson.name], "") || undefined,
        phone: firstString(
          [rawResponsiblePerson.phone, rawResponsiblePerson.phoneNumber, rawResponsiblePerson.telefonanumurs, rawResponsiblePerson.talrunis],
          ""
        ) || undefined,
        email: firstString([rawResponsiblePerson.email, rawResponsiblePerson.epasts], "") || undefined,
        status: firstString([rawResponsiblePerson.status, rawResponsiblePerson.statuss], "") || undefined,
      }
    : undefined;

  return {
    id,
    name,
    description: firstString([value.description, value.teamDescription], ""),
    profilePicture: firstString([value.profilePicture, value.teamProfilePicture], ""),
    vehicleDescription: firstString([value.vehicleDescription], ""),
    vehiclePictures: Array.isArray(value.vehiclePictures)
      ? value.vehiclePictures.filter((item): item is string => typeof item === "string")
      : [],
    vehicleDocuments: normalizeVehicleDocuments(value.vehicleDocuments, id),
    memberIds: members.map((member) => member.key),
    members,
    ageGroup: firstString([value.ageGroup, value.vecumaGrupa], "") || undefined,
    institution: firstString([value.institution, value.iestade, value.school, value.educationalInstitution], "") || undefined,
    cityOrRegion: firstString([value.cityOrRegion, value.pilsetaVaiNovads], "") || undefined,
    status: firstString([value.status, value.statuss], "") || undefined,
    appliedAt: firstString([value.appliedAt, value.createdAt, value.submittedAt, value.date, value.pieteikts], "") || undefined,
    responsiblePerson,
    comments: firstString([value.comments, value.komentari], "") || undefined,
    howHeardAbout: firstString([value.howHeardAbout, value.kaUzzinaja], "") || undefined,
  };
}

function localTeamToModerationRecord(value: TeamRecord): TeamModerationRecord {
  return {
    ...value,
    members: value.memberIds.map((memberId) => ({
      key: memberId,
      fullName: getUsersByTeam(value.id).find((user) => user.id === memberId)?.profile.name || memberId,
    })),
  };
}

function getTeamResponseItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  const nestedPayloads = [payload.teams, payload.komandas, payload.applications, payload.data, payload.team];
  for (const nested of nestedPayloads) {
    if (Array.isArray(nested)) return nested;
    if (isRecord(nested)) return [nested];
  }

  if (
    typeof payload.teamName === "string" ||
    typeof payload.komandasNosaukums === "string" ||
    Array.isArray(payload.members) ||
    Array.isArray(payload.dalibnieki)
  ) {
    return [payload];
  }

  return [];
}

function teamRoleLabel(role?: string): string {
  switch (role) {
    case "member":
    case "participant":
      return "Participant";
    case "team_leader":
      return "Team Leader";
    case "pilot":
      return "Pilot";
    case "reserve_pilot":
      return "Reserve Pilot";
    case "supervisor":
      return "Supervisor";
    default:
      return role || "-";
  }
}

function buildAccountPayload(
  user: PublicUserRecord,
  values: ProfileFormValues,
  role: UserRole = user.role,
  teamId: string | undefined = user.teamId
) {
  const profilePicture = (values.profilePicture || "").trim();
  const dateOfBirth = getApiDateOfBirth(values, user.profile.dateOfBirth);

  return {
    key: user.id,
    lietotajvards: values.username.trim(),
    epasts: values.email.trim(),
    telefonanumurs: values.phone.trim(),
    teamId,
    komandasId: teamId,
    role,
    dati: {
      key: user.id,
      id: teamId || "",
      fullName: values.name.trim(),
      dateOfBirth,
      educationalInstitution: values.school.trim(),
      role,
      classOrYear: values.grade.trim(),
      profilePicture,
    },
  };
}

function buildUpdatedUser(
  user: PublicUserRecord,
  values: ProfileFormValues,
  role: UserRole = user.role,
  teamId: string | undefined = user.teamId
): PublicUserRecord {
  return {
    ...user,
    username: values.username.trim(),
    role,
    teamId,
    profile: {
      ...user.profile,
      name: values.name.trim(),
      dateOfBirth: getApiDateOfBirth(values, user.profile.dateOfBirth) || undefined,
      school: values.school.trim(),
      grade: values.grade.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      profilePicture: (values.profilePicture || "").trim(),
    },
  };
}

async function saveAccountProfileToApi(
  user: PublicUserRecord,
  values: ProfileFormValues,
  role: UserRole = user.role,
  teamId: string | undefined = user.teamId
) {
  const response = await apiFetch(`${ENDPOINT_ACCOUNT}/${encodeURIComponent(user.id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildAccountPayload(user, values, role, teamId)),
  });

  if (!response.ok) {
    throw new Error(`Profile update failed with HTTP ${response.status}`);
  }
}

function roleLabel(role: UserRole): string {
  switch (role) {
    case "participant":
      return "Participant";
    case "team_leader":
      return "Team Leader";
    case "pilot":
      return "Pilot";
    case "reserve_pilot":
      return "Reserve Pilot";
    case "supervisor":
      return "Supervisor";
    case "admin":
      return "Admin";
    case "super_admin":
      return "Super Admin";
    default:
      return role;
  }
}

function roleColor(role: UserRole): string {
  switch (role) {
    case "super_admin":
      return "purple";
    case "admin":
      return "geekblue";
    case "supervisor":
      return "cyan";
    case "team_leader":
      return "gold";
    case "pilot":
      return "blue";
    case "reserve_pilot":
      return "orange";
    default:
      return "default";
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("File read failed"));
      }
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

async function readFilesAsDataUrls(files: FileList | null): Promise<string[]> {
  if (!files) return [];
  const items = Array.from(files);
  const result: string[] = [];
  for (const file of items) {
    const encoded = await readFileAsDataUrl(file);
    result.push(encoded);
  }
  return result;
}

const CabinetPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, refreshCurrentUser, logout } = useAuth();
  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [adminUserForm] = Form.useForm<AdminUserFormValues>();
  const [adminTeamForm] = Form.useForm<TeamFormValues>();
  const watchedProfilePicture = Form.useWatch("profilePicture", profileForm);
  const watchedAdminUserProfilePicture = Form.useWatch("profilePicture", adminUserForm);
  const watchedAdminTeamProfilePicture = Form.useWatch("profilePicture", adminTeamForm);

  const [allUsers, setAllUsers] = useState<PublicUserRecord[]>([]);
  const [allTeams, setAllTeams] = useState<TeamModerationRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [viewingTeam, setViewingTeam] = useState<TeamModerationRecord | null>(null);
  const [adminTeamPictures, setAdminTeamPictures] = useState<string[]>([]);
  const [adminTeamDocuments, setAdminTeamDocuments] = useState<VehicleDocument[]>([]);
  const [adminTeamMembers, setAdminTeamMembers] = useState<PublicUserRecord[]>([]);

  const canManageOwnTeam =
    currentUser?.role === "participant" ||
    currentUser?.role === "team_leader" ||
    currentUser?.role === "pilot" ||
    currentUser?.role === "reserve_pilot" ||
    currentUser?.role === "supervisor";
  const isSuperAdmin = currentUser?.role === "super_admin";

  const allTeamOptions = useMemo(
    () =>
      allTeams.map((record) => ({
        value: record.id,
        label: record.name,
      })),
    [allTeams]
  );

  const fetchModerationUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await apiFetch(ENDPOINT_ACCOUNTS);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload: unknown = await response.json();
      const items = Array.isArray(payload)
        ? payload
        : isRecord(payload) && Array.isArray(payload.accounts)
          ? payload.accounts
          : isRecord(payload) && Array.isArray(payload.data)
            ? payload.data
            : [];

      const users = items
        .map((item, index) => normalizeAccountInfo(item, index))
        .filter((item): item is PublicUserRecord => item !== null);

      setAllUsers(users);
    } catch (error) {
      setAllUsers(getAllUsers());
      message.warning("Could not load users from server. Showing local users.");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchModerationTeams = async () => {
    setTeamsLoading(true);
    try {
      const response = await apiFetch(ENDPOINT_TEAMS);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload: unknown = await response.json();
      const items = getTeamResponseItems(payload);

      const teams = items
        .map((item, index) => normalizeTeamApplication(item, index))
        .filter((item): item is TeamModerationRecord => item !== null);

      setAllTeams(teams);
    } catch (error) {
      setAllTeams(getAllTeams().map(localTeamToModerationRecord));
      message.warning("Could not load teams from server. Showing local teams.");
    } finally {
      setTeamsLoading(false);
    }
  };

  const refreshPageData = () => {
    if (!currentUser) return;

    profileForm.setFieldsValue({
      username: currentUser.username,
      name: currentUser.profile.name || "",
      dateOfBirth: formatDateForInput(currentUser.profile.dateOfBirth),
      school: currentUser.profile.school || "",
      grade: currentUser.profile.grade || "",
      phone: currentUser.profile.phone || "",
      email: currentUser.profile.email || "",
      profilePicture: currentUser.profile.profilePicture || "",
    });

    if (isSuperAdmin) {
      void fetchModerationUsers();
      void fetchModerationTeams();
    } else if (canManageOwnTeam) {
      setAllUsers([]);
      void fetchModerationTeams();
    } else {
      setAllUsers([]);
      setAllTeams([]);
    }
  };

  useEffect(() => {
    refreshPageData();
  }, [currentUser]);

  const handleProfileSave = async () => {
    if (!currentUser) return;
    try {
      const values = await profileForm.validateFields();
      await saveAccountProfileToApi(currentUser, values);
      const updatedUser = buildUpdatedUser(currentUser, values);

      if (getAllUsers().some((user) => user.id === currentUser.id)) {
        updateUser(currentUser.id, {
          username: updatedUser.username,
          profile: updatedUser.profile,
        });
      }

      storeAuthUser(updatedUser);
      refreshCurrentUser();
      message.success("Profile updated.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to save profile.";
      message.error(text);
    }
  };

  const handleLeaveTeam = () => {
    if (!currentUser?.teamId) return;
    if (!window.confirm("Leave current team?")) return;

    try {
      removeUserFromTeam(currentUser.id);
      refreshCurrentUser();
      message.success("You left the team.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to leave team.";
      message.error(text);
    }
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return;
    if (!window.confirm("Delete your account permanently?")) return;

    deleteUser(currentUser.id);
    logout();
    navigate("/signin");
  };

  const handleAddTeamPictures = async (
    files: FileList | null,
    target: "admin"
  ) => {
    try {
      const images = await readFilesAsDataUrls(files);
      if (target === "admin") {
        setAdminTeamPictures((prev) => [...prev, ...images]);
      }
    } catch {
      message.error("Failed to read image files.");
    }
  };

  const handleAddTeamDocuments = async (
    files: FileList | null,
    target: "admin"
  ) => {
    if (!files) return;
    try {
      const docs: VehicleDocument[] = [];
      for (const file of Array.from(files)) {
        const dataUrl = await readFileAsDataUrl(file);
        docs.push({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type || "application/octet-stream",
          dataUrl,
          uploadedAt: new Date().toISOString(),
        });
      }

      if (target === "admin") {
        setAdminTeamDocuments((prev) => [...prev, ...docs]);
      }
    } catch {
      message.error("Failed to read document files.");
    }
  };

  const openUserEditor = (user: PublicUserRecord) => {
    setEditingUserId(user.id);
    adminUserForm.setFieldsValue({
      username: user.username,
      role: user.role,
      teamId: user.teamId,
      name: user.profile.name || "",
      dateOfBirth: formatDateForInput(user.profile.dateOfBirth),
      school: user.profile.school || "",
      grade: user.profile.grade || "",
      phone: user.profile.phone || "",
      email: user.profile.email || "",
      profilePicture: user.profile.profilePicture || "",
    });
  };

  const handleSaveEditedUser = async () => {
    if (!editingUserId) return;
    try {
      const values = await adminUserForm.validateFields();
      const editingUser = allUsers.find((user) => user.id === editingUserId);
      if (!editingUser) throw new Error("User not found");

      await saveAccountProfileToApi(editingUser, values, values.role, values.teamId || undefined);
      const updatedUser = buildUpdatedUser(
        editingUser,
        values,
        values.role,
        values.teamId || undefined
      );

      if (getAllUsers().some((user) => user.id === editingUserId)) {
        updateUser(editingUserId, {
          username: values.username.trim(),
          role: values.role,
          teamId: values.teamId || null,
          profile: updatedUser.profile,
        });
      }
      setAllUsers((prev) => prev.map((user) => (user.id === editingUserId ? updatedUser : user)));
      if (currentUser?.id === editingUserId) storeAuthUser(updatedUser);
      setEditingUserId(null);
      message.success("User updated.");
      refreshCurrentUser();
      refreshPageData();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to update user.";
      message.error(text);
    }
  };

  const openTeamEditor = (teamRecord: TeamRecord) => {
    setEditingTeamId(teamRecord.id);
    adminTeamForm.setFieldsValue({
      name: teamRecord.name,
      description: teamRecord.description,
      profilePicture: teamRecord.profilePicture,
      vehicleDescription: teamRecord.vehicleDescription,
    });
    setAdminTeamPictures(teamRecord.vehiclePictures);
    setAdminTeamDocuments(teamRecord.vehicleDocuments);
    setAdminTeamMembers(getUsersByTeam(teamRecord.id));
  };

  const handleSaveEditedTeam = async () => {
    if (!editingTeamId) return;
    try {
      const values = await adminTeamForm.validateFields();
      updateTeam(editingTeamId, {
        name: values.name.trim(),
        description: values.description.trim(),
        profilePicture: (values.profilePicture || "").trim(),
        vehicleDescription: values.vehicleDescription.trim(),
        vehiclePictures: adminTeamPictures,
        vehicleDocuments: adminTeamDocuments,
      });
      setEditingTeamId(null);
      message.success("Team updated.");
      refreshCurrentUser();
      refreshPageData();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to update team.";
      message.error(text);
    }
  };

  const handleDeleteAnyTeam = (teamRecord: TeamRecord) => {
    if (!window.confirm(`Delete team "${teamRecord.name}"?`)) return;
    deleteTeam(teamRecord.id);
    message.success("Team deleted.");
    refreshCurrentUser();
    refreshPageData();
  };

  const handleKickFromAdminTeam = (teamId: string, memberId: string) => {
    if (!window.confirm("Kick this member from team?")) return;
    kickTeamMember(teamId, memberId);
    setAdminTeamMembers(getUsersByTeam(teamId));
    refreshCurrentUser();
    refreshPageData();
    message.success("Member removed.");
  };

  if (!currentUser) {
    return (
      <section className="py-10 bg-gray-50 min-h-[60vh]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert type="warning" message="No active user session. Please log in again." />
          <Button className="mt-4" type="primary" onClick={() => navigate("/signin")}>
            Go to login
          </Button>
        </div>
      </section>
    );
  }

  const userColumns = [
    {
      title: "User",
      key: "user",
      render: (_: unknown, record: PublicUserRecord) => (
        <div>
          <div className="font-semibold">{record.profile.name || "-"}</div>
          <div className="text-xs text-gray-500">@{record.username}</div>
        </div>
      ),
    },
    {
      title: "Date of birth",
      key: "dateOfBirth",
      responsive: ["lg" as const],
      render: (_: unknown, record: PublicUserRecord) =>
        record.profile.dateOfBirth ? formatDisplayDate(record.profile.dateOfBirth) : "-",
    },
    {
      title: "Role",
      key: "role",
      render: (_: unknown, record: PublicUserRecord) => (
        <Tag color={roleColor(record.role)}>{roleLabel(record.role)}</Tag>
      ),
    },
    {
      title: "Team",
      key: "team",
      render: (_: unknown, record: PublicUserRecord) => {
        const userTeam = allTeams.find((item) => item.id === record.teamId);
        return userTeam?.name || "-";
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 90,
      render: (_: unknown, record: PublicUserRecord) => (
        <Button size="small" onClick={() => openUserEditor(record)}>
          Edit
        </Button>
      ),
    },
  ];

  const teamColumns = [
    {
      title: "Team",
      key: "name",
      render: (_: unknown, record: TeamModerationRecord) => (
        <div>
          <div className="font-semibold">{record.name}</div>
          <div className="text-xs text-gray-500">
            {record.members.length || record.memberIds.length} members
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      responsive: ["md" as const],
      render: (_: unknown, record: TeamModerationRecord) => record.status || "-",
    },
    {
      title: "Age group",
      key: "ageGroup",
      responsive: ["md" as const],
      render: (_: unknown, record: TeamModerationRecord) => record.ageGroup || "-",
    },
    {
      title: "Vehicle docs",
      key: "docs",
      render: (_: unknown, record: TeamModerationRecord) => record.vehicleDocuments.length,
    },
    {
      title: "Actions",
      key: "actions",
      width: 90,
      render: (_: unknown, record: TeamModerationRecord) => (
        <Button size="small" onClick={() => setViewingTeam(record)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <section className="py-10 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-[#0A306D] [&_.ant-card]:!text-[#0A306D] [&_.ant-card-head-title]:!text-[#0A306D] [&_.ant-form-item-label>label]:!text-[#0A306D] flex flex-col gap-4">
        <Title level={2} className="!text-[#0A306D] !mb-0">
          Profile Cabinet
        </Title>
        <Text className="!text-[#36598B]">
          Role: <Tag color={roleColor(currentUser.role)}>{roleLabel(currentUser.role)}</Tag>
        </Text>

        <Card title={<span><UserOutlined /> My Profile</span>}>
          <Form form={profileForm} layout="vertical">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: "Username is required." }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: "Name is required." }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="dateOfBirth"
                label="Date of birth"
                normalize={(value: string) => formatDateInput(value)}
                rules={[
                  {
                    validator: (_, value: string) => {
                      if (!value) return Promise.resolve();
                      if (parseDateString(value)) return Promise.resolve();
                      return Promise.reject(new Error("Invalid date format (use DD.MM.YYYY)."));
                    },
                  },
                ]}
              >
                <Input placeholder="DD.MM.YYYY" maxLength={10} autoComplete="bday" />
              </Form.Item>
              <Form.Item name="school" label="School">
                <Input />
              </Form.Item>
              <Form.Item name="grade" label="Grade">
                <Input />
              </Form.Item>
              <Form.Item name="phone" label="Phone">
                <Input />
              </Form.Item>
              <Form.Item
                name="email"
                label="E-mail"
                rules={[
                  {
                    type: "email",
                    message: "Please enter a valid e-mail.",
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </div>
            <Form.Item name="profilePicture" hidden>
              <Input />
            </Form.Item>
            <div className="mb-4">
              <div className="font-semibold mb-2">Profile picture</div>
              {watchedProfilePicture ? (
                <div className="mb-2">
                  <Image src={watchedProfilePicture} alt="Profile" width={120} className="rounded" />
                </div>
              ) : (
                <Text type="secondary">No profile picture uploaded.</Text>
              )}
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      const encoded = await readFileAsDataUrl(file);
                      profileForm.setFieldValue("profilePicture", encoded);
                    } catch {
                      message.error("Failed to read profile picture.");
                    } finally {
                      event.target.value = "";
                    }
                  }}
                />
                {watchedProfilePicture && (
                  <Button onClick={() => profileForm.setFieldValue("profilePicture", "")}>
                    Remove picture
                  </Button>
                )}
              </div>
            </div>
            <Space wrap>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleProfileSave}>
                Save profile
              </Button>
            </Space>
          </Form>
        </Card>

        <Card title="Account Actions">
          <Space wrap>
            {currentUser.teamId && (
              <Button onClick={handleLeaveTeam}>
                Exit from team
              </Button>
            )}
            <Button danger icon={<DeleteOutlined />} onClick={handleDeleteAccount}>
              Delete account
            </Button>
          </Space>
        </Card>

        {canManageOwnTeam && !isSuperAdmin && (
          <Card title={<span><TeamOutlined /> Role: Team Moderation</span>}>
            <Table<TeamModerationRecord>
              dataSource={allTeams}
              rowKey="id"
              columns={teamColumns}
              loading={teamsLoading}
              pagination={allTeams.length > 10 ? { pageSize: 10 } : false}
              locale={{ emptyText: "No team assigned." }}
            />
          </Card>
        )}

        {isSuperAdmin && (
          <>
            <Card title="Super Admin: User Moderation">
              <Table<PublicUserRecord>
                dataSource={allUsers}
                rowKey="id"
                columns={userColumns}
                loading={usersLoading}
                pagination={allUsers.length > 10 ? { pageSize: 10 } : false}
              />
            </Card>

            <Card title="Super Admin: Team Moderation">
              <Table<TeamModerationRecord>
                dataSource={allTeams}
                rowKey="id"
                columns={teamColumns}
                loading={teamsLoading}
                pagination={allTeams.length > 10 ? { pageSize: 10 } : false}
              />
            </Card>
          </>
        )}
      </div>

      <Modal
        open={editingUserId !== null}
        title="Edit User"
        onCancel={() => setEditingUserId(null)}
        onOk={handleSaveEditedUser}
        okText="Save"
        width={800}
      >
        <Form form={adminUserForm} layout="vertical">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: "Username is required." }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: "Role is required." }]}
            >
              <Select
                options={[
                  { value: "participant", label: roleLabel("participant") },
                  { value: "team_leader", label: roleLabel("team_leader") },
                  { value: "pilot", label: roleLabel("pilot") },
                  { value: "reserve_pilot", label: roleLabel("reserve_pilot") },
                  { value: "supervisor", label: roleLabel("supervisor") },
                  { value: "admin", label: roleLabel("admin") },
                  { value: "super_admin", label: roleLabel("super_admin") },
                ]}
              />
            </Form.Item>
            <Form.Item name="teamId" label="Team">
              <Select
                allowClear
                placeholder="No team"
                options={allTeamOptions}
              />
            </Form.Item>
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: "Name is required." }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="dateOfBirth"
              label="Date of birth"
              normalize={(value: string) => formatDateInput(value)}
              rules={[
                { required: true, message: "Date of birth is required." },
                {
                  validator: (_, value: string) => {
                    if (!value) return Promise.resolve();
                    if (parseDateString(value)) return Promise.resolve();
                    return Promise.reject(new Error("Invalid date format (use DD.MM.YYYY)."));
                  },
                },
              ]}
            >
              <Input placeholder="DD.MM.YYYY" maxLength={10} autoComplete="bday" />
            </Form.Item>
            <Form.Item name="school" label="School">
              <Input />
            </Form.Item>
            <Form.Item name="grade" label="Grade">
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="Phone">
              <Input />
            </Form.Item>
            <Form.Item
              name="email"
              label="E-mail"
              rules={[{ type: "email", message: "Please enter a valid e-mail." }]}
            >
              <Input />
            </Form.Item>
          </div>
          <Form.Item name="profilePicture" hidden>
            <Input />
          </Form.Item>
          <div className="mb-4">
            <div className="font-semibold mb-2">Profile picture</div>
            {watchedAdminUserProfilePicture ? (
              <div className="mb-2">
                <Image
                  src={watchedAdminUserProfilePicture}
                  alt="Profile"
                  width={120}
                  className="rounded"
                />
              </div>
            ) : (
              <Text type="secondary">No profile picture uploaded.</Text>
            )}
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    const encoded = await readFileAsDataUrl(file);
                    adminUserForm.setFieldValue("profilePicture", encoded);
                  } catch {
                    message.error("Failed to read profile picture.");
                  } finally {
                    event.target.value = "";
                  }
                }}
              />
              {watchedAdminUserProfilePicture && (
                <Button onClick={() => adminUserForm.setFieldValue("profilePicture", "")}>
                  Remove picture
                </Button>
              )}
            </div>
          </div>
        </Form>
      </Modal>

      <Modal
        open={viewingTeam !== null}
        title="Team details"
        onCancel={() => setViewingTeam(null)}
        footer={[
          <Button key="close" onClick={() => setViewingTeam(null)}>
            Close
          </Button>,
        ]}
        width={900}
      >
        {viewingTeam && (
          <div className="space-y-4">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Team">{viewingTeam.name}</Descriptions.Item>
              <Descriptions.Item label="Status">{viewingTeam.status || "-"}</Descriptions.Item>
              <Descriptions.Item label="Age group">{viewingTeam.ageGroup || "-"}</Descriptions.Item>
              <Descriptions.Item label="Institution">{viewingTeam.institution || "-"}</Descriptions.Item>
              <Descriptions.Item label="City/region">{viewingTeam.cityOrRegion || "-"}</Descriptions.Item>
              <Descriptions.Item label="Applied">
                {viewingTeam.appliedAt ? formatDisplayDate(viewingTeam.appliedAt) : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Responsible person">
                {viewingTeam.responsiblePerson?.fullName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Responsible contact">
                {[viewingTeam.responsiblePerson?.email, viewingTeam.responsiblePerson?.phone]
                  .filter(Boolean)
                  .join(" / ") || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="How heard about">
                {viewingTeam.howHeardAbout || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Comments">{viewingTeam.comments || "-"}</Descriptions.Item>
              <Descriptions.Item label="Vehicle description">
                {viewingTeam.vehicleDescription || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Vehicle documents">
                {viewingTeam.vehicleDocuments.length}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <div className="font-semibold mb-2">Members</div>
              <Table<TeamModerationMember>
                dataSource={viewingTeam.members}
                rowKey="key"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: "Name",
                    dataIndex: "fullName",
                    key: "fullName",
                  },
                  {
                    title: "Role",
                    dataIndex: "role",
                    key: "role",
                    render: (value: string | undefined) => teamRoleLabel(value),
                  },
                  {
                    title: "Date of birth",
                    dataIndex: "dateOfBirth",
                    key: "dateOfBirth",
                    render: (value: string | undefined) => (value ? formatDisplayDate(value) : "-"),
                  },
                  {
                    title: "Institution",
                    dataIndex: "educationalInstitution",
                    key: "educationalInstitution",
                    render: (value: string | undefined) => value || "-",
                  },
                  {
                    title: "Contact",
                    key: "contact",
                    render: (_: unknown, record: TeamModerationMember) =>
                      [record.email, record.phone].filter(Boolean).join(" / ") || "-",
                  },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={editingTeamId !== null}
        title="Edit Team"
        onCancel={() => setEditingTeamId(null)}
        onOk={handleSaveEditedTeam}
        okText="Save"
        width={900}
      >
        <Form form={adminTeamForm} layout="vertical">
          <Form.Item
            name="name"
            label="Team name"
            rules={[{ required: true, message: "Team name is required." }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Team description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="profilePicture" hidden>
            <Input />
          </Form.Item>
          <div className="mb-4">
            <div className="font-semibold mb-2">Team profile picture</div>
            {watchedAdminTeamProfilePicture ? (
              <div className="mb-2">
                <Image
                  src={watchedAdminTeamProfilePicture}
                  alt="Team profile"
                  width={140}
                  className="rounded"
                />
              </div>
            ) : (
              <Text type="secondary">No team profile picture uploaded.</Text>
            )}
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    const encoded = await readFileAsDataUrl(file);
                    adminTeamForm.setFieldValue("profilePicture", encoded);
                  } catch {
                    message.error("Failed to read profile picture.");
                  } finally {
                    event.target.value = "";
                  }
                }}
              />
              {watchedAdminTeamProfilePicture && (
                <Button onClick={() => adminTeamForm.setFieldValue("profilePicture", "")}>
                  Remove picture
                </Button>
              )}
            </div>
          </div>
          <Form.Item name="vehicleDescription" label="Vehicle description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>

        <div className="font-semibold mb-2">Vehicle pictures</div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={async (event) => {
            await handleAddTeamPictures(event.target.files, "admin");
            event.target.value = "";
          }}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 mb-4">
          {adminTeamPictures.map((picture) => (
            <div key={picture} className="border rounded p-2">
              <Image src={picture} alt="Vehicle" className="rounded" />
              <Button
                type="link"
                danger
                onClick={() =>
                  setAdminTeamPictures((prev) => prev.filter((item) => item !== picture))
                }
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        <div className="font-semibold mb-2">Vehicle documents</div>
        <input
          type="file"
          multiple
          onChange={async (event) => {
            await handleAddTeamDocuments(event.target.files, "admin");
            event.target.value = "";
          }}
        />
        <Space direction="vertical" className="w-full mt-3 mb-4">
          {adminTeamDocuments.map((document) => (
            <div key={document.id} className="flex items-center justify-between border rounded px-3 py-2">
              <div>
                <div className="font-medium">{document.name}</div>
                <div className="text-xs text-gray-500">{document.type}</div>
              </div>
              <Button
                danger
                type="link"
                onClick={() =>
                  setAdminTeamDocuments((prev) => prev.filter((item) => item.id !== document.id))
                }
              >
                Delete
              </Button>
            </div>
          ))}
        </Space>

        {editingTeamId && (
          <>
            <div className="font-semibold mb-2">Team members</div>
            <Table<PublicUserRecord>
              dataSource={adminTeamMembers}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                {
                  title: "Name",
                  key: "name",
                  render: (_: unknown, record: PublicUserRecord) => record.profile.name || "-",
                },
                {
                  title: "Role",
                  key: "role",
                  render: (_: unknown, record: PublicUserRecord) => (
                    <Tag color={roleColor(record.role)}>{roleLabel(record.role)}</Tag>
                  ),
                },
                {
                  title: "Action",
                  key: "action",
                  width: 120,
                  render: (_: unknown, record: PublicUserRecord) => (
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleKickFromAdminTeam(editingTeamId, record.id)}
                    >
                      Kick
                    </Button>
                  ),
                },
              ]}
            />
          </>
        )}
      </Modal>
    </section>
  );
};

export default CabinetPage;
