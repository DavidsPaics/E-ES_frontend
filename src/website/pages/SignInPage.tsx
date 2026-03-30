import React from "react";
import { Alert, Button, Card, Form, Input, Typography, message } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/webapp/authentification/AuthContext";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

interface SignInValues {
  username: string;
  password: string;
}

const SignInPage: React.FC = () => {
  const { t } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string } | null)?.from || "/cabinet";

  const handleSubmit = async (values: SignInValues) => {
    try {
      await login(values.username, values.password);
      navigate(from);
    } catch {
      message.error(t("website.auth.invalidCredentials"));
    }
  };

  if (isAuthenticated) {
    return (
      <section className="py-10 bg-gray-50 min-h-[70vh] text-[#0A306D] [&_.ant-card]:!text-[#0A306D] [&_.ant-form-item-label>label]:!text-[#0A306D]">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert
            type="info"
            showIcon
            message={t("website.auth.alreadySignedIn")}
            action={
              <Button type="primary" size="small" onClick={() => navigate("/cabinet")}>
                {t("website.auth.goToCabinet")}
              </Button>
            }
          />
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 bg-gray-50 min-h-[70vh] text-[#0A306D] [&_.ant-card]:!text-[#0A306D] [&_.ant-form-item-label>label]:!text-[#0A306D]">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <Title level={2} className="!text-[#0A306D] !mb-1">
            {t("website.nav.signIn", { defaultValue: "Sign in" })}
          </Title>
          <Text type="secondary">{t("website.auth.signInSubtitle")}</Text>

          <Form<SignInValues> layout="vertical" className="mt-6" onFinish={handleSubmit}>
            <Form.Item
              name="username"
              label={t("website.auth.username")}
              rules={[{ required: true, message: t("website.auth.usernameRequired") }]}
            >
              <Input autoComplete="username" />
            </Form.Item>

            <Form.Item
              name="password"
              label={t("website.auth.password")}
              rules={[{ required: true, message: t("website.auth.passwordRequired") }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>

            <div className="flex items-center justify-between gap-3">
              <Link to="/signup" className="text-[#0A306D] hover:underline">
                {t("website.nav.signUp", { defaultValue: "Sign up" })}
              </Link>
              <Button type="primary" htmlType="submit">
                {t("website.nav.signIn", { defaultValue: "Sign in" })}
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </section>
  );
};

export default SignInPage;
