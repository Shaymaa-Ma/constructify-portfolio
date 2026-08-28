/*
 * Admin/src/api/adminApi.js
 *
 * Central API client for Constructify Admin Panel.
 *
 * ACTUAL BACKEND STRUCTURE:
 *
 * construction-portfolio/
 *
 * ├── uploads/
 * │
 * └── Server/
 *     └── api/
 *         ├── admin/
 *         │   └── auth/
 *         │       ├── login.php
 *         │       ├── logout.php
 *         │       ├── me.php
 *         │       └── register.php
 *         │
 *         └── client/
 *             ├── about/
 *             │   ├── index.php
 *             │   └── features/
 *             │       └── index.php
 *             │
 *             ├── categories/
 *             │   └── index.php
 *             │
 *             ├── hero/
 *             │   └── index.php
 *             │
 *             ├── projects/
 *             │   └── index.php
 *             │
 *             ├── services/
 *             │   ├── index.php
 *             │   └── items/
 *             │       └── index.php
 *             │
 *             └── site-settings/
 *                 └── index.php
 *
 *
 * IMPORTANT:
 *
 * ADMIN AUTH APIs:
 * /Server/api/admin/
 *
 * CLIENT CONTENT APIs:
 * /Server/api/client/
 *
 * Images:
 * /uploads/
 *
 * React Admin:
 * http://localhost:3001
 */


/* =========================================================
   BASE URL
========================================================= */

const API_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL) ||
  "http://localhost/construction-portfolio/Server/api";


/* =========================================================
   SEPARATE API BASE URLS
========================================================= */

/*
 * Authentication belongs to /admin
 */

const ADMIN_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_ADMIN_API_BASE_URL) ||
  `${API_BASE_URL}/admin`;


/*
 * Website content belongs to /client
 */

const CLIENT_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_CLIENT_API_BASE_URL) ||
  `${API_BASE_URL}/client`;


/* =========================================================
   UPLOADS URL
========================================================= */

export const UPLOADS_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_UPLOADS_BASE_URL) ||
  "http://localhost/construction-portfolio/uploads";


/*
 * Helper for displaying uploaded images.
 *
 * Examples:
 *
 * getImageUrl("hero.jpg")
 *
 * getImageUrl("/uploads/hero.jpg")
 *
 * getImageUrl("uploads/hero.jpg")
 */

export function getImageUrl(image) {

  if (!image) {
    return "";
  }

  const value = String(image).trim();

  if (!value) {
    return "";
  }

  /*
   * Already a complete URL.
   */

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }


  /*
   * Remove leading slash.
   */

  let clean = value.replace(/^\/+/, "");


  /*
   * If database already contains uploads/,
   * do not add uploads twice.
   */

  if (clean.startsWith("uploads/")) {
    clean = clean.substring("uploads/".length);
  }


  return `${UPLOADS_BASE_URL}/${clean}`;
}


/* =========================================================
   TOKEN
========================================================= */

const TOKEN_STORAGE_KEY =
  "constructify_admin_token";


export function getToken() {

  try {

    return localStorage.getItem(
      TOKEN_STORAGE_KEY
    );

  } catch {

    return null;

  }

}


export function setToken(token) {

  try {

    if (token) {

      localStorage.setItem(
        TOKEN_STORAGE_KEY,
        token
      );

    }

  } catch {}

}


