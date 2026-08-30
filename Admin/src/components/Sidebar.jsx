import React from "react";
import { NavLink } from "react-router-dom";

const menuItems = [
  {
    path: "/admin/dashboard",
    label: "Dashboard",
    icon: "bi-grid-1x2-fill",
  },
  {
    path: "/admin/site-settings",
    label: "Site Settings",
    icon: "bi-gear-fill",
  },
  {
    path: "/admin/hero",
    label: "Hero Section",
    icon: "bi-stars",
  },
  {
    path: "/admin/about",
    label: "About",
    icon: "bi-info-circle-fill",
  },
  {
    path: "/admin/services",
    label: "Services",
    icon: "bi-tools",
  },
  {
    path: "/admin/projects",
    label: "Projects",
    icon: "bi-buildings-fill",
  },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="sidebar-overlay d-lg-none"
          onClick={onClose}
        />
      )}

      <aside
        className={`admin-sidebar ${open ? "sidebar-open" : ""
          }`}
      >

        <div className="sidebar-brand">

          <div className="brand-mark small">
            <i className="bi bi-buildings-fill"></i>
          </div>

          <div>
            <strong>CONSTRUCTIFY</strong>
            <span>ADMIN PANEL</span>
          </div>

        </div>

        <div className="sidebar-section-label">
          MANAGEMENT
        </div>

        <nav className="admin-nav">

          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-button ${isActive ? "active" : ""}`
              }
            >
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}

        </nav>

        <div className="sidebar-bottom">

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="view-site"
          >
            <i className="bi bi-box-arrow-up-right" />
            <span>View Website</span>
          </a>

        </div>

      </aside>
    </>
  );
}