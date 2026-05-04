import React from "react";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/webapp/authentification/AuthContext";
import { ENDPOINT_AUTH_REGISTER } from "@/webapp/config/endpoints";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const { Title, Text } = Typography;

interface SignUpValues {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  dateOfBirth: string;
  phone: string;
  email: string;
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

const SignUpPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

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

      const response = await fetch(ENDPOINT_AUTH_REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.name,
          dateOfBirth: dateOfBirth.format("YYYY-MM-DD"),
          password: values.password,
          username: values.username,
          email: values.email,
          phoneNumber: values.phone,
          role: "member",
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
