import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  authApi,
  clearToken,
} from "../api/adminApi";

const pageTitles = {
  "/admin/dashboard": "Dashboard",
  "/admin/site-settings": "Site Settings",
  "/admin/hero": "Hero Section",
  "/admin/about": "About Section",
  "/admin/services": "Services",
  "/admin/projects": "Projects",
  "/admin/project-categories": "Project Categories",
  "/admin/counters": "Counters",
};

export default function Topbar({ onMenu }) {
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem(
      "constructify_admin_user"
    ) || "{}"
  );

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.log(error);
    }

    clearToken();

    localStorage.removeItem(
      "constructify_admin_user"
    );

    navigate("/admin/login");
  };

  return (
    <header className="admin-topbar">

      <div className="d-flex align-items-center gap-3">

        <button
          className="mobile-menu-btn d-lg-none"
          onClick={onMenu}
        >
          <i className="bi bi-list" />
        </button>

        <div>

          <div className="topbar-title">
            {pageTitles[location.pathname] ||
              "Admin Panel"}
          </div>

          <div className="topbar-breadcrumb">
            Constructify / Admin
          </div>

        </div>

      </div>

      <div className="topbar-user">

        <div className="user-avatar">
          {(
            user.name ||
            user.email ||
            "A"
          )
            .charAt(0)
            .toUpperCase()}
        </div>

        <div className="d-none d-sm-block">

          <strong>
            {user.name || "Administrator"}
          </strong>

          <small>
            {user.email || "Admin"}
          </small>

        </div>

        <button
          className="logout-btn"
          onClick={logout}
          title="Logout"
        >
          <i className="bi bi-box-arrow-right" />
        </button>

      </div>

    </header>
  );
}