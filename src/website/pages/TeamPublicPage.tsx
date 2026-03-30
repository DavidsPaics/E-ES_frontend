import React, { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Image,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  ensureCabinetSeeded,
  getAllTeams,
  getTeamById,
  getUsersByTeam,
  type VehicleDocument,
} from "@/shared/cabinet/store";
import { formatDisplayDate } from "@/utils/dateFormat";

const { Paragraph, Text, Title } = Typography;

interface PublicMemberView {
  id: string;
  fullName: string;
  role?: string;
  school?: string;
  grade?: string;
  aboutMe?: string;
  profilePicture?: string;
}

interface TeamViewModel {
  id: string;
  name: string;
  school: string;
  supervisor: string;
  description: string;
  profilePicture: string;
  vehicleDescription: string;
  vehiclePictures: string[];
  vehicleDocuments: VehicleDocument[];
  members: PublicMemberView[];
}

interface TeamLocationState {
  applicant?: {
    teamId: string;
    teamName: string;
    school: string;
    supervisor: string;
    teamDescription?: string;
    teamProfilePicture?: string;
    vehicleDescription?: string;
    vehiclePictures?: string[];
    teamDocuments?: VehicleDocument[];
    members?: PublicMemberView[];
  };
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function roleLabel(role?: string): string {
  switch (role) {
    case "participant":
      return "Participant";
    case "team_leader":
      return "Team Leader";
    case "pilot":
      return "Pilot";
    case "reserve_pilot":
      return "Reserve Pilot";
    case "supervisor":
      return "Supervisor";
    case "admin":
      return "Referee";
    case "super_admin":
      return "Super Admin";
    default:
      return role || "-";
  }
}

const TeamPublicPage: React.FC = () => {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const location = useLocation();
  const state = location.state as TeamLocationState | null;

  const model = useMemo<TeamViewModel | null>(() => {
    ensureCabinetSeeded();
    const decodedId = decodeURIComponent(teamId || "");

    const byId = decodedId ? getTeamById(decodedId) : null;
    let team = byId;
    if (!team && decodedId) {
      const allTeams = getAllTeams();
      team = allTeams.find((item) => toSlug(item.name) === decodedId) || null;
    }

    if (team) {
      const users = getUsersByTeam(team.id);
      const members = users.map((user) => ({
        id: user.id,
        fullName: user.profile.name || user.username,
        role: user.role,
        school: user.profile.school,
        grade: user.profile.grade,
        aboutMe: user.profile.aboutMe,
        profilePicture: user.profile.profilePicture,
      }));

      return {
        id: team.id,
        name: team.name,
        school: users.find((user) => user.profile.school)?.profile.school || "-",
        supervisor:
          users.find((user) => user.role === "supervisor")?.profile.name ||
          users.find((user) => user.role === "team_leader")?.profile.name ||
          "-",
        description: team.description || "-",
        profilePicture: team.profilePicture || "",
        vehicleDescription: team.vehicleDescription || "-",
        vehiclePictures: team.vehiclePictures || [],
        vehicleDocuments: team.vehicleDocuments || [],
        members,
      };
    }

    if (state?.applicant) {
      return {
        id: state.applicant.teamId,
        name: state.applicant.teamName,
        school: state.applicant.school || "-",
        supervisor: state.applicant.supervisor || "-",
        description: state.applicant.teamDescription || "-",
        profilePicture: state.applicant.teamProfilePicture || "",
        vehicleDescription: state.applicant.vehicleDescription || "-",
        vehiclePictures: state.applicant.vehiclePictures || [],
        vehicleDocuments: state.applicant.teamDocuments || [],
        members: state.applicant.members || [],
      };
    }

    return null;
  }, [teamId, state]);

  if (!model) {
    return (
      <section className="py-12 bg-gray-50 min-h-[60vh]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert
            type="warning"
            showIcon
            message="Team not found"
            description="No public team profile is available for this team yet."
          />
          <Button className="mt-4" icon={<ArrowLeftOutlined />} onClick={() => navigate("/apply")}>
            Back to applications
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-[#0A306D] to-[#36598B] text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            Back
          </Button>
          <div className="flex items-center gap-3">
            <TeamOutlined className="text-2xl" />
            <Title level={2} className="!text-white !mb-0">
              {model.name}
            </Title>
          </div>
        </div>
      </section>

      <section className="py-10 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Card>
            <Space direction="vertical" className="w-full" size="middle">
              {model.profilePicture ? (
                <Image src={model.profilePicture} alt={model.name} className="rounded-lg" />
              ) : null}

              <div>
                <Text strong>School: </Text>
                <Text>{model.school}</Text>
              </div>
              <div>
                <Text strong>Supervisor: </Text>
                <Text>{model.supervisor}</Text>
              </div>
              <div>
                <Text strong>Team description</Text>
                <Paragraph className="!mt-1 !mb-0">{model.description}</Paragraph>
              </div>
            </Space>
          </Card>

          <Card title="Vehicle">
            <Space direction="vertical" className="w-full" size="middle">
              <div>
                <Text strong>Vehicle description</Text>
                <Paragraph className="!mt-1 !mb-0">{model.vehicleDescription}</Paragraph>
              </div>

              {model.vehiclePictures.length > 0 ? (
                <div>
                  <Text strong className="block mb-2">
                    Vehicle pictures
                  </Text>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {model.vehiclePictures.map((picture) => (
                      <Image key={picture} src={picture} alt="Vehicle" className="rounded" />
                    ))}
                  </div>
                </div>
              ) : (
                <Text type="secondary">No vehicle pictures uploaded.</Text>
              )}

              <div>
                <Text strong className="block mb-2">
                  <FileTextOutlined /> Technical documents
                </Text>
                {model.vehicleDocuments.length === 0 ? (
                  <Text type="secondary">No documents uploaded.</Text>
                ) : (
                  <Space direction="vertical" className="w-full">
                    {model.vehicleDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border rounded px-3 py-2"
                      >
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-xs text-gray-500">
                            {doc.type || "-"}
                            {doc.uploadedAt ? ` · ${formatDisplayDate(doc.uploadedAt)}` : ""}
                          </div>
                        </div>
                        {doc.dataUrl ? (
                          <a
                            href={doc.dataUrl}
                            download={doc.name}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#0A306D] hover:underline text-sm font-medium"
                          >
                            Open / Download
                          </a>
                        ) : (
                          <Text type="secondary" className="text-sm">
                            File unavailable
                          </Text>
                        )}
                      </div>
                    ))}
                  </Space>
                )}
              </div>
            </Space>
          </Card>

          <Card title="Team Members">
            {model.members.length === 0 ? (
              <Text type="secondary">No member information available.</Text>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {model.members.map((member) => (
                  <Card key={member.id} size="small">
                    <div className="flex items-start gap-3">
                      {member.profilePicture ? (
                        <Avatar size={52} src={member.profilePicture} />
                      ) : (
                        <Avatar size={52} icon={<UserOutlined />} />
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold">{member.fullName}</div>
                        <Tag className="mt-1">{roleLabel(member.role)}</Tag>
                        <div className="text-sm text-gray-600 mt-1">
                          {member.school || "-"}
                          {member.grade ? ` · ${member.grade}` : ""}
                        </div>
                        <Paragraph className="!mb-0 !mt-2 text-sm">
                          {member.aboutMe || "-"}
                        </Paragraph>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            <Alert
              type="info"
              showIcon
              className="mt-4"
              message="Date of birth and contact information are hidden in public team view."
            />
          </Card>
        </div>
      </section>
    </div>
  );
};

export default TeamPublicPage;