export function clearToken() {

  try {

    localStorage.removeItem(
      TOKEN_STORAGE_KEY
    );

  } catch {}

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
    String(base).replace(/\/+$/, "");

  const cleanPath =
    String(path).replace(/^\/+/, "");


  const url = new URL(
    `${cleanBase}/${cleanPath}`,
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost"
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
   HEADERS
========================================================= */

function authHeaders() {

  const headers = {};

  const token = getToken();

  if (token) {

    headers.Authorization =
      `Bearer ${token}`;

  }

  return headers;

}


function jsonHeaders() {

  return {

    ...authHeaders(),

    "Content-Type":
      "application/json",

  };

}


/* =========================================================
   RESPONSE HANDLER
========================================================= */

async function parseResponse(
  response
) {

  let body = null;

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";


  try {

    if (
      contentType.includes(
        "application/json"
      )
    ) {

      body = await response.json();

    } else {

      const text =
        await response.text();

      try {

        body = JSON.parse(text);

      } catch {

        body = null;

      }

    }

  } catch {

    body = null;

  }


  /*
   * Token expired.
   */

  if (response.status === 401) {

    clearToken();

  }


  /*
   * HTTP error.
   */

  if (!response.ok) {

    throw new Error(
      body?.error ||
      body?.message ||
      `Request failed (HTTP ${response.status})`
    );

  }


  /*
   * API-level error.
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


  return body || {};

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
    base,
  } = {}
) {

  const url =
    buildUrl(
      base || CLIENT_BASE_URL,
      path,
      params
    );


  let response;


  try {

    response =
      await fetch(
        url,
        {
          method,

          headers:
            body !== undefined
              ? jsonHeaders()
              : authHeaders(),

          body:
            body !== undefined
              ? JSON.stringify(body)
              : undefined,
        }
      );

  } catch (error) {

    throw new Error(
      "Unable to connect to the API. Please check that WAMP/Apache is running and the API URL is correct."
    );

  }


  return parseResponse(response);

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
    base,
  } = {}
) {

  const url =
    buildUrl(
      base || CLIENT_BASE_URL,
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

    /*
     * IMPORTANT:
     *
     * Do NOT set Content-Type here.
     *
     * Browser creates:
     *
     * multipart/form-data;
     * boundary=...
     */

    response =
      await fetch(
        url,
        {
          method,

          headers:
            authHeaders(),

          body: formData,
        }
      );

  } catch (error) {

    throw new Error(
      "Unable to connect to the API. Please check that WAMP/Apache is running and the API URL is correct."
    );

  }


  return parseResponse(response);

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
       * File
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
       * Blob
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
       * Normal value
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
   AUTH API
 *
 * IMPORTANT:
 * Authentication is inside:
 *
 * /Server/api/admin/auth/
========================================================= */

export const authApi = {

  login: async ({
    email,
    password,
  }) => {

    const res =
      await request(
        "POST",
        "/auth/login.php",
        {
          base:
            ADMIN_BASE_URL,

          body: {
            email,
            password,
          },
        }
      );


    if (res.data?.token) {

      setToken(
        res.data.token
      );

    }


    if (res.token) {

      setToken(
        res.token
      );

    }


    return res;

  },


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
          base:
            ADMIN_BASE_URL,

          body: {

            name,

            email,

            password,

            invite_code:
              inviteCode,

          },

        }
      );


    if (res.data?.token) {

      setToken(
        res.data.token
      );

    }


    if (res.token) {

      setToken(
        res.token
      );

    }


    return res;

  },


  me: () =>
    request(
      "GET",
      "/auth/me.php",
      {
        base:
          ADMIN_BASE_URL,
      }
    ),


  logout: async () => {

    try {

      return await request(
        "POST",
        "/auth/logout.php",
        {
          base:
            ADMIN_BASE_URL,

          body: {},
        }
      );

    } finally {

      clearToken();

    }

  },

};


/* =========================================================
   SITE SETTINGS
 *
 * /Server/api/client/site-settings/
========================================================= */

export const siteSettingsApi = {

  get: () =>
    request(
      "GET",
      "/site-settings/index.php"
    ),


  update: (fields) =>
    request(
      "PUT",
      "/site-settings/index.php",
      {
        body: fields,
      }
    ),


  updateWithImage: async (
    fields
  ) => {

    const formData =
      createFormData({
        ...fields,
        _method: "PUT",
      });


    return formRequest(
      "POST",
      "/site-settings/index.php",
      {
        formData,
      }
    );

  },

};


