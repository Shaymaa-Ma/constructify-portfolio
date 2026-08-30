/*
 * Admin/src/api/adminApi.js
 *
 * Central API client for the Constructify Admin Panel.
 *
 * ADMIN BACKEND:
 *
 * http://localhost/construction-portfolio/Server/api/admin
 *
 * UPLOADS:
 *
 * http://localhost/construction-portfolio/uploads
 *
 * React Admin:
 *
 * http://localhost:3001
 *
 *
 * Backend structure:
 *
 * Server/
 * └── api/
 *     └── admin/
 *         ├── about/
 *         │   ├── index.php
 *         │   └── features/
 *         │       └── index.php
 *         │
 *         ├── auth/
 *         │   ├── login.php
 *         │   ├── logout.php
 *         │   ├── me.php
 *         │   └── register.php
 *         │
 *         ├── categories/
 *         │   └── index.php
 *         │
 *         ├── hero/
 *         │   └── index.php
 *         │
 *         ├── projects/
 *         │   └── index.php
 *         │
 *         ├── services/
 *         │   ├── index.php
 *         │   └── items/
 *         │       └── index.php
 *         │
 *         ├── site-settings/
 *         │   └── index.php
 *         │
 *         └── _bootstrap.php
 */


/* =========================================================
   API BASE URL
========================================================= */

const DEFAULT_API_BASE_URL =
  "http://localhost/construction-portfolio/Server/api";


const API_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  DEFAULT_API_BASE_URL;


/* =========================================================
   ADMIN API BASE URL
========================================================= */

const DEFAULT_ADMIN_API_BASE_URL =
  `${API_BASE_URL.replace(/\/+$/, "")}/admin`;


const ADMIN_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_ADMIN_API_BASE_URL) ||
  DEFAULT_ADMIN_API_BASE_URL;


/* =========================================================
   UPLOADS BASE URL
========================================================= */

const DEFAULT_UPLOADS_BASE_URL =
  "http://localhost/construction-portfolio/uploads";


export const UPLOADS_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_UPLOADS_BASE_URL) ||
  DEFAULT_UPLOADS_BASE_URL;


/* =========================================================
   TOKEN
========================================================= */

const TOKEN_STORAGE_KEY =
  "constructify_admin_token";


/**
 * Get authentication token.
 */
export function getToken() {

  try {

    return localStorage.getItem(
      TOKEN_STORAGE_KEY
    );

  } catch {

    return null;

  }

}


/**
 * Store authentication token.
 */
export function setToken(token) {

  try {

    if (
      token !== undefined &&
      token !== null &&
      String(token).trim() !== ""
    ) {

      localStorage.setItem(
        TOKEN_STORAGE_KEY,
        String(token)
      );

    }

  } catch (error) {

    console.error(
      "Unable to save authentication token:",
      error
    );

  }

}


/**
 * Remove authentication token.
 */
export function clearToken() {

  try {

    localStorage.removeItem(
      TOKEN_STORAGE_KEY
    );

  } catch (error) {

    console.error(
      "Unable to clear authentication token:",
      error
    );

  }

}


/* =========================================================
   IMAGE URL
========================================================= */

/**
 * Convert an image path returned by PHP/database
 * into a complete browser URL.
 *
 * Supported values:
 *
 * hero.jpg
 *
 * /hero.jpg
 *
 * uploads/hero.jpg
 *
 * /uploads/hero.jpg
 *
 * http://localhost/...
 *
 * https://...
 */
export function getImageUrl(image) {

  if (
    image === undefined ||
    image === null
  ) {

    return "";

  }


  const value =
    String(image).trim();


  if (!value) {

    return "";

  }


  /*
   * Already a complete URL.
   */
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {

    return value;

  }


  /*
   * Convert backslashes to forward slashes.
   */
  let clean =
    value.replace(/\\/g, "/");


  /*
   * Remove leading slash.
   */
  clean =
    clean.replace(/^\/+/, "");


  /*
   * Remove localhost/construction-portfolio/
   * if the database accidentally stores a full
   * project-relative path.
   */
  clean = clean.replace(
    /^localhost\/construction-portfolio\//i,
    ""
  );


  clean = clean.replace(
    /^construction-portfolio\//i,
    ""
  );


  /*
   * If the database contains:
   *
   * uploads/image.jpg
   *
   * remove "uploads/" because UPLOADS_BASE_URL
   * already points to /uploads.
   */
  clean = clean.replace(
    /^uploads\//i,
    ""
  );


  /*
   * Final URL:
   *
   * http://localhost/construction-portfolio/uploads/image.jpg
   */
  return `${UPLOADS_BASE_URL.replace(
    /\/+$/,
    ""
  )}/${clean}`;

}


