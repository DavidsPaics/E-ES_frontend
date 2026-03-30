import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Image,
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
  CopyOutlined,
  DeleteOutlined,
  SaveOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/webapp/authentification/AuthContext";
import {
  createTeamInvite,
  deleteTeam,
  deleteUser,
  getAllTeams,
  getTeamInvites,
  getAllUsers,
  getTeamById,
  getUsersByTeam,
  kickTeamMember,
  removeUserFromTeam,
  revokeTeamInvite,
  type PublicUserRecord,
  type TeamRecord,
  type TeamInviteRecord,
  type UserRole,
  type VehicleDocument,
  updateTeam,
  updateUser,
} from "@/shared/cabinet/store";
import { formatDisplayDate } from "@/utils/dateFormat";

const { Text, Title } = Typography;

interface ProfileFormValues {
  username: string;
  name: string;
  school: string;
  grade: string;
  phone: string;
  email: string;
  profilePicture: string;
  aboutMe: string;
}

interface TeamFormValues {
  name: string;
  description: string;
  profilePicture: string;
  vehicleDescription: string;
}

interface AdminUserFormValues extends ProfileFormValues {
  role: UserRole;
  teamId?: string;
}

function roleLabel(role: UserRole): string {
  switch (role) {
    case "participant":
      return "Participant";
    case "team_leader":
      return "Team Leader";
    case "supervisor":
      return "Supervisor";
    case "admin":
      return "Admin";
    case "super_admin":
      return "Super Admin";
    default:
      return role;
  }
}

function roleColor(role: UserRole): string {
  switch (role) {
    case "super_admin":
      return "purple";
    case "admin":
      return "geekblue";
    case "supervisor":
      return "cyan";
    case "team_leader":
      return "gold";
    default:
      return "default";
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("File read failed"));
      }
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

async function readFilesAsDataUrls(files: FileList | null): Promise<string[]> {
  if (!files) return [];
  const items = Array.from(files);
  const result: string[] = [];
  for (const file of items) {
    const encoded = await readFileAsDataUrl(file);
    result.push(encoded);
  }
  return result;
}

const CabinetPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, refreshCurrentUser, logout } = useAuth();
  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [teamForm] = Form.useForm<TeamFormValues>();
  const [adminUserForm] = Form.useForm<AdminUserFormValues>();
  const [adminTeamForm] = Form.useForm<TeamFormValues>();
  const watchedProfilePicture = Form.useWatch("profilePicture", profileForm);
  const watchedTeamProfilePicture = Form.useWatch("profilePicture", teamForm);
  const watchedAdminUserProfilePicture = Form.useWatch("profilePicture", adminUserForm);
  const watchedAdminTeamProfilePicture = Form.useWatch("profilePicture", adminTeamForm);

  const [team, setTeam] = useState<TeamRecord | null>(null);
  const [teamMembers, setTeamMembers] = useState<PublicUserRecord[]>([]);
  const [teamPictures, setTeamPictures] = useState<string[]>([]);
  const [teamDocuments, setTeamDocuments] = useState<VehicleDocument[]>([]);
  const [teamInvites, setTeamInvites] = useState<TeamInviteRecord[]>([]);

  const [allUsers, setAllUsers] = useState<PublicUserRecord[]>([]);
  const [allTeams, setAllTeams] = useState<TeamRecord[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [adminTeamPictures, setAdminTeamPictures] = useState<string[]>([]);
  const [adminTeamDocuments, setAdminTeamDocuments] = useState<VehicleDocument[]>([]);
  const [adminTeamMembers, setAdminTeamMembers] = useState<PublicUserRecord[]>([]);

  const canManageOwnTeam =
    currentUser?.role === "team_leader" || currentUser?.role === "supervisor";
  const isSuperAdmin = currentUser?.role === "super_admin";

  const allTeamOptions = useMemo(
    () =>
      allTeams.map((record) => ({
        value: record.id,
        label: record.name,
      })),
    [allTeams]
  );

  const refreshPageData = () => {
    if (!currentUser) return;

    profileForm.setFieldsValue({
      username: currentUser.username,
      name: currentUser.profile.name || "",
      school: currentUser.profile.school || "",
      grade: currentUser.profile.grade || "",
      phone: currentUser.profile.phone || "",
      email: currentUser.profile.email || "",
      profilePicture: currentUser.profile.profilePicture || "",
      aboutMe: currentUser.profile.aboutMe || "",
    });

    if (currentUser.teamId) {
      const teamData = getTeamById(currentUser.teamId);
      setTeam(teamData);
      setTeamMembers(getUsersByTeam(currentUser.teamId));
      setTeamPictures(teamData?.vehiclePictures ?? []);
      setTeamDocuments(teamData?.vehicleDocuments ?? []);
      setTeamInvites(getTeamInvites(currentUser.teamId).filter((invite) => !invite.usedByUserId));
      teamForm.setFieldsValue({
        name: teamData?.name ?? "",
        description: teamData?.description ?? "",
        profilePicture: teamData?.profilePicture ?? "",
        vehicleDescription: teamData?.vehicleDescription ?? "",
      });
    } else {
      setTeam(null);
      setTeamMembers([]);
      setTeamPictures([]);
      setTeamDocuments([]);
      setTeamInvites([]);
      teamForm.resetFields();
    }

    if (isSuperAdmin) {
      setAllUsers(getAllUsers());
      setAllTeams(getAllTeams());
    } else {
      setAllUsers([]);
      setAllTeams([]);
    }
  };

  useEffect(() => {
    refreshPageData();
  }, [currentUser]);

  const handleProfileSave = async () => {
    if (!currentUser) return;
    try {
      const values = await profileForm.validateFields();
      updateUser(currentUser.id, {
        username: values.username.trim(),
        profile: {
          name: values.name.trim(),
          school: values.school.trim(),
          grade: values.grade.trim(),
          phone: values.phone.trim(),
          email: values.email.trim(),
          profilePicture: (values.profilePicture || "").trim(),
          aboutMe: values.aboutMe.trim(),
        },
      });
      refreshCurrentUser();
      message.success("Profile updated.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to save profile.";
      message.error(text);
    }
  };

  const handleLeaveTeam = () => {
    if (!currentUser?.teamId) return;
    if (!window.confirm("Leave current team?")) return;

    try {
      removeUserFromTeam(currentUser.id);
      refreshCurrentUser();
      message.success("You left the team.");
      setTeam(null);
      setTeamMembers([]);
      setTeamPictures([]);
      setTeamDocuments([]);
      setTeamInvites([]);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to leave team.";
      message.error(text);
    }
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return;
    if (!window.confirm("Delete your account permanently?")) return;

    deleteUser(currentUser.id);
    logout();
    navigate("/signin");
  };

  const handleAddTeamPictures = async (
    files: FileList | null,
    target: "own" | "admin"
  ) => {
    try {
      const images = await readFilesAsDataUrls(files);
      if (target === "own") {
        setTeamPictures((prev) => [...prev, ...images]);
      } else {
        setAdminTeamPictures((prev) => [...prev, ...images]);
      }
    } catch {
      message.error("Failed to read image files.");
    }
  };

  const handleAddTeamDocuments = async (
    files: FileList | null,
    target: "own" | "admin"
  ) => {
    if (!files) return;
    try {
      const docs: VehicleDocument[] = [];
      for (const file of Array.from(files)) {
        const dataUrl = await readFileAsDataUrl(file);
        docs.push({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type || "application/octet-stream",
          dataUrl,
          uploadedAt: new Date().toISOString(),
        });
      }

      if (target === "own") {
        setTeamDocuments((prev) => [...prev, ...docs]);
      } else {
        setAdminTeamDocuments((prev) => [...prev, ...docs]);
      }
    } catch {
      message.error("Failed to read document files.");
    }
  };

  const handleSaveOwnTeam = async () => {
    if (!team) return;
    try {
      const values = await teamForm.validateFields();
      const updated = updateTeam(team.id, {
        name: values.name.trim(),
        description: values.description.trim(),
        profilePicture: (values.profilePicture || "").trim(),
        vehicleDescription: values.vehicleDescription.trim(),
        vehiclePictures: teamPictures,
        vehicleDocuments: teamDocuments,
      });
      setTeam(updated);
      message.success("Team information updated.");
      refreshCurrentUser();
      refreshPageData();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to update team.";
      message.error(text);
    }
  };

  const handleDeleteOwnTeam = () => {
    if (!team) return;
    if (!window.confirm("Delete this team and detach all members?")) return;

    deleteTeam(team.id);
    refreshCurrentUser();
    message.success("Team deleted.");
    setTeam(null);
    setTeamMembers([]);
    setTeamPictures([]);
    setTeamDocuments([]);
    setTeamInvites([]);
  };

  const handleKickOwnTeamMember = (memberId: string) => {
    if (!team) return;
    if (!window.confirm("Kick this member from the team?")) return;

    kickTeamMember(team.id, memberId);
    refreshPageData();
    message.success("Member removed from team.");
  };

  const getInviteLink = (code: string) => {
    const url = new URL("/signup", window.location.origin);
    url.searchParams.set("invite", code);
    return url.toString();
  };

  const handleCreateTeamInvite = async () => {
    if (!team || !currentUser) return;
    try {
      const invite = createTeamInvite(team.id, currentUser.id);
      setTeamInvites(getTeamInvites(team.id).filter((item) => !item.usedByUserId));
      await navigator.clipboard.writeText(getInviteLink(invite.code));
      message.success("Invitation link copied.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to create invite.";
      message.error(text);
    }
  };

  const handleCopyInviteLink = async (code: string) => {
    try {
      await navigator.clipboard.writeText(getInviteLink(code));
      message.success("Invitation link copied.");
    } catch {
      message.error("Failed to copy invitation link.");
    }
  };

  const handleRevokeTeamInvite = (inviteId: string) => {
    if (!team || !currentUser) return;
    try {
      revokeTeamInvite(inviteId, currentUser.id);
      setTeamInvites(getTeamInvites(team.id).filter((item) => !item.usedByUserId));
      message.success("Invite revoked.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to revoke invite.";
      message.error(text);
    }
  };

  const openUserEditor = (user: PublicUserRecord) => {
    setEditingUserId(user.id);
    adminUserForm.setFieldsValue({
      username: user.username,
      role: user.role,
      teamId: user.teamId,
      name: user.profile.name || "",
      school: user.profile.school || "",
      grade: user.profile.grade || "",
      phone: user.profile.phone || "",
      email: user.profile.email || "",
      profilePicture: user.profile.profilePicture || "",
      aboutMe: user.profile.aboutMe || "",
    });
  };

  const handleSaveEditedUser = async () => {
    if (!editingUserId) return;
    try {
      const values = await adminUserForm.validateFields();
      updateUser(editingUserId, {
        username: values.username.trim(),
        role: values.role,
        teamId: values.teamId || null,
        profile: {
          name: values.name.trim(),
          school: values.school.trim(),
          grade: values.grade.trim(),
          phone: values.phone.trim(),
          email: values.email.trim(),
          profilePicture: (values.profilePicture || "").trim(),
          aboutMe: values.aboutMe.trim(),
        },
      });
      setEditingUserId(null);
      message.success("User updated.");
      refreshCurrentUser();
      refreshPageData();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to update user.";
      message.error(text);
    }
  };

  const handleDeleteAnyUser = (user: PublicUserRecord) => {
    if (!window.confirm(`Delete user "${user.username}"?`)) return;

    deleteUser(user.id);
    if (currentUser?.id === user.id) {
      logout();
      navigate("/signin");
      return;
    }
    message.success("User deleted.");
    refreshCurrentUser();
    refreshPageData();
  };

  const openTeamEditor = (teamRecord: TeamRecord) => {
    setEditingTeamId(teamRecord.id);
    adminTeamForm.setFieldsValue({
      name: teamRecord.name,
      description: teamRecord.description,
      profilePicture: teamRecord.profilePicture,
      vehicleDescription: teamRecord.vehicleDescription,
    });
    setAdminTeamPictures(teamRecord.vehiclePictures);
    setAdminTeamDocuments(teamRecord.vehicleDocuments);
    setAdminTeamMembers(getUsersByTeam(teamRecord.id));
  };

  const handleSaveEditedTeam = async () => {
    if (!editingTeamId) return;
    try {
      const values = await adminTeamForm.validateFields();
      updateTeam(editingTeamId, {
        name: values.name.trim(),
        description: values.description.trim(),
        profilePicture: (values.profilePicture || "").trim(),
        vehicleDescription: values.vehicleDescription.trim(),
        vehiclePictures: adminTeamPictures,
        vehicleDocuments: adminTeamDocuments,
      });
      setEditingTeamId(null);
      message.success("Team updated.");
      refreshCurrentUser();
      refreshPageData();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to update team.";
      message.error(text);
    }
  };

  const handleDeleteAnyTeam = (teamRecord: TeamRecord) => {
    if (!window.confirm(`Delete team "${teamRecord.name}"?`)) return;
    deleteTeam(teamRecord.id);
    message.success("Team deleted.");
    refreshCurrentUser();
    refreshPageData();
  };

  const handleKickFromAdminTeam = (teamId: string, memberId: string) => {
    if (!window.confirm("Kick this member from team?")) return;
    kickTeamMember(teamId, memberId);
    setAdminTeamMembers(getUsersByTeam(teamId));
    refreshCurrentUser();
    refreshPageData();
    message.success("Member removed.");
  };

  if (!currentUser) {
    return (
      <section className="py-10 bg-gray-50 min-h-[60vh]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert type="warning" message="No active user session. Please log in again." />
          <Button className="mt-4" type="primary" onClick={() => navigate("/signin")}>
            Go to login
          </Button>
        </div>
      </section>
    );
  }

  const userColumns = [
    {
      title: "User",
      key: "user",
      render: (_: unknown, record: PublicUserRecord) => (
        <div>
          <div className="font-semibold">{record.profile.name || "-"}</div>
          <div className="text-xs text-gray-500">@{record.username}</div>
        </div>
      ),
    },
    {
      title: "Role",
      key: "role",
      render: (_: unknown, record: PublicUserRecord) => (
        <Tag color={roleColor(record.role)}>{roleLabel(record.role)}</Tag>
      ),
    },
    {
      title: "Team",
      key: "team",
      render: (_: unknown, record: PublicUserRecord) => {
        const userTeam = allTeams.find((item) => item.id === record.teamId);
        return userTeam?.name || "-";
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 190,
      render: (_: unknown, record: PublicUserRecord) => (
        <Space>
          <Button size="small" onClick={() => openUserEditor(record)}>
            Edit
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteAnyUser(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const teamColumns = [
    {
      title: "Team",
      key: "name",
      render: (_: unknown, record: TeamRecord) => (
        <div>
          <div className="font-semibold">{record.name}</div>
          <div className="text-xs text-gray-500">{record.memberIds.length} members</div>
        </div>
      ),
    },
    {
      title: "Vehicle docs",
      key: "docs",
      render: (_: unknown, record: TeamRecord) => record.vehicleDocuments.length,
    },
    {
      title: "Actions",
      key: "actions",
      width: 190,
      render: (_: unknown, record: TeamRecord) => (
        <Space>
          <Button size="small" onClick={() => openTeamEditor(record)}>
            Edit
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteAnyTeam(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <section className="py-10 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-[#0A306D] [&_.ant-card]:!text-[#0A306D] [&_.ant-card-head-title]:!text-[#0A306D] [&_.ant-form-item-label>label]:!text-[#0A306D] flex flex-col gap-4">
        <Title level={2} className="!text-[#0A306D] !mb-0">
          Profile Cabinet
        </Title>
        <Text className="!text-[#36598B]">
          Role: <Tag color={roleColor(currentUser.role)}>{roleLabel(currentUser.role)}</Tag>
        </Text>

        <Card title={<span><UserOutlined /> My Profile</span>}>
          <Form form={profileForm} layout="vertical">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: "Username is required." }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: "Name is required." }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="school" label="School">
                <Input />
              </Form.Item>
              <Form.Item name="grade" label="Grade">
                <Input />
              </Form.Item>
              <Form.Item name="phone" label="Phone">
                <Input />
              </Form.Item>
              <Form.Item
                name="email"
                label="E-mail"
                rules={[
                  {
                    type: "email",
                    message: "Please enter a valid e-mail.",
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </div>
            <Form.Item name="profilePicture" hidden>
              <Input />
            </Form.Item>
            <div className="mb-4">
              <div className="font-semibold mb-2">Profile picture</div>
              {watchedProfilePicture ? (
                <div className="mb-2">
                  <Image src={watchedProfilePicture} alt="Profile" width={120} className="rounded" />
                </div>
              ) : (
                <Text type="secondary">No profile picture uploaded.</Text>
              )}
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    try {
                      const encoded = await readFileAsDataUrl(file);
                      profileForm.setFieldValue("profilePicture", encoded);
                    } catch {
                      message.error("Failed to read profile picture.");
                    } finally {
                      event.target.value = "";
                    }
                  }}
                />
                {watchedProfilePicture && (
                  <Button onClick={() => profileForm.setFieldValue("profilePicture", "")}>
                    Remove picture
                  </Button>
                )}
              </div>
            </div>
            <Form.Item name="aboutMe" label="About me">
              <Input.TextArea rows={4} maxLength={2000} showCount />
            </Form.Item>
            <Space wrap>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleProfileSave}>
                Save profile
              </Button>
            </Space>
          </Form>
        </Card>

        <Card title="Account Actions">
          <Space wrap>
            {currentUser.teamId && (
              <Button onClick={handleLeaveTeam}>
                Exit from team
              </Button>
            )}
            <Button danger icon={<DeleteOutlined />} onClick={handleDeleteAccount}>
              Delete account
            </Button>
          </Space>
        </Card>

        {(canManageOwnTeam || isSuperAdmin) && currentUser.teamId && (
          <Card title={<span><TeamOutlined /> Team Management</span>}>
            {team ? (
              <>
                <Form form={teamForm} layout="vertical">
                  <Form.Item
                    name="name"
                    label="Team name"
                    rules={[{ required: true, message: "Team name is required." }]}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item name="description" label="Team description">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                  <Form.Item name="profilePicture" hidden>
                    <Input />
                  </Form.Item>
                  <div className="mb-4">
                    <div className="font-semibold mb-2">Team profile picture</div>
                    {watchedTeamProfilePicture ? (
                      <div className="mb-2">
                        <Image
                          src={watchedTeamProfilePicture}
                          alt="Team profile"
                          width={140}
                          className="rounded"
                        />
                      </div>
                    ) : (
                      <Text type="secondary">No team profile picture uploaded.</Text>
                    )}
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          try {
                            const encoded = await readFileAsDataUrl(file);
                            teamForm.setFieldValue("profilePicture", encoded);
                          } catch {
                            message.error("Failed to read profile picture.");
                          } finally {
                            event.target.value = "";
                          }
                        }}
                      />
                      {watchedTeamProfilePicture && (
                        <Button onClick={() => teamForm.setFieldValue("profilePicture", "")}>
                          Remove picture
                        </Button>
                      )}
                    </div>
                  </div>
                  <Form.Item name="vehicleDescription" label="Vehicle description">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                </Form>

                <Space direction="vertical" className="w-full" size="middle">
                  <div>
                    <div className="font-semibold mb-2">Vehicle pictures</div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (event) => {
                        await handleAddTeamPictures(event.target.files, "own");
                        event.target.value = "";
                      }}
                    />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      {teamPictures.map((picture) => (
                        <div key={picture} className="border rounded p-2">
                          <Image src={picture} alt="Vehicle" className="rounded" />
                          <Button
                            type="link"
                            danger
                            onClick={() =>
                              setTeamPictures((prev) => prev.filter((item) => item !== picture))
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold mb-2">Vehicle documents</div>
                    <input
                      type="file"
                      multiple
                      onChange={async (event) => {
                        await handleAddTeamDocuments(event.target.files, "own");
                        event.target.value = "";
                      }}
                    />
                    <Space direction="vertical" className="w-full mt-3">
                      {teamDocuments.map((document) => (
                        <div
                          key={document.id}
                          className="flex items-center justify-between border rounded px-3 py-2"
                        >
                          <div>
                            <div className="font-medium">{document.name}</div>
                            <div className="text-xs text-gray-500">{document.type}</div>
                          </div>
                          <Button
                            danger
                            type="link"
                            onClick={() =>
                              setTeamDocuments((prev) =>
                                prev.filter((item) => item.id !== document.id)
                              )
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      ))}
                    </Space>
                  </div>

                  <div>
                    <div className="font-semibold mb-2">Team members</div>
                    <Table<PublicUserRecord>
                      dataSource={teamMembers}
                      rowKey="id"
                      pagination={false}
                      columns={[
                        {
                          title: "Name",
                          key: "name",
                          render: (_: unknown, record: PublicUserRecord) =>
                            record.profile.name || "-",
                        },
                        {
                          title: "Role",
                          key: "role",
                          render: (_: unknown, record: PublicUserRecord) => (
                            <Tag>{roleLabel(record.role)}</Tag>
                          ),
                        },
                        {
                          title: "Grade",
                          key: "grade",
                          render: (_: unknown, record: PublicUserRecord) =>
                            record.profile.grade || "-",
                        },
                        {
                          title: "Action",
                          key: "action",
                          width: 120,
                          render: (_: unknown, record: PublicUserRecord) =>
                            record.id !== currentUser.id ? (
                              <Button
                                size="small"
                                danger
                                onClick={() => handleKickOwnTeamMember(record.id)}
                              >
                                Kick
                              </Button>
                            ) : (
                              <Text type="secondary">You</Text>
                            ),
                        },
                      ]}
                    />
                  </div>

                  <div>
                    <div className="font-semibold mb-2">Team invitation links</div>
                    <Button onClick={handleCreateTeamInvite}>Create and copy invitation link</Button>
                    <Space direction="vertical" className="w-full mt-3">
                      {teamInvites.length === 0 ? (
                        <Text type="secondary">No active invitation links.</Text>
                      ) : (
                        teamInvites.map((invite) => (
                          <div
                            key={invite.id}
                            className="flex items-center justify-between border rounded px-3 py-2 gap-3"
                          >
                            <div>
                              <div className="font-semibold tracking-wide">Invitation link</div>
                              <div className="text-xs text-gray-500">
                                Created: {formatDisplayDate(invite.createdAt)}
                              </div>
                            </div>
                            <Space>
                              <Button
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopyInviteLink(invite.code)}
                              >
                                Copy link
                              </Button>
                              <Button
                                size="small"
                                danger
                                onClick={() => handleRevokeTeamInvite(invite.id)}
                              >
                                Revoke
                              </Button>
                            </Space>
                          </div>
                        ))
                      )}
                    </Space>
                  </div>
                </Space>

                <Space wrap className="mt-4">
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveOwnTeam}>
                    Save team
                  </Button>
                  <Button danger icon={<DeleteOutlined />} onClick={handleDeleteOwnTeam}>
                    Delete team
                  </Button>
                </Space>
              </>
            ) : (
              <Alert type="info" message="No team assigned." />
            )}
          </Card>
        )}

        {isSuperAdmin && (
          <>
            <Card title="Super Admin: User Moderation">
              <Table<PublicUserRecord>
                dataSource={allUsers}
                rowKey="id"
                columns={userColumns}
                pagination={allUsers.length > 10 ? { pageSize: 10 } : false}
              />
            </Card>

            <Card title="Super Admin: Team Moderation">
              <Table<TeamRecord>
                dataSource={allTeams}
                rowKey="id"
                columns={teamColumns}
                pagination={allTeams.length > 10 ? { pageSize: 10 } : false}
              />
            </Card>
          </>
        )}
      </div>

      <Modal
        open={editingUserId !== null}
        title="Edit User"
        onCancel={() => setEditingUserId(null)}
        onOk={handleSaveEditedUser}
        okText="Save"
        width={800}
      >
        <Form form={adminUserForm} layout="vertical">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: "Username is required." }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: "Role is required." }]}
            >
              <Select
                options={[
                  { value: "participant", label: roleLabel("participant") },
                  { value: "team_leader", label: roleLabel("team_leader") },
                  { value: "supervisor", label: roleLabel("supervisor") },
                  { value: "admin", label: roleLabel("admin") },
                  { value: "super_admin", label: roleLabel("super_admin") },
                ]}
              />
            </Form.Item>
            <Form.Item name="teamId" label="Team">
              <Select
                allowClear
                placeholder="No team"
                options={allTeamOptions}
              />
            </Form.Item>
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: "Name is required." }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="school" label="School">
              <Input />
            </Form.Item>
            <Form.Item name="grade" label="Grade">
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="Phone">
              <Input />
            </Form.Item>
            <Form.Item
              name="email"
              label="E-mail"
              rules={[{ type: "email", message: "Please enter a valid e-mail." }]}
            >
              <Input />
            </Form.Item>
          </div>
          <Form.Item name="profilePicture" hidden>
            <Input />
          </Form.Item>
          <div className="mb-4">
            <div className="font-semibold mb-2">Profile picture</div>
            {watchedAdminUserProfilePicture ? (
              <div className="mb-2">
                <Image
                  src={watchedAdminUserProfilePicture}
                  alt="Profile"
                  width={120}
                  className="rounded"
                />
              </div>
            ) : (
              <Text type="secondary">No profile picture uploaded.</Text>
            )}
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    const encoded = await readFileAsDataUrl(file);
                    adminUserForm.setFieldValue("profilePicture", encoded);
                  } catch {
                    message.error("Failed to read profile picture.");
                  } finally {
                    event.target.value = "";
                  }
                }}
              />
              {watchedAdminUserProfilePicture && (
                <Button onClick={() => adminUserForm.setFieldValue("profilePicture", "")}>
                  Remove picture
                </Button>
              )}
            </div>
          </div>
          <Form.Item name="aboutMe" label="About me">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={editingTeamId !== null}
        title="Edit Team"
        onCancel={() => setEditingTeamId(null)}
        onOk={handleSaveEditedTeam}
        okText="Save"
        width={900}
      >
        <Form form={adminTeamForm} layout="vertical">
          <Form.Item
            name="name"
            label="Team name"
            rules={[{ required: true, message: "Team name is required." }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Team description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="profilePicture" hidden>
            <Input />
          </Form.Item>
          <div className="mb-4">
            <div className="font-semibold mb-2">Team profile picture</div>
            {watchedAdminTeamProfilePicture ? (
              <div className="mb-2">
                <Image
                  src={watchedAdminTeamProfilePicture}
                  alt="Team profile"
                  width={140}
                  className="rounded"
                />
              </div>
            ) : (
              <Text type="secondary">No team profile picture uploaded.</Text>
            )}
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  try {
                    const encoded = await readFileAsDataUrl(file);
                    adminTeamForm.setFieldValue("profilePicture", encoded);
                  } catch {
                    message.error("Failed to read profile picture.");
                  } finally {
                    event.target.value = "";
                  }
                }}
              />
              {watchedAdminTeamProfilePicture && (
                <Button onClick={() => adminTeamForm.setFieldValue("profilePicture", "")}>
                  Remove picture
                </Button>
              )}
            </div>
          </div>
          <Form.Item name="vehicleDescription" label="Vehicle description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>

        <div className="font-semibold mb-2">Vehicle pictures</div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={async (event) => {
            await handleAddTeamPictures(event.target.files, "admin");
            event.target.value = "";
          }}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 mb-4">
          {adminTeamPictures.map((picture) => (
            <div key={picture} className="border rounded p-2">
              <Image src={picture} alt="Vehicle" className="rounded" />
              <Button
                type="link"
                danger
                onClick={() =>
                  setAdminTeamPictures((prev) => prev.filter((item) => item !== picture))
                }
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        <div className="font-semibold mb-2">Vehicle documents</div>
        <input
          type="file"
          multiple
          onChange={async (event) => {
            await handleAddTeamDocuments(event.target.files, "admin");
            event.target.value = "";
          }}
        />
        <Space direction="vertical" className="w-full mt-3 mb-4">
          {adminTeamDocuments.map((document) => (
            <div key={document.id} className="flex items-center justify-between border rounded px-3 py-2">
              <div>
                <div className="font-medium">{document.name}</div>
                <div className="text-xs text-gray-500">{document.type}</div>
              </div>
              <Button
                danger
                type="link"
                onClick={() =>
                  setAdminTeamDocuments((prev) => prev.filter((item) => item.id !== document.id))
                }
              >
                Delete
              </Button>
            </div>
          ))}
        </Space>

        {editingTeamId && (
          <>
            <div className="font-semibold mb-2">Team members</div>
            <Table<PublicUserRecord>
              dataSource={adminTeamMembers}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                {
                  title: "Name",
                  key: "name",
                  render: (_: unknown, record: PublicUserRecord) => record.profile.name || "-",
                },
                {
                  title: "Role",
                  key: "role",
                  render: (_: unknown, record: PublicUserRecord) => (
                    <Tag color={roleColor(record.role)}>{roleLabel(record.role)}</Tag>
                  ),
                },
                {
                  title: "Action",
                  key: "action",
                  width: 120,
                  render: (_: unknown, record: PublicUserRecord) => (
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleKickFromAdminTeam(editingTeamId, record.id)}
                    >
                      Kick
                    </Button>
                  ),
                },
              ]}
            />
          </>
        )}
      </Modal>
    </section>
  );
};

export default CabinetPage;
