import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Table, Tag, Spin, Input } from "antd";
import { TeamOutlined, SearchOutlined, FormOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import { ENDPOINT_APPLICATIONS } from "@/webapp/config/endpoints";

interface Applicant {
  id: string;
  teamName: string;
  school: string;
  members: number;
  supervisor: string;
  appliedAt: string;
  status: "accepted" | "denied" | "in_process";
}

// ── Fake seed data used when the server is unreachable ──────────
const FAKE_APPLICANTS: Applicant[] = [
  { id: "1", teamName: "Volt Racers", school: "Rīgas Valsts 1. ģimnāzija", members: 4, supervisor: "A. Bērziņš", appliedAt: "2026-01-20", status: "accepted" },
  { id: "2", teamName: "E-Motion", school: "Jelgavas Tehnoloģiju vidusskola", members: 5, supervisor: "I. Kalniņa", appliedAt: "2026-01-25", status: "accepted" },
  { id: "3", teamName: "Thunder Bolts", school: "Liepājas Valsts 1. ģimnāzija", members: 3, supervisor: "M. Ozoliņš", appliedAt: "2026-02-01", status: "in_process" },
  { id: "4", teamName: "Spark Squad", school: "Ventspils Tehnikums", members: 6, supervisor: "K. Jansons", appliedAt: "2026-02-03", status: "in_process" },
  { id: "5", teamName: "Green Wheels", school: "Daugavpils Universitāte", members: 4, supervisor: "S. Liepiņa", appliedAt: "2026-02-05", status: "accepted" },
  { id: "6", teamName: "Circuit Breakers", school: "Ogres Tehnikums", members: 5, supervisor: "R. Vītols", appliedAt: "2026-02-07", status: "denied" },
  { id: "7", teamName: "Watt's Up", school: "Rīgas Tehniskā universitāte", members: 4, supervisor: "J. Lācis", appliedAt: "2026-02-08", status: "in_process" },
];

const ApplicationPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "en" | "lv";

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const googleFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSd8DkWBFwrYVwxFVHqMDa3hR7gw028b-yvfmnk6ZewvDXspbw/viewform?usp=publish-editor";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(ENDPOINT_APPLICATIONS)
      .then((res) => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then((data: Applicant[]) => {
        if (!cancelled) setApplicants(data);
      })
      .catch(() => {
        if (!cancelled) setApplicants(FAKE_APPLICANTS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const statusConfig: Record<Applicant["status"], { color: string; icon: React.ReactNode; label: string }> = {
    accepted: { color: "green", icon: <CheckCircleOutlined />, label: t("website.apply.statusAccepted") },
    denied: { color: "red", icon: <CloseCircleOutlined />, label: t("website.apply.statusDenied") },
    in_process: { color: "blue", icon: <SyncOutlined spin />, label: t("website.apply.statusInProcess") },
  };

  const filtered = applicants.filter((a) => {
    const q = search.toLowerCase();
    return a.teamName.toLowerCase().includes(q) || a.school.toLowerCase().includes(q);
  });

  const stats = {
    total: applicants.length,
    accepted: applicants.filter((a) => a.status === "accepted").length,
    inProcess: applicants.filter((a) => a.status === "in_process").length,
    denied: applicants.filter((a) => a.status === "denied").length,
  };

  const columns = [
    {
      title: t("website.apply.colTeam"),
      dataIndex: "teamName",
      key: "teamName",
      render: (name: string) => <span className="font-semibold text-[#0A306D]">{name}</span>,
    },
    {
      title: t("website.apply.colSchool"),
      dataIndex: "school",
      key: "school",
      responsive: ["md" as const],
    },
    {
      title: t("website.apply.colMembers"),
      dataIndex: "members",
      key: "members",
      width: 100,
      align: "center" as const,
    },
    {
      title: t("website.apply.colSupervisor"),
      dataIndex: "supervisor",
      key: "supervisor",
      responsive: ["lg" as const],
    },
    {
      title: t("website.apply.colDate"),
      dataIndex: "appliedAt",
      key: "appliedAt",
      width: 130,
      responsive: ["sm" as const],
    },
    {
      title: t("website.apply.colStatus"),
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: Applicant["status"]) => {
        const cfg = statusConfig[status];
        return (
          <Tag icon={cfg.icon} color={cfg.color} className="flex items-center gap-1 w-fit">
            {cfg.label}
          </Tag>
        );
      },
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0A306D] to-[#36598B] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t("website.apply.title")}</h1>
          <p className="text-xl text-white/70">{t("website.apply.subtitle")}</p>
        </div>
      </section>

      {/* Application Summary + Link */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-14 h-14 rounded-xl bg-[#4EA9D5]/10 flex items-center justify-center flex-shrink-0">
                <FormOutlined className="text-[#4EA9D5] text-2xl" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#0A306D] mb-2">{t("website.apply.summaryTitle")}</h2>
                <p className="text-gray-600 leading-relaxed">
                  {t("website.apply.summaryText")}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
              <a
                href={googleFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#0A306D] text-white px-8 py-3 rounded-xl text-lg font-bold hover:bg-[#36598B] transition-colors shadow-lg"
              >
                <FormOutlined />
                {t("website.apply.openForm")}
              </a>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-700 font-medium">{t("website.apply.open")}</span>
                <span className="text-gray-400 mx-1">·</span>
                <span className="text-gray-500">{t("website.apply.deadline")}: 2026-03-31</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Participants Table */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-[#0A306D]">{t("website.apply.participantsTitle")}</h2>
            <Input
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder={t("website.apply.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-72"
              allowClear
            />
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Spin size="large" />
              </div>
            ) : (
              <Table
                dataSource={filtered}
                columns={columns}
                rowKey="id"
                pagination={filtered.length > 10 ? { pageSize: 10 } : false}
                locale={{ emptyText: t("website.apply.noResults") }}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ApplicationPage;