/* =========================================================
   URL BUILDER
========================================================= */

function buildUrl(
  base,
  path = "",
  params = null
) {

  const cleanBase =
    String(base).replace(
      /\/+$/,
      ""
    );


  const cleanPath =
    String(path).replace(
      /^\/+/,
      ""
    );


  const url =
    new URL(
      `${cleanBase}/${cleanPath}`
    );


  if (params) {

    Object.entries(params).forEach(
      ([key, value]) => {

        if (
          value !== undefined &&
          value !== null &&
          value !== ""
        ) {

          url.searchParams.set(
            key,
            String(value)
          );

        }

      }
    );

  }


  return url.toString();

}


/* =========================================================
   AUTH HEADERS
========================================================= */

function authHeaders(
  hasJsonBody = false
) {

  const headers = {};


  if (hasJsonBody) {

    headers["Content-Type"] =
      "application/json";

  }


  const token =
    getToken();


  if (token) {

    headers["Authorization"] =
      `Bearer ${token}`;

  }


  return headers;

}


/* =========================================================
   RESPONSE HANDLER
========================================================= */

async function parseResponse(
  response
) {

  let body = null;

  let rawText = null;


  const contentType =
    response.headers.get(
      "content-type"
    ) || "";


  try {

    if (
      contentType
        .toLowerCase()
        .includes(
          "application/json"
        )
    ) {

      body =
        await response.json();

    } else {

      rawText =
        await response.text();


      if (rawText.trim()) {

        try {

          body =
            JSON.parse(rawText);

        } catch {

          body = null;

        }

      }

    }

  } catch (error) {

    /*
     * response.json() threw — the server said it was JSON but
     * the body didn't actually parse (almost always a PHP
     * warning/notice printed before the real json_encode()
     * output, which corrupts it). Read the raw text so we can
     * surface what the server actually sent instead of
     * silently pretending nothing happened.
     */

    try {

      rawText = await response.clone().text();

    } catch {

      rawText = null;

    }

    body = null;

  }


  /*
   * Authentication failure.
   */
  if (
    response.status === 401
  ) {

    clearToken();

  }


  /*
   * HTTP error.
   */
  if (!response.ok) {

    const message =
      body?.error ||
      body?.message ||
      body?.raw ||
      (rawText && rawText.trim()
        ? `Server returned an unexpected response: ${rawText.slice(0, 300)}`
        : `Request failed (HTTP ${response.status})`);


    throw new Error(
      message
    );

  }


  /*
   * Application-level error.
   */
  if (
    body &&
    body.success === false
  ) {

    throw new Error(
      body.error ||
      body.message ||
      "The server rejected the request."
    );

  }


  /*
   * The request came back HTTP 200 but the body never parsed
   * as JSON. Previously this silently returned {} here, which
   * looked exactly like success to every caller (no thrown
   * error, no success:false) even though nothing the server
   * did actually reached the frontend. Throw instead, with
   * whatever raw text the server sent, so the real problem
   * (almost always a stray PHP warning/notice printed before
   * the JSON) is visible instead of masquerading as success.
   */

  if (body === null) {

    throw new Error(
      rawText && rawText.trim()
        ? `Server response wasn't valid JSON: ${rawText.slice(0, 300)}`
        : "Server returned an empty response."
    );

  }


  return body;

}


/* =========================================================
   JSON REQUEST
========================================================= */

async function request(
  method,
  path,
  {
    params,
    body,
  } = {}
) {

  /*
   * IMPORTANT:
   *
   * Every Admin request ALWAYS uses
   * ADMIN_BASE_URL.
   *
   * There is intentionally no "base"
   * parameter here.
   *
   * This prevents Admin code from
   * accidentally calling /client/.
   */

  const url =
    buildUrl(
      ADMIN_BASE_URL,
      path,
      params
    );


  let response;


  try {
    response = await fetch(
      url,
      {
        method,

        credentials: "include",

        headers:
          authHeaders(
            body !== undefined
          ),

        body:
          body !== undefined
            ? JSON.stringify(body)
            : undefined,
      }
    );
  } catch (error) {

    console.error(
      "API connection error:",
      {
        url,
        method,
        error,
      }
    );


    throw new Error(
      "Unable to connect to the API. Please check that WAMP/Apache is running and that the Admin API URL is correct."
    );

  }


  return parseResponse(
    response
  );

}


