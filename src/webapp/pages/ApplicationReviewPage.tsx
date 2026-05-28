import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Descriptions,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import { useTranslation } from "react-i18next";
import {
  ENDPOINT_ACCOUNTS,
  ENDPOINT_TEAM,
  ENDPOINT_TEAM_APPLICATIONS,
} from "@/webapp/config/endpoints";
import { apiFetch } from "@/webapp/utils/api";
import { formatDisplayDate, formatDisplayTime } from "@/utils/dateFormat";

type ApplicationStatus = "accepted" | "denied" | "in_process";

interface TeamMemberView {
  key: string;
  fullName: string;
  dateOfBirth?: string;
  educationalInstitution?: string;
  phone?: string;
  email?: string;
  role?: string;
  classOrYear?: string;
}

interface ApplicationRecord {
  id: string;
  teamName: string;
  school: string;
  supervisor: string;
  appliedAt: string;
  appliedTime: string;
  appliedAtRaw?: string;
  status: ApplicationStatus;
  ageGroup?: string;
  cityOrRegion?: string;
  responsibleEmail?: string;
  responsiblePhone?: string;
  comments?: string;
  howHeardAbout?: string;
  members: TeamMemberView[];
}

interface AccountOption {
  key: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface TeamAcceptFormValues {
  teamName: string;
  ageGroup?: string;
  institution?: string;
  cityOrRegion?: string;
  responsibleName?: string;
  responsiblePhone?: string;
  responsibleEmail?: string;
  responsibleStatus?: string;
  avatar?: string;
  carId?: string;
}

const { Text } = Typography;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function firstNonEmpty(values: Array<unknown>, fallback = "-"): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return fallback;
}

function normalizeStatus(value: unknown): ApplicationStatus {
  if (value === "accepted" || value === "denied" || value === "in_process") return value;
  if (value === "pending") return "in_process";
  return "in_process";
}

function parseDateParts(rawDate: unknown): { date: string; time: string; raw?: string } {
  if (typeof rawDate !== "string" || rawDate.trim().length === 0) return { date: "-", time: "-" };
  const date = formatDisplayDate(rawDate);
  const time = formatDisplayTime(rawDate);
  if (date === "-") return { date: rawDate, time: "-", raw: rawDate };
  return {
    date,
    time,
    raw: rawDate,
  };
}

function formatAppliedDateTime(date: string, time: string): string {
  if (date !== "-" && time !== "-") return `${date} ${time}`;
  if (date !== "-") return date;
  if (time !== "-") return time;
  return "-";
}

function normalizeMembers(rawMembers: unknown): TeamMemberView[] {
  if (Array.isArray(rawMembers)) {
    return rawMembers
      .map((entry, index) => {
        if (!isRecord(entry)) return null;
        return {
          key: String(entry.key ?? entry.id ?? index),
          fullName: firstNonEmpty([entry.fullName, entry.name], "-"),
          dateOfBirth: typeof entry.dateOfBirth === "string" ? entry.dateOfBirth : undefined,
          educationalInstitution:
            typeof entry.educationalInstitution === "string"
              ? entry.educationalInstitution
              : undefined,
          phone: firstNonEmpty([entry.phone, entry.contactPhone], ""),
          email: firstNonEmpty([entry.email, entry.contactEmail], ""),
          role: typeof entry.role === "string" ? entry.role : undefined,
          classOrYear: typeof entry.classOrYear === "string" ? entry.classOrYear : undefined,
        } as TeamMemberView;
      })
      .filter((m): m is TeamMemberView => m !== null);
  }
  return [];
}

