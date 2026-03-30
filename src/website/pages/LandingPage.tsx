import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Carousel } from "antd";
import "@ant-design/v5-patch-for-react-19";
import { getArticles } from "@/website/pages/data/newsStore";
import { getEvents } from "@/website/pages/data/eventsData";
import Logo from "@/assets/Logo.png";

// Event photos
import photo1 from "@/assets/photo/IMG_0141.jpg";
import photo2 from "@/assets/photo/IMG_0250.jpg";
import photo3 from "@/assets/photo/IMG_0361.jpg";
import photo4 from "@/assets/photo/IMG_0418.jpg";
import photo5 from "@/assets/photo/IMG_0434.jpg";
import photo6 from "@/assets/photo/IMG_0448.jpg";
import photo7 from "@/assets/photo/IMG_0468.jpg";
import photo8 from "@/assets/photo/IMG_0472.jpg";
import photo9 from "@/assets/photo/IMG_0517.jpg";
import photo10 from "@/assets/photo/IMG_0550.jpg";

const eventPhotos = [photo1, photo2, photo3, photo4, photo5, photo6, photo7, photo8, photo9, photo10];

const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  const articles = getArticles(true).slice(0, 3);
  const events = getEvents("upcoming").slice(0, 3);

  const features = [
    {
      icon: "🏎️",
      title: t("website.landing.feature1Title"),
      desc: t("website.landing.feature1Desc"),
    },
    {
      icon: "⚡",
      title: t("website.landing.feature2Title"),
      desc: t("website.landing.feature2Desc"),
    },
    {
      icon: "🏆",
      title: t("website.landing.feature3Title"),
      desc: t("website.landing.feature3Desc"),
    },
  ];

  return (
    <div>
      {/* ─── Hero Section with Photo Slideshow Background ── */}
      <section className="relative text-white overflow-hidden min-h-[600px] md:min-h-[700px]">
        {/* Slideshow background layer */}
        <div className="absolute inset-0 z-0">
          <Carousel
            autoplay
            autoplaySpeed={5000}
            effect="fade"
            dots={false}
            speed={1500}
            className="h-full [&_.slick-list]:h-full [&_.slick-track]:h-full [&_.slick-slide>div]:h-full"
            style={{ height: "100%" }}
          >
            {eventPhotos.map((src, i) => (
              <div key={i} className="h-full">
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ minHeight: "700px" }}
                />
              </div>
            ))}
          </Carousel>
        </div>

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 z-1 bg-gradient-to-b from-[#0A306D]/75 via-[#0A306D]/60 to-[#0A306D]/80" />

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-40">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 drop-shadow-lg">
                {t("website.landing.heroTitle")}
              </h1>
              <p className="text-lg md:text-xl text-white/85 mb-8 max-w-2xl drop-shadow-md">
                {t("website.landing.heroSubtitle")}
              </p>
            
            </div>
            <div className="flex-shrink-0">
              <img src={Logo} alt="E-ES Logo" className="w-48 md:w-64 drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Section ──────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-[#0A306D]">
            {t("website.landing.featuresTitle")}
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
            {t("website.landing.featuresSubtitle")}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="text-5xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-[#0A306D] mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Upcoming Events ─── Temporarily hidden
      {events.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-bold text-[#0A306D]">
                {t("website.landing.upcomingEvents")}
              </h2>
              <Link to="/events" className="text-[#4EA9D5] font-medium hover:underline">
                {t("website.landing.viewAll")} →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {events.map((evt: CompetitionEvent) => (
                <div
                  key={evt.id}
                  className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-2 text-sm text-[#4EA9D5] font-medium mb-3">
                    <span>📅</span>
                    <span>
                      {formatDisplayDate(evt.date)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#0A306D] mb-2">
                    {evt.title[lang] || evt.title.en}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    📍 {evt.location[lang] || evt.location.en}
                  </p>
                  <p className="text-gray-500 text-sm line-clamp-2">
                    {evt.description[lang] || evt.description.en}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      */}

      {/* ─── Latest News ─── Temporarily hidden
      {articles.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-bold text-[#0A306D]">
                {t("website.landing.latestNews")}
              </h2>
              <Link to="/news" className="text-[#4EA9D5] font-medium hover:underline">
                {t("website.landing.viewAll")} →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.map((article: NewsArticle) => (
                <Link
                  key={article.id}
                  to={`/news/${article.id}`}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow group"
                >
                  {article.image && (
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title[lang] || article.title.en}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex gap-2 mb-2">
                      {article.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-[#4EA9D5]/10 text-[#4EA9D5] px-2 py-0.5 rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-lg font-bold text-[#0A306D] mb-2 group-hover:text-[#4EA9D5] transition-colors">
                      {article.title[lang] || article.title.en}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2">
                      {article.summary[lang] || article.summary.en}
                    </p>
                    <div className="text-xs text-gray-400 mt-3">
                      {formatDisplayDate(article.date)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      */}

      {/* ─── CTA Section ───────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-[#0A306D] to-[#36598B] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("website.landing.ctaTitle")}
          </h2>
          <p className="text-white/70 text-lg mb-8">
            {t("website.landing.ctaSubtitle")}
          </p>
          <Link
            to="/apply"
            className="inline-block bg-white text-[#0A306D] px-10 py-4 rounded-xl text-lg font-bold hover:bg-gray-100 transition-colors shadow-lg"
          >
            {t("website.landing.heroCta")}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