/* =========================================================
   FORM DATA REQUEST
========================================================= */

async function formRequest(
  method,
  path,
  {
    params,
    formData,
  } = {}
) {

  /*
   * Admin FormData requests also ALWAYS
   * use ADMIN_BASE_URL.
   */

  const url =
    buildUrl(
      ADMIN_BASE_URL,
      path,
      params
    );


  if (
    typeof FormData === "undefined" ||
    !(formData instanceof FormData)
  ) {

    throw new Error(
      "formData must be an instance of FormData."
    );

  }


  let response;


  try {

    response = await fetch(
      url,
      {
        method,

        credentials: "include",

        headers:
          authHeaders(false),

        body:
          formData,
      }
    );

  } catch (error) {

    console.error(
      "API connection error:",
      {
        url,
        method,
        error,
      }
    );


    throw new Error(
      "Unable to connect to the API. Please check that WAMP/Apache is running and that the Admin API URL is correct."
    );

  }


  return parseResponse(
    response
  );

}


/* =========================================================
   FORM DATA BUILDER
========================================================= */

function createFormData(
  data = {}
) {

  const formData =
    new FormData();


  Object.entries(data).forEach(
    ([key, value]) => {

      if (
        value === undefined ||
        value === null
      ) {

        return;

      }


      /*
       * File.
       */
      if (
        typeof File !== "undefined" &&
        value instanceof File
      ) {

        formData.append(
          key,
          value
        );

        return;

      }


      /*
       * Blob.
       */
      if (
        typeof Blob !== "undefined" &&
        value instanceof Blob
      ) {

        formData.append(
          key,
          value
        );

        return;

      }


      /*
       * Normal value.
       */
      formData.append(
        key,
        String(value)
      );

    }
  );


  return formData;

}


/* =========================================================
   DETECT FILE
========================================================= */

function containsFile(
  value
) {

  if (!value) {

    return false;

  }


  return (
    (
      typeof File !== "undefined" &&
      value instanceof File
    ) ||
    (
      typeof Blob !== "undefined" &&
      value instanceof Blob
    )
  );

}


/* =========================================================
   AUTH API
========================================================= */

export const authApi = {

  /*
   * POST
   *
   * /Server/api/admin/auth/login.php
   */
  login: async ({
    email,
    password,
  }) => {

    const res =
      await request(
        "POST",
        "/auth/login.php",
        {
          body: {
            email,
            password,
          },
        }
      );


    /*
     * Support:
     *
     * {
     *   data: {
     *     token: "..."
     *   }
     * }
     */
    if (
      res.data?.token
    ) {

      setToken(
        res.data.token
      );

    }


    /*
     * Support:
     *
     * {
     *   token: "..."
     * }
     */
    else if (
      res.token
    ) {

      setToken(
        res.token
      );

    }


    return res;

  },


  /*
   * POST
   *
   * /Server/api/admin/auth/register.php
   */
  register: async ({
    name,
    email,
    password,
    inviteCode,
  }) => {

    const res =
      await request(
        "POST",
        "/auth/register.php",
        {
          body: {
            name,
            email,
            password,
            invite_code:
              inviteCode,
          },
        }
      );


    if (
      res.data?.token
    ) {

      setToken(
        res.data.token
      );

    }


    else if (
      res.token
    ) {

      setToken(
        res.token
      );

    }


    return res;

  },


  /*
   * GET
   *
   * /Server/api/admin/auth/me.php
   */
  me: () =>
    request(
      "GET",
      "/auth/me.php"
    ),


  /*
   * POST
   *
   * /Server/api/admin/auth/logout.php
   */
  logout: async () => {

    try {

      return await request(
        "POST",
        "/auth/logout.php",
        {
          body: {},
        }
      );

    } finally {

      clearToken();

    }

  },

};


/* =========================================================
   SITE SETTINGS API
========================================================= */

