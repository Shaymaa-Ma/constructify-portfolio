
import React, { useEffect, useState } from "react";
import { aboutApi, getImageUrl } from "../api/adminApi";

export default function About() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================================
     ABOUT FORM
  ========================================================= */

  const [form, setForm] = useState({
    id: null,

    badge_text: "",
    title: "",
    description: "",
    overlay_badge_text: "",

    primary_btn_text: "",
    primary_btn_link: "",

    secondary_btn_text: "",
    secondary_btn_link: "",
  });

  /* =========================================================
     CURRENT IMAGES
  ========================================================= */

  const [currentPrimary, setCurrentPrimary] = useState(null);
  const [currentSecondary, setCurrentSecondary] = useState(null);

  /* =========================================================
     NEW IMAGE FILES
  ========================================================= */

  const [newPrimary, setNewPrimary] = useState(null);
  const [newSecondary, setNewSecondary] = useState(null);

  /* =========================================================
     IMAGE PREVIEWS
  ========================================================= */

  const [previewPrimary, setPreviewPrimary] = useState(null);
  const [previewSecondary, setPreviewSecondary] = useState(null);

  /* =========================================================
     FEATURES
  ========================================================= */

  const [features, setFeatures] = useState([]);
  const [featureSaving, setFeatureSaving] = useState(null);

  /* =========================================================
     FEATURE ICON OPTIONS
     
     Each feature gets 3 relevant icon choices.
     The value saved to DB is still the Bootstrap icon name.
  ========================================================= */

  const featureIconOptions = {
    "Licensed & Insured": [
      {
        value: "bi-shield-check",
        label: "Shield Check",
      },
      {
        value: "bi-check-circle",
        label: "Check Circle",
      },
      {
        value: "bi-shield-lock",
        label: "Shield Lock",
      },
    ],

    "On-Time Delivery": [
      {
        value: "bi-clock-history",
        label: "Clock History",
      },
      {
        value: "bi-clock",
        label: "Clock",
      },
      {
        value: "bi-calendar-check",
        label: "Calendar Check",
      },
    ],

    "Expert Workforce": [
      {
        value: "bi-people",
        label: "People",
      },
      {
        value: "bi-people-fill",
        label: "People Fill",
      },
      {
        value: "bi-person-check",
        label: "Person Check",
      },
    ],

    "Award Winning": [
      {
        value: "bi-award",
        label: "Award",
      },
      {
        value: "bi-trophy",
        label: "Trophy",
      },
      {
        value: "bi-star",
        label: "Star",
      },
    ],
  };

  /* =========================================================
     LOAD ABOUT
  ========================================================= */

  useEffect(() => {
    loadAbout();

    return () => {
      if (previewPrimary) {
        URL.revokeObjectURL(previewPrimary);
      }

      if (previewSecondary) {
        URL.revokeObjectURL(previewSecondary);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAbout() {
    setLoading(true);
    setError("");

    try {
      /* =====================================================
         LOAD ABOUT SECTION
      ===================================================== */

      const response = await aboutApi.get();

      const section = response?.data || {};

      setForm({
        id: section.id ?? null,

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

      /* =====================================================
         CURRENT IMAGES
      ===================================================== */

      setCurrentPrimary(
        section.image_primary || null
      );

      setCurrentSecondary(
        section.image_secondary || null
      );

      /* =====================================================
         LOAD FEATURES
      ===================================================== */

      const featureData =
        await aboutApi.features.list();

      setFeatures(
        Array.isArray(featureData)
          ? featureData
          : []
      );

    } catch (err) {
      setError(
        err?.message ||
        "Failed to load About section."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     ABOUT INPUT
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

  function handleImagePick(e, type) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );

      e.target.value = "";
      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "Image size must be less than 5 MB."
      );

      e.target.value = "";
      return;
    }

    const previewUrl =
      URL.createObjectURL(file);

    if (type === "primary") {
      if (previewPrimary) {
        URL.revokeObjectURL(
          previewPrimary
        );
      }

      setNewPrimary(file);
      setPreviewPrimary(previewUrl);

    } else {
      if (previewSecondary) {
        URL.revokeObjectURL(
          previewSecondary
        );
      }

      setNewSecondary(file);
      setPreviewSecondary(previewUrl);
    }

    setError("");
    setSuccess("");

    e.target.value = "";
  }

  /* =========================================================
     CANCEL PRIMARY IMAGE
  ========================================================= */

  function removeNewPrimary() {
    if (previewPrimary) {
      URL.revokeObjectURL(
        previewPrimary
      );
    }

    setNewPrimary(null);
    setPreviewPrimary(null);

    setError("");
    setSuccess("");
  }

  /* =========================================================
     CANCEL SECONDARY IMAGE
  ========================================================= */

  function removeNewSecondary() {
    if (previewSecondary) {
      URL.revokeObjectURL(
        previewSecondary
      );
    }

    setNewSecondary(null);
    setPreviewSecondary(null);

    setError("");
    setSuccess("");
  }

  /* =========================================================
     SAVE ABOUT
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

        badge_text: form.badge_text,

        title: form.title,

        description: form.description,

        overlay_badge_text:
          form.overlay_badge_text,

        primary_btn_text:
          form.primary_btn_text,

        primary_btn_link:
          form.primary_btn_link,

        secondary_btn_text:
          form.secondary_btn_text,

        secondary_btn_link:
          form.secondary_btn_link,
      };

      if (newPrimary) {
        fields.image_primary =
          newPrimary;
      }

      if (newSecondary) {
        fields.image_secondary =
          newSecondary;
      }

      const response =
        await aboutApi.update(fields);

      setSuccess(
        response?.message ||
        (
          newPrimary ||
            newSecondary
            ? "About section and images updated successfully."
            : "About section updated successfully."
        )
      );

      if (previewPrimary) {
        URL.revokeObjectURL(
          previewPrimary
        );
      }

      if (previewSecondary) {
        URL.revokeObjectURL(
          previewSecondary
        );
      }

      setPreviewPrimary(null);
      setPreviewSecondary(null);

      setNewPrimary(null);
      setNewSecondary(null);

      await loadAbout();

    } catch (err) {
      setError(
        err?.message ||
        "Unable to update About section."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     FEATURE FIELD CHANGE
  ========================================================= */

  function handleFeatureChange(
    index,
    field,
    value
  ) {
    setFeatures((previous) =>
      previous.map(
        (feature, i) =>
          i === index
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

  async function handleFeatureSave(
    feature
  ) {
    if (!feature?.id) {
      return;
    }

    setFeatureSaving(feature.id);
    setError("");
    setSuccess("");

    try {
      await aboutApi.features.update(
        feature.id,
        {
          icon:
            feature.icon || "",

          title:
            feature.title || "",

          description:
            feature.description || "",

          display_order:
            Number(
              feature.display_order
            ) || 0,
        }
      );

      setSuccess(
        "About feature updated successfully."
      );

      const updatedFeatures =
        await aboutApi.features.list();

      setFeatures(
        Array.isArray(updatedFeatures)
          ? updatedFeatures
          : []
      );

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
          Loading About section...
        </span>

      </div>
    );
  }

  /* =========================================================
     IMAGE TO DISPLAY
  ========================================================= */

  const displayedPrimary =
    previewPrimary ||
    getImageUrl(currentPrimary);

  const displayedSecondary =
    previewSecondary ||
    getImageUrl(currentSecondary);

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

          <h1>
            About Section
          </h1>

          <p>
            Manage the company story,
            images, content, and feature
            highlights displayed on the
            homepage.
          </p>

        </div>

      </div>


      {/* =====================================================
          ERROR
      ====================================================== */}

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
      ====================================================== */}

      {success && (
        <div
          className="alert alert-success p-3 mb-3"
          role="alert"
        >

          <i className="bi bi-check-circle me-2" />

          {success}

        </div>
      )}


      <div className="split-manager">


        {/* ===================================================
            ABOUT IMAGES
        ==================================================== */}

        <div className="content-card form-card">

          <div className="card-heading">

            <div>

              <h3>
                About Images
              </h3>

              <p>
                Manage the images displayed
                in the About section.
              </p>

            </div>

          </div>


          {/* =================================================
              PRIMARY IMAGE
          ================================================== */}

          <div className="mb-4">

            <label className="form-label">
              Primary Image
            </label>


            {displayedPrimary ? (

              <img
                className="image-preview mb-2"
                src={displayedPrimary}
                alt="About primary"
              />

            ) : (

              <div className="image-placeholder compact mb-2">

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
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
                }}
              >

                <i className="bi bi-upload me-2" />

                {newPrimary
                  ? "Change Image"
                  : "Choose Primary Image"}

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={saving}
                  onChange={(e) =>
                    handleImagePick(
                      e,
                      "primary"
                    )
                  }
                />

              </label>


              {newPrimary && (

                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={
                    removeNewPrimary
                  }
                  disabled={saving}
                >

                  <i className="bi bi-x-lg me-2" />

                  Cancel New Image

                </button>

              )}

            </div>


            {newPrimary && (

              <div className="mt-2 text-muted">

                <i className="bi bi-file-image me-2" />

                Selected:

                {" "}

                <strong>
                  {newPrimary.name}
                </strong>

              </div>

            )}


            {!newPrimary &&
              currentPrimary && (

                <div className="mt-2 text-muted">

                  <small>

                    Current image:

                    {" "}

                    <strong>
                      {currentPrimary}
                    </strong>

                  </small>

                </div>

              )}

          </div>


          {/* =================================================
              SECONDARY IMAGE
          ================================================== */}

          <div>

            <label className="form-label">
              Secondary Image
            </label>


            {displayedSecondary ? (

              <img
                className="image-preview mb-2"
                src={displayedSecondary}
                alt="About secondary"
              />

            ) : (

              <div className="image-placeholder compact mb-2">

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
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
                }}
              >

                <i className="bi bi-upload me-2" />

                {newSecondary
                  ? "Change Image"
                  : "Choose Secondary Image"}

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={saving}
                  onChange={(e) =>
                    handleImagePick(
                      e,
                      "secondary"
                    )
                  }
                />

              </label>


              {newSecondary && (

                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={
                    removeNewSecondary
                  }
                  disabled={saving}
                >

                  <i className="bi bi-x-lg me-2" />

                  Cancel New Image

                </button>

              )}

            </div>


            {newSecondary && (

              <div className="mt-2 text-muted">

                <i className="bi bi-file-image me-2" />

                Selected:

                {" "}

                <strong>
                  {newSecondary.name}
                </strong>

              </div>

            )}


            {!newSecondary &&
              currentSecondary && (

                <div className="mt-2 text-muted">

                  <small>

                    Current image:

                    {" "}

                    <strong>
                      {currentSecondary}
                    </strong>

                  </small>

                </div>

              )}

          </div>


          {/* =================================================
              UPLOAD INFORMATION
          ================================================== */}

          {(newPrimary ||
            newSecondary) && (

              <div className="alert alert-info mt-3 mb-0">

                <small>

                  The selected image will be
                  uploaded when you click{" "}

                  <strong>
                    Save Changes
                  </strong>
                  .

                </small>

              </div>

            )}

        </div>


        {/* ===================================================
            ABOUT CONTENT
        ==================================================== */}

        <form
          className="content-card form-card"
          onSubmit={handleSave}
        >

          <div className="card-heading">

            <div>

              <h3>
                About Content
              </h3>

              <p>
                Edit the text and buttons
                displayed in the About section.
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
                type="text"
                className="form-input form-control"
                name="badge_text"
                value={
                  form.badge_text
                }
                onChange={
                  handleChange
                }
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
                type="text"
                className="form-input form-control"
                name="overlay_badge_text"
                value={
                  form.overlay_badge_text
                }
                onChange={
                  handleChange
                }
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
                type="text"
                className="form-input form-control"
                name="title"
                value={
                  form.title
                }
                onChange={
                  handleChange
                }
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
                value={
                  form.description
                }
                onChange={
                  handleChange
                }
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
                type="text"
                className="form-input form-control"
                name="primary_btn_text"
                value={
                  form.primary_btn_text
                }
                onChange={
                  handleChange
                }
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
                type="text"
                className="form-input form-control"
                name="primary_btn_link"
                value={
                  form.primary_btn_link
                }
                onChange={
                  handleChange
                }
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
                type="text"
                className="form-input form-control"
                name="secondary_btn_text"
                value={
                  form.secondary_btn_text
                }
                onChange={
                  handleChange
                }
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
                type="text"
                className="form-input form-control"
                name="secondary_btn_link"
                value={
                  form.secondary_btn_link
                }
                onChange={
                  handleChange
                }
              />

            </div>

          </div>


          {/* =================================================
              SAVE
          ================================================== */}

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

            <h3>
              About Features
            </h3>

            <span>
              Edit the feature highlights
              displayed in the About section.
            </span>

          </div>

        </div>


        <div className="stack-list">

          {features.map(
            (feature, index) => {

              /*
               * Get the 3 icons configured for
               * this particular feature.
               */
              const iconOptions =
                featureIconOptions[
                feature.title
                ] || [
                  {
                    value: "bi-star",
                    label: "Star",
                  },
                  {
                    value: "bi-check-circle",
                    label: "Check Circle",
                  },
                  {
                    value: "bi-info-circle",
                    label: "Info Circle",
                  },
                ];

              return (

                <div
                  className="data-item"
                  key={
                    feature.id ??
                    `feature-${index}`
                  }
                >

                  {/* =================================================
                      FEATURE ICON PREVIEW
                  ================================================== */}

                  <div className="data-icon">

                    <i
                      className={`bi ${feature.icon ||
                        "bi-star"
                        }`}
                    />

                  </div>


                  {/* =================================================
                      FEATURE CONTENT
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

                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >

                      {/* =================================================
                          ICON DROPDOWN
                      ================================================== */}

                      <div
                        style={{
                          minWidth: 210,
                        }}
                      >

                        <label
                          className="form-label mb-1"
                          style={{
                            fontSize: 12,
                          }}
                        >
                          Icon
                        </label>

                        <div
                          style={{
                            position: "relative",
                          }}
                        >
                          <select
                            className="form-input form-control form-control-sm"
                            style={{
                              paddingRight: 35,
                            }}
                            value={
                              feature.icon ||
                              ""
                            }
                            onChange={(e) =>
                              handleFeatureChange(
                                index,
                                "icon",
                                e.target.value
                              )
                            }
                          >

                            <option value="" disabled>
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

                          {/* DROPDOWN ARROW */}
                          <i
                            className="bi bi-chevron-down"
                            style={{
                              position: "absolute",
                              right: 12,
                              top: "50%",
                              transform: "translateY(-50%)",
                              pointerEvents: "none",
                              fontSize: 12,
                            }}
                          />

                        </div>

                      </div>


                      {/* =================================================
                          TITLE
                      ================================================== */}

                      <div
                        style={{
                          flex: 1,
                        }}
                      >

                        <label
                          className="form-label mb-1"
                          style={{
                            fontSize: 12,
                          }}
                        >
                          Title
                        </label>

                        <input
                          className="form-input form-control form-control-sm"
                          value={
                            feature.title ||
                            ""
                          }
                          onChange={(e) =>
                            handleFeatureChange(
                              index,
                              "title",
                              e.target.value
                            )
                          }
                          placeholder="Feature title"
                        />

                      </div>


                      {/* =================================================
                          ORDER
                      ================================================== */}

                      <div
                        style={{
                          maxWidth: 80,
                        }}
                      >

                        <label
                          className="form-label mb-1"
                          style={{
                            fontSize: 12,
                          }}
                        >
                          Order
                        </label>

                        <input
                          className="form-input form-control form-control-sm"
                          type="number"
                          min="1"
                          value={
                            feature.display_order ??
                            ""
                          }
                          onChange={(e) =>
                            handleFeatureChange(
                              index,
                              "display_order",
                              e.target.value
                            )
                          }
                          placeholder="Order"
                        />

                      </div>

                    </div>


                    {/* =================================================
                        DESCRIPTION
                    ================================================== */}

                    <textarea
                      className="form-input form-control form-control-sm"
                      value={
                        feature.description ||
                        ""
                      }
                      onChange={(e) =>
                        handleFeatureChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Feature description"
                      rows={2}
                    />

                  </div>


                  {/* =================================================
                      SAVE FEATURE
                  ================================================== */}

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

              );
            }
          )}


          {features.length === 0 && (

            <div className="empty-state">

              No About features found.

            </div>

          )}

        </div>

      </div>
    </>
  );
}
