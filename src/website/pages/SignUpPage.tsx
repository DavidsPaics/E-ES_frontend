import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Form, Input, Select, Typography, message } from "antd";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/webapp/authentification/AuthContext";
import { ENDPOINT_AUTH_REGISTER, ENDPOINT_TEAMS } from "@/webapp/config/endpoints";
import { getAllTeams } from "@/shared/cabinet/store";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const { Title, Text } = Typography;
const SIGNUP_DRAFT_STORAGE_KEY = "signup-form-draft";

type AccountTeamRole = "participant" | "team_leader" | "pilot" | "reserve_pilot";

interface SelectableTeam {
  id: string;
  name: string;
}

interface SignUpValues {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  teamId?: string;
  teamRole?: AccountTeamRole;
}

type SignUpDraftValues = Omit<SignUpValues, "password" | "confirmPassword">;

const formatDateInput = (input: string): string => {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 8)}`;
};

const parseDateString = (input: string) => {
  const formatted = formatDateInput(input);
  if (formatted.length < 10) return null;
  const parsed = dayjs(formatted, "DD.MM.YYYY", true);
  return parsed.isValid() && !parsed.isAfter(dayjs(), "day") ? parsed : null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function firstNonEmpty(values: unknown[], fallback = ""): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function normalizeTeam(value: unknown, index: number): SelectableTeam | null {
  if (!isRecord(value)) return null;
  const name = firstNonEmpty([value.teamName, value.komandasNosaukums, value.name], "");
  if (!name) return null;
  return {
    id: firstNonEmpty([value.key, value.id, value.ID, value.teamId], name || `team-${index + 1}`),
    name,
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

  if (typeof payload.teamName === "string" || typeof payload.komandasNosaukums === "string") {
    return [payload];
  }

  return [];
}

function responseIndicatesPendingVerification(payload: unknown): boolean {
  if (typeof payload === "string") {
    try {
      return responseIndicatesPendingVerification(JSON.parse(payload));
    } catch {
      return payload.toLowerCase().includes("pending verification");
    }
  }

  if (!isRecord(payload)) return false;

  const status = firstNonEmpty([payload.status, payload.state, payload.result], "").toLowerCase();
  const message = firstNonEmpty([payload.message, payload.detail, payload.description], "").toLowerCase();
  const combined = `${status} ${message}`;

  return (
    status === "pending" ||
    status === "pending_verification" ||
    status === "verification_pending" ||
    combined.includes("pending verification") ||
    combined.includes("verification pending")
  );
}

function getStoredSignUpDraft(): SignUpDraftValues | null {
  try {
    const stored = localStorage.getItem(SIGNUP_DRAFT_STORAGE_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (!isRecord(parsed)) return null;

    return {
      username: firstNonEmpty([parsed.username], ""),
      name: firstNonEmpty([parsed.name], ""),
      dateOfBirth: firstNonEmpty([parsed.dateOfBirth], ""),
      phone: firstNonEmpty([parsed.phone], ""),
      email: firstNonEmpty([parsed.email], ""),
      teamId: firstNonEmpty([parsed.teamId], "") || undefined,
      teamRole: firstNonEmpty([parsed.teamRole], "") as AccountTeamRole | undefined,
    };
  } catch {
    return null;
  }
}

function getStorableSignUpDraft(values: Partial<SignUpValues>): SignUpDraftValues {
  return {
    username: values.username || "",
    name: values.name || "",
    dateOfBirth: values.dateOfBirth || "",
    phone: values.phone || "",
    email: values.email || "",
    teamId: values.teamId,
    teamRole: values.teamRole,
  };
}

function saveSignUpDraft(values: Partial<SignUpValues>) {
  try {
    localStorage.setItem(
      SIGNUP_DRAFT_STORAGE_KEY,
      JSON.stringify(getStorableSignUpDraft(values))
    );
  } catch {
    // ignore storage errors
  }
}

function clearSignUpDraft() {
  try {
    localStorage.removeItem(SIGNUP_DRAFT_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

function getLocalTeams(): SelectableTeam[] {
  return getAllTeams()
    .map((team) => ({ id: team.id, name: team.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const SignUpPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const [form] = Form.useForm<SignUpValues>();
  const selectedTeamId = Form.useWatch("teamId", form);
  const [teams, setTeams] = useState<SelectableTeam[]>(() => getLocalTeams());
  const [teamsLoading, setTeamsLoading] = useState(false);
  const leaderVerificationId = (
    searchParams.get("uniqueID") ??
    searchParams.get("uniqueId") ??
    ""
  ).trim();
  const isLeaderVerification = leaderVerificationId.length > 0;
  const leaderVerificationTeam = useMemo(
    () => teams.find((team) => team.id === leaderVerificationId),
    [leaderVerificationId, teams]
  );

  useEffect(() => {
    const draft = getStoredSignUpDraft();
    if (!draft) return;

    form.setFieldsValue({
      ...draft,
      teamId: isLeaderVerification ? leaderVerificationId : draft.teamId,
      teamRole: isLeaderVerification ? "team_leader" : draft.teamRole ?? "participant",
    });
  }, [form, isLeaderVerification, leaderVerificationId]);

  useEffect(() => {
    let active = true;
    setTeamsLoading(true);

    fetch(ENDPOINT_TEAMS)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<unknown>;
      })
      .then((payload) => {
        const rawTeams = getTeamResponseItems(payload);
        const normalized = rawTeams
          .map((item, index) => normalizeTeam(item, index))
          .filter((item): item is SelectableTeam => item !== null)
          .sort((a, b) => a.name.localeCompare(b.name));
        if (active && normalized.length > 0) {
          setTeams(normalized);
        }
      })
      .catch(() => {
        if (active) setTeams(getLocalTeams());
      })
      .finally(() => {
        if (active) setTeamsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isLeaderVerification) return;
    form.setFieldsValue({
      teamId: leaderVerificationId,
      teamRole: "team_leader",
    });
  }, [form, isLeaderVerification, leaderVerificationId]);

  const handleValuesChange = () => {
    saveSignUpDraft(form.getFieldsValue());
  };

  const teamOptions = useMemo(
    () => teams.map((team) => ({ value: team.id, label: team.name })),
    [teams]
  );

  const teamRoleOptions: { value: AccountTeamRole; label: string }[] = [
    { value: "participant", label: t("website.apply.form.roleParticipant") },
    { value: "team_leader", label: t("website.apply.form.roleTeamLeader") },
    { value: "pilot", label: t("website.apply.form.rolePilot") },
    { value: "reserve_pilot", label: t("website.apply.form.roleReservePilot") },
  ];

  const getLocalizedSignUpError = (error: unknown): string => {
    if (!(error instanceof Error)) return t("website.auth.signUpFailed");

    switch (error.message) {
      case "Username already in use":
        return t("website.auth.usernameTaken");
      case "Team not found":
        return t("website.auth.teamNotFound");
      case "Username is required":
        return t("website.auth.usernameRequired");
      case "Password is required":
        return t("website.auth.passwordRequired");
      case "Invite code is invalid":
        return t("website.auth.inviteInvalid");
      case "Invite code is already used":
        return t("website.auth.inviteUsed");
      case "Invite code does not match selected team":
        return t("website.auth.inviteTeamMismatch");
      default:
        return t("website.auth.signUpFailed");
    }
  };

  const handleSubmit = async (values: SignUpValues) => {
    try {
      const dateOfBirth = parseDateString(values.dateOfBirth);
      if (!dateOfBirth) {
        throw new Error("Date of birth is invalid");
      }

      const selectedTeam = values.teamId
        ? teams.find((team) => team.id === values.teamId)
        : undefined;
      const teamForRegistration = isLeaderVerification ? leaderVerificationTeam : selectedTeam;

      if (!isLeaderVerification && values.teamId && !selectedTeam) {
        throw new Error("Team not found");
      }

      const role = isLeaderVerification
        ? "team_leader"
        : values.teamId
          ? values.teamRole ?? "participant"
          : "member";
      const registerEndpoint = isLeaderVerification
        ? `${ENDPOINT_AUTH_REGISTER}?uniqueID=${encodeURIComponent(leaderVerificationId)}`
        : ENDPOINT_AUTH_REGISTER;

      const response = await fetch(registerEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.name,
          dateOfBirth: dateOfBirth.format("YYYY-MM-DD"),
          parole: values.password,
          lietotajvards: values.username,
          epasts: values.email,
          telefonanumurs: values.phone,
          komandasNosaukums: teamForRegistration?.name ?? "",
          role,
        }),
      });

      if (!response.ok) {
        throw new Error(`Registration failed with HTTP ${response.status}`);
      }

      const payload = await response
        .clone()
        .json()
        .catch(() => null);

      if (responseIndicatesPendingVerification(payload)) {
        clearSignUpDraft();
        message.info(t("website.auth.accountPendingVerification"), 8);
        return;
      }

      clearSignUpDraft();
      await login(values.username, values.password);
      message.success(t("website.auth.accountCreated"));
      navigate("/cabinet");
    } catch (error) {
      message.error(getLocalizedSignUpError(error));
    }
  };

  if (isAuthenticated) {
    return (
      <section className="py-10 bg-gray-50 min-h-[70vh] text-[#0A306D] [&_.ant-card]:!text-[#0A306D] [&_.ant-form-item-label>label]:!text-[#0A306D]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <Text>{t("website.auth.alreadySignedIn")}</Text>
            <div className="mt-4">
              <Button type="primary" onClick={() => navigate("/cabinet")}>
                {t("website.auth.goToCabinet")}
              </Button>
            </div>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 bg-gray-50 min-h-[70vh] text-[#0A306D] [&_.ant-card]:!text-[#0A306D] [&_.ant-form-item-label>label]:!text-[#0A306D]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <Title level={2} className="!text-[#0A306D] !mb-1">
            {t("website.nav.signUp", { defaultValue: "Sign up" })}
          </Title>
          <Text type="secondary">{t("website.auth.signUpSubtitle")}</Text>
          {isLeaderVerification && (
            <Alert
              className="mt-4"
              showIcon
              type="info"
              message={t("website.auth.teamLeaderVerificationTitle")}
              description={
                <div>
                  {t("website.auth.teamLeaderVerificationDescription")}
                  <div className="mt-2">
                    {t("website.auth.teamLeaderVerificationTeam")}:{" "}
                    <Text strong>{leaderVerificationTeam?.name ?? leaderVerificationId}</Text>
                  </div>
                </div>
              }
            />
          )}

          <Form<SignUpValues>
            form={form}
            layout="vertical"
            className="mt-6"
            initialValues={{
              teamId: isLeaderVerification ? leaderVerificationId : undefined,
              teamRole: isLeaderVerification ? "team_leader" : "participant",
            }}
            onFinish={handleSubmit}
            onValuesChange={handleValuesChange}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="username"
                label={t("website.auth.username")}
                rules={[{ required: true, message: t("website.auth.usernameRequired") }]}
              >
                <Input autoComplete="username" />
              </Form.Item>

              <Form.Item
                name="name"
                label={t("website.auth.fullName")}
                rules={[{ required: true, message: t("website.auth.fullNameRequired") }]}
              >
                <Input autoComplete="name" />
              </Form.Item>

              <Form.Item
                name="password"
                label={t("website.auth.password")}
                rules={[
                  { required: true, message: t("website.auth.passwordRequired") },
                  { min: 4, message: t("website.auth.passwordMin") },
                ]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label={t("website.auth.confirmPassword")}
                dependencies={["password"]}
                rules={[
                  { required: true, message: t("website.auth.confirmPasswordRequired") },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t("website.auth.passwordMismatch")));
                    },
                  }),
                ]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>

              <Form.Item
                name="dateOfBirth"
                label={t("website.auth.dateOfBirth")}
                normalize={(value: string) => formatDateInput(value)}
                rules={[
                  { required: true, message: t("website.auth.dateOfBirthRequired") },
                  {
                    validator: (_, value: string) => {
                      if (!value) return Promise.resolve();
                      if (parseDateString(value)) return Promise.resolve();
                      return Promise.reject(
                        new Error(
                          t("website.apply.form.validation.memberDobInvalid", {
                            defaultValue: "Invalid date format (use DD.MM.YYYY)",
                          })
                        )
                      );
                    },
                  },
                ]}
              >
                <Input placeholder="DD.MM.YYYY" maxLength={10} autoComplete="bday" />
              </Form.Item>
              <Form.Item
                name="phone"
                label={t("website.auth.phone")}
                rules={[{ required: true, message: t("website.auth.phoneRequired") }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="email"
                label={t("website.auth.email")}
                rules={[
                  { required: true, message: t("website.auth.emailRequired") },
                  { type: "email", message: t("website.auth.emailInvalid") },
                ]}
              >
                <Input autoComplete="email" />
              </Form.Item>

              {isLeaderVerification ? (
                <Form.Item label="Team verification">
                  <Input
                    readOnly
                    value={leaderVerificationTeam?.name ?? leaderVerificationId}
                  />
                </Form.Item>
              ) : (
                <Form.Item name="teamId" label={t("website.auth.joinTeamOptional")}>
                  <Select
                    allowClear
                    showSearch
                    loading={teamsLoading}
                    optionFilterProp="label"
                    placeholder={t("website.auth.joinTeamOptional")}
                    options={teamOptions}
                  />
                </Form.Item>
              )}

              {!isLeaderVerification && selectedTeamId && (
                <Form.Item
                  name="teamRole"
                  label={t("website.apply.form.memberRole")}
                  rules={[{ required: true, message: t("website.apply.form.validation.memberRoleRequired") }]}
                >
                  <Select options={teamRoleOptions} />
                </Form.Item>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <Link to="/signin" className="text-[#0A306D] hover:underline">
                {t("website.nav.signIn", { defaultValue: "Sign in" })}
              </Link>
              <Button type="primary" htmlType="submit">
                {t("website.nav.signUp", { defaultValue: "Sign up" })}
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </section>
  );
};

export default SignUpPage;
