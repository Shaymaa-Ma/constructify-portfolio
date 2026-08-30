import React, {
  useEffect,
  useState,
} from "react";

import {
  siteSettingsApi,
} from "../api/adminApi";


/* =========================================================
   EMPTY FORM
========================================================= */

const emptySettings = {
  company_name: "",
  phone: "",
  email: "",
  logo_icon: "",
  cta_text: "",
  cta_link: "",
};


export default function SiteSettings() {

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    saving,
    setSaving
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const [
    success,
    setSuccess
  ] = useState("");

  const [
    form,
    setForm
  ] = useState(emptySettings);


  /* =======================================================
     LOAD SETTINGS
  ======================================================= */

  useEffect(() => {

    loadSettings();

  }, []);


  async function loadSettings() {

    setLoading(true);
    setError("");

    try {

      const response =
        await siteSettingsApi.get();


      /*
       * API response:
       *
       * {
       *   success: true,
       *   data: {
       *      company_name: "...",
       *      ...
       *   }
       * }
       */

      const data =
        response?.data || {};


      setForm({

        company_name:
          data.company_name ?? "",

        phone:
          data.phone ?? "",

        email:
          data.email ?? "",

        logo_icon:
          data.logo_icon ?? "",

        cta_text:
          data.cta_text ?? "",

        cta_link:
          data.cta_link ?? "",

      });

    } catch (err) {

      console.error(
        "Failed to load site settings:",
        err
      );

      setError(
        err?.message ||
        "Failed to load site settings."
      );

    } finally {

      setLoading(false);

    }

  }


  /* =======================================================
     HANDLE CHANGE
  ======================================================= */

  function handleChange(e) {

    const {
      name,
      value,
    } = e.target;


    setForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );


    if (error) {
      setError("");
    }

    if (success) {
      setSuccess("");
    }

  }


  /* =======================================================
     SAVE
  ======================================================= */

  async function handleSave(e) {

    e.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);


    try {

      const response =
        await siteSettingsApi.update(
          form
        );


      /*
       * Use the returned database row
       * immediately.
       */

      const updated =
        response?.data;


      if (updated) {

        setForm({

          company_name:
            updated.company_name ?? "",

          phone:
            updated.phone ?? "",

          email:
            updated.email ?? "",

          logo_icon:
            updated.logo_icon ?? "",

          cta_text:
            updated.cta_text ?? "",

          cta_link:
            updated.cta_link ?? "",

        });

      }


      setSuccess(
        "Site settings updated successfully."
      );

    } catch (err) {

      console.error(
        "Failed to update site settings:",
        err
      );

      setError(
        err?.message ||
        "Failed to update site settings."
      );

    } finally {

      setSaving(false);

    }

  }


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {

    return (
      <div className="loading-state">

        <div
          className="spinner-border"
          role="status"
          aria-hidden="true"
        />

        <span>
          Loading site settings…
        </span>

      </div>
    );

  }


  /* =======================================================
     PAGE
  ======================================================= */

  return (

    <>

      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <div className="page-header">

        <div>

          <h1>
            Site Settings
          </h1>

          <p>
            Manage your company information
            and branding used across the website.
          </p>

        </div>

      </div>


      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (

        <div
          className="alert alert-danger p-3 mb-3"
          role="alert"
        >

          {error}

        </div>

      )}


      {/* ===================================================
          SUCCESS
      =================================================== */}

      {success && (

        <div
          className="alert alert-success p-3 mb-3"
          role="alert"
        >

          {success}

        </div>

      )}


      {/* ===================================================
          FORM
      =================================================== */}

      <form
        className="
          content-card
          form-card
          site-settings-card
        "
        onSubmit={handleSave}
      >

        {/* =================================================
            CARD HEADER
        ================================================= */}

        <div className="card-heading">

          <div>

            <h3>
              Company Information
            </h3>

            <p>
              Update the information displayed
              throughout the Constructify website.
            </p>

          </div>

        </div>


        {/* =================================================
            FORM FIELDS
        ================================================= */}

        <div className="row g-3">


          {/* =================================================
              COMPANY NAME
          ================================================= */}

          <div className="col-12">

            <label
              htmlFor="company_name"
              className="form-label"
            >
              Company Name
            </label>

            <input
              id="company_name"
              name="company_name"
              type="text"
              className="
                form-input
                form-control
              "
              value={
                form.company_name
              }
              onChange={
                handleChange
              }
              placeholder="Constructify"
              required
            />

          </div>


          {/* =================================================
              PHONE
          ================================================= */}

          <div className="col-md-6">

            <label
              htmlFor="phone"
              className="form-label"
            >
              Phone
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              className="
                form-input
                form-control
              "
              value={
                form.phone
              }
              onChange={
                handleChange
              }
              placeholder="+961 XX XXX XXX"
            />

          </div>


          {/* =================================================
              EMAIL
          ================================================= */}

          <div className="col-md-6">

            <label
              htmlFor="email"
              className="form-label"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              className="
                form-input
                form-control
              "
              value={
                form.email
              }
              onChange={
                handleChange
              }
              placeholder="info@example.com"
            />

          </div>


          {/* =================================================
              LOGO ICON
          ================================================= */}

          <div className="col-12">

            <label
              htmlFor="logo_icon"
              className="form-label"
            >
              Logo Icon
            </label>

            <input
              id="logo_icon"
              name="logo_icon"
              type="text"
              className="
                form-input
                form-control
              "
              value={
                form.logo_icon
              }
              onChange={
                handleChange
              }
              placeholder="bi-buildings"
            />

            <small className="text-muted d-block mt-1">

              Enter the Bootstrap Icons class
              used for the company logo.

            </small>

          </div>


          {/* =================================================
              CTA TEXT
          ================================================= */}

          <div className="col-md-6">

            <label
              htmlFor="cta_text"
              className="form-label"
            >
              CTA Button Text
            </label>

            <input
              id="cta_text"
              name="cta_text"
              type="text"
              className="
                form-input
                form-control
              "
              value={
                form.cta_text
              }
              onChange={
                handleChange
              }
              placeholder="Get Started"
            />

          </div>


          {/* =================================================
              CTA LINK
          ================================================= */}

          <div className="col-md-6">

            <label
              htmlFor="cta_link"
              className="form-label"
            >
              CTA Button Link
            </label>

            <input
              id="cta_link"
              name="cta_link"
              type="text"
              className="
                form-input
                form-control
              "
              value={
                form.cta_link
              }
              onChange={
                handleChange
              }
              placeholder="/contact"
            />

          </div>

        </div>


        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="form-actions-modern">

          <button
            type="submit"
            className="
              admin-btn
              btn
            "
            disabled={saving}
          >

            {saving ? (

              <>

                <span
                  className="
                    spinner-border
                    spinner-border-sm
                    me-2
                  "
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