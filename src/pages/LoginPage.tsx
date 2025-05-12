// LoginPage.tsx
import { useAuth } from "@/authentification/AuthContext";
import { useNavigate } from "react-router-dom";
import Login from "@/components/login";
import type { FormProps } from "antd";
import MainMenu from "@/components/menu";

type FieldType = {
  username?: string;
  password?: string;
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    try {
      await login(values.username!, values.password!);
      navigate("/dashboard"); // or /protected if your route is named like that
    } catch {
      alert("Login failed");
    }
  };

  return (
<div>
   {/* Top-level wrapper */}
 <div className="min-h-screen flex flex-col">
   {/* Full-width header */}
   <header
     className="fixed top-0 left-0 right-0 w-screen p-4 bg-white/20 backdrop-blur-md shadow-md text-xl font-bold text-center text-white"
     style={{ zIndex: 10 }}
   >
     🚀 Welcome to the Login Page
     </header>

   <div className="min-h-screen flex ">
     {/* Sidebar */}
      <div className="p-4 mt-16">
        <MainMenu />
     </div>

      {/* Login form aligned left, but vertically centered */}
     <div className="flex flex-1 justify-start">
        <div className="ml-5 mt-40" > {/* Adjust margin as needed */}
          <Login onFinish={handleLoginFinish}  />
        </div>
      </div>
    </div>
  </div>
</div>


  );
};

export default LoginPage;
