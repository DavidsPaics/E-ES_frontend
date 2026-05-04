import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Form,
  Input,
  Select,
  Radio,
  Checkbox,
  Button,
  Card,
  Space,
  Divider,
  Alert,
  message,
  Typography,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  PhoneOutlined,
  MailOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import type { Dayjs } from "dayjs";

dayjs.extend(customParseFormat);
import {
  type AgeGroup,
  type MemberRole,
  type TeamMember,
  type RegistrationFormData,
  MIN_TEAM_SIZE,
  calculateAge,
  getOldestMemberAge,
  determineAgeGroup,
  hasRequiredRoles,
  meetsMinTeamSize,
  isAgeValidForGroup,
} from "../types/registration";
import { ENDPOINT_TEAM_APPLICATION } from "@/webapp/config/endpoints";

const { TextArea } = Input;
const { Title, Text } = Typography;

const STORAGE_KEY = "registration-form-draft";

interface StoredFormData {
  formValues: Record<string, unknown>;
  members: Array<{
    key: string;
    fullName: string;
    dateOfBirth: string | null;
    dateOfBirthRaw?: string;
    educationalInstitution: string;
    phone: string;
    email: string;
    role: MemberRole | undefined;
    secondaryRole?: "pilot" | "reserve_pilot";
    classOrYear?: string;
  }>;
}

