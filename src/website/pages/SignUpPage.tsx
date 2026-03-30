import React, { useMemo } from "react";
import { Alert, Button, Card, Form, Input, Select, Typography, message } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/webapp/authentification/AuthContext";
import { createUser, getAllTeams } from "@/shared/cabinet/store";

const { Title, Text } = Typography;

interface SignUpValues {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  school?: string;
  grade?: string;
  phone?: string;
  email?: string;
  teamId?: string;
}

const SignUpPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const inviteCodeFromLink = useMemo(() => {
    const value = new URLSearchParams(location.search).get("invite");
    return value?.trim() || "";
  }, [location.search]);

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

  const teamOptions = useMemo(
    () =>
      getAllTeams().map((team) => ({
        value: team.id,
        label: team.name,
      })),
    []
  );

  const handleSubmit = async (values: SignUpValues) => {
    try {
      createUser({
        username: values.username,
        password: values.password,
        role: "participant",
        teamId: inviteCodeFromLink ? undefined : values.teamId,
        inviteCode: inviteCodeFromLink || undefined,
        profile: {
          name: values.name,
          school: values.school,
          grade: values.grade,
          phone: values.phone,
          email: values.email,
        },
      });
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
          {inviteCodeFromLink && (
            <Alert
              className="mt-4"
              type="info"
              showIcon
              message={t("website.auth.inviteLinkDetected")}
            />
          )}

          <Form<SignUpValues> layout="vertical" className="mt-6" onFinish={handleSubmit}>
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

              <Form.Item name="school" label={t("website.auth.school")}>
                <Input />
              </Form.Item>
              <Form.Item name="grade" label={t("website.auth.grade")}>
                <Input />
              </Form.Item>
              <Form.Item name="phone" label={t("website.auth.phone")}>
                <Input />
              </Form.Item>
              <Form.Item
                name="email"
                label={t("website.auth.email")}
                rules={[{ type: "email", message: t("website.auth.emailInvalid") }]}
              >
                <Input autoComplete="email" />
              </Form.Item>
            </div>

            {!inviteCodeFromLink && (
              <Form.Item name="teamId" label={t("website.auth.joinTeamOptional")}>
                <Select allowClear options={teamOptions} />
              </Form.Item>
            )}

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
