
import React, { useEffect, useState } from "react";
import { heroApi, getImageUrl } from "../api/adminApi";

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

    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadHero() {
    setLoading(true);
    setError("");

    try {
      const response = await heroApi.get();

      /*
       * Backend GET response:
       *
       * {
       *   data: {
       *     id,
       *     badge_text,
       *     title_text,
       *     ...
       *     background_image,
       *     counters: [...]
       *   }
       * }
       */

      const hero = response?.data || {};

      setForm({
        id: hero.id ?? null,

        badge_text:
          hero.badge_text || "",

        title_text:
          hero.title_text || "",

        title_highlight:
          hero.title_highlight || "",

        subtitle:
          hero.subtitle || "",

        primary_btn_text:
          hero.primary_btn_text || "",

        primary_btn_link:
          hero.primary_btn_link || "",

        secondary_btn_text:
          hero.secondary_btn_text || "",

        secondary_btn_link:
          hero.secondary_btn_link || "",
      });

      /*
       * IMPORTANT:
       * The image filename comes directly from the database.
       */
      setCurrentImage(
        hero.background_image || null
      );

      /*
       * Load counters from database.
       */
      setCounters(
        Array.isArray(hero.counters)
          ? hero.counters
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
     HERO INPUT
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
     COUNTER INPUT
     
     Only VALUE, LABEL and ORDER are editable.
     
     The icon is intentionally not displayed because
     the client Hero does not use counter icons.
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
     IMAGE SELECTION
  ========================================================= */

  function handleImagePick(e) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    /*
     * Validate image type.
     */
    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );

      e.target.value = "";
      return;
    }

    /*
     * Maximum image size: 5 MB.
     */
    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "Image size must be less than 5 MB."
      );

      e.target.value = "";
      return;
    }

    /*
     * Remove previous preview URL.
     */
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    /*
     * Store the actual File object.
     */
    setNewImageFile(file);

    /*
     * Create temporary browser preview.
     */
    setImagePreview(
      URL.createObjectURL(file)
    );

    setError("");
    setSuccess("");

    /*
     * Allow selecting the same file again.
     */
    e.target.value = "";
  }

  /* =========================================================
     CANCEL NEW IMAGE
  ========================================================= */

  function handleRemoveNewImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setNewImageFile(null);
    setImagePreview(null);

    setError("");
    setSuccess("");
  }

  /* =========================================================
     SAVE HERO + COUNTERS + IMAGE
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
       * Prepare hero data.
       *
       * IMPORTANT:
       * The existing database counter "icon" is NOT
       * edited from the admin panel.
       *
       * We keep the existing icon value when sending
       * the counter so the backend does not accidentally
       * erase it.
       */

      const fields = {
        id: form.id ?? 1,

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

        counters:
          counters.map(
            (counter, index) => ({
              id:
                counter.id ?? null,

              /*
               * Keep the existing icon value in the
               * database without displaying/editing it.
               */
              icon:
                counter.icon || "",

              value:
                counter.value || "",

              label:
                counter.label || "",

              display_order:
                Number(
                  counter.display_order
                ) || index + 1,
            })
          ),
      };

      /*
       * Only send background_image when a NEW
       * image was selected.
       *
       * If no new image was selected, PHP keeps
       * the existing database image.
       */
      if (newImageFile) {
        fields.background_image =
          newImageFile;
      }

      /*
       * Send one multipart request.
       */
      const response =
        await heroApi.update(fields);

      setSuccess(
        response?.message ||
          (
            newImageFile
              ? "Hero section, counters, and background image updated successfully."
              : "Hero section and counters updated successfully."
          )
      );

      /*
       * Remove temporary image preview.
       */
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      setImagePreview(null);
      setNewImageFile(null);

      /*
       * Reload the actual database values.
       *
       * This is important because PHP may have
       * generated/saved a new image filename.
       */
      await loadHero();

    } catch (err) {
      setError(
        err?.message ||
          "Unable to update Hero section."
      );
    } finally {
      setSaving(false);
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
          Loading hero section...
        </span>

      </div>
    );
  }

  /* =========================================================
     IMAGE TO DISPLAY
  ========================================================= */

  const displayedImage =
    imagePreview ||
    getImageUrl(currentImage);

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
            Manage the main content and
            statistics displayed at the top
            of the homepage.
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
            BACKGROUND IMAGE
        ==================================================== */}

        <div className="content-card form-card">

          <div className="card-heading">

            <div>

              <h3>
                Background Image
              </h3>

              <p>
                Select the image used as the
                hero background.
              </p>

            </div>

          </div>


          {/* =================================================
              IMAGE PREVIEW
          ================================================== */}

          {displayedImage ? (

            <img
              className="image-preview"
              src={displayedImage}
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


          {/* =================================================
              IMAGE ACTIONS
          ================================================== */}

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

              {newImageFile
                ? "Change Image"
                : "Choose Image"}

              <input
                type="file"
                accept="image/*"
                hidden
                disabled={saving}
                onChange={
                  handleImagePick
                }
              />

            </label>


            {/* CANCEL NEW IMAGE */}

            {newImageFile && (

              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={
                  handleRemoveNewImage
                }
                disabled={saving}
              >

                <i className="bi bi-x-lg me-2" />

                Cancel New Image

              </button>

            )}

          </div>


          {/* =================================================
              SELECTED FILE
          ================================================== */}

          {newImageFile && (

            <div className="mt-2 text-muted">

              <i className="bi bi-file-image me-2" />

              Selected:

              {" "}

              <strong>
                {newImageFile.name}
              </strong>

            </div>

          )}


          {/* =================================================
              UPLOAD INFORMATION
          ================================================== */}

          {newImageFile && (

            <div className="alert alert-info mt-3 mb-0">

              <small>

                This image will be uploaded
                when you click{" "}

                <strong>
                  Save Changes
                </strong>.

              </small>

            </div>

          )}


          {/* =================================================
              CURRENT IMAGE
          ================================================== */}

          {!newImageFile &&
            currentImage && (

              <div className="mt-3 text-muted">

                <small>

                  Current image:

                  {" "}

                  <strong>
                    {currentImage}
                  </strong>

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
                Edit the text and buttons
                displayed in the hero section.
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
                value={
                  form.title_highlight
                }
                onChange={
                  handleChange
                }
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
                value={
                  form.title_text
                }
                onChange={
                  handleChange
                }
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
                value={
                  form.subtitle
                }
                onChange={
                  handleChange
                }
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
              HERO COUNTERS
              
              Only:
              - Value
              - Label
              - Order

              No icon input.
          ================================================== */}

          <div className="mt-4">

            <div className="card-heading">

              <div>

                <h3>
                  Hero Statistics
                </h3>

                <p>
                  Edit the statistics displayed
                  in the Hero section.
                </p>

              </div>

            </div>


            <div className="row g-3">

              {counters.map(
                (counter, index) => (

                  <div
                    className="col-12"
                    key={
                      counter.id ??
                      `counter-${index}`
                    }
                  >

                    <div className="border rounded p-3">

                      <div className="row g-3">


                        {/* VALUE */}

                        <div className="col-md-4">

                          <label
                            className="form-label"
                          >
                            Value
                          </label>

                          <input
                            type="text"
                            className="form-input form-control"
                            value={
                              counter.value ||
                              ""
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

                        <div className="col-md-5">

                          <label
                            className="form-label"
                          >
                            Label
                          </label>

                          <input
                            type="text"
                            className="form-input form-control"
                            value={
                              counter.label ||
                              ""
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

                        <div className="col-md-3">

                          <label
                            className="form-label"
                          >
                            Order
                          </label>

                          <input
                            type="number"
                            min="1"
                            className="form-input form-control"
                            value={
                              counter.display_order ??
                              ""
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

                )
              )}

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