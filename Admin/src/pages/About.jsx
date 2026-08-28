
import React, { useEffect, useState } from "react";
import { aboutApi } from "../api/adminApi";

const IMAGE_BASE =
  import.meta.env?.VITE_UPLOADS_BASE_URL || "/uploads";

export default function About() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    badge_text: "",
    title: "",
    description: "",
    overlay_badge_text: "",
    primary_btn_text: "",
    primary_btn_link: "",
    secondary_btn_text: "",
    secondary_btn_link: "",
  });

  const [currentPrimary, setCurrentPrimary] = useState(null);
  const [currentSecondary, setCurrentSecondary] = useState(null);

  const [newPrimary, setNewPrimary] = useState(null);
  const [newSecondary, setNewSecondary] = useState(null);

  const [previewPrimary, setPreviewPrimary] = useState(null);
  const [previewSecondary, setPreviewSecondary] = useState(null);

  const [features, setFeatures] = useState([]);
  const [featureSaving, setFeatureSaving] = useState(null);

  /* =========================================================
     LOAD ABOUT
  ========================================================= */

  useEffect(() => {
    loadAbout();
  }, []);

  async function loadAbout() {
    setLoading(true);
    setError("");

    try {
      const response = await aboutApi.get();

      const section =
        response?.section ||
        response?.data ||
        response ||
        {};

      setForm({
        badge_text: section.badge_text || "",
        title: section.title || "",
        description: section.description || "",
        overlay_badge_text:
          section.overlay_badge_text || "",
        primary_btn_text:
          section.primary_btn_text || "",
        primary_btn_link:
          section.primary_btn_link || "",
        secondary_btn_text:
          section.secondary_btn_text || "",
        secondary_btn_link:
          section.secondary_btn_link || "",
      });

      setCurrentPrimary(
        section.image_primary || null
      );

      setCurrentSecondary(
        section.image_secondary || null
      );

      /*
       * Features are a separate API endpoint in your
       * adminApi.js, so load them separately.
       */
      const featureData = await aboutApi.features.list();

      setFeatures(featureData || []);
    } catch (err) {
      setError(
        err?.message || "Failed to load About section."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     HANDLE FORM INPUT
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
     IMAGE PICKER
  ========================================================= */

  function pickImage(e, type) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (type === "primary") {
      setNewPrimary(file);

      if (previewPrimary) {
        URL.revokeObjectURL(previewPrimary);
      }

      setPreviewPrimary(previewUrl);
    } else {
      setNewSecondary(file);

      if (previewSecondary) {
        URL.revokeObjectURL(previewSecondary);
      }

      setPreviewSecondary(previewUrl);
    }

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
     SAVE ABOUT SECTION
  ========================================================= */

  async function handleSave(e) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      /*
       * Your current adminApi.js uses:
       *
       * aboutApi.update(fields)
       *
       * Therefore only JSON fields are sent here.
       */
      await aboutApi.update(form);

      setSuccess(
        "About section updated successfully."
      );

      /*
       * Clear image selections after saving.
       */
      setNewPrimary(null);
      setNewSecondary(null);

      if (previewPrimary) {
        URL.revokeObjectURL(previewPrimary);
      }

      if (previewSecondary) {
        URL.revokeObjectURL(previewSecondary);
      }

      setPreviewPrimary(null);
      setPreviewSecondary(null);

      /*
       * Reload saved data.
       */
      await loadAbout();
    } catch (err) {
      setError(
        err?.message || "Failed to update About section."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     FEATURE FIELD CHANGE
  ========================================================= */

  function handleFeatureFieldChange(
    id,
    field,
    value
  ) {
    setFeatures((previous) =>
      previous.map((feature) =>
        feature.id === id
          ? {
              ...feature,
              [field]: value,
            }
          : feature
      )
    );

    setError("");
    setSuccess("");
  }

  /* =========================================================
     SAVE FEATURE
  ========================================================= */

  async function handleFeatureSave(feature) {
    setFeatureSaving(feature.id);
    setError("");
    setSuccess("");

    try {
      await aboutApi.features.update(
        feature.id,
        {
          icon: feature.icon,
          title: feature.title,
          description: feature.description,
          display_order: feature.display_order,
        }
      );

      setSuccess(
        "About feature updated successfully."
      );

      /*
       * Refresh features from database.
       */
      const updatedFeatures =
        await aboutApi.features.list();

      setFeatures(updatedFeatures || []);
    } catch (err) {
      setError(
        err?.message ||
          "Failed to update About feature."
      );
    } finally {
      setFeatureSaving(null);
    }
  }

  /* =========================================================
     LOADING STATE
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

        <span>Loading About section...</span>
      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1>About Section</h1>

          <p>
            Manage the company story and information
            displayed on the homepage.
          </p>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div
          className="alert alert-danger p-3 mb-3"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div
          className="alert alert-success p-3 mb-3"
          role="alert"
        >
          {success}
        </div>
      )}

      <div className="split-manager">

        {/* =====================================================
            IMAGES
        ====================================================== */}

        <div className="content-card form-card">
          <div className="card-heading">
            <div>
              <h3>About Images</h3>

              <p>
                Manage the images displayed in the
                About section.
              </p>
            </div>
          </div>

          {/* PRIMARY IMAGE */}
          <div className="mb-4">
            <div className="form-label">
              Primary Image
            </div>

            {previewPrimary || currentPrimary ? (
              <img
                className="image-preview mb-2"
                src={
                  previewPrimary ||
                  getImageUrl(currentPrimary)
                }
                alt="About primary"
              />
            ) : (
              <div className="image-placeholder compact mb-2">
                <i className="bi bi-image" />

                <span>No image uploaded</span>
              </div>
            )}

            <label
              className="admin-btn btn btn-sm mb-0"
              style={{ cursor: "pointer" }}
            >
              <i className="bi bi-upload me-2" />

              Choose Primary Image

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) =>
                  pickImage(e, "primary")
                }
              />
            </label>

            {newPrimary && (
              <div className="text-muted mt-2">
                Selected: {newPrimary.name}
              </div>
            )}
          </div>

          {/* SECONDARY IMAGE */}
          <div>
            <div className="form-label">
              Secondary Image
            </div>

            {previewSecondary ||
            currentSecondary ? (
              <img
                className="image-preview mb-2"
                src={
                  previewSecondary ||
                  getImageUrl(currentSecondary)
                }
                alt="About secondary"
              />
            ) : (
              <div className="image-placeholder compact mb-2">
                <i className="bi bi-image" />

                <span>No image uploaded</span>
              </div>
            )}

            <label
              className="admin-btn btn btn-sm mb-0"
              style={{ cursor: "pointer" }}
            >
              <i className="bi bi-upload me-2" />

              Choose Secondary Image

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) =>
                  pickImage(e, "secondary")
                }
              />
            </label>

            {newSecondary && (
              <div className="text-muted mt-2">
                Selected: {newSecondary.name}
              </div>
            )}
          </div>

          {(newPrimary || newSecondary) && (
            <div className="alert alert-warning mt-3 mb-0">
              <small>
                The selected images are previewed here.
                Your current JSON API does not upload
                image files. A multipart upload endpoint
                is required to permanently save new image
                files.
              </small>
            </div>
          )}
        </div>

        {/* =====================================================
            CONTENT
        ====================================================== */}

        <form
          className="content-card form-card"
          onSubmit={handleSave}
        >
          <div className="card-heading">
            <div>
              <h3>About Content</h3>

              <p>
                Edit the text and buttons displayed
                in the About section.
              </p>
            </div>
          </div>

          <div className="row g-3">

            {/* BADGE */}
            <div className="col-md-6">
              <label
                htmlFor="badge_text"
                className="form-label"
              >
                Badge Text
              </label>

              <input
                id="badge_text"
                className="form-input form-control"
                name="badge_text"
                value={form.badge_text}
                onChange={handleChange}
              />
            </div>

            {/* OVERLAY BADGE */}
            <div className="col-md-6">
              <label
                htmlFor="overlay_badge_text"
                className="form-label"
              >
                Overlay Badge Text
              </label>

              <input
                id="overlay_badge_text"
                className="form-input form-control"
                name="overlay_badge_text"
                value={
                  form.overlay_badge_text
                }
                onChange={handleChange}
              />
            </div>

            {/* TITLE */}
            <div className="col-12">
              <label
                htmlFor="title"
                className="form-label"
              >
                Title
              </label>

              <input
                id="title"
                className="form-input form-control"
                name="title"
                value={form.title}
                onChange={handleChange}
              />
            </div>

            {/* DESCRIPTION */}
            <div className="col-12">
              <label
                htmlFor="description"
                className="form-label"
              >
                Description
              </label>

              <textarea
                id="description"
                className="form-input form-control"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="5"
              />
            </div>

            {/* PRIMARY BUTTON TEXT */}
            <div className="col-md-6">
              <label
                htmlFor="primary_btn_text"
                className="form-label"
              >
                Primary Button Text
              </label>

              <input
                id="primary_btn_text"
                className="form-input form-control"
                name="primary_btn_text"
                value={
                  form.primary_btn_text
                }
                onChange={handleChange}
              />
            </div>

            {/* PRIMARY BUTTON LINK */}
            <div className="col-md-6">
              <label
                htmlFor="primary_btn_link"
                className="form-label"
              >
                Primary Button Link
              </label>

              <input
                id="primary_btn_link"
                className="form-input form-control"
                name="primary_btn_link"
                value={
                  form.primary_btn_link
                }
                onChange={handleChange}
              />
            </div>

            {/* SECONDARY BUTTON TEXT */}
            <div className="col-md-6">
              <label
                htmlFor="secondary_btn_text"
                className="form-label"
              >
                Secondary Button Text
              </label>

              <input
                id="secondary_btn_text"
                className="form-input form-control"
                name="secondary_btn_text"
                value={
                  form.secondary_btn_text
                }
                onChange={handleChange}
              />
            </div>

            {/* SECONDARY BUTTON LINK */}
            <div className="col-md-6">
              <label
                htmlFor="secondary_btn_link"
                className="form-label"
              >
                Secondary Button Link
              </label>

              <input
                id="secondary_btn_link"
                className="form-input form-control"
                name="secondary_btn_link"
                value={
                  form.secondary_btn_link
                }
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
          ABOUT FEATURES
      ====================================================== */}

      <div className="content-card list-card mt-3">
        <div className="card-heading">
          <div>
            <h3>About Features</h3>

            <span>
              Edit the feature highlights displayed
              in the About section.
            </span>
          </div>
        </div>

        <div className="stack-list">
          {features.map((feature) => (
            <div
              className="data-item"
              key={feature.id}
            >
              {/* ICON */}
              <div className="data-icon">
                <i
                  className={`bi ${
                    feature.icon ||
                    "bi-star"
                  }`}
                />
              </div>

              {/* FEATURE CONTENT */}
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
                  }}
                >
                  {/* ICON */}
                  <input
                    className="form-input form-control form-control-sm"
                    style={{
                      maxWidth: 150,
                    }}
                    value={
                      feature.icon || ""
                    }
                    onChange={(e) =>
                      handleFeatureFieldChange(
                        feature.id,
                        "icon",
                        e.target.value
                      )
                    }
                    placeholder="bi-icon-name"
                  />

                  {/* TITLE */}
                  <input
                    className="form-input form-control form-control-sm"
                    value={
                      feature.title || ""
                    }
                    onChange={(e) =>
                      handleFeatureFieldChange(
                        feature.id,
                        "title",
                        e.target.value
                      )
                    }
                    placeholder="Title"
                  />

                  {/* ORDER */}
                  <input
                    className="form-input form-control form-control-sm"
                    style={{
                      maxWidth: 80,
                    }}
                    type="number"
                    value={
                      feature.display_order ??
                      0
                    }
                    onChange={(e) =>
                      handleFeatureFieldChange(
                        feature.id,
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
                    feature.description || ""
                  }
                  onChange={(e) =>
                    handleFeatureFieldChange(
                      feature.id,
                      "description",
                      e.target.value
                    )
                  }
                  placeholder="Description"
                  rows={2}
                />
              </div>

              {/* SAVE FEATURE */}
              <div className="data-actions">
                <button
                  className="btn-icon"
                  type="button"
                  disabled={
                    featureSaving ===
                    feature.id
                  }
                  onClick={() =>
                    handleFeatureSave(
                      feature
                    )
                  }
                  title="Save feature"
                >
                  {featureSaving ===
                  feature.id ? (
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

          {features.length === 0 && (
            <div className="empty-state">
              No features found.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