export const siteSettingsApi = {

  /*
   * GET
   *
   * /admin/site-settings/index.php
   */
  get: () =>
    request(
      "GET",
      "/site-settings/index.php"
    ),


  /*
   * UPDATE
   *
   * PHP expects:
   *
   * POST + _method=PUT
   *
   * Same approach as Hero / About / Services.
   */
  update: async (
    fields = {}
  ) => {

    const formData =
      new FormData();


    /* -----------------------------------------------------
       ID
    ----------------------------------------------------- */

    if (
      fields.id !== undefined &&
      fields.id !== null &&
      fields.id !== ""
    ) {

      formData.append(
        "id",
        String(fields.id)
      );

    }


    /* -----------------------------------------------------
       METHOD OVERRIDE
    ----------------------------------------------------- */

    formData.append(
      "_method",
      "PUT"
    );


    /* -----------------------------------------------------
       SITE SETTINGS FIELDS
    ----------------------------------------------------- */

    const settingsFields = [

      "company_name",

      "phone",

      "email",

      "logo_icon",

      "cta_text",

      "cta_link",

    ];


    settingsFields.forEach(
      (field) => {

        if (
          fields[field] !== undefined &&
          fields[field] !== null
        ) {

          formData.append(
            field,
            String(fields[field])
          );

        }

      }
    );


    /* -----------------------------------------------------
       SEND
    ----------------------------------------------------- */

    return formRequest(
      "POST",
      "/site-settings/index.php",
      {
        formData,
      }
    );

  },


  /*
   * Compatibility method.
   */
  updateWithImage: async (
    fields = {}
  ) => {

    return siteSettingsApi.update(
      fields
    );

  },

};


/* =========================================================
   HERO API
========================================================= */

export const heroApi = {

  /*
   * GET
   *
   * /admin/hero/index.php
   */
  get: () =>
    request(
      "GET",
      "/hero/index.php"
    ),


  /*
   * UPDATE HERO
   *
   * PHP endpoint expects POST.
   *
   * We always use multipart/form-data because:
   * - Hero can contain an image
   * - Hero contains counters
   * - PHP reads data from $_POST
   */
  update: async (fields = {}) => {

    const formData = new FormData();


    /* =====================================================
       HERO ID
    ===================================================== */

    if (
      fields.id !== undefined &&
      fields.id !== null
    ) {

      formData.append(
        "id",
        String(fields.id)
      );

    }


    /* =====================================================
       HERO TEXT FIELDS
    ===================================================== */

    const heroFields = [
      "badge_text",
      "title_text",
      "title_highlight",
      "subtitle",
      "primary_btn_text",
      "primary_btn_link",
      "secondary_btn_text",
      "secondary_btn_link",
    ];


    heroFields.forEach((field) => {

      if (
        fields[field] !== undefined &&
        fields[field] !== null
      ) {

        formData.append(
          field,
          String(fields[field])
        );

      }

    });


    /* =====================================================
       BACKGROUND IMAGE
    ===================================================== */

    /*
     * Your PHP expects:
     *
     * $_FILES['background_image']
     *
     * Therefore React must send:
     *
     * background_image
     */

    const image =
      fields.background_image ||
      fields.image;


    if (
      containsFile(image)
    ) {

      formData.append(
        "background_image",
        image
      );

    }


    /* =====================================================
       COUNTERS
    ===================================================== */

    /*
     * PHP expects:
     *
     * counters[0][id]
     * counters[0][icon]
     * counters[0][value]
     * counters[0][label]
     * counters[0][display_order]
     */

    if (
      Array.isArray(fields.counters)
    ) {

      fields.counters.forEach(
        (counter, index) => {

          if (!counter) {
            return;
          }


          if (
            counter.id !== undefined &&
            counter.id !== null
          ) {

            formData.append(
              `counters[${index}][id]`,
              String(counter.id)
            );

          }


          formData.append(
            `counters[${index}][icon]`,
            String(counter.icon ?? "")
          );


          formData.append(
            `counters[${index}][value]`,
            String(counter.value ?? "")
          );


          formData.append(
            `counters[${index}][label]`,
            String(counter.label ?? "")
          );


          formData.append(
            `counters[${index}][display_order]`,
            String(
              counter.display_order ??
              index
            )
          );

        }
      );

    }


    /* =====================================================
       SEND
    ===================================================== */

    return formRequest(
      "POST",
      "/hero/index.php",
      {
        formData,
      }
    );

  },


  /*
   * Explicit multipart update.
   *
   * Kept for compatibility with Hero.jsx
   */
  updateWithImage: async (
    fields = {}
  ) => {

    return heroApi.update(
      fields
    );

  },

};