function normalizeApplication(rawValue: unknown, index: number): ApplicationRecord | null {
  if (!isRecord(rawValue)) return null;

  const responsiblePerson = isRecord(rawValue.responsiblePerson) ? rawValue.responsiblePerson : undefined;
  const members = normalizeMembers(rawValue.members);
  const parsedDate = parseDateParts(
    firstNonEmpty(
      [rawValue.appliedAt, rawValue.createdAt, rawValue.submittedAt, rawValue.date],
      ""
    )
  );

  return {
    id: String(rawValue.key ?? rawValue.id ?? rawValue._id ?? `application-${index}`),
    teamName: firstNonEmpty(
      [rawValue.teamName, rawValue.komandasNosaukums, rawValue.team, rawValue.name],
      "Unnamed team"
    ),
    school: firstNonEmpty([rawValue.school, rawValue.institution, rawValue.educationalInstitution]),
    supervisor: firstNonEmpty([
      rawValue.supervisor,
      responsiblePerson?.fullName,
      rawValue.responsibleName,
    ]),
    appliedAt: parsedDate.date,
    appliedTime: parsedDate.time,
    appliedAtRaw: parsedDate.raw,
    status: normalizeStatus(rawValue.status),
    ageGroup: typeof rawValue.ageGroup === "string" ? rawValue.ageGroup : undefined,
    cityOrRegion:
      typeof rawValue.cityOrRegion === "string" ? rawValue.cityOrRegion : undefined,
    responsibleEmail:
      typeof responsiblePerson?.email === "string" ? responsiblePerson.email : undefined,
    responsiblePhone:
      typeof responsiblePerson?.phone === "string" ? responsiblePerson.phone : undefined,
    comments: typeof rawValue.comments === "string" ? rawValue.comments : undefined,
    howHeardAbout:
      typeof rawValue.howHeardAbout === "string" ? rawValue.howHeardAbout : undefined,
    members,
  };
}

function normalizeAccountOption(rawValue: unknown, index: number): AccountOption | null {
  if (!isRecord(rawValue)) return null;
  const data = isRecord(rawValue.dati) ? rawValue.dati : rawValue;
  const key = firstNonEmpty([rawValue.key, rawValue.id, rawValue.ID, data.key, data.id], `account-${index + 1}`);
  const username = firstNonEmpty([rawValue.lietotajvards, rawValue.username, rawValue.epasts], key);
  const fullName = firstNonEmpty([data.fullName, data.name, rawValue.fullName, rawValue.name], username);

  return {
    key,
    username,
    fullName,
    email: firstNonEmpty([rawValue.epasts, rawValue.email, data.email], ""),
    phone: firstNonEmpty([rawValue.telefonanumurs, rawValue.phoneNumber, data.phone, data.phoneNumber], ""),
    role: firstNonEmpty([data.role, rawValue.role], ""),
  };
}

function getArrayPayloadItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  for (const key of ["data", "accounts", "teams", "applications"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function buildExampleApplications(): ApplicationRecord[] {
  return [
    {
      id: "example-1",
      teamName: "Volt Falcons",
      school: "Riga State Gymnasium No. 1",
      supervisor: "Ilze Ozola",
      appliedAt: "26.03.2026",
      appliedTime: "14:35",
      appliedAtRaw: "2026-03-26T14:35:00Z",
      status: "in_process",
      ageGroup: "U16",
      cityOrRegion: "Riga",
      responsibleEmail: "coach@voltfalcons.lv",
      responsiblePhone: "+371 20001001",
      comments: "We can bring our own tools and charger.",
      howHeardAbout: "School STEM club",
      members: [
        {
          key: "1",
          fullName: "Markuss Berzins",
          dateOfBirth: "2011-04-02",
          educationalInstitution: "Riga State Gymnasium No. 1",
          phone: "+371 22000001",
          email: "markuss.berzins@example.com",
          role: "pilot",
          classOrYear: "Grade 9",
        },
        {
          key: "2",
          fullName: "Anna Liepa",
          dateOfBirth: "2011-08-19",
          educationalInstitution: "Riga State Gymnasium No. 1",
          phone: "+371 22000002",
          email: "anna.liepa@example.com",
          role: "reserve_pilot",
          classOrYear: "Grade 9",
        },
        {
          key: "3",
          fullName: "Rihards Ozols",
          dateOfBirth: "2011-01-13",
          educationalInstitution: "Riga State Gymnasium No. 1",
          phone: "+371 22000003",
          email: "rihards.ozols@example.com",
          role: "team_leader",
          classOrYear: "Grade 9",
        },
        {
          key: "4",
          fullName: "Liene Krumina",
          dateOfBirth: "2012-11-05",
          educationalInstitution: "Riga State Gymnasium No. 1",
          phone: "+371 22000004",
          email: "liene.krumina@example.com",
          role: "participant",
          classOrYear: "Grade 8",
        },
      ],
    },
    {
      id: "example-2",
      teamName: "EcoSpark",
      school: "Jelgava Technical School",
      supervisor: "Janis Stalts",
      appliedAt: "24.03.2026",
      appliedTime: "09:12",
      appliedAtRaw: "2026-03-24T09:12:00Z",
      status: "accepted",
      ageGroup: "U25",
      cityOrRegion: "Jelgava",
      responsibleEmail: "mentor@ecospark.lv",
      responsiblePhone: "+371 20001002",
      comments: "",
      howHeardAbout: "Last year's finals",
      members: [
        {
          key: "1",
          fullName: "Edgars Auzins",
          dateOfBirth: "2007-03-20",
          educationalInstitution: "Jelgava Technical School",
          phone: "+371 22000101",
          email: "edgars.auzins@example.com",
          role: "team_leader",
          classOrYear: "Year 2",
        },
        {
          key: "2",
          fullName: "Paula Ziedina",
          dateOfBirth: "2008-07-11",
          educationalInstitution: "Jelgava Technical School",
          phone: "+371 22000102",
          email: "paula.ziedina@example.com",
          role: "pilot",
          classOrYear: "Year 1",
        },
        {
          key: "3",
          fullName: "Niks Berzins",
          dateOfBirth: "2007-12-03",
          educationalInstitution: "Jelgava Technical School",
          phone: "+371 22000103",
          email: "niks.berzins@example.com",
          role: "reserve_pilot",
          classOrYear: "Year 2",
        },
        {
          key: "4",
          fullName: "Santa Lapsa",
          dateOfBirth: "2008-09-14",
          educationalInstitution: "Jelgava Technical School",
          phone: "+371 22000104",
          email: "santa.lapsa@example.com",
          role: "participant",
          classOrYear: "Year 1",
        },
        {
          key: "5",
          fullName: "Karlis Dreimanis",
          dateOfBirth: "2006-05-27",
          educationalInstitution: "Jelgava Technical School",
          phone: "+371 22000105",
          email: "karlis.dreimanis@example.com",
          role: "participant",
          classOrYear: "Year 3",
        },
      ],
    },
    {
      id: "example-3",
      teamName: "Blue Current",
      school: "Liepaja Secondary School No. 3",
      supervisor: "Dace Kalnina",
      appliedAt: "23.03.2026",
      appliedTime: "18:47",
      appliedAtRaw: "2026-03-23T18:47:00Z",
      status: "denied",
      ageGroup: "U12",
      cityOrRegion: "Liepaja",
      responsibleEmail: "blue.current@example.com",
      responsiblePhone: "+371 20001003",
      comments: "Will reapply with complete team composition.",
      howHeardAbout: "Social media",
      members: [
        {
          key: "1",
          fullName: "Marta Janse",
          dateOfBirth: "2014-10-06",
          educationalInstitution: "Liepaja Secondary School No. 3",
          phone: "+371 22000201",
          email: "marta.janse@example.com",
          role: "pilot",
          classOrYear: "Grade 5",
        },
        {
          key: "2",
          fullName: "Roberts Gailis",
          dateOfBirth: "2014-02-22",
          educationalInstitution: "Liepaja Secondary School No. 3",
          phone: "+371 22000202",
          email: "roberts.gailis@example.com",
          role: "participant",
          classOrYear: "Grade 5",
        },
        {
          key: "3",
          fullName: "Laura Upite",
          dateOfBirth: "2013-04-17",
          educationalInstitution: "Liepaja Secondary School No. 3",
          phone: "+371 22000203",
          email: "laura.upite@example.com",
          role: "reserve_pilot",
          classOrYear: "Grade 6",
        },
      ],
    },
  ];
}

const ApplicationReviewPage: React.FC = () => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ApplicationStatus>("all");
  const [selected, setSelected] = useState<ApplicationRecord | null>(null);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [acceptingApplication, setAcceptingApplication] = useState<ApplicationRecord | null>(null);
  const [teamAcceptValues, setTeamAcceptValues] = useState<TeamAcceptFormValues | null>(null);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedAccountKeys, setSelectedAccountKeys] = useState<React.Key[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  const statusConfig: Record<ApplicationStatus, { color: string; label: string; icon: React.ReactNode }> = {
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

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "participant":
        return t("website.apply.form.roleParticipant");
      case "team_leader":
        return t("website.apply.form.roleTeamLeader");
      case "pilot":
        return t("website.apply.form.rolePilot");
      case "reserve_pilot":
        return t("website.apply.form.roleReservePilot");
      default:
        return role || "-";
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(ENDPOINT_TEAM_APPLICATIONS);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload: unknown = await response.json();
      const items = Array.isArray(payload)
        ? payload
        : isRecord(payload) && Array.isArray(payload.data)
          ? payload.data
          : isRecord(payload) && Array.isArray(payload.applications)
            ? payload.applications
            : isRecord(payload) && Array.isArray(payload.teams)
              ? payload.teams
              : [];

      const normalized = items
        .map((entry, index) => normalizeApplication(entry, index))
        .filter((entry): entry is ApplicationRecord => entry !== null);

      if (normalized.length === 0) {
        setApplications(buildExampleApplications());
        message.warning(
          t("webapp.applicationReview.usingExampleData")
        );
        return;
      }

      setApplications(normalized);
    } catch {
      setApplications(buildExampleApplications());
      message.warning(
        t("webapp.applicationReview.fetchFallback")
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    setAccountsLoading(true);
    try {
      const response = await apiFetch(ENDPOINT_ACCOUNTS);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload: unknown = await response.json();
      const normalized = getArrayPayloadItems(payload)
        .map((entry, index) => normalizeAccountOption(entry, index))
        .filter((entry): entry is AccountOption => entry !== null);
      setAccounts(normalized);
    } catch {
      setAccounts([]);
      message.warning(t("webapp.applicationReview.accountsLoadFallback", { defaultValue: "Could not load accounts." }));
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchAccounts();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((item) => {
      const searchMatch =
        q.length === 0 ||
        item.teamName.toLowerCase().includes(q) ||
        item.school.toLowerCase().includes(q) ||
        item.supervisor.toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" || item.status === statusFilter;
      return searchMatch && statusMatch;
    });
  }, [applications, search, statusFilter]);

  const openAcceptModal = (record: ApplicationRecord) => {
    const matchingAccountKeys = accounts
      .filter((account) =>
        record.members.some(
          (member) =>
            member.email &&
            account.email &&
            member.email.toLowerCase() === account.email.toLowerCase()
        )
      )
      .map((account) => account.key);

    setAcceptingApplication(record);
    setTeamAcceptValues({
      teamName: record.teamName,
      ageGroup: record.ageGroup,
      institution: record.school,
      cityOrRegion: record.cityOrRegion,
      responsibleName: record.supervisor,
      responsibleEmail: record.responsibleEmail,
      responsiblePhone: record.responsiblePhone,
    });
    setSelectedAccountKeys(matchingAccountKeys);
  };

  const handleAcceptTeamApplication = async () => {
    if (!acceptingApplication || !teamAcceptValues) return;

    setUpdatingKey(`${acceptingApplication.id}:accepted`);
    try {
      const selectedAccounts = accounts.filter((account) => selectedAccountKeys.includes(account.key));
      const payload = {
        key: acceptingApplication.id,
        teamName: teamAcceptValues.teamName,
        members: selectedAccounts.map((account) => ({
          dati: {
            key: account.key,
            fullName: account.fullName,
            role: account.role,
            email: account.email,
          },
          lietotajvards: account.username,
          epasts: account.email,
          telefonanumurs: account.phone,
        })),
        ageGroup: teamAcceptValues.ageGroup,
        institution: teamAcceptValues.institution,
        cityOrRegion: teamAcceptValues.cityOrRegion,
        responsiblePerson: {
          fullName: teamAcceptValues.responsibleName,
          phone: teamAcceptValues.responsiblePhone,
          email: teamAcceptValues.responsibleEmail,
          status: teamAcceptValues.responsibleStatus,
        },
        avatar: teamAcceptValues.avatar,
        carId: teamAcceptValues.carId,
      };

      const response = await apiFetch(`${ENDPOINT_TEAM}/${encodeURIComponent(acceptingApplication.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      setApplications((prev) =>
        prev.map((item) =>
          item.id === acceptingApplication.id ? { ...item, status: "accepted" } : item
        )
      );
      setSelected((prev) =>
        prev && prev.id === acceptingApplication.id ? { ...prev, status: "accepted" } : prev
      );
      setAcceptingApplication(null);
      setTeamAcceptValues(null);
      setSelectedAccountKeys([]);
      message.success(t("webapp.applicationReview.updateOk"));
    } catch {
      message.error(t("webapp.applicationReview.updateError"));
    } finally {
      setUpdatingKey(null);
    }
  };

  const columns = [
    {
      title: t("website.apply.colTeam"),
      dataIndex: "teamName",
      key: "teamName",
      render: (value: string) => <span className="font-semibold">{value}</span>,
    },
    {
      title: t("website.apply.colSchool"),
      dataIndex: "school",
      key: "school",
      responsive: ["md" as const],
    },
    {
      title: t("website.apply.colMembers"),
      key: "membersCount",
      width: 110,
      align: "center" as const,
      render: (_: unknown, record: ApplicationRecord) => record.members.length,
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
      width: 180,
      responsive: ["sm" as const],
      render: (_: string, record: ApplicationRecord) =>
        formatAppliedDateTime(record.appliedAt, record.appliedTime),
    },
    {
      title: t("website.apply.colStatus"),
      dataIndex: "status",
      key: "status",
      width: 145,
      render: (status: ApplicationStatus) => {
        const cfg = statusConfig[status];
        return (
          <Tag icon={cfg.icon} color={cfg.color} className="w-fit">
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: t("common.actions"),
      key: "actions",
      width: 320,
      render: (_: unknown, record: ApplicationRecord) => {
        const rowIsUpdating = updatingKey?.startsWith(`${record.id}:`) ?? false;
        return (
          <Space size="small" wrap>
            <Button size="small" icon={<EyeOutlined />} onClick={() => setSelected(record)}>
              {t("webapp.applicationReview.view")}
            </Button>
            <Button
              size="small"
              type={record.status === "accepted" ? "primary" : "default"}
              onClick={() => openAcceptModal(record)}
              loading={updatingKey === `${record.id}:accepted`}
              disabled={rowIsUpdating && updatingKey !== `${record.id}:accepted`}
            >
              {t("webapp.applicationReview.accept")}
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">
        {t("webapp.applicationReview.title")}
      </h1>

      <div className="flex flex-col gap-4 w-full max-w-[1400px]">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder={t("website.apply.searchPlaceholder")}
            allowClear
            className="w-full lg:max-w-sm"
          />
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            className="w-full lg:w-60"
            options={[
              {
                value: "all",
                label: t("webapp.applicationReview.allStatuses"),
              },
              { value: "in_process", label: statusConfig.in_process.label },
              { value: "accepted", label: statusConfig.accepted.label },
              { value: "denied", label: statusConfig.denied.label },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchApplications} loading={loading}>
            {t("webapp.applicationReview.refresh")}
          </Button>
        </div>

        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={filtered.length > 12 ? { pageSize: 12 } : false}
          locale={{
            emptyText: t("website.apply.noResults"),
          }}
        />
      </div>

      <Modal
        open={selected !== null}
        onCancel={() => setSelected(null)}
        width={900}
        title={t("webapp.applicationReview.details")}
        footer={[
          <Button key="close" onClick={() => setSelected(null)}>
            {t("admin.cancel")}
          </Button>,
        ]}
      >
        {selected && (
          <div className="space-y-4">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={t("website.apply.colTeam")}>{selected.teamName}</Descriptions.Item>
              <Descriptions.Item label={t("website.apply.colSchool")}>{selected.school}</Descriptions.Item>
              <Descriptions.Item label={t("website.apply.colMembers")}>{selected.members.length}</Descriptions.Item>
              <Descriptions.Item label={t("website.apply.form.ageGroup")}>
                {selected.ageGroup || "-"}
              </Descriptions.Item>
              <Descriptions.Item label={t("website.apply.form.cityOrRegion")}>
                {selected.cityOrRegion || "-"}
              </Descriptions.Item>
              <Descriptions.Item label={t("website.apply.colSupervisor")}>
                {selected.supervisor}
              </Descriptions.Item>
              <Descriptions.Item label={t("website.apply.form.responsibleEmail")}>
                {selected.responsibleEmail || "-"}
              </Descriptions.Item>
              <Descriptions.Item label={t("website.apply.form.responsiblePhone")}>
                {selected.responsiblePhone || "-"}
              </Descriptions.Item>
              <Descriptions.Item label={t("website.apply.colDate")}>
                {formatAppliedDateTime(selected.appliedAt, selected.appliedTime)}
              </Descriptions.Item>
              <Descriptions.Item label={t("website.apply.colStatus")}>
                <Tag color={statusConfig[selected.status].color}>{statusConfig[selected.status].label}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <div>
              <h3 className="font-semibold mb-2">
                {t("website.apply.form.section2")}
              </h3>
              {selected.members.length === 0 ? (
                <Text type="secondary">
                  {t("webapp.applicationReview.noMemberDetails")}
                </Text>
              ) : (
                <Table
                  dataSource={selected.members}
                  rowKey="key"
                  size="small"
                  pagination={false}
                  columns={[
                    {
                      title: t("website.apply.form.memberFullName"),
                      dataIndex: "fullName",
                      key: "fullName",
                    },
                    {
                      title: t("website.apply.form.memberDob"),
                      dataIndex: "dateOfBirth",
                      key: "dateOfBirth",
                      render: (value: string | undefined) => (value ? formatDisplayDate(value) : "-"),
                    },
                    {
                      title: t("website.apply.form.memberRole"),
                      dataIndex: "role",
                      key: "role",
                      render: (value: string | undefined) => getRoleLabel(value),
                    },
                    {
                      title: t("website.apply.form.memberPhone"),
                      dataIndex: "phone",
                      key: "phone",
                      render: (value: string | undefined) => value || "-",
                    },
                    {
                      title: t("website.apply.form.memberEmail"),
                      dataIndex: "email",
                      key: "email",
                      render: (value: string | undefined) => value || "-",
                    },
                    {
                      title: t("website.apply.form.memberInstitution"),
                      dataIndex: "educationalInstitution",
                      key: "educationalInstitution",
                      render: (value: string | undefined) => value || "-",
                    },
                    {
                      title: t("website.apply.form.memberClass"),
                      dataIndex: "classOrYear",
                      key: "classOrYear",
                      render: (value: string | undefined) => value || "-",
                    },
                  ]}
                />
              )}
            </div>

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={t("website.apply.form.howHeard")}>
                {selected.howHeardAbout || "-"}
              </Descriptions.Item>
              <Descriptions.Item label={t("website.apply.form.comments")}>
                {selected.comments || "-"}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        open={acceptingApplication !== null}
        onCancel={() => {
          setAcceptingApplication(null);
          setTeamAcceptValues(null);
          setSelectedAccountKeys([]);
        }}
        onOk={handleAcceptTeamApplication}
        okText={t("webapp.applicationReview.accept")}
        confirmLoading={updatingKey === `${acceptingApplication?.id}:accepted`}
        width={1000}
        title={t("webapp.applicationReview.accept")}
      >
        {acceptingApplication && teamAcceptValues && (
          <div className="space-y-4">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={t("website.apply.form.teamName")}>
                <Input
                  value={teamAcceptValues.teamName}
                  onChange={(event) =>
                    setTeamAcceptValues((prev) =>
                      prev ? { ...prev, teamName: event.target.value } : prev
                    )
                  }
                />
              </Descriptions.Item>
              <Descriptions.Item label={t("website.apply.form.ageGroup")}>
                <Input
                  value={teamAcceptValues.ageGroup}
                  onChange={(event) =>
                    setTeamAcceptValues((prev) =>
                      prev ? { ...prev, ageGroup: event.target.value } : prev
                    )
                  }
                />
              </Descriptions.Item>
              <Descriptions.Item label={t("website.apply.form.institution")}>
                <Input
                  value={teamAcceptValues.institution}
                  onChange={(event) =>
                    setTeamAcceptValues((prev) =>
                      prev ? { ...prev, institution: event.target.value } : prev
                    )
                  }
                />
              </Descriptions.Item>
              <Descriptions.Item label={t("website.apply.form.cityOrRegion")}>
                <Input
                  value={teamAcceptValues.cityOrRegion}
                  onChange={(event) =>
                    setTeamAcceptValues((prev) =>
                      prev ? { ...prev, cityOrRegion: event.target.value } : prev
                    )
                  }
                />
              </Descriptions.Item>
              <Descriptions.Item label={t("website.apply.colSupervisor")}>
                <Input
                  value={teamAcceptValues.responsibleName}
                  onChange={(event) =>
                    setTeamAcceptValues((prev) =>
                      prev ? { ...prev, responsibleName: event.target.value } : prev
                    )
                  }
                />
              </Descriptions.Item>
              <Descriptions.Item label={t("website.apply.form.responsiblePhone")}>
                <Input
                  value={teamAcceptValues.responsiblePhone}
                  onChange={(event) =>
                    setTeamAcceptValues((prev) =>
                      prev ? { ...prev, responsiblePhone: event.target.value } : prev
                    )
                  }
                />
              </Descriptions.Item>
              <Descriptions.Item label={t("website.apply.form.responsibleEmail")}>
                <Input
                  value={teamAcceptValues.responsibleEmail}
                  onChange={(event) =>
                    setTeamAcceptValues((prev) =>
                      prev ? { ...prev, responsibleEmail: event.target.value } : prev
                    )
                  }
                />
              </Descriptions.Item>
            </Descriptions>

            <div>
              <h3 className="font-semibold mb-2">
                {t("webapp.applicationReview.accounts", { defaultValue: "Accounts" })}
              </h3>
              <Table<AccountOption>
                dataSource={accounts}
                rowKey="key"
                size="small"
                loading={accountsLoading}
                pagination={accounts.length > 8 ? { pageSize: 8 } : false}
                rowSelection={{
                  selectedRowKeys: selectedAccountKeys,
                  onChange: setSelectedAccountKeys,
                }}
                columns={[
                  {
                    title: t("website.auth.fullName"),
                    dataIndex: "fullName",
                    key: "fullName",
                  },
                  {
                    title: t("website.auth.username"),
                    dataIndex: "username",
                    key: "username",
                  },
                  {
                    title: t("website.auth.email"),
                    dataIndex: "email",
                    key: "email",
                    render: (value: string | undefined) => value || "-",
                  },
                  {
                    title: t("website.apply.form.memberRole"),
                    dataIndex: "role",
                    key: "role",
                    render: (value: string | undefined) => getRoleLabel(value),
                  },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApplicationReviewPage;
