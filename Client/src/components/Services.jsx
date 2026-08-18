// Import React hooks for fetching and storing data.
import React, { useEffect, useState } from "react";

// Import the API function that gets services data.
import { getServices } from "../api/api";

export default function Services() {

  // Store the services data received from the API.
  const [data, setData] = useState(null);

  // Fetch the services when the component loads.
  useEffect(() => {
    getServices().then(setData).catch(() => {});
  }, []);

  // Show an empty section while the data is loading.
  if (!data) return <section id="services" className="services" />;

  return (
    // Main Services section.
    <section id="services" className="services">
      <div className="container">

        {/* Section title and description. */}
        <div className="section-heading text-center">
          <h2 className="section-title">{data.title}</h2>
          <p className="section-desc">{data.subtitle}</p>
        </div>

        {/* Main services layout. */}
        <div className="services-layout">

          {/* Featured service panel with image and button. */}
          <div className="services-panel">
            <img
              src={`/images/${data.panel_image}`}
              alt={data.panel_title}
            />

            <div className="services-panel-overlay">
              <h3>{data.panel_title}</h3>

              {/* Link to the featured service. */}
              <a
                href={data.panel_btn_link}
                className="link-accent"
              >
                {data.panel_btn_text}
                <i className="bi bi-arrow-right"></i>
              </a>
            </div>
          </div>

          {/* Grid containing all services. */}
          <div className="services-grid">

            {/* Create a card for each service. */}
            {data.services.map((s, i) => (
              <div className="service-card" key={i}>

                {/* Service icon. */}
                <div className="feature-icon">
                  <i className={`bi ${s.icon}`}></i>
                </div>

                {/* Service title and description. */}
                <h4>{s.title}</h4>
                <p>{s.description}</p>

              </div>
            ))}

          </div>
        </div>

        {/* Track record / statistics section. */}
        <div className="track-record">

          {/* Statistics text and button. */}
          <div className="track-record-text">
            <span className="kicker">
              {data.stats_badge_text}
            </span>

            <h3 className="section-title">
              {data.stats_title}
            </h3>

            <p className="section-desc">
              {data.stats_description}
            </p>

            {/* Link to more statistics/details. */}
            <a
              href={data.stats_btn_link}
              className="link-accent"
            >
              {data.stats_btn_text}
              <i className="bi bi-arrow-right"></i>
            </a>
          </div>

          {/* Display all statistics. */}
          <div className="track-record-stats">

            {/* Create a box for each statistic. */}
            {data.stats.map((c, i) => (
              <div className="stat-box" key={i}>

                {/* Statistic icon. */}
                <div className="feature-icon">
                  <i className={`bi ${c.icon}`}></i>
                </div>

                {/* Statistic value and label. */}
                <div>
                  <div className="counter-value counter-value-dark">
                    {c.value}
                  </div>

                  <div className="counter-label counter-label-dark">
                    {c.label}
                  </div>
                </div>

              </div>
            ))}

          </div>
        </div>

      </div>
    </section>
  );
}