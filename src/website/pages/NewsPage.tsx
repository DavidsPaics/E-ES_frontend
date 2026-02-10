import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getArticles, type NewsArticle } from "@/website/data/newsStore";

const NewsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "en" | "lv";
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    setArticles(getArticles(true));
  }, []);

  const allTags = Array.from(new Set(articles.flatMap((a) => a.tags)));
  const filtered = selectedTag ? articles.filter((a) => a.tags.includes(selectedTag)) : articles;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-[#0A306D] mb-2">{t("website.news.title")}</h1>
        <p className="text-gray-500">{t("website.news.subtitle")}</p>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !selectedTag
                ? "bg-[#0A306D] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t("website.news.all")}
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedTag === tag
                  ? "bg-[#4EA9D5] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Articles Grid */}
      {filtered.length === 0 ? (
        <p className="text-gray-400 italic text-center py-16">{t("website.news.noNews")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((article) => (
            <Link
              key={article.id}
              to={`/news/${article.id}`}
              className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow group"
            >
              {article.image ? (
                <div className="h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title[lang] || article.title.en}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-[#0A306D] to-[#4EA9D5] flex items-center justify-center">
                  <span className="text-6xl opacity-30">📰</span>
                </div>
              )}
              <div className="p-6">
                <div className="flex gap-2 mb-2">
                  {article.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-[#4EA9D5]/10 text-[#4EA9D5] px-2 py-0.5 rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-lg font-bold text-[#0A306D] mb-2 group-hover:text-[#4EA9D5] transition-colors">
                  {article.title[lang] || article.title.en}
                </h2>
                <p className="text-gray-500 text-sm line-clamp-3 mb-3">
                  {article.summary[lang] || article.summary.en}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{article.author}</span>
                  <span>
                    {new Date(article.date).toLocaleDateString(lang === "lv" ? "lv-LV" : "en-GB", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsPage;