/* =========================================================
   ABOUT API
========================================================= */

export const aboutApi = {

  /*
   * GET
   *
   * /admin/about/index.php
   */
  get: () =>
    request(
      "GET",
      "/about/index.php"
    ),


  /*
   * UPDATE ABOUT
   *
   * PHP endpoint expects POST.
   *
   * Always use multipart/form-data,
   * because About supports:
   *
   * image_primary
   * image_secondary
   */
  update: async (
    fields = {}
  ) => {

    const formData =
      new FormData();


    /* =====================================================
       ABOUT ID
    ===================================================== */

    if (
      fields.id !== undefined &&
      fields.id !== null
    ) {

      formData.append(
        "id",
        String(fields.id)
      );

    }


    /* =====================================================
       ABOUT TEXT FIELDS
    ===================================================== */

    const aboutFields = [

      "badge_text",

      "title",

      "description",

      "overlay_badge_text",

      "primary_btn_text",

      "primary_btn_link",

      "secondary_btn_text",

      "secondary_btn_link",

    ];


    aboutFields.forEach(
      (field) => {

        if (
          fields[field] !== undefined &&
          fields[field] !== null
        ) {

          formData.append(
            field,
            String(fields[field])
          );

        }

      }
    );


    /* =====================================================
       PRIMARY IMAGE
    ===================================================== */

    if (
      containsFile(
        fields.image_primary
      )
    ) {

      formData.append(
        "image_primary",
        fields.image_primary
      );

    }


    /* =====================================================
       SECONDARY IMAGE
    ===================================================== */

    if (
      containsFile(
        fields.image_secondary
      )
    ) {

      formData.append(
        "image_secondary",
        fields.image_secondary
      );

    }


    /* =====================================================
       SEND
    ===================================================== */

    return formRequest(
      "POST",
      "/about/index.php",
      {
        formData,
      }
    );

  },


  /*
   * Explicit multipart update.
   *
   * Kept for compatibility with About.jsx.
   */
  updateWithImage: async (
    fields = {}
  ) => {

    return aboutApi.update(
      fields
    );

  },


  /* -------------------------------------------------------
     ABOUT FEATURES
  ------------------------------------------------------- */

  features: {

    /*
     * GET ALL
     */
    list: async () => {

      const res =
        await request(
          "GET",
          "/about/features/index.php"
        );


      return res.data || [];

    },


    /*
     * GET ONE
     */
    getOne: async (
      id
    ) => {

      const res =
        await request(
          "GET",
          "/about/features/index.php",
          {
            params: {
              id,
            },
          }
        );


      return res.data;

    },


    /*
     * UPDATE FEATURE
     *
     * PHP endpoint uses POST,
     * following the same approach as Hero.
     */
    update: async (
      id,
      feature = {}
    ) => {

      const formData =
        new FormData();


      /* -----------------------------------------------
         ID
      ----------------------------------------------- */

      formData.append(
        "id",
        String(id)
      );


      /* -----------------------------------------------
         Fields
      ----------------------------------------------- */

      const featureFields = [

        "icon",

        "title",

        "description",

        "display_order",

      ];


      featureFields.forEach(
        (field) => {

          if (
            feature[field] !== undefined &&
            feature[field] !== null
          ) {

            formData.append(
              field,
              String(feature[field])
            );

          }

        }
      );


      /* -----------------------------------------------
         Image
      ----------------------------------------------- */

      if (
        containsFile(
          feature.image
        )
      ) {

        formData.append(
          "image",
          feature.image
        );

      }


      /* -----------------------------------------------
         SEND
      ----------------------------------------------- */

      return formRequest(
        "POST",
        "/about/features/index.php",
        {
          formData,
        }
      );

    },


    /*
     * Explicit multipart update.
     */
    updateWithImage: async (
      id,
      feature = {}
    ) => {

      return aboutApi.features.update(
        id,
        feature
      );

    },

  },

};


/* =========================================================
   SERVICES API
========================================================= */

