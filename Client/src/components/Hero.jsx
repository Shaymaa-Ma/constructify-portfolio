// Import React hooks: useEffect for running code after rendering,
// and useState for storing the hero data.
import React, { useEffect, useState } from "react";

// Import the API function that fetches the hero section data from the database.
import { getHero } from "../api/api";

// Define and export the Hero component.
export default function Hero() {

  // Create a state variable called "hero" to store the hero data.
  // Initially, there is no hero data, so the value is null.
  const [hero, setHero] = useState(null);

  // useEffect runs after the component is rendered.
  useEffect(() => {

    // Call the getHero API function to retrieve hero data from the backend.
    getHero()

      // When the data is successfully received, store it in the hero state.
      .then(setHero)

      // If an error happens, keep the hero state unchanged.
      .catch(() => {});

  // The empty dependency array means this effect runs only once
  // when the Hero component is first loaded.
  }, []);

  // If the hero data has not been loaded yet,
  // return an empty hero section as a temporary placeholder.
  if (!hero) return <section id="home" className="hero" />;

  // Check if the database contains a background image.
  // If it exists, create the image path.
  // Otherwise, set bgUrl to null.
  const bgUrl = hero.background_image
    ? `/images/${hero.background_image}`
    : null;

  // Return the complete Hero section.
  return (

    // Main hero section.
    // The id allows the navbar to link to this section using #home.
    // The className applies the hero CSS styles.
    // If there is a background image, apply it using inline CSS.
    <section
      id="home"
      className="hero"
      style={
        bgUrl
          ? { backgroundImage: `url(${bgUrl})` }
          : undefined
      }
    >

      {/* Dark/transparent overlay placed above the background image. */}
      <div className="hero-overlay"></div>

      {/* Container that holds the main hero content. */}
      <div className="hero-content">

        {/* Small badge displayed above the main title. */}
        <span className="badge-pill">

          {/* Bootstrap building icon. */}
          <i className="bi bi-building"></i>

          {/* Display the badge text coming from the database. */}
          {hero.badge_text}
        </span>

        {/* Main hero heading. */}
        <h1 className="hero-title">

          {/* Display the main title text from the database. */}
          {hero.title_text}

          {/* Display the highlighted part of the title. */}
          <span className="text-accent">
            {hero.title_highlight}
          </span>
        </h1>

        {/* Display the hero description/subtitle from the database. */}
        <p className="hero-subtitle">
          {hero.subtitle}
        </p>

        {/* Container for the two hero buttons. */}
        <div className="hero-actions">

          {/* Primary button.
              The link and button text come from the database. */}
          <a
            href={hero.primary_btn_link}
            className="btn btn-accent"
          >
            {hero.primary_btn_text}
          </a>

          {/* Secondary button.
              The link and button text also come from the database. */}
          <a
            href={hero.secondary_btn_link}
            className="btn btn-outline-light"
          >

            {/* Display the secondary button text. */}
            {hero.secondary_btn_text}

            {/* Bootstrap arrow icon displayed after the text. */}
            <i className="bi bi-arrow-right"></i>
          </a>

        </div>
      </div>

      {/* 
        Only display the counters section if:
        1. hero.counters exists
        2. hero.counters contains at least one counter
      */}
      {hero.counters && hero.counters.length > 0 && (

        // Container for all hero counters.
        <div className="hero-counters">

          {/* 
            Loop through every counter received from the database.
            "c" represents the current counter.
            "i" represents its index.
          */}
          {hero.counters.map((c, i) => (

            // Individual counter container.
            // The index is used as the React key.
            <div className="counter" key={i}>

              {/* Display the counter value, such as "15+" or "250+". */}
              <div className="counter-value">
                {c.value}
              </div>

              {/* Display the counter label, such as "Projects Completed". */}
              <div className="counter-label">
                {c.label}
              </div>

            </div>
          ))}

        </div>
      )}

    </section>
  );
}