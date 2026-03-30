import React from "react";
import { useTranslation } from "react-i18next";
import { FilePdfOutlined, DownloadOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";

import rulesLv from "@/assets/pdf/Energo Efektivitātes Sacensību 2026 nolikums.pdf";
import rulesEn from "@/assets/pdf/Energy Efficiency Competition 2026.pdf";

const RulesPage: React.FC = () => {
  const { t, i18n } = useTranslation();

  const pdfFiles = [
    {
      label: "Energo Efektivitātes Sacensību 2026 nolikums",
      lang: "LV",
      href: rulesLv,
    },
    {
      label: "Energy Efficiency Competition 2026",
      lang: "EN",
      href: rulesEn,
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0A306D] to-[#36598B] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t("website.rules.title")}</h1>
          <p className="text-xl text-white/70">{t("website.rules.subtitle")}</p>
        </div>
      </section>

      {/* Summary + PDFs */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quick summary */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-bold text-[#0A306D] mb-4">
              {t("website.rules.summaryTitle")}
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {t("website.rules.summaryContent")}
            </p>
          </div>

          {/* PDF downloads */}
          <h2 className="text-2xl font-bold text-[#0A306D] mb-6 text-center">
            {t("website.rules.documentsTitle")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {pdfFiles.map((pdf) => (
              <a
                key={pdf.lang}
                href={pdf.href}
                download
                className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#4EA9D5] transition-all group"
              >
                <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                  <FilePdfOutlined className="text-red-500 text-2xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#0A306D] truncate">{pdf.label}</div>
                  <div className="text-sm text-gray-500">PDF · {pdf.lang}</div>
                </div>
                <DownloadOutlined className="text-gray-400 group-hover:text-[#4EA9D5] text-lg transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default RulesPage;
