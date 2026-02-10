import React from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileImageOutlined, FilePdfOutlined, FileOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import { getArticle } from "@/website/data/newsStore";

const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "en" | "lv";

  const article = id ? getArticle(id) : undefined;

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-[#0A306D] mb-4">{t("website.news.notFound")}</h1>
        <Link to="/news" className="text-[#4EA9D5] hover:underline">
          ← {t("website.news.backToNews")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/news" className="text-[#4EA9D5] hover:underline text-sm mb-6 inline-block">
        ← {t("website.news.backToNews")}
      </Link>

      {article.image && (
        <div className="rounded-2xl overflow-hidden mb-8 h-64 md:h-80">
          <img
            src={article.image}
            alt={article.title[lang] || article.title.en}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {article.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs bg-[#4EA9D5]/10 text-[#4EA9D5] px-3 py-1 rounded-full font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      <h1 className="text-3xl md:text-4xl font-extrabold text-[#0A306D] mb-4">
        {article.title[lang] || article.title.en}
      </h1>

      <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-6 border-b border-gray-200">
        <span>
          {t("website.news.by")} <strong className="text-gray-600">{article.author}</strong>
        </span>
        <span>
          {new Date(article.date).toLocaleDateString(lang === "lv" ? "lv-LV" : "en-GB", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      <div className="prose prose-lg max-w-none text-gray-700">
        {(article.content[lang] || article.content.en).split("\n").map((paragraph, i) => {
          if (!paragraph.trim()) return <br key={i} />;
          if (paragraph.startsWith("•")) {
            return (
              <li key={i} className="ml-4 mb-1">
                {paragraph.slice(1).trim()}
              </li>
            );
          }
          return (
            <p key={i} className="mb-4">
              {paragraph}
            </p>
          );
        })}
      </div>

      {/* Attachments */}
      {article.attachments && article.attachments.length > 0 && (
        <div className="mt-10 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-bold text-[#0A306D] mb-4">{t("website.newsAdmin.attachments")}</h3>
          <div className="flex flex-wrap gap-3">
            {article.attachments.map((att, i) => {
              const icon = att.type.startsWith("image/")
                ? <FileImageOutlined className="text-blue-500" />
                : att.type === "application/pdf"
                  ? <FilePdfOutlined className="text-red-500" />
                  : <FileOutlined className="text-gray-500" />;
              return (
                <a
                  key={i}
                  href={att.dataUrl}
                  download={att.name}
                  className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 text-sm hover:bg-gray-200 transition-colors"
                >
                  {icon}
                  <span className="text-gray-700">{att.name}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsDetailPage;
