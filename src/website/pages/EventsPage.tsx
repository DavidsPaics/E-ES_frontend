import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getEvents, type CompetitionEvent } from "@/website/data/eventsData";

const EventsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "en" | "lv";
  const [events, setEvents] = useState<CompetitionEvent[]>([]);
  const [filter, setFilter] = useState<"all" | "upcoming" | "ongoing" | "completed">("all");

  useEffect(() => {
    setEvents(filter === "all" ? getEvents() : getEvents(filter));
  }, [filter]);

  const statusColors: Record<string, string> = {
    upcoming: "bg-blue-100 text-blue-700",
    ongoing: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-500",
  };

  const statusLabels: Record<string, string> = {
    upcoming: t("website.events.statusUpcoming"),
    ongoing: t("website.events.statusOngoing"),
    completed: t("website.events.statusCompleted"),
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0A306D] to-[#36598B] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t("website.events.title")}</h1>
          <p className="text-xl text-white/70">{t("website.events.subtitle")}</p>
        </div>
      </section>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {(["all", "upcoming", "ongoing", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-[#0A306D] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? t("website.events.filterAll") : statusLabels[f]}
            </button>
          ))}
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <p className="text-gray-400 italic text-center py-16">{t("website.events.noEvents")}</p>
        ) : (
          <div className="space-y-6">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  {/* Date badge */}
                  <div className="flex-shrink-0 bg-[#0A306D] text-white rounded-xl p-4 text-center min-w-[100px]">
                    <div className="text-3xl font-bold">
                      {new Date(evt.date).getDate()}
                    </div>
                    <div className="text-sm text-white/70">
                      {new Date(evt.date).toLocaleDateString(lang === "lv" ? "lv-LV" : "en-GB", {
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-[#0A306D]">
                        {evt.title[lang] || evt.title.en}
                      </h2>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[evt.status]}`}>
                        {statusLabels[evt.status]}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                      <span>📍 {evt.location[lang] || evt.location.en}</span>
                      <span>
                        📅{" "}
                        {new Date(evt.date).toLocaleDateString(lang === "lv" ? "lv-LV" : "en-GB", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                        {evt.endDate && (
                          <>
                            {" – "}
                            {new Date(evt.endDate).toLocaleDateString(lang === "lv" ? "lv-LV" : "en-GB", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </>
                        )}
                      </span>
                    </div>

                    <p className="text-gray-600 leading-relaxed">
                      {evt.description[lang] || evt.description.en}
                    </p>

                    {evt.registrationUrl && evt.status === "upcoming" && (
                      <a
                        href={evt.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-4 bg-[#4EA9D5] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#3d8ab3] transition-colors"
                      >
                        {t("website.events.register")} →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