/* =========================================================
   HERO
 *
 * /Server/api/client/hero/
========================================================= */

export const heroApi = {

  get: () =>
    request(
      "GET",
      "/hero/index.php"
    ),


  update: (fields) =>
    request(
      "PUT",
      "/hero/index.php",
      {
        body: fields,
      }
    ),


  /*
   * Update hero including image.
   */

  updateWithImage: async (
    fields
  ) => {

    const formData =
      createFormData({
        ...fields,
        _method: "PUT",
      });


    return formRequest(
      "POST",
      "/hero/index.php",
      {
        formData,
      }
    );

  },

};


/* =========================================================
   ABOUT
 *
 * /Server/api/client/about/
========================================================= */

export const aboutApi = {

  get: () =>
    request(
      "GET",
      "/about/index.php"
    ),


  update: (fields) =>
    request(
      "PUT",
      "/about/index.php",
      {
        body: fields,
      }
    ),


  /*
   * Update About including image.
   */

  updateWithImage: async (
    fields
  ) => {

    const formData =
      createFormData({
        ...fields,
        _method: "PUT",
      });


    return formRequest(
      "POST",
      "/about/index.php",
      {
        formData,
      }
    );

  },


  /* -------------------------------------------------------
     ABOUT FEATURES
  ------------------------------------------------------- */

  features: {

    list: async () => {

      const res =
        await request(
          "GET",
          "/about/features/index.php"
        );


      return res.data || [];

    },


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


    update: async (
      id,
      feature
    ) => {

      /*
       * If feature contains a File,
       * automatically use multipart.
       */

      const hasImage =
        feature?.image instanceof File ||
        feature?.image instanceof Blob;


      if (hasImage) {

        const formData =
          createFormData({
            ...feature,

            id,

            _method: "PUT",
          });


        return formRequest(
          "POST",
          "/about/features/index.php",
          {
            formData,
          }
        );

      }


      const res =
        await request(
          "PUT",
          "/about/features/index.php",
          {
            body: {
              ...feature,
              id,
            },
          }
        );


      return res;

    },

  },

};


/* =========================================================
   SERVICES
 *
 * /Server/api/client/services/
========================================================= */

export const servicesApi = {

  /*
   * SERVICES SECTION
   */

  getSection: () =>
    request(
      "GET",
      "/services/index.php"
    ),


  updateSection: (
    fields
  ) =>
    request(
      "PUT",
      "/services/index.php",
      {
        body: fields,
      }
    ),


  /*
   * Services section image.
   */

  updateSectionWithImage:
    async (fields) => {

      const formData =
        createFormData({
          ...fields,
          _method: "PUT",
        });


      return formRequest(
        "POST",
        "/services/index.php",
        {
          formData,
        }
      );

    },


  /* -------------------------------------------------------
     SERVICE ITEMS
  ------------------------------------------------------- */

  items: {

    list: async () => {

      const res =
        await request(
          "GET",
          "/services/items/index.php"
        );


      return res.data || [];

    },


    getOne: async (
      id
    ) => {

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


      return res.data;

    },


    update: async (
      id,
      service
    ) => {

      const hasImage =
        service?.image instanceof File ||
        service?.image instanceof Blob;


      /*
       * Image update.
       */

      if (hasImage) {

        const formData =
          createFormData({
            ...service,

            id,

            _method: "PUT",
          });


        return formRequest(
          "POST",
          "/services/items/index.php",
          {
            formData,
          }
        );

      }


      /*
       * Normal JSON update.
       */

      const res =
        await request(
          "PUT",
          "/services/items/index.php",
          {
            body: {
              ...service,
              id,
            },
          }
        );


      return res;

    },


    updateWithImage:
      async (
        id,
        service
      ) => {

        const formData =
          createFormData({
            ...service,

            id,

            _method: "PUT",
          });


        return formRequest(
          "POST",
          "/services/items/index.php",
          {
            formData,
          }
        );

      },

  },

};