export const servicesApi = {

  /* =======================================================
     SERVICES SECTION
  ======================================================= */

  /*
   * GET SECTION + COUNTERS
   *
   * GET:
   * /Server/api/admin/services/index.php
   */
  get: async () => {

    return request(
      "GET",
      "/services/index.php"
    );

  },


  /*
   * Compatibility method for Services.jsx
   */
  getSection: async () => {

    return request(
      "GET",
      "/services/index.php"
    );

  },


  /* =======================================================
     UPDATE SERVICES SECTION
  ======================================================= */

  /*
   * PHP expects:
   *
   * POST + _method=PUT
   *
   * Because the request may contain:
   * - text fields
   * - panel_image
   * - counters
   */

  update: async (
    fields = {}
  ) => {

    const formData =
      new FormData();


    /* -----------------------------------------------------
       ID
    ----------------------------------------------------- */

    if (
      fields.id !== undefined &&
      fields.id !== null &&
      fields.id !== ""
    ) {

      formData.append(
        "id",
        String(fields.id)
      );

    }


    /* -----------------------------------------------------
       METHOD OVERRIDE
    ----------------------------------------------------- */

    formData.append(
      "_method",
      "PUT"
    );


    /* -----------------------------------------------------
       SECTION FIELDS
    ----------------------------------------------------- */

    const sectionFields = [
      "title",
      "subtitle",
      "panel_title",
      "panel_btn_text",
      "panel_btn_link",
      "stats_badge_text",
      "stats_title",
      "stats_description",
      "stats_btn_text",
      "stats_btn_link",
    ];


    sectionFields.forEach(
      (field) => {

        if (
          fields[field] !== undefined &&
          fields[field] !== null
        ) {

          formData.append(
            field,
            String(fields[field])
          );

        }

      }
    );


    /* -----------------------------------------------------
       PANEL IMAGE
    ----------------------------------------------------- */

    if (
      containsFile(
        fields.panel_image
      )
    ) {

      formData.append(
        "panel_image",
        fields.panel_image
      );

    }


    /* -----------------------------------------------------
       COUNTERS

       PHP expects a JSON string (it json_decode()s this
       field itself), so this must stay a single stringified
       value, not counters[0][icon] style nested keys like
       hero uses.
    ----------------------------------------------------- */

    if (
      Array.isArray(fields.counters)
    ) {

      formData.append(
        "counters",
        JSON.stringify(
          fields.counters
        )
      );

    }


    /* -----------------------------------------------------
       SEND
    ----------------------------------------------------- */

    return formRequest(
      "POST",
      "/services/index.php",
      {
        formData,
      }
    );

  },


  /* =======================================================
     UPDATE SECTION
  ======================================================= */

  updateSection: async (
    fields = {}
  ) => {

    return servicesApi.update(
      fields
    );

  },


  /* =======================================================
     UPDATE SECTION WITH IMAGE
  ======================================================= */

  updateSectionWithImage: async (
    fields = {}
  ) => {

    return servicesApi.update(
      fields
    );

  },


  /* =======================================================
     SERVICE ITEMS
  ======================================================= */

  items: {

    /* -----------------------------------------------------
       GET ALL SERVICES
    ----------------------------------------------------- */

    list: async () => {

      const res =
        await request(
          "GET",
          "/services/items/index.php"
        );


      return Array.isArray(
        res?.data
      )
        ? res.data
        : [];

    },


    /* -----------------------------------------------------
       GET ONE SERVICE
    ----------------------------------------------------- */

    getOne: async (
      id
    ) => {

      if (
        id === undefined ||
        id === null ||
        id === ""
      ) {

        throw new Error(
          "Service ID is required."
        );

      }


      const res =
        await request(
          "GET",
          "/services/items/index.php",
          {
            params: {
              id,
            },
          }
        );


      return res?.data || null;

    },


    /* -----------------------------------------------------
       UPDATE SERVICE
    ----------------------------------------------------- */

    update: async (
      id,
      service = {}
    ) => {

      if (
        id === undefined ||
        id === null ||
        id === ""
      ) {

        throw new Error(
          "Service ID is required."
        );

      }


      const formData =
        new FormData();


      /* ---------------------------------------------------
         ID
      --------------------------------------------------- */

      formData.append(
        "id",
        String(id)
      );


      /* ---------------------------------------------------
         METHOD OVERRIDE
      --------------------------------------------------- */

      formData.append(
        "_method",
        "PUT"
      );


      /* ---------------------------------------------------
         SERVICE FIELDS
      --------------------------------------------------- */

      const serviceFields = [
        "icon",
        "title",
        "description",
        "display_order",
      ];


      serviceFields.forEach(
        (field) => {

          if (
            service[field] !== undefined &&
            service[field] !== null
          ) {

            formData.append(
              field,
              String(service[field])
            );

          }

        }
      );


      /* ---------------------------------------------------
         SEND
      --------------------------------------------------- */

      return formRequest(
        "POST",
        "/services/items/index.php",
        {
          formData,
        }
      );

    },


    /* -----------------------------------------------------
       UPDATE SERVICE WITH IMAGE
       -----------------------------------------------------
       Not currently needed because the PHP service-item
       endpoint has no image field.
    */

    updateWithImage: async (
      id,
      service = {}
    ) => {

      return servicesApi.items.update(
        id,
        service
      );

    },

  },

};



