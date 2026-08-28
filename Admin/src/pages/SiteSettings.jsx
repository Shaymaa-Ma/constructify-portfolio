
import React, { useEffect, useState } from "react";
import { siteSettingsApi } from "../api/adminApi";

export default function SiteSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    company_name: "",
    phone: "",
    email: "",
    logo_icon: "",
    cta_text: "",
    cta_link: "",
  });

  /* =========================================================
     LOAD SITE SETTINGS
  ========================================================= */

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await siteSettingsApi.get();

      /*
       * The API may return the settings directly
       * or inside response.data.
       */
      const data = response?.data || response || {};

      setForm({
        company_name: data.company_name || "",
        phone: data.phone || "",
        email: data.email || "",
        logo_icon: data.logo_icon || "",
        cta_text: data.cta_text || "",
        cta_link: data.cta_link || "",
      });
    } catch (err) {
      setError(
        err?.message || "Failed to load site settings."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     HANDLE INPUT CHANGES
  ========================================================= */

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    /*
     * Clear messages when the administrator starts editing.
     */
    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }
  }

  /* =========================================================
     UPDATE SITE SETTINGS
  ========================================================= */

  async function handleSave(e) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await siteSettingsApi.update(form);

      setSuccess("Site settings updated successfully.");

      /*
       * Reload the saved values from the server so the
       * form always reflects the database.
       */
      await loadSettings();
    } catch (err) {
      setError(
        err?.message || "Failed to update site settings."
      );
    } finally {
      setSaving(false);
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
          aria-hidden="true"
        />

        <span>Loading site settings…</span>
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
          <h1>Site Settings</h1>
          <p>
            Manage your company information and branding
            used across the website.
          </p>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div
          className="alert alert-danger p-3 mb-3"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {success && (
        <div
          className="alert alert-success p-3 mb-3"
          role="alert"
        >
          {success}
        </div>
      )}

      {/* SETTINGS FORM */}
      <form
        className="content-card form-card"
        onSubmit={handleSave}
        style={{ maxWidth: 760 }}
      >
        {/* CARD HEADER */}
        <div className="card-heading">
          <div>
            <h3>Company Information</h3>
            <p>
              Update the information displayed throughout
              the Constructify website.
            </p>
          </div>
        </div>

        <div className="row g-3">

          {/* COMPANY NAME */}
          <div className="col-12">
            <label
              htmlFor="company_name"
              className="form-label"
            >
              Company Name
            </label>

            <input
              id="company_name"
              type="text"
              className="form-input form-control"
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              placeholder="Constructify"
              required
            />
          </div>

          {/* PHONE */}
          <div className="col-md-6">
            <label
              htmlFor="phone"
              className="form-label"
            >
              Phone
            </label>

            <input
              id="phone"
              type="tel"
              className="form-input form-control"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+961 XX XXX XXX"
            />
          </div>

          {/* EMAIL */}
          <div className="col-md-6">
            <label
              htmlFor="email"
              className="form-label"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              className="form-input form-control"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="info@example.com"
            />
          </div>

          {/* LOGO ICON */}
          <div className="col-12">
            <label
              htmlFor="logo_icon"
              className="form-label"
            >
              Logo Icon
            </label>

            <input
              id="logo_icon"
              type="text"
              className="form-input form-control"
              name="logo_icon"
              value={form.logo_icon}
              onChange={handleChange}
              placeholder="bi-buildings"
            />

            <small className="text-muted d-block mt-1">
              Enter the Bootstrap Icons class used for the
              company logo.
            </small>
          </div>

          {/* CTA TEXT */}
          <div className="col-md-6">
            <label
              htmlFor="cta_text"
              className="form-label"
            >
              CTA Button Text
            </label>

            <input
              id="cta_text"
              type="text"
              className="form-input form-control"
              name="cta_text"
              value={form.cta_text}
              onChange={handleChange}
              placeholder="Get Started"
            />
          </div>

          {/* CTA LINK */}
          <div className="col-md-6">
            <label
              htmlFor="cta_link"
              className="form-label"
            >
              CTA Button Link
            </label>

            <input
              id="cta_link"
              type="text"
              className="form-input form-control"
              name="cta_link"
              value={form.cta_link}
              onChange={handleChange}
              placeholder="/contact"
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="form-actions-modern">
          <button
            type="submit"
            className="admin-btn btn"
            disabled={saving}
          >
            {saving ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
                Saving…
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
    </>
  );
}

