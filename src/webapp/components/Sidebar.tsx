import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/webapp/authentification/AuthContext";
import { useTranslation } from "react-i18next";
import Logo from "@/assets/Logo.png";
import { useSidebar } from "./SidebarContext";
import {
  HomeOutlined,
  TrophyOutlined,
  BarChartOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  BgColorsOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  FileTextOutlined,
  FlagOutlined,
  ThunderboltOutlined,
  CarOutlined,
  AimOutlined,
  DragOutlined,
  StopOutlined,
  StarOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GlobalOutlined,
  ArrowLeftOutlined,
  AppstoreOutlined,
  MenuOutlined,
  CloseOutlined,
  DesktopOutlined,
  FileSearchOutlined,
} from "@ant-design/icons";
import { Tooltip } from "antd";

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  action?: () => void;
  adminOnly?: boolean;
  hideWhenAuth?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const Sidebar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { collapsed, setCollapsed } = useSidebar();
  const isWebappAdmin = isAuthenticated;

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "lv" ? "en" : "lv");
  };

  const navGroups: NavGroup[] = [
    {
      title: t("nav.navigation"),
      items: [
        { key: "home", label: t("nav.home"), icon: <HomeOutlined />, path: "/app" },
        { key: "leaderboard", label: t("nav.leaderboard"), icon: <TrophyOutlined />, path: "/app/leaderboard" },
        { key: "results", label: t("nav.results"), icon: <BarChartOutlined />, path: "/app/results" },
        { key: "live-data", label: t("nav.liveData"), icon: <DashboardOutlined />, path: "/app/live-data" },
        { key: "test", label: t("nav.test"), icon: <ExperimentOutlined />, path: "/app/test" },
        { key: "palette", label: t("nav.palette"), icon: <BgColorsOutlined />, path: "/app/palette" },
      ],
    },
    {
      title: t("nav.admin"),
      items: [
        { key: "admin", label: t("nav.admin"), icon: <SettingOutlined />, path: "/app/admin", adminOnly: true },
        { key: "news-admin", label: t("website.newsAdmin.manageTitle"), icon: <FileTextOutlined />, path: "/app/news-admin", adminOnly: true },
        {
          key: "applications-review",
          label: t("webapp.applicationReview.title"),
          icon: <FileSearchOutlined />,
          path: "/app/applications-review",
          adminOnly: true,
        },
        { key: "race-configuration", label: t("nav.raceConfig"), icon: <FlagOutlined />, path: "/app/race-configuration", adminOnly: true },
        { key: "points", label: t("nav.points"), icon: <StarOutlined />, path: "/app/points", adminOnly: true },
      ],
    },
    {
      title: t("categories.categories"),
      items: [
        { key: "eko-race", label: t("categories.efficiencyRace"), icon: <ThunderboltOutlined />, path: "/app/Category/EkoRace", adminOnly: true },
        { key: "main-race", label: t("categories.finalRace"), icon: <CarOutlined />, path: "/app/Category/MainRace", adminOnly: true },
        { key: "shuttle-run", label: t("categories.shuttleRun"), icon: <AimOutlined />, path: "/app/Category/ShuttleRun", adminOnly: true },
        { key: "steering-test", label: t("categories.figureDriving"), icon: <DragOutlined />, path: "/app/Category/SteeringTest", adminOnly: true },
        { key: "drag-race", label: t("categories.dragRace"), icon: <AppstoreOutlined />, path: "/app/Category/DragRace", adminOnly: true },
        { key: "braking-test", label: t("categories.brakingTest"), icon: <StopOutlined />, path: "/app/Category/BrakingTest", adminOnly: true },
      ],
    },
    {
      title: "TV Displays",
      items: [
        { key: "tv-leaderboard", label: "Leaderboard TV", icon: <DesktopOutlined />, path: "/app/tv/leaderboard", adminOnly: true },
        { key: "tv-results", label: "Results TV", icon: <DesktopOutlined />, path: "/app/tv/results", adminOnly: true },
        { key: "tv-live-data", label: "Live Data TV", icon: <DesktopOutlined />, path: "/app/tv/live-data", adminOnly: true },
      ],
    },
  ];

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(path);
  };

  const handleClick = (item: NavItem) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const renderItem = (item: NavItem) => {
    if (item.adminOnly && !isWebappAdmin) return null;
    if (item.hideWhenAuth && isAuthenticated) return null;

    const active = isActive(item.path);
    const content = (
      <button
        key={item.key}
        onClick={() => handleClick(item)}
        className={`
          group flex items-center gap-3 w-full rounded-lg text-sm font-medium
          transition-all duration-200 outline-none
          ${collapsed ? "justify-center px-3 py-2.5" : "px-3 py-2.5"}
          ${
            active
              ? "bg-[#4EA9D5]/20 text-[#4EA9D5] shadow-sm shadow-[#4EA9D5]/10"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          }
        `}
      >
        <span className={`text-lg flex-shrink-0 ${active ? "text-[#4EA9D5]" : "text-white/50 group-hover:text-white/80"}`}>
          {item.icon}
        </span>
        {!collapsed && (
          <span className="truncate">{item.label}</span>
        )}
        {!collapsed && active && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4EA9D5]" />
        )}
      </button>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.key} title={item.label} placement="right" color="#36598B">
          {content}
        </Tooltip>
      );
    }
    return <React.Fragment key={item.key}>{content}</React.Fragment>;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden sm:flex fixed top-0 left-0 h-screen z-40 flex-col
          bg-gradient-to-b from-[#0A306D] to-[#0d2451]
          border-r border-white/5 shadow-xl
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-[68px]" : "w-[240px]"}
        `}
      >
      {/* ── Logo / Brand ── */}
      <div className={`flex items-center gap-3 p-4 border-b border-white/10 ${collapsed ? "justify-center" : ""}`}>
        <img src={Logo} alt="E-ES" className="w-9 h-9 rounded-lg object-contain" />
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-white font-bold text-base leading-tight">E-ES</span>
            <span className="text-white/40 text-[10px] tracking-wider uppercase">Webapp</span>
          </div>
        )}
      </div>

      {/* ── Nav Groups ── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => (!item.adminOnly || isWebappAdmin) && (!item.hideWhenAuth || !isAuthenticated)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  {group.title}
                </p>
              )}
              {collapsed && <div className="mx-auto w-6 h-px bg-white/10 mb-2" />}
              <div className="space-y-0.5">
                {visibleItems.map(renderItem)}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Bottom Actions ── */}
      <div className="border-t border-white/10 px-2 py-3 space-y-0.5">
        {/* Language Toggle */}
        {renderItem({
          key: "lang",
          label: i18n.language === "lv" ? "English" : "Latviešu",
          icon: <GlobalOutlined />,
          action: toggleLanguage,
        })}

        {/* Login / Logout */}
        {!isAuthenticated
          ? renderItem({
              key: "login",
              label: t("nav.login"),
              icon: <LoginOutlined />,
              path: "/signin",
            })
          : renderItem({
              key: "logout",
              label: t("nav.logout"),
              icon: <LogoutOutlined />,
              action: logout,
            })}

        {/* Back to Website */}
        {renderItem({
          key: "website",
          label: t("website.nav.home"),
          icon: <ArrowLeftOutlined />,
          path: "/",
        })}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <span className="text-lg flex-shrink-0">
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>

    {/* Mobile Header */}
    <div className="sm:hidden fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-[#0A306D] to-[#0d2451] border-b border-white/10 h-16 flex items-center px-4">
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="text-white text-xl hover:text-[#4EA9D5] transition-colors"
      >
        {mobileOpen ? <CloseOutlined /> : <MenuOutlined />}
      </button>
      <img src={Logo} alt="E-ES" className="w-8 h-8 rounded-lg mx-3" />
      <span className="text-white font-bold">E-ES</span>
    </div>

    {/* Mobile Drawer Overlay */}
    {mobileOpen && (
      <div
        className="sm:hidden fixed inset-0 bg-black/30 z-30 top-16"
        onClick={() => setMobileOpen(false)}
      />
    )}

    {/* Mobile Drawer */}
    <div
      className={`sm:hidden fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-gradient-to-b from-[#0A306D] to-[#0d2451] z-30 flex flex-col overflow-y-auto transition-transform duration-300 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => (!item.adminOnly || isWebappAdmin) && (!item.hideWhenAuth || !isAuthenticated)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  if (item.adminOnly && !isWebappAdmin) return null;
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        handleClick(item);
                        setMobileOpen(false);
                      }}
                      className={`
                        group flex items-center gap-3 w-full rounded-lg text-sm font-medium px-3 py-2.5
                        transition-all duration-200 outline-none
                        ${
                          active
                            ? "bg-[#4EA9D5]/20 text-[#4EA9D5] shadow-sm shadow-[#4EA9D5]/10"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        }
                      `}
                    >
                      <span className={`text-lg flex-shrink-0 ${active ? "text-[#4EA9D5]" : "text-white/50 group-hover:text-white/80"}`}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                      {active && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4EA9D5]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-white/10 px-2 py-3 space-y-0.5">
        <button
          onClick={() => {
            toggleLanguage();
            setMobileOpen(false);
          }}
          className="group flex items-center gap-3 w-full rounded-lg text-sm font-medium px-3 py-2.5 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200 outline-none"
        >
          <span className="text-lg flex-shrink-0 text-white/50 group-hover:text-white/80">
            <GlobalOutlined />
          </span>
          <span>{i18n.language === "lv" ? "English" : "Latviešu"}</span>
        </button>

        {!isAuthenticated ? (
          <button
            onClick={() => {
              navigate("/signin");
              setMobileOpen(false);
            }}
            className="group flex items-center gap-3 w-full rounded-lg text-sm font-medium px-3 py-2.5 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200 outline-none"
          >
            <span className="text-lg flex-shrink-0 text-white/50 group-hover:text-white/80">
              <LoginOutlined />
            </span>
            <span>{t("nav.login")}</span>
          </button>
        ) : (
          <button
            onClick={() => {
              logout();
              setMobileOpen(false);
            }}
            className="group flex items-center gap-3 w-full rounded-lg text-sm font-medium px-3 py-2.5 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200 outline-none"
          >
            <span className="text-lg flex-shrink-0 text-white/50 group-hover:text-white/80">
              <LogoutOutlined />
            </span>
            <span>{t("nav.logout")}</span>
          </button>
        )}

        <button
          onClick={() => {
            navigate("/");
            setMobileOpen(false);
          }}
          className="group flex items-center gap-3 w-full rounded-lg text-sm font-medium px-3 py-2.5 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200 outline-none"
        >
          <span className="text-lg flex-shrink-0 text-white/50 group-hover:text-white/80">
            <ArrowLeftOutlined />
          </span>
          <span>{t("website.nav.home")}</span>
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