/* =========================================================
   CATEGORIES API
   FULL CRUD — no image field (project_categories has none)
========================================================= */

export const categoriesApi = {

  /*
   * GET ALL
   * /admin/categories/index.php
   */
  list: async () => {

    const res = await request("GET", "/categories/index.php");

    return res.data || [];
  },


  /*
   * GET ONE
   */
  getOne: async (id) => {

    const res = await request(
      "GET",
      "/categories/index.php",
      { params: { id } }
    );

    return res.data;
  },


  /*
   * CREATE
   * Returns the FULL response { success, message, data } —
   * callers that need the created row read res.data themselves.
   */
  create: async (category) => {

    return request(
      "POST",
      "/categories/index.php",
      { body: category }
    );
  },


  /*
   * UPDATE
   */
  update: async (id, category) => {

    return request(
      "PUT",
      "/categories/index.php",
      {
        params: { id },
        body: category,
      }
    );
  },


  /*
   * DELETE
   * Rejects with a 409 message if projects still reference
   * this category — surfaced as a normal thrown Error by
   * parseResponse().
   */
  remove: (id) =>
    request(
      "DELETE",
      "/categories/index.php",
      { params: { id } }
    ),

};


/* =========================================================
   PROJECTS API
   FULL CRUD, with image upload support
========================================================= */

export const projectsApi = {

  /*
   * GET ALL (optionally filtered by category)
   */
  list: async (categoryId = "") => {

    const params = {};

    if (categoryId !== "" && categoryId !== null && categoryId !== undefined) {
      params.category_id = categoryId;
    }

    const res = await request(
      "GET",
      "/projects/index.php",
      { params }
    );

    return res.data || [];
  },


  /*
   * GET ONE
   */
  getOne: async (id) => {

    const res = await request(
      "GET",
      "/projects/index.php",
      { params: { id } }
    );

    return res.data;
  },


  /*
   * CREATE
   *
   * If project.image is a File/Blob, this switches to a plain
   * multipart POST (no _method override — the backend's real
   * POST/create branch handles it directly). Otherwise it's a
   * regular JSON POST.
   *
   * Returns the FULL response { success, message, data } so
   * callers can read the created row (with category_name/slug
   * already joined) from res.data.
   */
  create: async (project) => {

    if (containsFile(project?.image)) {

      const formData = createFormData(project);

      return formRequest(
        "POST",
        "/projects/index.php",
        { formData }
      );
    }

    return request(
      "POST",
      "/projects/index.php",
      { body: project }
    );
  },


  /*
   * UPDATE
   *
   * Same file-vs-JSON branching as create. When a file is
   * present this must go through _method=PUT (multipart PUT
   * bodies can't be parsed by PHP directly), matching what
   * projects/index.php expects.
   */
  update: async (id, project) => {

    if (containsFile(project?.image)) {

      const formData = createFormData({
        ...project,
        id,
        _method: "PUT",
      });

      return formRequest(
        "POST",
        "/projects/index.php",
        { formData }
      );
    }

    return request(
      "PUT",
      "/projects/index.php",
      {
        params: { id },
        body: project,
      }
    );
  },


  /*
   * DELETE
   */
  remove: (id) =>
    request(
      "DELETE",
      "/projects/index.php",
      { params: { id } }
    ),

};


/* =========================================================
   ADMIN API
========================================================= */

export const adminApi = {

  auth:
    authApi,

  siteSettings:
    siteSettingsApi,

  hero:
    heroApi,

  about:
    aboutApi,

  services:
    servicesApi,

  categories:
    categoriesApi,

  projects:
    projectsApi,

};


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default adminApi;