/* =========================================================
   CATEGORIES
 *
 * /Server/api/client/categories/
 *
 * FULL CRUD
========================================================= */

export const categoriesApi = {

  list: async () => {

    const res =
      await request(
        "GET",
        "/categories/index.php"
      );


    return res.data || [];

  },


  getOne: async (
    id
  ) => {

    const res =
      await request(
        "GET",
        "/categories/index.php",
        {
          params: {
            id,
          },
        }
      );


    return res.data;

  },


  create: async (
    category
  ) => {

    const hasImage =
      category?.image instanceof File ||
      category?.image instanceof Blob;


    if (hasImage) {

      const formData =
        createFormData(category);


      return formRequest(
        "POST",
        "/categories/index.php",
        {
          formData,
        }
      );

    }


    return request(
      "POST",
      "/categories/index.php",
      {
        body: category,
      }
    );

  },


  update: async (
    id,
    category
  ) => {

    const hasImage =
      category?.image instanceof File ||
      category?.image instanceof Blob;


    /*
     * Update with image.
     */

    if (hasImage) {

      const formData =
        createFormData({
          ...category,

          id,

          _method: "PUT",
        });


      return formRequest(
        "POST",
        "/categories/index.php",
        {
          formData,
        }
      );

    }


    /*
     * Normal update.
     */

    return request(
      "PUT",
      "/categories/index.php",
      {
        params: {
          id,
        },

        body: category,
      }
    );

  },


  updateWithImage:
    async (
      id,
      category
    ) => {

      const formData =
        createFormData({
          ...category,

          id,

          _method: "PUT",
        });


      return formRequest(
        "POST",
        "/categories/index.php",
        {
          formData,
        }
      );

    },


  remove: async (
    id
  ) => {

    return request(
      "DELETE",
      "/categories/index.php",
      {
        params: {
          id,
        },
      }
    );

  },

};


/* =========================================================
   PROJECTS
 *
 * /Server/api/client/projects/
 *
 * FULL CRUD + IMAGE
========================================================= */

export const projectsApi = {

  list: async (
    categoryId = ""
  ) => {

    const res =
      await request(
        "GET",
        "/projects/index.php",
        {
          params: {
            category_id:
              categoryId,
          },
        }
      );


    return res.data || [];

  },


  getOne: async (
    id
  ) => {

    const res =
      await request(
        "GET",
        "/projects/index.php",
        {
          params: {
            id,
          },
        }
      );


    return res.data;

  },


  /*
   * CREATE
   *
   * Always use FormData because
   * a project may contain an image.
   */

  create: async (
    project
  ) => {

    const formData =
      createFormData(project);


    return formRequest(
      "POST",
      "/projects/index.php",
      {
        formData,
      }
    );

  },


  /*
   * UPDATE
   *
   * POST + _method=PUT
   *
   * This allows PHP to receive
   * multipart/form-data correctly.
   */

  update: async (
    id,
    project
  ) => {

    const formData =
      createFormData({
        ...project,

        id,

        _method: "PUT",
      });


    return formRequest(
      "POST",
      "/projects/index.php",
      {
        formData,
      }
    );

  },


  /*
   * Explicit image update.
   */

  updateWithImage:
    async (
      id,
      project
    ) => {

      const formData =
        createFormData({
          ...project,

          id,

          _method: "PUT",
        });


      return formRequest(
        "POST",
        "/projects/index.php",
        {
          formData,
        }
      );

    },


  /*
   * DELETE
   */

  remove: async (
    id
  ) => {

    return request(
      "DELETE",
      "/projects/index.php",
      {
        params: {
          id,
        },
      }
    );

  },

};


/* =========================================================
   ADMIN API
========================================================= */

export const adminApi = {

  /*
   * Authentication
   */

  auth:
    authApi,


  /*
   * Website content
   */

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