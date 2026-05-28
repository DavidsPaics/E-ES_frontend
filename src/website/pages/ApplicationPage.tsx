import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Input,
  Modal,
  Spin,
  Table,
  Tag,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FormOutlined,
  SearchOutlined,
  SyncOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import { ENDPOINT_TEAMS } from "@/webapp/config/endpoints";
import RegistrationForm from "../components/RegistrationForm";
import { formatDisplayDate } from "@/utils/dateFormat";
import { type VehicleDocument } from "@/shared/cabinet/store";

const isProduction = import.meta.env.PROD;

type ApplicationStatus = "accepted" | "denied" | "in_process";

interface ApplicantMember {
  id: string;
  fullName: string;
  role?: string;
  school?: string;
  grade?: string;
  aboutMe?: string;
  profilePicture?: string;
}

interface Applicant {
  id: string;
  teamId: string;
  teamName: string;
  school: string;
  members: ApplicantMember[];
  supervisor: string;
  appliedAt: string;
  status: ApplicationStatus;
  teamDescription?: string;
  teamProfilePicture?: string;
  vehicleDescription?: string;
  vehiclePictures: string[];
  teamDocuments: VehicleDocument[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function firstNonEmpty(values: unknown[], fallback = ""): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return fallback;
}

function toTeamId(teamName: string, fallback: string): string {
  const slug = teamName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function normalizeStatus(value: unknown): ApplicationStatus {
  if (value === "accepted" || value === "denied" || value === "in_process") return value;
  if (value === "pending") return "in_process";
  return "in_process";
}

function normalizeMembers(rawMembers: unknown, teamId: string): ApplicantMember[] {
  if (!Array.isArray(rawMembers)) return [];

  return rawMembers
    .map((item, index) => {
      if (!isRecord(item)) return null;
      const fullName = firstNonEmpty([item.fullName, item.name], "");
      if (!fullName) return null;

      return {
        id: firstNonEmpty(
          [item.id, item.userId, item.key],
          `${teamId}-member-${index + 1}`
        ),
        fullName,
        role: firstNonEmpty([item.role], ""),
        school: firstNonEmpty([item.educationalInstitution, item.school], ""),
        grade: firstNonEmpty([item.classOrYear, item.grade], ""),
        aboutMe: firstNonEmpty([item.aboutMe, item.bio], ""),
        profilePicture: firstNonEmpty([item.profilePicture, item.avatar], ""),
      } as ApplicantMember;
    })
    .filter((member): member is ApplicantMember => member !== null);
}

function normalizeApplicant(value: unknown, index: number): Applicant | null {
  if (!isRecord(value)) return null;

  const teamName = firstNonEmpty(
    [value.teamName, value.komandasNosaukums, value.team, value.name],
    `Team ${index + 1}`
  );
  const teamId = firstNonEmpty(
    [
      value.teamId,
      value.key,
      isRecord(value.team) ? value.team.id : undefined,
      isRecord(value.team) ? value.team.key : undefined,
    ],
    toTeamId(teamName, `team-${index + 1}`)
  );

  const responsiblePerson = isRecord(value.responsiblePerson)
    ? value.responsiblePerson
    : undefined;

  let members = normalizeMembers(value.members, teamId);
  const memberCountFromApi = Number(
    isRecord(value.members) ? NaN : (value.memberCount ?? value.membersCount ?? value.members)
  );
  if (members.length === 0 && Number.isFinite(memberCountFromApi) && memberCountFromApi > 0) {
    members = Array.from({ length: memberCountFromApi }).map((_, idx) => ({
      id: `${teamId}-member-${idx + 1}`,
      fullName: `Member ${idx + 1}`,  
    }));
  }

  return {
    id: firstNonEmpty([value.key, value.id, value._id], `application-${index + 1}`),
    teamId,
    teamName,
    school: firstNonEmpty([value.school, value.institution, value.educationalInstitution], "-"),
    members,
    supervisor: firstNonEmpty(
      [value.supervisor, responsiblePerson?.fullName, value.responsibleName],
      "-"
    ),
    appliedAt: firstNonEmpty(
      [value.appliedAt, value.createdAt, value.submittedAt, value.date],
      new Date().toISOString()
    ),
    status: normalizeStatus(value.status),
    teamDescription: firstNonEmpty(
      [value.teamDescription, isRecord(value.team) ? value.team.description : undefined],
      ""
    ),
    teamProfilePicture: firstNonEmpty(
      [value.teamProfilePicture, isRecord(value.team) ? value.team.profilePicture : undefined],
      ""
    ),
    vehicleDescription: firstNonEmpty(
      [value.vehicleDescription, isRecord(value.team) ? value.team.vehicleDescription : undefined],
      ""
    ),
    vehiclePictures: Array.isArray(value.vehiclePictures)
      ? value.vehiclePictures.filter((item): item is string => typeof item === "string")
      : [],
    teamDocuments: Array.isArray(value.vehicleDocuments)
      ? value.vehicleDocuments
          .filter((item): item is Record<string, unknown> => isRecord(item))
          .map((item, docIndex) => ({
            id: firstNonEmpty([item.id], `${teamId}-doc-${docIndex + 1}`),
            name: firstNonEmpty([item.name], `Document ${docIndex + 1}`),
            type: firstNonEmpty([item.type], ""),
            dataUrl: firstNonEmpty([item.dataUrl, item.url], ""),
            uploadedAt: firstNonEmpty([item.uploadedAt], ""),
          }))
      : [],
  };
}

const ApplicationPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formModalOpen, setFormModalOpen] = useState(false);

