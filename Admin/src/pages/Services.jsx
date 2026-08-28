
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
     CURRENT IMAGE
  ========================================================= */

  const [currentPanelImage, setCurrentPanelImage] = useState(null);

  /* =========================================================
     NEW IMAGE
  ========================================================= */

  const [newPanelImage, setNewPanelImage] = useState(null);

  /* =========================================================
     IMAGE PREVIEW
  ========================================================= */

  const [panelPreview, setPanelPreview] = useState(null);

  /* =========================================================
     SERVICES ITEMS
  ========================================================= */

  const [services, setServices] = useState([]);
  const [serviceSaving, setServiceSaving] = useState(null);

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
     LOAD SERVICES SECTION + ITEMS
  ========================================================= */

  async function loadServices() {

    setLoading(true);
    setError("");

    try {

      /* =====================================================
         LOAD SERVICES SECTION
      ===================================================== */

      const response = await servicesApi.get();

      console.log("SERVICES API RESPONSE:", response);

      /*
       * Axios response:
       *
       * response
       *   └── data
       *        ├── success
       *        ├── data       <-- actual section
       *        ├── counters
       *        └── image_url
       *
       * Therefore:
       *
       * response.data.data
       */

      const apiResponse =
        response?.data ?? response ?? {};

      const section =
        apiResponse?.data ?? apiResponse ?? {};

      console.log("SERVICES SECTION:", section);

      /* =====================================================
         FORM
      ===================================================== */

      setForm({
        id: section.id ?? 1,

        title: section.title ?? "",
        subtitle: section.subtitle ?? "",

        panel_title: section.panel_title ?? "",
        panel_btn_text: section.panel_btn_text ?? "",
        panel_btn_link: section.panel_btn_link ?? "",

        stats_badge_text:
          section.stats_badge_text ?? "",

        stats_title:
          section.stats_title ?? "",

        stats_description:
          section.stats_description ?? "",

        stats_btn_text:
          section.stats_btn_text ?? "",

        stats_btn_link:
          section.stats_btn_link ?? "",
      });

      /* =====================================================
         IMAGE
      ===================================================== */

      setCurrentPanelImage(
        section.panel_image ||
        apiResponse.image_url ||
        null
      );

      /* =====================================================
         LOAD SERVICE ITEMS
      ===================================================== */

      if (
        servicesApi.items &&
        typeof servicesApi.items.list === "function"
      ) {

        const servicesResponse =
          await servicesApi.items.list();

        /*
         * Support both:
         *
         * Axios:
         * response.data.data
         *
         * Direct array:
         * [...]
         */

        const servicesData =
          servicesResponse?.data?.data ??
          servicesResponse?.data ??
          servicesResponse ??
          [];

        setServices(
          Array.isArray(servicesData)
            ? servicesData
            : []
        );

      } else {

        setServices([]);

      }

    } catch (err) {

      console.error(
        "Services load error:",
        err
      );

      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load Services section."
      );

    } finally {

      setLoading(false);

    }
  }

  /* =========================================================
     HANDLE SECTION FIELD CHANGE
  ========================================================= */

  function handleChange(e) {

    const {
      name,
      value,
    } = e.target;

    setForm(previous => ({
      ...previous,
      [name]: value,
    }));

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

      setError(
        "Only JPG, PNG, WEBP and GIF images are allowed."
      );

      e.target.value = "";

      return;
    }

    if (file.size > 5 * 1024 * 1024) {

      setError(
        "Image size must be less than 5 MB."
      );

      e.target.value = "";

      return;
    }

    if (panelPreview) {
      URL.revokeObjectURL(panelPreview);
    }

    const previewUrl =
      URL.createObjectURL(file);

    setNewPanelImage(file);
    setPanelPreview(previewUrl);

    setError("");
    setSuccess("");

    e.target.value = "";
  }

  /* =========================================================
     REMOVE NEW IMAGE
  ========================================================= */

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
     SAVE SERVICES SECTION
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

      /*
       * IMPORTANT:
       *
       * Your PHP backend expects these exact names.
       */

      const fields = {
        id: form.id ?? 1,

        title: form.title,
        subtitle: form.subtitle,

        panel_title: form.panel_title,
        panel_btn_text: form.panel_btn_text,
        panel_btn_link: form.panel_btn_link,

        stats_badge_text:
          form.stats_badge_text,

        stats_title:
          form.stats_title,

        stats_description:
          form.stats_description,

        stats_btn_text:
          form.stats_btn_text,

        stats_btn_link:
          form.stats_btn_link,
      };

      /*
       * If an image was selected,
       * servicesApi.update() must convert
       * this object into FormData.
       */

      if (newPanelImage) {
        fields.panel_image = newPanelImage;
      }

      console.log(
        "SERVICES SAVE DATA:",
        fields
      );

      const response =
        await servicesApi.update(fields);

      console.log(
        "SERVICES SAVE RESPONSE:",
        response
      );

      /*
       * Axios response:
       *
       * response.data = PHP JSON
       */

      const result =
        response?.data ?? response ?? {};

      if (result.success === false) {

        throw new Error(
          result.error ||
          result.message ||
          "Services section update failed."
        );
      }

      setSuccess(
        result.message ||
        (
          newPanelImage
            ? "Services section and image updated successfully."
            : "Services section updated successfully."
        )
      );

      /* =====================================================
         CLEAN PREVIEW
      ===================================================== */

      if (panelPreview) {
        URL.revokeObjectURL(panelPreview);
      }

      setNewPanelImage(null);
      setPanelPreview(null);

      /* =====================================================
         RELOAD FROM DATABASE
      ===================================================== */

      await loadServices();

    } catch (err) {

      console.error(
        "Services save error:",
        err
      );

      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Unable to update Services section."
      );

    } finally {

      setSaving(false);

    }
  }

  /* =========================================================
     SERVICE ITEM CHANGE
  ========================================================= */

  function handleServiceChange(
    index,
    field,
    value
  ) {

    setServices(previous =>
      previous.map((service, i) =>
        i === index
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

    if (!service?.id) {

      setError(
        "Service ID is missing."
      );

      return;
    }

    if (serviceSaving === service.id) {
      return;
    }

    setServiceSaving(service.id);

    setError("");
    setSuccess("");

    try {

      const response =
        await servicesApi.items.update(
          service.id,
          {
            icon: service.icon || "",
            title: service.title || "",
            description:
              service.description || "",
            display_order:
              Number(
                service.display_order
              ) || 0,
          }
        );

      const result =
        response?.data ?? response ?? {};

      if (result.success === false) {

        throw new Error(
          result.error ||
          result.message ||
          "Failed to update service."
        );
      }

      setSuccess(
        `"${service.title || "Service"}" updated successfully.`
      );

      /* ===================================================
         RELOAD ITEMS
      =================================================== */

      const updatedResponse =
        await servicesApi.items.list();

      const updatedData =
        updatedResponse?.data?.data ??
        updatedResponse?.data ??
        updatedResponse ??
        [];

      setServices(
        Array.isArray(updatedData)
          ? updatedData
          : []
      );

    } catch (err) {

      console.error(
        "Service update error:",
        err
      );

      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
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

        <span>
          Loading Services...
        </span>

      </div>
    );
  }

  /* =========================================================
     IMAGE
  ========================================================= */

  const displayedPanelImage =
    panelPreview ||
    getImageUrl(currentPanelImage);

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="page-header">

        <div>

          <h1>
            Services
          </h1>

          <p>
            Manage the Services section
            and service items displayed
            on the homepage.
          </p>

        </div>

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div
          className="alert alert-danger p-3 mb-3"
          role="alert"
        >

          <i className="bi bi-exclamation-triangle me-2" />

          {error}

        </div>

      )}

      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {success && (

        <div
          className="alert alert-success p-3 mb-3"
          role="alert"
        >

          <i className="bi bi-check-circle me-2" />

          {success}

        </div>

      )}

      {/* =====================================================
          SECTION MANAGER
      ===================================================== */}

      <div className="split-manager">

        {/* ===================================================
            IMAGE
        ==================================================== */}

        <div className="content-card form-card">

          <div className="card-heading">

            <div>

              <h3>
                Panel Image
              </h3>

              <p>
                Image displayed in the
                Services section panel.
              </p>

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

              <span>
                No image uploaded
              </span>

            </div>

          )}

          <div className="form-actions-modern">

            <label
              className="admin-btn btn btn-sm mb-0"
              style={{
                cursor:
                  saving
                    ? "not-allowed"
                    : "pointer",
              }}
            >

              <i className="bi bi-upload me-2" />

              {newPanelImage
                ? "Change Image"
                : "Choose Image"}

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

              Selected:{" "}

              <strong>
                {newPanelImage.name}
              </strong>

            </div>

          )}

          {!newPanelImage &&
            currentPanelImage && (

              <div className="mt-2 text-muted">

                <small>

                  Current image:{" "}

                  <strong>
                    {currentPanelImage}
                  </strong>

                </small>

              </div>

            )}

        </div>

        {/* ===================================================
            CONTENT
        ==================================================== */}

        <form
          className="content-card form-card"
          onSubmit={handleSave}
        >

          <div className="card-heading">

            <div>

              <h3>
                Section Content
              </h3>

              <p>
                Edit the Services section
                content.
              </p>

            </div>

          </div>

          <div className="row g-3">

            {/* TITLE */}

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

            {/* SUBTITLE */}

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

          {/* SAVE */}

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

            <h3>
              Services List
            </h3>

            <span>
              Edit each service's icon,
              title, description, and
              display order.
            </span>

          </div>

        </div>

        <div className="stack-list">

          {services.map(
            (service, index) => (

              <div
                className="data-item"
                key={
                  service.id ??
                  `service-${index}`
                }
              >

                {/* ICON PREVIEW */}

                <div className="data-icon">

                  <i
                    className={`bi ${
                      service.icon ||
                      "bi-tools"
                    }`}
                  />

                </div>

                {/* SERVICE CONTENT */}

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

                    {/* ICON */}

                    <input
                      type="text"
                      className="form-input form-control form-control-sm"
                      style={{
                        maxWidth: 180,
                      }}
                      value={
                        service.icon || ""
                      }
                      onChange={(e) =>
                        handleServiceChange(
                          index,
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
                      value={
                        service.title || ""
                      }
                      onChange={(e) =>
                        handleServiceChange(
                          index,
                          "title",
                          e.target.value
                        )
                      }
                      placeholder="Service title"
                    />

                    {/* ORDER */}

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

                  {/* DESCRIPTION */}

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

                {/* SAVE */}

                <div className="data-actions">

                  <button
                    className="btn-icon"
                    type="button"
                    disabled={
                      serviceSaving ===
                      service.id
                    }
                    onClick={() =>
                      handleServiceSave(
                        service
                      )
                    }
                    title="Save service"
                  >

                    {serviceSaving ===
                    service.id ? (

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

            )
          )}

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
