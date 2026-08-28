import React, { useEffect, useState } from "react";
import { heroApi } from "../api/adminApi";

const IMAGE_BASE =
  import.meta.env?.VITE_UPLOADS_BASE_URL || "/uploads";

export default function Hero() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    id: null,
    badge_text: "",
    title_text: "",
    title_highlight: "",
    subtitle: "",
    primary_btn_text: "",
    primary_btn_link: "",
    secondary_btn_text: "",
    secondary_btn_link: "",
    background_image: "",
  });

  const [counters, setCounters] = useState([]);

  const [currentImage, setCurrentImage] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);


  /* =========================================================
     LOAD HERO
  ========================================================= */

  useEffect(() => {
    loadHero();
  }, []);


  async function loadHero() {
    setLoading(true);
    setError("");

    try {
      const response = await heroApi.get();

      const section =
        response?.data ||
        response?.section ||
        response ||
        {};

      setForm({
        id: section.id || null,
        badge_text: section.badge_text || "",
        title_text: section.title_text || "",
        title_highlight: section.title_highlight || "",
        subtitle: section.subtitle || "",
        primary_btn_text:
          section.primary_btn_text || "",
        primary_btn_link:
          section.primary_btn_link || "",
        secondary_btn_text:
          section.secondary_btn_text || "",
        secondary_btn_link:
          section.secondary_btn_link || "",
        background_image:
          section.background_image || "",
      });

      setCurrentImage(
        section.background_image || null
      );


      /* Load Hero counters */
      setCounters(
        Array.isArray(section.counters)
          ? section.counters
          : []
      );

    } catch (err) {
      setError(
        err?.message ||
          "Failed to load hero section."
      );
    } finally {
      setLoading(false);
    }
  }


  /* =========================================================
     HANDLE HERO INPUT
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
     HANDLE COUNTER INPUT
  ========================================================= */

  function handleCounterChange(
    index,
    field,
    value
  ) {
    setCounters((previous) =>
      previous.map((counter, i) =>
        i === index
          ? {
              ...counter,
              [field]: value,
            }
          : counter
      )
    );

    setError("");
    setSuccess("");
  }


  /* =========================================================
     HANDLE IMAGE
  ========================================================= */

  function handleImagePick(e) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setNewImageFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);

    setError("");
    setSuccess("");
  }


  /* =========================================================
     SAVE HERO + COUNTERS
  ========================================================= */

  async function handleSave(e) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {

      const fields = {
        id: form.id,

        badge_text:
          form.badge_text,

        title_text:
          form.title_text,

        title_highlight:
          form.title_highlight,

        subtitle:
          form.subtitle,

        primary_btn_text:
          form.primary_btn_text,

        primary_btn_link:
          form.primary_btn_link,

        secondary_btn_text:
          form.secondary_btn_text,

        secondary_btn_link:
          form.secondary_btn_link,

        counters: counters.map((counter) => ({
          id: counter.id,
          icon: counter.icon || "",
          value: counter.value || "",
          label: counter.label || "",
          display_order:
            Number(counter.display_order) || 0,
        })),
      };


      /*
       * The current API accepts JSON.
       *
       * Therefore a newly selected image file
       * is only previewed for now.
       *
       * Existing background_image remains saved.
       */

      if (
        !newImageFile &&
        form.background_image
      ) {
        fields.background_image =
          form.background_image;
      }


      await heroApi.update(fields);


      setSuccess(
        "Hero section and counters updated successfully."
      );


      setNewImageFile(null);

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      setImagePreview(null);


      await loadHero();

    } catch (err) {

      setError(
        err?.message ||
          "Failed to update hero section."
      );

    } finally {

      setSaving(false);
    }
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
          Loading hero section...
        </span>

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

          <h1>
            Hero Section
          </h1>

          <p>
            Manage the main content and statistics
            displayed at the top of the homepage.
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
          {success}
        </div>
      )}


      <div className="split-manager">

        {/* ===================================================
            BACKGROUND IMAGE
        ==================================================== */}

        <div className="content-card form-card">

          <div className="card-heading">

            <div>

              <h3>
                Background Image
              </h3>

              <p>
                Select the image used as the hero
                background.
              </p>

            </div>

          </div>


          {imagePreview || currentImage ? (

            <img
              className="image-preview"
              src={
                imagePreview ||
                getImageUrl(currentImage)
              }
              alt="Hero background"
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
              style={{ cursor: "pointer" }}
            >

              <i className="bi bi-upload me-2" />

              Choose Image

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleImagePick}
              />

            </label>

          </div>


          {newImageFile && (
            <div className="mt-2 text-muted">
              Selected: {newImageFile.name}
            </div>
          )}


          {newImageFile && (
            <div className="alert alert-warning mt-3 mb-0">

              <small>
                The image is currently previewed only.
                File uploading requires a multipart
                upload endpoint.
              </small>

            </div>
          )}

        </div>


        {/* ===================================================
            HERO CONTENT
        ==================================================== */}

        <form
          className="content-card form-card"
          onSubmit={handleSave}
        >

          <div className="card-heading">

            <div>

              <h3>
                Hero Content
              </h3>

              <p>
                Edit the text and buttons displayed
                in the hero section.
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
                value={form.badge_text}
                onChange={handleChange}
              />

            </div>


            {/* TITLE HIGHLIGHT */}

            <div className="col-md-6">

              <label
                htmlFor="title_highlight"
                className="form-label"
              >
                Title Highlight
              </label>

              <input
                id="title_highlight"
                type="text"
                className="form-input form-control"
                name="title_highlight"
                value={form.title_highlight}
                onChange={handleChange}
              />

            </div>


            {/* TITLE */}

            <div className="col-12">

              <label
                htmlFor="title_text"
                className="form-label"
              >
                Title Text
              </label>

              <input
                id="title_text"
                type="text"
                className="form-input form-control"
                name="title_text"
                value={form.title_text}
                onChange={handleChange}
              />

            </div>


            {/* SUBTITLE */}

            <div className="col-12">

              <label
                htmlFor="subtitle"
                className="form-label"
              >
                Subtitle
              </label>

              <textarea
                id="subtitle"
                className="form-input form-control"
                name="subtitle"
                value={form.subtitle}
                onChange={handleChange}
                rows="4"
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
                value={form.primary_btn_text}
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
                type="text"
                className="form-input form-control"
                name="primary_btn_link"
                value={form.primary_btn_link}
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
                type="text"
                className="form-input form-control"
                name="secondary_btn_text"
                value={form.secondary_btn_text}
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
                type="text"
                className="form-input form-control"
                name="secondary_btn_link"
                value={form.secondary_btn_link}
                onChange={handleChange}
              />

            </div>

          </div>


          {/* =================================================
              HERO COUNTERS
          ================================================== */}

          <div className="mt-4">

            <div className="card-heading">

              <div>

                <h3>
                  Hero Statistics
                </h3>

                <p>
                  Edit the statistics displayed in
                  the Hero section.
                </p>

              </div>

            </div>


            <div className="row g-3">

              {counters.map((counter, index) => (

                <div
                  className="col-12"
                  key={counter.id}
                >

                  <div className="border rounded p-3">

                    <div className="row g-3">

                      {/* ICON */}

                      <div className="col-md-3">

                        <label className="form-label">
                          Icon
                        </label>

                        <input
                          type="text"
                          className="form-input form-control"
                          value={
                            counter.icon || ""
                          }
                          onChange={(e) =>
                            handleCounterChange(
                              index,
                              "icon",
                              e.target.value
                            )
                          }
                          placeholder="bi-award"
                        />

                      </div>


                      {/* VALUE */}

                      <div className="col-md-3">

                        <label className="form-label">
                          Value
                        </label>

                        <input
                          type="text"
                          className="form-input form-control"
                          value={
                            counter.value || ""
                          }
                          onChange={(e) =>
                            handleCounterChange(
                              index,
                              "value",
                              e.target.value
                            )
                          }
                          placeholder="25+"
                        />

                      </div>


                      {/* LABEL */}

                      <div className="col-md-4">

                        <label className="form-label">
                          Label
                        </label>

                        <input
                          type="text"
                          className="form-input form-control"
                          value={
                            counter.label || ""
                          }
                          onChange={(e) =>
                            handleCounterChange(
                              index,
                              "label",
                              e.target.value
                            )
                          }
                          placeholder="Years Experience"
                        />

                      </div>


                      {/* ORDER */}

                      <div className="col-md-2">

                        <label className="form-label">
                          Order
                        </label>

                        <input
                          type="number"
                          min="1"
                          className="form-input form-control"
                          value={
                            counter.display_order || ""
                          }
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
                No Hero counters found.
              </div>
            )}

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
    </>
  );
}