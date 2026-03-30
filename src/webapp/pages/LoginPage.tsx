// LoginPage.tsx
import { useAuth } from "@/webapp/authentification/AuthContext";
import { useNavigate } from "react-router-dom";
import Login from "@/webapp/components/login";
import type { FormProps } from "antd";
import { useTranslation } from 'react-i18next';

type FieldType = {
  username?: string;
  password?: string;
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLoginFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    try {
      await login(values.username!, values.password!);
      navigate("/cabinet");
    } catch {
      alert("Login failed");
    }
  };

  return (
    <div className="p-6 flex items-center justify-center min-h-[80vh]">
      <div>
        <h1 className="text-2xl font-bold text-white mb-8 text-center">{t('login.header')}</h1>
        <Login onFinish={handleLoginFinish} />
      </div>
    </div>


  );
};

export default LoginPage;