  const OPEN_DATE = new Date("2026-04-01T00:00:00");
  const CLOSE_DATE = new Date("2026-05-25T23:59:59");

  const isApplicationOpen = () => {
    const now = new Date();
    return now >= OPEN_DATE && now <= CLOSE_DATE;
  };

  const hasNotOpenedYet = () => {
    const now = new Date();
    return now < OPEN_DATE;
  };

  const isOpen = isApplicationOpen();
  const notOpenedYet = hasNotOpenedYet();

  const fetchApplicants = () => {
    setLoading(true);

    fetch(ENDPOINT_TEAMS)
      .then((res) => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then((payload: unknown) => {
        const rawItems = Array.isArray(payload)
          ? payload
          : isRecord(payload) && Array.isArray(payload.data)
            ? payload.data
            : isRecord(payload) && Array.isArray(payload.applications)
              ? payload.applications
              : isRecord(payload) && Array.isArray(payload.teams)
                ? payload.teams
                : [];

        const normalized = rawItems
          .map((item, index) => normalizeApplicant(item, index))
          .filter((item): item is Applicant => item !== null);

        setApplicants(normalized);
      })
      .catch(() => {
        setApplicants([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  const statusConfig: Record<
    Applicant["status"],
    { color: string; icon: React.ReactNode; label: string }
  > = {
    accepted: {
      color: "green",
      icon: <CheckCircleOutlined />,
      label: t("website.apply.statusAccepted"),
    },
    denied: {
      color: "red",
      icon: <CloseCircleOutlined />,
      label: t("website.apply.statusDenied"),
    },
    in_process: {
      color: "blue",
      icon: <SyncOutlined spin />,
      label: t("website.apply.statusInProcess"),
    },
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return applicants.filter((applicant) => {
      if (!query) return true;
      const inTeam = applicant.teamName.toLowerCase().includes(query);
      const inSchool = applicant.school.toLowerCase().includes(query);
      return inTeam || inSchool;
    });
  }, [applicants, search]);

  const columns = [
    {
      title: t("website.apply.colTeam"),
      dataIndex: "teamName",
      key: "teamName",
      render: (_: string, record: Applicant) =>
        isProduction ? (
          <span className="font-semibold text-[#0A306D]">{record.teamName}</span>
        ) : (
          <Button
            type="link"
            className="!px-0 !font-semibold !text-[#0A306D]"
            onClick={() =>
              navigate(`/team/${encodeURIComponent(record.teamId)}`, {
                state: { applicant: record },
              })
            }
          >
            {record.teamName}
          </Button>
        ),
    },
    {
      title: t("website.apply.colSchool"),
      dataIndex: "school",
      key: "school",
      responsive: ["md" as const],
    },
    {
      title: t("website.apply.colMembers"),
      key: "members",
      width: 100,
      render: (_: unknown, record: Applicant) => (
        <div className="font-medium">{record.members.length || 4}</div>
      ),
    },
    {
      title: t("website.apply.colDate"),
      dataIndex: "appliedAt",
      key: "appliedAt",
      width: 140,
      responsive: ["sm" as const],
      render: (value: string) => formatDisplayDate(value),
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
      <section className="bg-gradient-to-br from-[#0A306D] to-[#36598B] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{t("website.apply.title")}</h1>
          <p className="text-xl text-white/70">{t("website.apply.subtitle")}</p>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-14 h-14 rounded-xl bg-[#4EA9D5]/10 flex items-center justify-center flex-shrink-0">
                <FormOutlined className="text-[#4EA9D5] text-2xl" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#0A306D] mb-2">{t("website.apply.summaryTitle")}</h2>
                <p className="text-gray-600 leading-relaxed">{t("website.apply.summaryText")}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {isOpen ? (
                <>
                  <Button
                    type="primary"
                    size="large"
                    icon={<FormOutlined />}
                    onClick={() => setFormModalOpen(true)}
                    className="bg-[#0A306D] hover:!bg-[#36598B] h-auto px-8 py-3 text-lg font-bold shadow-lg"
                  >
                    {t("website.apply.openForm")}
                  </Button>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-700 font-medium">{t("website.apply.open")}</span>
                    <span className="text-gray-400 mx-1">·</span>
                    <span className="text-gray-500">
                      {t("website.apply.deadline")}: {formatDisplayDate(CLOSE_DATE)}
                    </span>
                  </div>
                </>
              ) : notOpenedYet ? (
                <div className="w-full">
                  <Alert
                    type="info"
                    showIcon
                    icon={<FormOutlined />}
                    message={t("website.apply.notYetOpenMessage")}
                    description={
                      <div className="mt-3 space-y-2">
                        <p>{t("website.apply.notYetOpenDescription")}</p>
                        <p className="font-semibold text-base">{t("website.apply.openingDate")}</p>
                      </div>
                    }
                  />
                </div>
              ) : (
                <div className="w-full">
                  <Alert
                    type="warning"
                    showIcon
                    icon={<WarningOutlined />}
                    message={t("website.apply.closedMessage")}
                    description={
                      <div className="mt-3 space-y-2">
                        <p>{t("website.apply.closedDescription")}</p>
                        <p className="font-semibold text-base">
                          <a href="mailto:energorace@gmail.com" className="text-[#0A306D] hover:underline">
                            {t("website.apply.emailAddress")}
                          </a>
                        </p>
                        <p className="text-sm mt-3">{t("website.apply.requiredInfo")}</p>
                      </div>
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-[#0A306D]">{t("website.apply.participantsTitle")}</h2>
            <Input
              prefix={<SearchOutlined className="text-gray-400" />}
              placeholder={t("website.apply.searchPlaceholder")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full sm:w-72"
              allowClear
            />
          </div>

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

      {isOpen && (
        <Modal
          open={formModalOpen}
          onCancel={() => setFormModalOpen(false)}
          footer={null}
          width={900}
          title={t("website.apply.form.title")}
          destroyOnClose
          className="registration-modal"
        >
          <RegistrationForm
            onSuccess={() => {
              setFormModalOpen(false);
              fetchApplicants();
            }}
            onCancel={() => setFormModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default ApplicationPage;
