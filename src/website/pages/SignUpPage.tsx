import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, Select, Typography, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/webapp/authentification/AuthContext";
import { ENDPOINT_AUTH_REGISTER, ENDPOINT_TEAMS } from "@/webapp/config/endpoints";
import { getAllTeams } from "@/shared/cabinet/store";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const { Title, Text } = Typography;

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
    id: firstNonEmpty([value.key, value.id, value.teamId], name || `team-${index + 1}`),
    name,
  };
}

function getLocalTeams(): SelectableTeam[] {
  return getAllTeams()
    .map((team) => ({ id: team.id, name: team.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const SignUpPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [form] = Form.useForm<SignUpValues>();
  const selectedTeamId = Form.useWatch("teamId", form);
  const [teams, setTeams] = useState<SelectableTeam[]>(() => getLocalTeams());
  const [teamsLoading, setTeamsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setTeamsLoading(true);

    fetch(ENDPOINT_TEAMS)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<unknown>;
      })
      .then((payload) => {
        const rawTeams = Array.isArray(payload)
          ? payload
          : isRecord(payload) && Array.isArray(payload.teams)
            ? payload.teams
            : isRecord(payload) && Array.isArray(payload.data)
              ? payload.data
              : [];
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

      if (values.teamId && !selectedTeam) {
        throw new Error("Team not found");
      }

      const role = values.teamId ? values.teamRole ?? "participant" : "member";

      const response = await fetch(ENDPOINT_AUTH_REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.name,
          dateOfBirth: dateOfBirth.format("YYYY-MM-DD"),
          parole: values.password,
          lietotajvards: values.username,
          epasts: values.email,
          telefonanumurs: values.phone,
          komandasNosaukums: selectedTeam?.name ?? "",
          role,
        }),
      });

      if (!response.ok) {
        throw new Error(`Registration failed with HTTP ${response.status}`);
      }

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

          <Form<SignUpValues>
            form={form}
            layout="vertical"
            className="mt-6"
            initialValues={{ teamRole: "participant" }}
            onFinish={handleSubmit}
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

              {selectedTeamId && (
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