interface RegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormMember {
  key: string;
  fullName: string;
  dateOfBirth: Dayjs | null;
  dateOfBirthRaw?: string; // For auto-formatting during typing
  educationalInstitution: string;
  phone: string;
  email: string;
  role: MemberRole | undefined;
  secondaryRole?: "pilot" | "reserve_pilot"; // Only for team_leader who is also pilot/reserve
  classOrYear?: string;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<FormMember[]>(() => {
    // Load from localStorage on init
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredFormData = JSON.parse(stored);
        if (data.members && data.members.length > 0) {
          return data.members.map((m) => ({
            ...m,
            dateOfBirth: m.dateOfBirth ? dayjs(m.dateOfBirth) : null,
          }));
        }
      }
    } catch {
      // ignore parse errors
    }
    return [
      {
        key: crypto.randomUUID(),
        fullName: "",
        dateOfBirth: null,
        educationalInstitution: "",
        phone: "",
        email: "",
        role: undefined,
      },
    ];
  });

  const ageGroup: AgeGroup | undefined = Form.useWatch("ageGroup", form);

  // Load form values from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredFormData = JSON.parse(stored);
        if (data.formValues) {
          form.setFieldsValue(data.formValues);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [form]);

  // Save to localStorage whenever form or members change
  const saveToStorage = () => {
    try {
      const formValues = form.getFieldsValue();
      const storedMembers = members.map((m) => ({
        ...m,
        dateOfBirth: m.dateOfBirth ? m.dateOfBirth.toISOString() : null,
      }));
      const data: StoredFormData = { formValues, members: storedMembers };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage errors
    }
  };

  // Debounced save effect
  useEffect(() => {
    const timer = setTimeout(saveToStorage, 500);
    return () => clearTimeout(timer);
  }, [members]);

  // Clear storage on successful submission
  const clearStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Auto-format date input: "16092004" -> "16.09.2004"
  const formatDateInput = (input: string): string => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, "");
    if (digits.length === 0) return "";
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 8)}`;
  };

  // Parse formatted date string to Dayjs
  const parseDateString = (input: string): Dayjs | null => {
    const formatted = formatDateInput(input);
    if (formatted.length < 10) return null;
    const parsed = dayjs(formatted, "DD.MM.YYYY", true);
    // Allow dates up to and including today
    return parsed.isValid() && !parsed.isAfter(dayjs(), "day") ? parsed : null;
  };

  const roleOptions: { value: MemberRole; label: string }[] = [
    { value: "participant", label: t("website.apply.form.roleParticipant") },
    { value: "team_leader", label: t("website.apply.form.roleTeamLeader") },
    { value: "pilot", label: t("website.apply.form.rolePilot") },
    { value: "reserve_pilot", label: t("website.apply.form.roleReservePilot") },
  ];

  const secondaryRoleOptions: { value: "pilot" | "reserve_pilot"; label: string }[] = [
    { value: "pilot", label: t("website.apply.form.rolePilot") },
    { value: "reserve_pilot", label: t("website.apply.form.roleReservePilot") },
  ];

  // Get available role options for a member, excluding already-taken unique roles
  const getAvailableRoleOptions = (memberKey: string) => {
    const takenRoles = new Set<MemberRole>();
    
    for (const m of members) {
      if (m.key === memberKey) continue;
      if (m.role) takenRoles.add(m.role);
      // If another team_leader has a secondary role, that pilot/reserve_pilot is taken
      if (m.role === "team_leader" && m.secondaryRole) {
        takenRoles.add(m.secondaryRole);
      }
    }

    return roleOptions.filter((opt) => {
      // participant can have multiple
      if (opt.value === "participant") return true;
      // unique roles can only be taken once
      return !takenRoles.has(opt.value);
    });
  };

  // Get available secondary role options for team leader
  const getAvailableSecondaryRoleOptions = (memberKey: string) => {
    const takenPilotRoles = new Set<"pilot" | "reserve_pilot">();
    
    for (const m of members) {
      if (m.key === memberKey) continue;
      // Check if pilot/reserve_pilot is taken by another member's primary role
      if (m.role === "pilot") takenPilotRoles.add("pilot");
      if (m.role === "reserve_pilot") takenPilotRoles.add("reserve_pilot");
      // Check if taken by another team_leader's secondary role
      if (m.role === "team_leader" && m.secondaryRole) {
        takenPilotRoles.add(m.secondaryRole);
      }
    }

    return secondaryRoleOptions.filter((opt) => !takenPilotRoles.has(opt.value));
  };

  const addMember = () => {
    setMembers([
      ...members,
      {
        key: crypto.randomUUID(),
        fullName: "",
        dateOfBirth: null,
        educationalInstitution: "",
        phone: "",
        email: "",
        role: undefined,
      },
    ]);
  };

  const removeMember = (key: string) => {
    if (members.length > 1) {
      setMembers(members.filter((m) => m.key !== key));
    }
  };

  const updateMember = (key: string, field: keyof FormMember, value: unknown) => {
    setMembers(members.map((m) => {
      if (m.key !== key) return m;
      const updated = { ...m, [field]: value };
      // Clear secondaryRole when primary role changes away from team_leader
      if (field === "role" && value !== "team_leader") {
        updated.secondaryRole = undefined;
      }
      return updated;
    }));
  };

  const validateMembers = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check all members have required fields
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.fullName.trim()) {
        errors.push(`${t("website.apply.form.validation.memberNameRequired")} (#${i + 1})`);
      }
      if (!m.dateOfBirth) {
        // Check if there's raw input that failed to parse
        if (m.dateOfBirthRaw && m.dateOfBirthRaw.length > 0) {
          errors.push(`${t("website.apply.form.validation.memberDobInvalid", { defaultValue: "Invalid date format (use DD.MM.YYYY)" })} (#${i + 1})`);
        } else {
          errors.push(`${t("website.apply.form.validation.memberDobRequired")} (#${i + 1})`);
        }
      }
      if (!m.educationalInstitution.trim()) {
        errors.push(`${t("website.apply.form.validation.memberInstitutionRequired")} (#${i + 1})`);
      }
      if (!m.phone.trim()) {
        errors.push(`${t("website.apply.form.validation.memberPhoneRequired")} (#${i + 1})`);
      }
      if (!m.email.trim()) {
        errors.push(`${t("website.apply.form.validation.memberEmailRequired")} (#${i + 1})`);
      } else {
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email);
        if (!isValidEmail) {
          errors.push(`${t("website.apply.form.validation.memberEmailInvalid")} (#${i + 1})`);
        }
      }
      if (!m.role) {
        errors.push(`${t("website.apply.form.validation.memberRoleRequired")} (#${i + 1})`);
      }
    }

    if (errors.length > 0) return { valid: false, errors };

    // Collect all effective roles (including secondary roles from team leaders)
    const allRoles: MemberRole[] = [];
    for (const m of members) {
      if (m.role) allRoles.push(m.role);
      if (m.role === "team_leader" && m.secondaryRole) {
        allRoles.push(m.secondaryRole);
      }
    }

    // Convert to TeamMember format for validation (for age/size checks)
    const teamMembers: TeamMember[] = members.map((m) => ({
      key: m.key,
      fullName: m.fullName,
      dateOfBirth: m.dateOfBirth!.format("YYYY-MM-DD"),
      educationalInstitution: m.educationalInstitution,
      phone: m.phone,
      email: m.email,
      role: m.role!,
      classOrYear: m.classOrYear,
    }));

    // Check minimum team size
    if (ageGroup && !meetsMinTeamSize(teamMembers, ageGroup)) {
      if (ageGroup === "U12" || ageGroup === "tautas") {
        errors.push(t("website.apply.form.validation.minMembersU12"));
      } else {
        errors.push(t("website.apply.form.validation.minMembersU16"));
      }
    }

    // Check required roles (using collected roles including secondary)
    const requiredRoles: MemberRole[] = ["pilot", "reserve_pilot", "team_leader"];
    const presentRoles = new Set(allRoles);
    const missingRoles = requiredRoles.filter((role) => !presentRoles.has(role));
    
    for (const role of missingRoles) {
      if (role === "pilot") errors.push(t("website.apply.form.validation.missingPilot"));
      if (role === "reserve_pilot") errors.push(t("website.apply.form.validation.missingReservePilot"));
      if (role === "team_leader") errors.push(t("website.apply.form.validation.missingTeamLeader"));
    }

    // Check for duplicate unique roles
    const roleCounts = allRoles.reduce((acc, role) => {
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<MemberRole, number>);

    if (roleCounts.pilot > 1) errors.push(t("website.apply.form.validation.duplicatePilot"));
    if (roleCounts.reserve_pilot > 1) errors.push(t("website.apply.form.validation.duplicateReservePilot"));
    if (roleCounts.team_leader > 1) errors.push(t("website.apply.form.validation.duplicateTeamLeader"));

    // Check age group matches oldest member
    if (ageGroup && ageGroup !== "tautas") {
      const oldestAge = getOldestMemberAge(teamMembers);
      if (!isAgeValidForGroup(oldestAge, ageGroup)) {
        const suggestedGroup = determineAgeGroup(oldestAge);
        errors.push(
          t("website.apply.form.validation.ageGroupMismatch", {
            age: oldestAge,
            group: ageGroup,
            suggested: suggestedGroup,
          })
        );
      }
    }

    return { valid: errors.length === 0, errors };
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    // Validate members
    const memberValidation = validateMembers();
    if (!memberValidation.valid) {
      memberValidation.errors.forEach((err) => message.error(err));
      return;
    }

    setSubmitting(true);

    const formData: RegistrationFormData = {
      teamName: values.teamName as string,
      ageGroup: values.ageGroup as AgeGroup,
      institution: values.institution as string | undefined,
      cityOrRegion: values.cityOrRegion as string,
      members: members.map((m) => ({
        key: m.key,
        fullName: m.fullName,
        dateOfBirth: m.dateOfBirth!.format("YYYY-MM-DD"),
        educationalInstitution: m.educationalInstitution,
        phone: m.phone,
        email: m.email,
        role: m.role!,
        secondaryRole: m.role === "team_leader" ? m.secondaryRole : undefined,
        classOrYear: m.classOrYear,
      })),
      responsiblePerson: {
        fullName: values.responsibleName as string,
        phone: values.responsiblePhone as string,
        email: values.responsibleEmail as string,
        status: values.responsibleStatus as string,
      },
      howHeardAbout: values.howHeard as string | undefined,
      comments: values.comments as string | undefined,
      confirmTruthful: values.confirmTruthful as boolean,
      confirmRules: values.confirmRules as boolean,
      confirmMedia: values.confirmMedia as boolean,
    };

    try {
      const response = await fetch(ENDPOINT_TEAM_APPLICATION, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to submit");
      }

      clearStorage();
      message.success(t("website.apply.form.success"));
      onSuccess?.();
    } catch {
      message.error(t("website.apply.form.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const minMembersHint = ageGroup
    ? `${t("website.apply.form.section2")} (min: ${MIN_TEAM_SIZE[ageGroup]})`
    : t("website.apply.form.section2");

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      onValuesChange={saveToStorage}
      className="registration-form"
      scrollToFirstError
    >
      {/* Section 1: General Team Info */}
      <Card className="mb-6">
        <Title level={4} className="!text-[#0A306D] !mb-4 flex items-center gap-2">
          <TeamOutlined /> {t("website.apply.form.section1")}
        </Title>

        <Form.Item
          name="teamName"
          label={t("website.apply.form.teamName")}
          rules={[{ required: true, message: t("website.apply.form.validation.teamNameRequired") }]}
        >
          <Input placeholder={t("website.apply.form.teamNamePlaceholder")} size="large" />
        </Form.Item>

        <Form.Item
          name="ageGroup"
          label={t("website.apply.form.ageGroup")}
          rules={[{ required: true, message: t("website.apply.form.validation.ageGroupRequired") }]}
        >
          <Radio.Group className="flex flex-col gap-2">
            <Radio value="U12">{t("website.apply.form.ageGroupU12")}</Radio>
            <Radio value="U16">{t("website.apply.form.ageGroupU16")}</Radio>
            <Radio value="U25">{t("website.apply.form.ageGroupU25")}</Radio>
            <Radio value="tautas">{t("website.apply.form.ageGroupTautas")}</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="institution" label={t("website.apply.form.institution")}>
          <Input placeholder={t("website.apply.form.institutionPlaceholder")} size="large" />
        </Form.Item>

        <Form.Item
          name="cityOrRegion"
          label={t("website.apply.form.cityOrRegion")}
          rules={[{ required: true, message: t("website.apply.form.validation.cityRequired") }]}
        >
          <Input placeholder={t("website.apply.form.cityOrRegionPlaceholder")} size="large" />
        </Form.Item>
      </Card>

      {/* Section 2: Team Members */}
      <Card className="mb-6">
        <Title level={4} className="!text-[#0A306D] !mb-4 flex items-center gap-2">
          <UserOutlined /> {minMembersHint}
        </Title>

        {ageGroup && (
          <Alert
            type="info"
            showIcon
            className="mb-4"
            message={
              ageGroup === "U12" || ageGroup === "tautas"
                ? t("website.apply.form.validation.minMembersU12")
                : t("website.apply.form.validation.minMembersU16")
            }
          />
        )}

        <Space direction="vertical" className="w-full" size="middle">
          {members.map((member, index) => (
            <Card
              key={member.key}
              size="small"
              className="bg-gray-50"
              title={
                <span className="text-sm font-medium">
                  {t("website.apply.form.section2")} #{index + 1}
                </span>
              }
              extra={
                members.length > 1 && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeMember(member.key)}
                  >
                    {t("website.apply.form.removeMember")}
                  </Button>
                )
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Text className="block mb-1">
                    {t("website.apply.form.memberFullName")} <span className="text-red-500">*</span>
                  </Text>
                  <Input
                    value={member.fullName}
                    onChange={(e) => updateMember(member.key, "fullName", e.target.value)}
                    placeholder={t("website.apply.form.memberFullNamePlaceholder")}
                  />
                </div>

                <div>
                  <Text className="block mb-1">
                    {t("website.apply.form.memberDob")} <span className="text-red-500">*</span>
                  </Text>
                  <Input
                    value={member.dateOfBirthRaw ?? (member.dateOfBirth ? member.dateOfBirth.format("DD.MM.YYYY") : "")}
                    onChange={(e) => {
                      const formatted = formatDateInput(e.target.value);
                      const parsed = parseDateString(formatted);
                      setMembers(members.map((m) => {
                        if (m.key !== member.key) return m;
                        return {
                          ...m,
                          dateOfBirthRaw: formatted,
                          dateOfBirth: parsed,
                        };
                      }));
                    }}
                    onBlur={() => {
                      // On blur, clear raw value if we have a valid date
                      setMembers(members.map((m) => {
                        if (m.key !== member.key) return m;
                        if (m.dateOfBirth) {
                          return { ...m, dateOfBirthRaw: undefined };
                        }
                        return m;
                      }));
                    }}
                    placeholder="DD.MM.YYYY"
                    maxLength={10}
                  />
                </div>

                <div>
                  <Text className="block mb-1">
                    {t("website.apply.form.memberInstitution")} <span className="text-red-500">*</span>
                  </Text>
                  <Input
                    value={member.educationalInstitution}
                    onChange={(e) => updateMember(member.key, "educationalInstitution", e.target.value)}
                    placeholder={t("website.apply.form.memberInstitutionPlaceholder")}
                  />
                </div>

                <div>
                  <Text className="block mb-1">
                    {t("website.apply.form.memberPhone")} <span className="text-red-500">*</span>
                  </Text>
                  <Input
                    value={member.phone}
                    onChange={(e) => updateMember(member.key, "phone", e.target.value)}
                    placeholder={t("website.apply.form.memberPhonePlaceholder")}
                    prefix={<PhoneOutlined className="text-gray-400" />}
                  />
                </div>

                <div>
                  <Text className="block mb-1">
                    {t("website.apply.form.memberEmail")} <span className="text-red-500">*</span>
                  </Text>
                  <Input
                    value={member.email}
                    onChange={(e) => updateMember(member.key, "email", e.target.value)}
                    placeholder={t("website.apply.form.memberEmailPlaceholder")}
                    prefix={<MailOutlined className="text-gray-400" />}
                  />
                </div>

                <div>
                  <Text className="block mb-1">
                    {t("website.apply.form.memberRole")} <span className="text-red-500">*</span>
                  </Text>
                  <Select
                    value={member.role}
                    onChange={(value) => updateMember(member.key, "role", value)}
                    placeholder={t("website.apply.form.memberRole")}
                    options={getAvailableRoleOptions(member.key)}
                    className="w-full"
                  />
                </div>

                {member.role === "team_leader" && (
                  <div>
                    <Text className="block mb-1">
                      {t("website.apply.form.teamLeaderSecondaryRole", { defaultValue: "Also serves as (optional)" })}
                    </Text>
                    <Select
                      value={member.secondaryRole}
                      onChange={(value) => updateMember(member.key, "secondaryRole", value)}
                      placeholder={t("website.apply.form.teamLeaderSecondaryRolePlaceholder", { defaultValue: "Select if also pilot..." })}
                      options={getAvailableSecondaryRoleOptions(member.key)}
                      className="w-full"
                      allowClear
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <Text className="block mb-1">{t("website.apply.form.memberClass")}</Text>
                  <Input
                    value={member.classOrYear}
                    onChange={(e) => updateMember(member.key, "classOrYear", e.target.value)}
                    placeholder={t("website.apply.form.memberClassPlaceholder")}
                  />
                </div>
              </div>
            </Card>
          ))}
        </Space>

        <Button type="dashed" onClick={addMember} block icon={<PlusOutlined />} className="mt-4">
          {t("website.apply.form.addMember")}
        </Button>
      </Card>

      {/* Section 3: Responsible Person */}
      <Card className="mb-6">
        <Title level={4} className="!text-[#0A306D] !mb-4 flex items-center gap-2">
          <PhoneOutlined /> {t("website.apply.form.section3")}
        </Title>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="responsibleName"
            label={t("website.apply.form.responsibleName")}
            rules={[{ required: true, message: t("website.apply.form.validation.responsibleNameRequired") }]}
          >
            <Input placeholder={t("website.apply.form.responsibleNamePlaceholder")} size="large" />
          </Form.Item>

          <Form.Item
            name="responsiblePhone"
            label={t("website.apply.form.responsiblePhone")}
            rules={[{ required: true, message: t("website.apply.form.validation.responsiblePhoneRequired") }]}
          >
            <Input
              placeholder={t("website.apply.form.responsiblePhonePlaceholder")}
              size="large"
              prefix={<PhoneOutlined className="text-gray-400" />}
            />
          </Form.Item>

          <Form.Item
            name="responsibleEmail"
            label={t("website.apply.form.responsibleEmail")}
            rules={[
              { required: true, message: t("website.apply.form.validation.responsibleEmailRequired") },
              { type: "email", message: t("website.apply.form.validation.responsibleEmailInvalid") },
            ]}
          >
            <Input
              placeholder={t("website.apply.form.responsibleEmailPlaceholder")}
              size="large"
              prefix={<MailOutlined className="text-gray-400" />}
            />
          </Form.Item>

          <Form.Item
            name="responsibleStatus"
            label={t("website.apply.form.responsibleStatus")}
            rules={[{ required: true, message: t("website.apply.form.validation.responsibleStatusRequired") }]}
          >
            <Input placeholder={t("website.apply.form.responsibleStatusPlaceholder")} size="large" />
          </Form.Item>
        </div>
      </Card>

      {/* Section 4: Additional Info */}
      <Card className="mb-6">
        <Title level={4} className="!text-[#0A306D] !mb-4 flex items-center gap-2">
          <InfoCircleOutlined /> {t("website.apply.form.section4")}
        </Title>

        <Form.Item name="howHeard" label={t("website.apply.form.howHeard")}>
          <Input placeholder={t("website.apply.form.howHeardPlaceholder")} size="large" />
        </Form.Item>

        <Form.Item name="comments" label={t("website.apply.form.comments")}>
          <TextArea
            placeholder={t("website.apply.form.commentsPlaceholder")}
            rows={4}
            showCount
            maxLength={1000}
          />
        </Form.Item>
      </Card>

      {/* Section 5: Confirmations */}
      <Card className="mb-6">
        <Title level={4} className="!text-[#0A306D] !mb-4 flex items-center gap-2">
          <CheckCircleOutlined /> {t("website.apply.form.section5")}
        </Title>

        <Space direction="vertical" className="w-full">
          <Form.Item
            name="confirmTruthful"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error(t("website.apply.form.validation.confirmTruthfulRequired"))),
              },
            ]}
          >
            <Checkbox>{t("website.apply.form.confirmTruthful")}</Checkbox>
          </Form.Item>

          <Form.Item
            name="confirmRules"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error(t("website.apply.form.validation.confirmRulesRequired"))),
              },
            ]}
          >
            <Checkbox>{t("website.apply.form.confirmRules")}</Checkbox>
          </Form.Item>

          <Form.Item
            name="confirmMedia"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error(t("website.apply.form.validation.confirmMediaRequired"))),
              },
            ]}
          >
            <Checkbox>{t("website.apply.form.confirmMedia")}</Checkbox>
          </Form.Item>
        </Space>
      </Card>

      <Divider />

      {/* Submit */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button size="large" onClick={onCancel}>
            {t("website.apply.form.close")}
          </Button>
        )}
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={submitting}
          className="bg-[#0A306D] hover:!bg-[#36598B]"
        >
          {submitting ? t("website.apply.form.submitting") : t("website.apply.form.submit")}
        </Button>
      </div>
    </Form>
  );
};

export default RegistrationForm;
