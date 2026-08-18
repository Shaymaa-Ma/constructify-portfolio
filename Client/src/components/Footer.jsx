// Import React to create the Footer component.
import React from "react";

// Define and export the Footer component.
// "settings" contains company information from the database/API.
export default function Footer({ settings }) {

  // Get the company name from settings, or use "Constructify" as a default.
  const companyName = settings?.company_name || "Constructify";

  // Get the logo icon from settings, or use the default Bootstrap icon.
  const logoIcon = settings?.logo_icon || "bi-buildings";

  // Get the phone number from settings, or use a default number.
  const phone = settings?.phone || "+1 (555) 234-6789";

  // Get the email from settings, or use a default email.
  const email = settings?.email || "info@constructify.com";

  return (
    // Main footer container.
    <footer className="site-footer">

      {/* Main footer content. */}
      <div className="container footer-main">

        {/* Company information and branding. */}
        <div className="footer-column footer-about">

          {/* Footer logo that links back to the Home section. */}
          <a href="#home" className="footer-brand">

            {/* Display the company logo icon. */}
            <i className={`bi ${logoIcon}`}></i>

            {/* Display the company name. */}
            <span>{companyName}</span>
          </a>

          {/* Short company description. */}
          <p>
            Building quality spaces with precision, passion, and purpose.
            We deliver reliable construction solutions designed to last.
          </p>
        </div>

        {/* Quick navigation links. */}
        <div className="footer-column">

          {/* Column title. */}
          <h4>Quick Links</h4>

          {/* List of website sections. */}
          <ul className="footer-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About Us</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#projects">Projects</a></li>
          </ul>
        </div>

        {/* Services navigation. */}
        <div className="footer-column">

          {/* Column title. */}
          <h4>Our Services</h4>

          {/* List of available services. */}
          <ul className="footer-links">
            <li><a href="#services">Residential Building</a></li>
            <li><a href="#services">Commercial Projects</a></li>
            <li><a href="#services">Renovation</a></li>
            <li><a href="#services">Project Management</a></li>
          </ul>
        </div>

        {/* Contact information. */}
        <div className="footer-column footer-contact-column">

          {/* Column title. */}
          <h4>Contact Us</h4>

          {/* Phone contact link. */}
          <a
            href={`tel:${phone.replace(/[^+\d]/g, "")}`}
            className="footer-contact-item"
          >
            <i className="bi bi-telephone"></i>
            <span>{phone}</span>
          </a>

          {/* Email contact link. */}
          <a
            href={`mailto:${email}`}
            className="footer-contact-item"
          >
            <i className="bi bi-envelope"></i>
            <span>{email}</span>
          </a>

          {/* Location/description contact item. */}
          <a href="#home" className="footer-contact-item">
            <i className="bi bi-geo-alt"></i>
            <span>Construction & Infrastructure</span>
          </a>
        </div>

      </div>

      {/* Bottom part of the footer. */}
      <div className="footer-bottom">

        {/* Container for copyright and social links. */}
        <div className="container footer-bottom-inner">

          {/* Copyright text with the current year. */}
          <p>
            &copy; {new Date().getFullYear()} {companyName}.
            All rights reserved.
          </p>

          {/* Social media links. */}
          <div className="footer-socials">

            {/* Facebook link. */}
            <a href="#" aria-label="Facebook">
              <i className="bi bi-facebook"></i>
            </a>

            {/* Instagram link. */}
            <a href="#" aria-label="Instagram">
              <i className="bi bi-instagram"></i>
            </a>

            {/* LinkedIn link. */}
            <a href="#" aria-label="LinkedIn">
              <i className="bi bi-linkedin"></i>
            </a>

          </div>
        </div>
      </div>

    </footer>
  );
}