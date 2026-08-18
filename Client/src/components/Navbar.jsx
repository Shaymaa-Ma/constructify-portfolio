import React, { useState } from "react";

/*
Home / About / Services / Projects are demonstrated in the video
scrolling to their on-page anchor when clicked, so those are real
anchor links (#home, #about, #services, #projects).

Team / Pages / Contact never had their destination shown in the
video, so per the brief they're rendered visually but go nowhere
(href="#") until that's clarified or built in a later phase.
*/

export default function Navbar({ settings }) {
  const [open, setOpen] = useState(false);

  const companyName = settings?.company_name || "Constructify";
  const logoIcon = settings?.logo_icon || "bi-buildings";
  const phone = settings?.phone || "+1 (555) 234-6789";
  const ctaText = settings?.cta_text || "Get Estimate";
  const ctaLink = settings?.cta_link || "#";

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        <a href="#home" className="brand">
          <i className={`bi ${logoIcon}`}></i>
          <span>{companyName}</span>
        </a>

        <button
          className="nav-toggle d-lg-none"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <i className="bi bi-list"></i>
        </button>

        <ul className={`nav-links ${open ? "nav-links-open" : ""}`}>
          <li><a href="#home" onClick={() => setOpen(false)}>Home</a></li>
          <li><a href="#about" onClick={() => setOpen(false)}>About</a></li>
          <li><a href="#services" onClick={() => setOpen(false)}>Services</a></li>
          <li><a href="#projects" onClick={() => setOpen(false)}>Projects</a></li>
          <li><a href="#" onClick={() => setOpen(false)}>Team</a></li>
          <li><a href="#" onClick={() => setOpen(false)}>Pages</a></li>
          <li><a href="#" onClick={() => setOpen(false)}>Contact</a></li>
        </ul>

        <div className="navbar-right">
          <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="nav-phone">
            <i className="bi bi-telephone"></i> {phone}
          </a>
          <a href={ctaLink} className="btn btn-accent">{ctaText}</a>
        </div>

      </div>
    </nav>
  );
}
