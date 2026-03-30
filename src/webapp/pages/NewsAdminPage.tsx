import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Input, Space, Tag, Switch, message, Popconfirm, Upload } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, EyeOutlined, FileImageOutlined, FilePdfOutlined, FileOutlined, CloseCircleOutlined } from "@ant-design/icons";
import "@ant-design/v5-patch-for-react-19";
import { useTranslation } from "react-i18next";
import {
  getArticles,
  addArticle,
  updateArticle,
  deleteArticle,
  type NewsArticle,
} from "@/website/pages/data/newsStore";
import { formatDisplayDate } from "@/utils/dateFormat";

const { TextArea } = Input;

interface AttachedFile {
  name: string;
  type: string;
  dataUrl: string; // base64 data URL
}

const emptyForm = {
  titleEn: "",
  titleLv: "",
  summaryEn: "",
  summaryLv: "",
  contentEn: "",
  contentLv: "",
  author: "",
  image: "",
  tags: "",
  published: true,
  attachments: [] as AttachedFile[],
};

/** Read a File to a base64 data-URL string */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const NewsAdminPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "en" | "lv";
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [previewArticle, setPreviewArticle] = useState<NewsArticle | null>(null);

  const reload = () => setArticles(getArticles());

  useEffect(() => {
    reload();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (article: NewsArticle) => {
    setEditingId(article.id);
    setForm({
      titleEn: article.title.en,
      titleLv: article.title.lv,
      summaryEn: article.summary.en,
      summaryLv: article.summary.lv,
      contentEn: article.content.en,
      contentLv: article.content.lv,
      author: article.author,
      image: article.image,
      tags: article.tags.join(", "),
      published: article.published,
      attachments: article.attachments || [],
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      message.error("Please select an image file.");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error("Image must be smaller than 5 MB.");
      return false;
    }
    const dataUrl = await fileToDataUrl(file);
    setForm((prev) => ({ ...prev, image: dataUrl }));
    return false; // prevent antd auto-upload
  };

  const handleFileAttach = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      message.error("File must be smaller than 10 MB.");
      return false;
    }
    const dataUrl = await fileToDataUrl(file);
    setForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, { name: file.name, type: file.type, dataUrl }],
    }));
    return false;
  };

  const removeAttachment = (index: number) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    if (!form.titleEn.trim() && !form.titleLv.trim()) {
      message.error("Title is required in at least one language.");
      return;
    }

    const data = {
      title: { en: form.titleEn.trim(), lv: form.titleLv.trim() },
      summary: { en: form.summaryEn.trim(), lv: form.summaryLv.trim() },
      content: { en: form.contentEn.trim(), lv: form.contentLv.trim() },
      author: form.author.trim() || "Admin",
      date: editingId
        ? (articles.find((a) => a.id === editingId)?.date || new Date().toISOString().slice(0, 10))
        : new Date().toISOString().slice(0, 10),
      image: form.image,
      tags: form.tags
        .split(",")
        .map((tg) => tg.trim())
        .filter(Boolean),
      published: form.published,
      attachments: form.attachments,
    };

    if (editingId) {
      updateArticle(editingId, data);
      message.success("Article updated.");
    } else {
      addArticle(data);
      message.success("Article created.");
    }

    setModalOpen(false);
    reload();
  };

  const handleDelete = (id: string) => {
    deleteArticle(id);
    message.success("Article deleted.");
    reload();
  };

  /** Build a preview-ready article from the current form state */
  const buildPreviewFromForm = (): NewsArticle => ({
    id: editingId || "preview",
    title: { en: form.titleEn || "(No title)", lv: form.titleLv || "(Nav nosaukuma)" },
    summary: { en: form.summaryEn, lv: form.summaryLv },
    content: { en: form.contentEn, lv: form.contentLv },
    author: form.author || "Admin",
    date: new Date().toISOString().slice(0, 10),
    image: form.image,
    tags: form.tags.split(",").map((tg) => tg.trim()).filter(Boolean),
    published: form.published,
    attachments: form.attachments,
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <FileImageOutlined className="text-blue-400" />;
    if (type === "application/pdf") return <FilePdfOutlined className="text-red-400" />;
    return <FileOutlined className="text-gray-400" />;
  };

  const columns = [
    {
      title: t("website.newsAdmin.titleCol"),
      key: "title",
      render: (_: any, record: NewsArticle) => (
        <div className="flex items-center gap-3">
          {record.image && (
            <img src={record.image} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
          )}
          <div>
            <div className="font-medium text-white">{record.title.en || record.title.lv}</div>
            {record.title.lv && record.title.en && (
              <div className="text-xs text-gray-400">{record.title.lv}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: t("website.newsAdmin.author"),
      dataIndex: "author",
      key: "author",
      width: 140,
    },
    {
      title: t("website.newsAdmin.date"),
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (value: string) => formatDisplayDate(value),
    },
    {
      title: t("website.newsAdmin.tags"),
      key: "tags",
      width: 200,
      render: (_: any, record: NewsArticle) => (
        <div className="flex flex-wrap gap-1">
          {record.tags.map((tag) => (
            <Tag key={tag} color="blue">
              {tag}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: t("website.newsAdmin.published"),
      key: "published",
      width: 100,
      render: (_: any, record: NewsArticle) => (
        <Tag color={record.published ? "green" : "red"}>
          {record.published ? "✓" : "✗"}
        </Tag>
      ),
    },
    {
      title: t("common.actions"),
      key: "actions",
      width: 160,
      render: (_: any, record: NewsArticle) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewArticle(record)} title="Preview" />
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title={t("website.newsAdmin.confirmDelete")} onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* ── Preview Renderer ─────────────────────────────── */
  const renderPreview = (article: NewsArticle) => (
    <div className="bg-white text-gray-900 rounded-xl overflow-hidden">
      {article.image && (
        <div className="h-56 overflow-hidden">
          <img src={article.image} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-6">
        <div className="flex gap-2 mb-3">
          {article.tags.map((tag) => (
            <span key={tag} className="text-xs bg-[#4EA9D5]/10 text-[#4EA9D5] px-2 py-0.5 rounded-full font-medium">
              {tag}
            </span>
          ))}
        </div>
        <h2 className="text-2xl font-bold text-[#0A306D] mb-2">
          {article.title[lang] || article.title.en}
        </h2>
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span>{article.author}</span>
          <span>{formatDisplayDate(article.date)}</span>
        </div>
        <p className="text-gray-600 italic mb-4">{article.summary[lang] || article.summary.en}</p>
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-800">
          {article.content[lang] || article.content.en}
        </div>

        {/* Attachments */}
        {article.attachments && article.attachments.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">{t("website.newsAdmin.attachments")}</h4>
            <div className="flex flex-wrap gap-3">
              {article.attachments.map((att, i) => (
                <a
                  key={i}
                  href={att.dataUrl}
                  download={att.name}
                  className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm hover:bg-gray-200 transition-colors"
                >
                  {getFileIcon(att.type)}
                  <span className="text-gray-700">{att.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">{t("website.newsAdmin.header")}</h1>

      <div className="flex flex-col gap-y-6 w-full max-w-[1200px]">
          <div className="flex items-center justify-between">
            <h2 className="text-white text-xl font-semibold">{t("website.newsAdmin.manageTitle")}</h2>
            <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>
              {t("website.newsAdmin.addNew")}
            </Button>
          </div>

          <Table
            dataSource={articles}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        </div>

      {/* ── Preview Modal ──────────────────────────────── */}
      <Modal
        open={!!previewArticle}
        title={t("website.newsAdmin.previewTitle")}
        onCancel={() => setPreviewArticle(null)}
        footer={null}
        width={720}
      >
        {previewArticle && renderPreview(previewArticle)}
      </Modal>

      {/* ── Add / Edit Modal ───────────────────────────── */}
      <Modal
        open={modalOpen}
        title={editingId ? t("website.newsAdmin.editArticle") : t("website.newsAdmin.newArticle")}
        onCancel={() => setModalOpen(false)}
        width={1000}
        footer={
          <div className="flex justify-between">
            <Button
              icon={<EyeOutlined />}
              onClick={() => setPreviewArticle(buildPreviewFromForm())}
            >
              {t("website.newsAdmin.previewBtn")}
            </Button>
            <Space>
              <Button onClick={() => setModalOpen(false)}>{t("admin.cancel")}</Button>
              <Button type="primary" onClick={handleSave}>{t("admin.save")}</Button>
            </Space>
          </div>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Titles */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title (EN)</label>
              <Input
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                placeholder="English title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title (LV)</label>
              <Input
                value={form.titleLv}
                onChange={(e) => setForm({ ...form, titleLv: e.target.value })}
                placeholder="Latvian title"
              />
            </div>
          </div>

          {/* Summaries */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Summary (EN)</label>
              <TextArea
                rows={2}
                value={form.summaryEn}
                onChange={(e) => setForm({ ...form, summaryEn: e.target.value })}
                placeholder="English summary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Summary (LV)</label>
              <TextArea
                rows={2}
                value={form.summaryLv}
                onChange={(e) => setForm({ ...form, summaryLv: e.target.value })}
                placeholder="Latvian summary"
              />
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Content (EN)</label>
              <TextArea
                rows={6}
                value={form.contentEn}
                onChange={(e) => setForm({ ...form, contentEn: e.target.value })}
                placeholder="English content"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Content (LV)</label>
              <TextArea
                rows={6}
                value={form.contentLv}
                onChange={(e) => setForm({ ...form, contentLv: e.target.value })}
                placeholder="Latvian content"
              />
            </div>
          </div>

          {/* Author + Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Author</label>
              <Input
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                placeholder="Author name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags ({t("website.newsAdmin.commaSeparated")})</label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="news, update"
              />
            </div>
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("website.newsAdmin.coverImage")}</label>
            <div className="flex items-start gap-4">
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleImageUpload}
              >
                <Button icon={<UploadOutlined />}>{t("website.newsAdmin.uploadImage")}</Button>
              </Upload>
              {form.image && (
                <div className="relative">
                  <img src={form.image} alt="Cover preview" className="w-32 h-20 object-cover rounded-lg border" />
                  <button
                    onClick={() => setForm({ ...form, image: "" })}
                    className="absolute -top-2 -right-2 text-red-500 hover:text-red-700 bg-white rounded-full cursor-pointer"
                  >
                    <CloseCircleOutlined style={{ fontSize: 18 }} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium mb-2">{t("website.newsAdmin.attachments")}</label>
            <Upload
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
              showUploadList={false}
              beforeUpload={handleFileAttach}
              multiple
            >
              <Button icon={<UploadOutlined />}>{t("website.newsAdmin.attachFile")}</Button>
            </Upload>
            {form.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {form.attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 text-sm"
                  >
                    {getFileIcon(att.type)}
                    <span className="text-gray-700 max-w-[160px] truncate">{att.name}</span>
                    <button
                      onClick={() => removeAttachment(i)}
                      className="text-red-400 hover:text-red-600 cursor-pointer ml-1"
                    >
                      <CloseCircleOutlined />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Published toggle */}
          <div className="flex items-center gap-2">
            <Switch checked={form.published} onChange={(v) => setForm({ ...form, published: v })} />
            <span>{t("website.newsAdmin.published")}</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default NewsAdminPage;
