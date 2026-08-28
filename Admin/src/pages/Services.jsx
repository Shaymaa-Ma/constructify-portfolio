
import React, { useEffect, useState } from "react";
import { servicesApi } from "../api/adminApi";

const IMAGE_BASE =
  import.meta.env?.VITE_UPLOADS_BASE_URL || "/uploads";

export default function Services() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================================
     SERVICES SECTION
  ========================================================= */

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    panel_title: "",
    panel_btn_text: "",
    panel_btn_link: "",
    stats_badge_text: "",
    stats_title: "",
    stats_description: "",
    stats_btn_text: "",
    stats_btn_link: "",
  });

  const [currentPanelImage, setCurrentPanelImage] =
    useState(null);

  const [newPanelImage, setNewPanelImage] =
    useState(null);

  const [panelPreview, setPanelPreview] =
    useState(null);

  /* =========================================================
     SERVICES ITEMS
  ========================================================= */

  const [services, setServices] = useState([]);
  const [serviceSaving, setServiceSaving] = useState(null);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [sectionResponse, servicesList] =
        await Promise.all([
          servicesApi.getSection(),
          servicesApi.items.list(),
        ]);

      /*
       * Support all common backend response structures:
       *
       * { success: true, data: {...} }
       * { success: true, section: {...} }
       * {...}
       */

      const section =
        sectionResponse?.data ||
        sectionResponse?.section ||
        sectionResponse ||
        {};

      setForm({
        title: section.title || "",
        subtitle: section.subtitle || "",
        panel_title: section.panel_title || "",
        panel_btn_text: section.panel_btn_text || "",
        panel_btn_link: section.panel_btn_link || "",
        stats_badge_text:
          section.stats_badge_text || "",
        stats_title: section.stats_title || "",
        stats_description:
          section.stats_description || "",
        stats_btn_text: section.stats_btn_text || "",
        stats_btn_link: section.stats_btn_link || "",
      });

      setCurrentPanelImage(
        section.panel_image || null
      );

      /*
       * servicesApi.items.list() already returns:
       *
       * res.data || []
       */
      setServices(
        Array.isArray(servicesList)
          ? servicesList
          : []
      );
    } catch (err) {
      setError(
        err?.message ||
          "Failed to load Services."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     HANDLE SECTION INPUT
  ========================================================= */

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  /* =========================================================
     IMAGE URL
  ========================================================= */

  function getImageUrl(image) {
    if (!image) {
      return null;
    }

    if (
      image.startsWith("http://") ||
      image.startsWith("https://") ||
      image.startsWith("/")
    ) {
      return image;
    }

    return `${IMAGE_BASE}/${image}`;
  }

  /* =========================================================
     PICK PANEL IMAGE
  ========================================================= */

  function pickPanelImage(e) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    /*
     * Basic image validation.
     */
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    /*
     * Limit to 5 MB.
     */
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      return;
    }

    if (panelPreview) {
      URL.revokeObjectURL(panelPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setNewPanelImage(file);
    setPanelPreview(previewUrl);

    setError("");
    setSuccess("");
  }

  /* =========================================================
     SAVE SERVICES SECTION
  ========================================================= */

  async function handleSectionSave(e) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      /*
       * The current adminApi.js sends JSON.
       *
       * Therefore only the text fields are saved here.
       * The selected image is only previewed.
       */
      await servicesApi.updateSection({
        title: form.title,
        subtitle: form.subtitle,
        panel_title: form.panel_title,
        panel_btn_text: form.panel_btn_text,
        panel_btn_link: form.panel_btn_link,
        stats_badge_text: form.stats_badge_text,
        stats_title: form.stats_title,
        stats_description: form.stats_description,
        stats_btn_text: form.stats_btn_text,
        stats_btn_link: form.stats_btn_link,
      });

      setSuccess(
        "Services section updated successfully."
      );

      setNewPanelImage(null);

      if (panelPreview) {
        URL.revokeObjectURL(panelPreview);
      }

      setPanelPreview(null);

      /*
       * Reload saved database values.
       */
      await load();
    } catch (err) {
      setError(
        err?.message ||
          "Failed to update Services section."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     SERVICE FIELD CHANGE
  ========================================================= */

  function handleServiceFieldChange(
    id,
    field,
    value
  ) {
    setServices((previous) =>
      previous.map((service) =>
        String(service.id) === String(id)
          ? {
              ...service,
              [field]:
                field === "display_order"
                  ? value === ""
                    ? ""
                    : Number(value)
                  : value,
            }
          : service
      )
    );

    setError("");
    setSuccess("");
  }

  /* =========================================================
     SAVE SERVICE ITEM
  ========================================================= */

  async function handleServiceSave(service) {
    setServiceSaving(service.id);
    setError("");
    setSuccess("");

    try {
      await servicesApi.items.update(
        service.id,
        {
          icon: service.icon || "",
          title: service.title || "",
          description: service.description || "",
          display_order:
            service.display_order === ""
              ? 0
              : Number(service.display_order),
        }
      );

      setSuccess(
        `"${service.title || "Service"}" updated successfully.`
      );

      /*
       * Reload services from database.
       */
      const updatedServices =
        await servicesApi.items.list();

      setServices(
        Array.isArray(updatedServices)
          ? updatedServices
          : []
      );
    } catch (err) {
      setError(
        err?.message ||
          "Failed to update service."
      );
    } finally {
      setServiceSaving(null);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="loading-state">
        <div
          className="spinner-border"
          role="status"
        >
          <span className="visually-hidden">
            Loading...
          </span>
        </div>

        <span>Loading services...</span>
      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <>
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="page-header">
        <div>
          <h1>Services</h1>

          <p>
            Manage the Services section and
            service items displayed on the
            homepage.
          </p>
        </div>
      </div>

      {/* =====================================================
          ALERTS
      ====================================================== */}

      {error && (
        <div
          className="alert alert-danger p-3 mb-3"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="alert alert-success p-3 mb-3"
          role="alert"
        >
          {success}
        </div>
      )}

      {/* =====================================================
          SERVICES SECTION
      ====================================================== */}

      <div className="split-manager">

        {/* ===================================================
            PANEL IMAGE
        ==================================================== */}

        <div className="content-card form-card">
          <div className="card-heading">
            <div>
              <h3>Panel Image</h3>

              <p>
                Image displayed in the Services
                section panel.
              </p>
            </div>
          </div>

          {panelPreview || currentPanelImage ? (
            <img
              className="image-preview"
              src={
                panelPreview ||
                getImageUrl(currentPanelImage)
              }
              alt="Services panel"
            />
          ) : (
            <div className="image-placeholder">
              <i className="bi bi-image" />

              <span>
                No image uploaded
              </span>
            </div>
          )}

          <div className="form-actions-modern">
            <label
              className="admin-btn btn btn-sm mb-0"
              style={{
                cursor: "pointer",
              }}
            >
              <i className="bi bi-upload me-2" />

              Choose Image

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={pickPanelImage}
              />
            </label>
          </div>

          {newPanelImage && (
            <>
              <div className="text-muted mt-2">
                Selected: {newPanelImage.name}
              </div>

              <div className="alert alert-warning mt-3 mb-0">
                <small>
                  Image preview only. The current
                  API uses JSON and does not upload
                  image files yet.
                </small>
              </div>
            </>
          )}
        </div>

        {/* ===================================================
            SECTION CONTENT
        ==================================================== */}

        <form
          className="content-card form-card"
          onSubmit={handleSectionSave}
        >
          <div className="card-heading">
            <div>
              <h3>Section Content</h3>

              <p>
                Edit the Services section
                content.
              </p>
            </div>
          </div>

          <div className="row g-3">

            {/* SECTION TITLE */}

            <div className="col-12">
              <label
                className="form-label"
                htmlFor="title"
              >
                Section Title
              </label>

              <input
                id="title"
                type="text"
                className="form-input form-control"
                name="title"
                value={form.title}
                onChange={handleChange}
              />
            </div>

            {/* SECTION SUBTITLE */}

            <div className="col-12">
              <label
                className="form-label"
                htmlFor="subtitle"
              >
                Section Subtitle
              </label>

              <textarea
                id="subtitle"
                className="form-input form-control"
                name="subtitle"
                value={form.subtitle}
                onChange={handleChange}
                rows={3}
              />
            </div>

            {/* PANEL */}

            <div className="col-12">
              <div className="form-section-title mb-0 mt-2">
                Panel
              </div>
            </div>

            {/* PANEL TITLE */}

            <div className="col-12">
              <label
                className="form-label"
                htmlFor="panel_title"
              >
                Panel Title
              </label>

              <input
                id="panel_title"
                type="text"
                className="form-input form-control"
                name="panel_title"
                value={form.panel_title}
                onChange={handleChange}
              />
            </div>

            {/* PANEL BUTTON TEXT */}

            <div className="col-md-6">
              <label
                className="form-label"
                htmlFor="panel_btn_text"
              >
                Panel Button Text
              </label>

              <input
                id="panel_btn_text"
                type="text"
                className="form-input form-control"
                name="panel_btn_text"
                value={form.panel_btn_text}
                onChange={handleChange}
              />
            </div>

            {/* PANEL BUTTON LINK */}

            <div className="col-md-6">
              <label
                className="form-label"
                htmlFor="panel_btn_link"
              >
                Panel Button Link
              </label>

              <input
                id="panel_btn_link"
                type="text"
                className="form-input form-control"
                name="panel_btn_link"
                value={form.panel_btn_link}
                onChange={handleChange}
              />
            </div>

            {/* STATS */}

            <div className="col-12">
              <div className="form-section-title mb-0 mt-2">
                Stats
              </div>
            </div>

            {/* STATS BADGE */}

            <div className="col-md-6">
              <label
                className="form-label"
                htmlFor="stats_badge_text"
              >
                Stats Badge Text
              </label>

              <input
                id="stats_badge_text"
                type="text"
                className="form-input form-control"
                name="stats_badge_text"
                value={form.stats_badge_text}
                onChange={handleChange}
              />
            </div>

            {/* STATS TITLE */}

            <div className="col-md-6">
              <label
                className="form-label"
                htmlFor="stats_title"
              >
                Stats Title
              </label>

              <input
                id="stats_title"
                type="text"
                className="form-input form-control"
                name="stats_title"
                value={form.stats_title}
                onChange={handleChange}
              />
            </div>

            {/* STATS DESCRIPTION */}

            <div className="col-12">
              <label
                className="form-label"
                htmlFor="stats_description"
              >
                Stats Description
              </label>

              <textarea
                id="stats_description"
                className="form-input form-control"
                name="stats_description"
                value={form.stats_description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            {/* STATS BUTTON TEXT */}

            <div className="col-md-6">
              <label
                className="form-label"
                htmlFor="stats_btn_text"
              >
                Stats Button Text
              </label>

              <input
                id="stats_btn_text"
                type="text"
                className="form-input form-control"
                name="stats_btn_text"
                value={form.stats_btn_text}
                onChange={handleChange}
              />
            </div>

            {/* STATS BUTTON LINK */}

            <div className="col-md-6">
              <label
                className="form-label"
                htmlFor="stats_btn_link"
              >
                Stats Button Link
              </label>

              <input
                id="stats_btn_link"
                type="text"
                className="form-input form-control"
                name="stats_btn_link"
                value={form.stats_btn_link}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* SAVE SECTION */}

          <div className="form-actions-modern">
            <button
              className="admin-btn btn"
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />

                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2" />

                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* =====================================================
          SERVICES LIST
      ====================================================== */}

      <div className="content-card list-card mt-3">

        <div className="card-heading">
          <div>
            <h3>Services List</h3>

            <span>
              Edit each service's icon,
              title, description, and
              display order.
            </span>
          </div>
        </div>

        <div className="stack-list">

          {services.map((service) => (
            <div
              className="data-item"
              key={service.id}
            >

              {/* =================================================
                  SERVICE ICON PREVIEW
              ================================================== */}

              <div className="data-icon">
                <i
                  className={`bi ${
                    service.icon || "bi-tools"
                  }`}
                />
              </div>

              {/* =================================================
                  SERVICE CONTENT
              ================================================== */}

              <div
                className="data-info"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  flex: 1,
                }}
              >

                {/* TOP ROW */}

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >

                  {/* ICON */}

                  <input
                    type="text"
                    className="form-input form-control form-control-sm"
                    style={{
                      maxWidth: 180,
                    }}
                    value={service.icon || ""}
                    onChange={(e) =>
                      handleServiceFieldChange(
                        service.id,
                        "icon",
                        e.target.value
                      )
                    }
                    placeholder="bi-tools"
                  />

                  {/* TITLE */}

                  <input
                    type="text"
                    className="form-input form-control form-control-sm"
                    style={{
                      flex: 1,
                      minWidth: 180,
                    }}
                    value={service.title || ""}
                    onChange={(e) =>
                      handleServiceFieldChange(
                        service.id,
                        "title",
                        e.target.value
                      )
                    }
                    placeholder="Service title"
                  />

                  {/* DISPLAY ORDER */}

                  <input
                    type="number"
                    className="form-input form-control form-control-sm"
                    style={{
                      maxWidth: 100,
                    }}
                    value={
                      service.display_order ?? 0
                    }
                    onChange={(e) =>
                      handleServiceFieldChange(
                        service.id,
                        "display_order",
                        e.target.value
                      )
                    }
                    placeholder="Order"
                  />
                </div>

                {/* DESCRIPTION */}

                <textarea
                  className="form-input form-control form-control-sm"
                  value={
                    service.description || ""
                  }
                  onChange={(e) =>
                    handleServiceFieldChange(
                      service.id,
                      "description",
                      e.target.value
                    )
                  }
                  placeholder="Service description"
                  rows={3}
                />
              </div>

              {/* =================================================
                  SAVE BUTTON
              ================================================== */}

              <div className="data-actions">
                <button
                  className="btn-icon"
                  type="button"
                  disabled={
                    serviceSaving === service.id
                  }
                  onClick={() =>
                    handleServiceSave(service)
                  }
                  title="Save service"
                >
                  {serviceSaving === service.id ? (
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    />
                  ) : (
                    <i className="bi bi-check2" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* EMPTY STATE */}

          {services.length === 0 && (
            <div className="empty-state">
              <i className="bi bi-tools mb-2" />

              <div>
                No services found.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}