import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserOutlined } from "@ant-design/icons";
import Logo from "@/assets/Logo.png";
import { useAuth } from "@/webapp/authentification/AuthContext";

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const isProduction = import.meta.env.PROD;

  const links = [
    { to: "/", label: t("website.nav.home") },
    // { to: "/about", label: t("website.nav.about") },
    // { to: "/news", label: t("website.nav.news") },
    { to: "/rules", label: t("website.nav.rules") },
    // { to: "/events", label: t("website.nav.events") },
    { to: "/apply", label: t("website.nav.apply") },
  ];

  const isActive = (path: string) => location.pathname === path;

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === "lv" ? "en" : "lv");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={Logo} alt="E-ES" className="h-10 w-auto" />
            <span className="text-xl font-bold text-[#0A306D]">E-ES</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? "text-[#4EA9D5] border-b-2 border-[#4EA9D5] pb-1"
                    : "text-[#0A306D] hover:text-[#4EA9D5]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="text-sm text-[#0A306D] hover:text-[#4EA9D5] font-medium px-2 py-1 rounded border border-[#0A306D]/20 hover:border-[#4EA9D5]/40 transition-colors"
            >
              {i18n.language === "lv" ? "EN" : "LV"}
            </button>
      
            {!isProduction && (
              <Link
                to="/app"
                className="bg-[#0A306D] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#36598B] transition-colors"
              >
                {t("website.nav.goToApp")}
              </Link>
            )}

            <div className="relative group">
              <Link
                to={isAuthenticated ? "/cabinet" : "/signin"}
                aria-label={t("website.nav.cabinet", { defaultValue: "Cabinet" })}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                  isActive("/cabinet")
                    ? "border-[#4EA9D5] text-[#4EA9D5] bg-[#4EA9D5]/10"
                    : "border-[#0A306D]/20 text-[#0A306D] hover:text-[#4EA9D5] hover:border-[#4EA9D5]/40"
                }`}
              >
                <UserOutlined />
              </Link>

              <div
                className="
                  absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg
                  opacity-0 invisible group-hover:opacity-100 group-hover:visible
                  group-focus-within:opacity-100 group-focus-within:visible
                  transition-all duration-150 z-50 overflow-hidden
                "
              >
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/cabinet"
                      className="block px-3 py-2 text-sm text-[#0A306D] hover:bg-gray-50"
                    >
                      {t("website.nav.cabinet", { defaultValue: "Cabinet" })}
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      {t("website.nav.logout", { defaultValue: "Log out" })}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signin"
                      className="block px-3 py-2 text-sm text-[#0A306D] hover:bg-gray-50"
                    >
                      {t("website.nav.signIn", { defaultValue: "Sign in" })}
                    </Link>
                    <Link
                      to="/signup"
                      className="block px-3 py-2 text-sm text-[#0A306D] hover:bg-gray-50"
                    >
                      {t("website.nav.signUp", { defaultValue: "Sign up" })}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg className="w-6 h-6 text-[#0A306D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive(link.to) ? "bg-[#4EA9D5]/10 text-[#4EA9D5]" : "text-[#0A306D] hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 pt-2 flex items-center gap-3 px-3">
              <button onClick={toggleLang} className="text-sm text-[#0A306D] font-medium">
                {i18n.language === "lv" ? "EN" : "LV"}
              </button>
              
              {!isProduction && (
                <Link
                  to="/app"
                  onClick={() => setMobileOpen(false)}
                  className="bg-[#0A306D] text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {t("website.nav.goToApp")}
                </Link>
              )}

              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/cabinet"
                      onClick={() => setMobileOpen(false)}
                      aria-label={t("website.nav.cabinet", { defaultValue: "Cabinet" })}
                      className="w-9 h-9 rounded-full border border-[#0A306D]/20 text-[#0A306D] flex items-center justify-center"
                    >
                      <UserOutlined />
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                      className="text-sm text-red-600 font-medium"
                    >
                      {t("website.nav.logout", { defaultValue: "Log out" })}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signin"
                      onClick={() => setMobileOpen(false)}
                      className="text-sm text-[#0A306D] font-medium"
                    >
                      {t("website.nav.signIn", { defaultValue: "Sign in" })}
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="text-sm text-[#0A306D] font-medium"
                    >
                      {t("website.nav.signUp", { defaultValue: "Sign up" })}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
