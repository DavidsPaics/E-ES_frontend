import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "@/assets/Logo.png";

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#0A306D] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src={Logo} alt="E-ES" className="h-10 w-auto" />
              <span className="text-xl font-bold">E-ES</span>
            </div>
            <p className="text-white/70 text-sm max-w-md">
              {t("website.footer.description")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[#4EA9D5]">
              {t("website.footer.links")}
            </h4>
            <ul className="space-y-2">
              {/* Temporarily hidden - uncomment when ready
              <li><Link to="/about" className="text-sm text-white/70 hover:text-white transition-colors">{t("website.nav.about")}</Link></li>
              <li><Link to="/news" className="text-sm text-white/70 hover:text-white transition-colors">{t("website.nav.news")}</Link></li>
              <li><Link to="/rules" className="text-sm text-white/70 hover:text-white transition-colors">{t("website.nav.rules")}</Link></li>
              <li><Link to="/events" className="text-sm text-white/70 hover:text-white transition-colors">{t("website.nav.events")}</Link></li>
              */}
              <li><Link to="/" className="text-sm text-white/70 hover:text-white transition-colors">{t("website.nav.home")}</Link></li>
              <li><Link to="/apply" className="text-sm text-white/70 hover:text-white transition-colors">{t("website.nav.apply")}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[#4EA9D5]">
              {t("website.footer.contact")}
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>energorace@gmail.com</li>
              <li>travinsnikita@gmail.com</li>
              <li>ivarsbahmanis@gmail.com</li>
              <li>Riga, Latvia</li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="https://www.facebook.com/jtvees/?locale=lv_LV" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-[#4EA9D5] transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-white/50">
          © {new Date().getFullYear()} E-ES. {t("website.footer.rights")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
