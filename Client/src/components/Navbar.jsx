import React, { useEffect, useState } from "react";

/*
Home / About / Services / Projects are demonstrated in the video
scrolling to their on-page anchor when clicked, so those are real
anchor links (#home, #about, #services, #projects).

Team / Pages / Contact never had their destination shown in the
video, so per the brief they're rendered visually but go nowhere
(href="#") until that's clarified or built in a later phase.
*/

const SECTION_IDS = ["home", "about", "services", "projects"];

export default function Navbar({ settings }) {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");


  useEffect(() => {
    const sections = SECTION_IDS
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const companyName = settings?.company_name || "Constructify";
  const logoIcon = settings?.logo_icon || "bi-buildings";
  const phone = settings?.phone || "+1 (555) 234-6789";
  const ctaText = settings?.cta_text || "Get Estimate";
  const ctaLink = settings?.cta_link || "#";

  const linkClass = (id) => (activeSection === id ? "nav-link-active" : "");

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
          <li><a href="#home" className={linkClass("home")} onClick={() => setOpen(false)}>Home</a></li>
          <li><a href="#about" className={linkClass("about")} onClick={() => setOpen(false)}>About</a></li>
          <li><a href="#services" className={linkClass("services")} onClick={() => setOpen(false)}>Services</a></li>
          <li><a href="#projects" className={linkClass("projects")} onClick={() => setOpen(false)}>Projects</a></li>
          <li><a href="#" onClick={() => setOpen(false)}>Team</a></li>
          <li><a href="#" onClick={() => setOpen(false)}>Pages</a></li>
          <li><a href="#" onClick={() => setOpen(false)}>Contact</a></li>
        </ul>

        <div className="navbar-right">
          <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="nav-phone">
            <i className="bi bi-telephone"></i> {phone}
          </a>
          <a href={ctaLink} className="btn btn-accent btn-pill">{ctaText}</a>
        </div>

      </div>
    </nav>
  );
}