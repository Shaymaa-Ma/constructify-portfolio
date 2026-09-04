import React, { useEffect, useState } from "react";

import {
  servicesApi,
  getImageUrl,
} from "../api/adminApi";


export default function Services() {

  /* =========================================================
     STATE
  ========================================================= */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================================
     SERVICES SECTION
  ========================================================= */

  const [form, setForm] = useState({
    id: 1,

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

  /* =========================================================
     COUNTERS (track-record stats)
  ========================================================= */

  const [counters, setCounters] = useState([]);

  /* =========================================================
     IMAGE
  ========================================================= */

  const [currentPanelImage, setCurrentPanelImage] = useState(null);
  const [newPanelImage, setNewPanelImage] = useState(null);
  const [panelPreview, setPanelPreview] = useState(null);

  /* =========================================================
     SERVICES ITEMS
  ========================================================= */

  const [services, setServices] = useState([]);
  const [serviceSaving, setServiceSaving] = useState(null);

  /* =========================================================
     SERVICE ICON OPTIONS

     The value saved to the database is still the Bootstrap
     icon class. The admin selects a friendly icon name.
  ========================================================= */

  const serviceIconOptions = {
    1: [
      {
        value: "bi-house",
        label: "House",
      },
      {
        value: "bi-house-check",
        label: "House Check",
      },
      {
        value: "bi-buildings",
        label: "Buildings",
      },
    ],

    2: [
      {
        value: "bi-building",
        label: "Building",
      },
      {
        value: "bi-buildings",
        label: "Buildings",
      },
      {
        value: "bi-building-check",
        label: "Building Check",
      },
    ],

    3: [
      {
        value: "bi-hammer",
        label: "Hammer",
      },
      {
        value: "bi-tools",
        label: "Tools",
      },
      {
        value: "bi-house-gear",
        label: "House Gear",
      },
    ],

    4: [
      {
        value: "bi-signpost-split",
        label: "Signpost",
      },
      {
        value: "bi-cone-striped",
        label: "Construction",
      },
      {
        value: "bi-diagram-3",
        label: "Infrastructure",
      },
    ],
  };

  /* =========================================================
     COUNTER ICON OPTIONS
  ========================================================= */

  const counterIconOptions = [
    {
      value: "bi-award",
      label: "Award",
    },
    {
      value: "bi-building",
      label: "Building",
    },
    {
      value: "bi-people",
      label: "People",
    },
    {
      value: "bi-trophy",
      label: "Trophy",
    },
    {
      value: "bi-bar-chart",
      label: "Bar Chart",
    },
  ];

  /* =========================================================
     LOAD ON MOUNT
  ========================================================= */

  useEffect(() => {
    loadServices();

    return () => {
      if (panelPreview) {
        URL.revokeObjectURL(panelPreview);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================================================
     LOAD SERVICES SECTION + COUNTERS + ITEMS

     servicesApi.get() resolves the already-parsed JSON body
     directly: { success, data: section, counters: [...],
     image_url }. There is no extra axios-style ".data.data"
     nesting to unwrap — this client is fetch-based.
  ========================================================= */

  async function loadServices() {

    setLoading(true);
    setError("");

    try {

      const response = await servicesApi.getSection();

      const section = response?.data || {};

      setForm({
        id: section.id ?? 1,

        title: section.title ?? "",
        subtitle: section.subtitle ?? "",

        panel_title: section.panel_title ?? "",
        panel_btn_text: section.panel_btn_text ?? "",
        panel_btn_link: section.panel_btn_link ?? "",

        stats_badge_text: section.stats_badge_text ?? "",
        stats_title: section.stats_title ?? "",
        stats_description: section.stats_description ?? "",
        stats_btn_text: section.stats_btn_text ?? "",
        stats_btn_link: section.stats_btn_link ?? "",
      });

      setCounters(
        Array.isArray(response?.counters) ? response.counters : []
      );

      setCurrentPanelImage(section.panel_image || null);

      const servicesResponse = await servicesApi.items.list();

      setServices(
        Array.isArray(servicesResponse) ? servicesResponse : []
      );

    } catch (err) {

      setError(
        err?.message || "Failed to load Services section."
      );

    } finally {

      setLoading(false);

    }
  }

  /* =========================================================
     HANDLE SECTION FIELD CHANGE
  ========================================================= */

  function handleChange(e) {

    const { name, value } = e.target;

    setForm(previous => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  /* =========================================================
     HANDLE COUNTER INPUT
     (values only — edit only, no add/remove; the backend only
     ever UPDATEs rows by existing id)
  ========================================================= */

  function handleCounterChange(index, field, value) {

    setCounters(previous =>
      previous.map((counter, i) =>
        i === index ? { ...counter, [field]: value } : counter
      )
    );

    setError("");
    setSuccess("");
  }

  /* =========================================================
     IMAGE PICK
  ========================================================= */

  function handleImagePick(e) {

    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {

      setError("Only JPG, PNG, WEBP and GIF images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {

      setError("Image size must be less than 5 MB.");
      e.target.value = "";
      return;
    }

    if (panelPreview) {
      URL.revokeObjectURL(panelPreview);
    }

    setNewPanelImage(file);
    setPanelPreview(URL.createObjectURL(file));

    setError("");
    setSuccess("");

    e.target.value = "";
  }

  function removeNewImage() {

    if (panelPreview) {
      URL.revokeObjectURL(panelPreview);
    }

    setNewPanelImage(null);
    setPanelPreview(null);

    setError("");
    setSuccess("");
  }

  /* =========================================================
     SAVE SERVICES SECTION + COUNTERS + IMAGE

     services/index.php handles the section, the panel image,
     and all counters in ONE request — same as hero/index.php —
     so this fires exactly one servicesApi.update() call.
  ========================================================= */

  async function handleSave(e) {

    e.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {

      const fields = {
        id: form.id ?? 1,

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

        counters: counters.map((counter, index) => ({
          id: counter.id,
          icon: counter.icon || "",
          value: counter.value || "",
          label: counter.label || "",
          display_order: Number(counter.display_order) || index + 1,
        })),
      };

      if (newPanelImage) {
        fields.panel_image = newPanelImage;
      }

      const response = await servicesApi.update(fields);

      setSuccess(
        response?.message ||
          (newPanelImage
            ? "Services section, counters, and image updated successfully."
            : "Services section and counters updated successfully.")
      );

      if (panelPreview) {
        URL.revokeObjectURL(panelPreview);
      }

      setNewPanelImage(null);
      setPanelPreview(null);

      await loadServices();

    } catch (err) {

      setError(
        err?.message || "Unable to update Services section."
      );

    } finally {

      setSaving(false);

    }
  }

  /* =========================================================
     SERVICE ITEM CHANGE
  ========================================================= */

  function handleServiceChange(index, field, value) {

    setServices(previous =>
      previous.map((service, i) =>
        i === index
          ? {
              ...service,
              [field]:
                field === "display_order"
                  ? value === "" ? "" : Number(value)
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

    if (!service?.id) {

      setError("Service ID is missing.");
      return;
    }

    if (serviceSaving === service.id) {
      return;
    }

    setServiceSaving(service.id);
    setError("");
    setSuccess("");

    try {

      await servicesApi.items.update(service.id, {
        icon: service.icon || "",
        title: service.title || "",
        description: service.description || "",
        display_order: Number(service.display_order) || 0,
      });

      setSuccess(
        `"${service.title || "Service"}" updated successfully.`
      );

      const updatedServices = await servicesApi.items.list();

      setServices(
        Array.isArray(updatedServices) ? updatedServices : []
      );

    } catch (err) {

      setError(err?.message || "Failed to update service.");

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
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span>Loading Services...</span>
      </div>
    );
  }

  const displayedPanelImage =
    panelPreview || getImageUrl(currentPanelImage);

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <>

      <div className="page-header">
        <div>
          <h1>Services</h1>
          <p>
            Manage the Services section, track-record stats, and
            service items displayed on the homepage.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger p-3 mb-3" role="alert">
          <i className="bi bi-exclamation-triangle me-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success p-3 mb-3" role="alert">
          <i className="bi bi-check-circle me-2" />
          {success}
        </div>
      )}

      <div className="split-manager">

        {/* ===================================================
            IMAGE
        ==================================================== */}

        <div className="content-card form-card">

          <div className="card-heading">
            <div>
              <h3>Panel Image</h3>
              <p>Image displayed in the Services section panel.</p>
            </div>
          </div>

          {displayedPanelImage ? (

            <img
              className="image-preview"
              src={displayedPanelImage}
              alt="Services panel"
            />

          ) : (

            <div className="image-placeholder">
              <i className="bi bi-image" />
              <span>No image uploaded</span>
            </div>

          )}

          <div className="form-actions-modern">

            <label
              className="admin-btn btn btn-sm mb-0"
              style={{ cursor: saving ? "not-allowed" : "pointer" }}
            >
              <i className="bi bi-upload me-2" />
              {newPanelImage ? "Change Image" : "Choose Image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                disabled={saving}
                onChange={handleImagePick}
              />
            </label>

            {newPanelImage && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={removeNewImage}
                disabled={saving}
              >
                <i className="bi bi-x-lg me-2" />
                Cancel New Image
              </button>
            )}

          </div>

          {newPanelImage && (
            <div className="mt-2 text-muted">
              <i className="bi bi-file-image me-2" />
              Selected: <strong>{newPanelImage.name}</strong>
            </div>
          )}

        </div>

        {/* ===================================================
            CONTENT
        ==================================================== */}

        <form className="content-card form-card" onSubmit={handleSave}>

          <div className="card-heading">
            <div>
              <h3>Section Content</h3>
              <p>Edit the Services section content.</p>
            </div>
          </div>

          <div className="row g-3">

            <div className="col-12">
              <label className="form-label" htmlFor="title">
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

            <div className="col-12">
              <label className="form-label" htmlFor="subtitle">
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

            <div className="col-12">
              <div className="form-section-title mb-0 mt-2">Panel</div>
            </div>

            <div className="col-12">
              <label className="form-label" htmlFor="panel_title">
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

            <div className="col-md-6">
              <label className="form-label" htmlFor="panel_btn_text">
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

            <div className="col-md-6">
              <label className="form-label" htmlFor="panel_btn_link">
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

            <div className="col-12">
              <div className="form-section-title mb-0 mt-2">Stats</div>
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="stats_badge_text">
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

            <div className="col-md-6">
              <label className="form-label" htmlFor="stats_title">
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

            <div className="col-12">
              <label className="form-label" htmlFor="stats_description">
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

            <div className="col-md-6">
              <label className="form-label" htmlFor="stats_btn_text">
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

            <div className="col-md-6">
              <label className="form-label" htmlFor="stats_btn_link">
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

          {/* =================================================
              TRACK-RECORD COUNTERS — edit values only,
              no add/remove
          ================================================== */}

          <div className="mt-4">

            <div className="card-heading">
              <div>
                <h3>Track-Record Stats</h3>
                <p>Edit the 4 stat counters shown in the Services section.</p>
              </div>
            </div>

            <div className="row g-3">
              {counters.map((counter, index) => (
                <div className="col-12" key={counter.id ?? `counter-${index}`}>
                  <div className="border rounded p-3">
                    <div className="row g-3">

                      <div className="col-md-3">
                        <label className="form-label">
                          Icon
                        </label>

                        <div style={{ position: "relative" }}>

                          <select
                            className="form-input form-control"
                            style={{
                              paddingRight: 35,
                            }}
                            value={counter.icon || ""}
                            onChange={(e) =>
                              handleCounterChange(
                                index,
                                "icon",
                                e.target.value
                              )
                            }
                          >

                            <option
                              value=""
                              disabled
                            >
                              Select an icon
                            </option>

                            {counterIconOptions.map(
                              (option) => (

                                <option
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </option>

                              )
                            )}

                          </select>

                          <i
                            className="bi bi-chevron-down"
                            style={{
                              position: "absolute",
                              right: 12,
                              top: "50%",
                              transform:
                                "translateY(-50%)",
                              pointerEvents: "none",
                              fontSize: 12,
                            }}
                          />

                        </div>
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">Value</label>
                        <input
                          type="text"
                          className="form-input form-control"
                          value={counter.value || ""}
                          onChange={(e) =>
                            handleCounterChange(index, "value", e.target.value)
                          }
                          placeholder="850+"
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Label</label>
                        <input
                          type="text"
                          className="form-input form-control"
                          value={counter.label || ""}
                          onChange={(e) =>
                            handleCounterChange(index, "label", e.target.value)
                          }
                          placeholder="Projects Delivered"
                        />
                      </div>

                      <div className="col-md-2">
                        <label className="form-label">Order</label>
                        <input
                          type="number"
                          min="1"
                          className="form-input form-control"
                          value={counter.display_order || ""}
                          onChange={(e) =>
                            handleCounterChange(
                              index,
                              "display_order",
                              e.target.value
                            )
                          }
                        />
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>

            {counters.length === 0 && (
              <div className="alert alert-secondary">
                No Services counters found.
              </div>
            )}

          </div>

          <div className="form-actions-modern">
            <button className="admin-btn btn" type="submit" disabled={saving}>
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
              Edit each service's icon, title, description, and
              display order.
            </span>
          </div>
        </div>

        <div className="stack-list">

          {services.map((service, index) => {

            const iconOptions =
              serviceIconOptions[service.id] || [
                {
                  value: "bi-house",
                  label: "House",
                },
                {
                  value: "bi-building",
                  label: "Building",
                },
                {
                  value: "bi-tools",
                  label: "Tools",
                },
              ];

            return (

              <div
                className="data-item"
                key={service.id ?? `service-${index}`}
              >

                <div className="data-icon">
                  <i
                    className={`bi ${
                      service.icon || "bi-tools"
                    }`}
                  />
                </div>

                <div
                  className="data-info"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    flex: 1,
                  }}
                >

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >

                    {/* =================================================
                        SERVICE ICON DROPDOWN
                    ================================================== */}

                    <div
                      style={{
                        position: "relative",
                        width: 180,
                      }}
                    >

                      <select
                        className="form-input form-control form-control-sm"
                        style={{
                          width: "100%",
                          paddingRight: 32,
                        }}
                        value={service.icon || ""}
                        onChange={(e) =>
                          handleServiceChange(
                            index,
                            "icon",
                            e.target.value
                          )
                        }
                      >

                        <option
                          value=""
                          disabled
                        >
                          Select an icon
                        </option>

                        {iconOptions.map(
                          (option) => (

                            <option
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </option>

                          )
                        )}

                      </select>

                      <i
                        className="bi bi-chevron-down"
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform:
                            "translateY(-50%)",
                          pointerEvents: "none",
                          fontSize: 11,
                        }}
                      />

                    </div>

                    <input
                      type="text"
                      className="form-input form-control form-control-sm"
                      style={{
                        flex: 1,
                        minWidth: 180,
                      }}
                      value={service.title || ""}
                      onChange={(e) =>
                        handleServiceChange(
                          index,
                          "title",
                          e.target.value
                        )
                      }
                      placeholder="Service title"
                    />

                    <input
                      type="number"
                      className="form-input form-control form-control-sm"
                      style={{
                        maxWidth: 100,
                      }}
                      value={
                        service.display_order ?? ""
                      }
                      onChange={(e) =>
                        handleServiceChange(
                          index,
                          "display_order",
                          e.target.value
                        )
                      }
                      placeholder="Order"
                    />

                  </div>

                  <textarea
                    className="form-input form-control form-control-sm"
                    value={
                      service.description || ""
                    }
                    onChange={(e) =>
                      handleServiceChange(
                        index,
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Service description"
                    rows={3}
                  />

                </div>

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

            );

          })}

          {services.length === 0 && (
            <div className="empty-state">
              <i className="bi bi-tools mb-2" />
              <div>No services found.</div>
            </div>
          )}

        </div>

      </div>

    </>
  );
}