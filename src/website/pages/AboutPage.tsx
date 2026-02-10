import React from "react";
import { useTranslation } from "react-i18next";
import Logo from "@/assets/Logo.png";

const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  const values = [
    { icon: "🔧", title: t("website.about.value1Title"), desc: t("website.about.value1Desc") },
    { icon: "🌱", title: t("website.about.value2Title"), desc: t("website.about.value2Desc") },
    { icon: "🤝", title: t("website.about.value3Title"), desc: t("website.about.value3Desc") },
    { icon: "🎓", title: t("website.about.value4Title"), desc: t("website.about.value4Desc") },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0A306D] to-[#36598B] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <img src={Logo} alt="E-ES" className="w-24 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t("website.about.title")}</h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">{t("website.about.subtitle")}</p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#0A306D] mb-6">{t("website.about.missionTitle")}</h2>
          <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
            {t("website.about.missionText")}
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-[#0A306D] mb-12">
            {t("website.about.valuesTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 text-center shadow-md border border-gray-100">
                <div className="text-4xl mb-3">{v.icon}</div>
                <h3 className="text-lg font-bold text-[#0A306D] mb-2">{v.title}</h3>
                <p className="text-gray-600 text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* History */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#0A306D] mb-6">{t("website.about.historyTitle")}</h2>
          <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
            {t("website.about.historyText")}
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-[#0A306D] mb-4">{t("website.about.contactTitle")}</h2>
          <p className="text-gray-600 mb-6">{t("website.about.contactText")}</p>
          <a
            href="mailto:info@e-es.lv"
            className="inline-block bg-[#0A306D] text-white px-8 py-3 rounded-xl font-medium hover:bg-[#36598B] transition-colors"
          >
            info@e-es.lv
          </a>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
