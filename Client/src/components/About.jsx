
import React, { useEffect, useState } from "react";
// Import the API function used to get About section data from the backend.
import { getAbout } from "../api/api";

// Define and export the About component
export default function About() {

  // Create a state variable called "about" to store the data received from the API
  // Initially, the value is null because the data has not been loaded yet
  const [about, setAbout] = useState(null);

  // useEffect runs after the component is rendered
  useEffect(() => {

    // Call the getAbout API function to fetch the About section data
    getAbout()

      // When the request succeeds, save the returned data in the "about" state
      .then(setAbout)

      // If an error occurs, do nothing instead of showing an error
      .catch(() => {});

  // The empty dependency array means this effect runs only once, when the component is first loaded
  }, []);

  // If the About data has not been loaded yet,
  // display an empty About section as a temporary placeholder
  if (!about) return <section id="about" className="about" />;

  // Return the complete About section
  return (

    // Main About section
    // The id allows navigation to this section using #about
    <section id="about" className="about">

      {/* Container that controls the maximum width and spacing of the section */}
      <div className="container about-grid">

        {/* Left side of the About section containing the images */}
        <div className="about-media">

          {/* 
            The image filename comes from the database
          */}
          <img
            src={`/images/${about.image_primary}`}
            alt={about.title}
            className="about-img-primary"
          />

          {/* 
            Small badge displayed over the images
            The text comes from the database
          */}
          <span className="about-badge">
            {about.overlay_badge_text}
          </span>

          {/* 
            The image filename also comes from the database
            alt is empty because this image is decorative
          */}
          <img
            src={`/images/${about.image_secondary}`}
            alt=""
            className="about-img-secondary"
          />

        </div>

        {/* Right side containing the About text and features. */}
        <div className="about-content">

          {/* 
            Small label above the main title.
            The Bootstrap icon is displayed first,
            followed by the badge text from the database.
          */}
          <span className="kicker">
            <i className="bi bi-buildings"></i>
            {about.badge_text}
          </span>

          {/* Main About section title from the database. */}
          <h2 className="section-title">
            {about.title}
          </h2>

          {/* About section description from the database. */}
          <p className="section-desc">
            {about.description}
          </p>

          {/* Container for all About features. */}
          <div className="about-features">

            {/* 
              Loop through the features received from the database.
              "f" represents the current feature.
              "i" represents its index.
            */}
            {about.features.map((f, i) => (

              // Individual feature container.
              // The index is used as the React key.
              <div className="about-feature" key={i}>

                {/* Feature icon container. */}
                <div className="feature-icon">

                  {/* 
                    Bootstrap icon.
                    The icon class is dynamically received from the database.
                  */}
                  <i className={`bi ${f.icon}`}></i>

                </div>

                {/* Container for the feature title and description. */}
                <div>

                  {/* Feature title from the database. */}
                  <h4>
                    {f.title}
                  </h4>

                  {/* Feature description from the database. */}
                  <p>
                    {f.description}
                  </p>

                </div>

              </div>
            ))}

          </div>

          {/* Container for the About section buttons. */}
          <div className="about-actions">

            {/* 
              Primary button.
              Both the link and text are loaded from the database.
            */}
            <a
              href={about.primary_btn_link}
              className="btn btn-accent"
            >
              {about.primary_btn_text}

              {/* Bootstrap arrow icon after the button text. */}
              <i className="bi bi-arrow-right"></i>
            </a>

            {/* 
              Secondary button.
              The link and text also come from the database.
            */}
            <a
              href={about.secondary_btn_link}
              className="btn btn-outline"
            >
              {about.secondary_btn_text}
            </a>

          </div>

        </div>

      </div>

    </section>
  );
}