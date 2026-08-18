// Import React hooks for effects, memoized values, and state.
import React, { useEffect, useMemo, useState } from "react";

// Import the API function that gets projects from the backend.
import { getProjects } from "../api/api";

// Import the lightbox component for viewing project images.
import ProjectLightbox from "./ProjectLightbox";

export default function Projects() {

  // Store the projects data received from the API.
  const [data, setData] = useState(null);

  // Store the currently selected project category.
  const [activeFilter, setActiveFilter] = useState("all");

  // Store the selected project index for the lightbox.
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Fetch projects when the component loads.
  useEffect(() => {
    getProjects().then(setData).catch(() => {});
  }, []);

  // Create the list of projects based on the selected category.
  const filtered = useMemo(() => {
    if (!data) return [];

    // Show all projects when "all" is selected.
    if (activeFilter === "all") return data.projects;

    // Otherwise, show only projects matching the selected category.
    return data.projects.filter(
      (p) => p.category_slug === activeFilter
    );
  }, [data, activeFilter]);

  // Show an empty section while the data is loading.
  if (!data) return <section id="projects" className="projects" />;

  return (
    <section id="projects" className="projects">

      {/* Main container for the Projects section. */}
      <div className="container">

        {/* Section title and subtitle. */}
        <div className="section-heading text-center">
          <h2 className="section-title">{data.title}</h2>
          <p className="section-desc">{data.subtitle}</p>
        </div>

        {/* Category filter buttons. */}
        <div className="filter-tabs">

          {/* Button that shows all projects. */}
          <button
            className={`filter-tab ${
              activeFilter === "all" ? "filter-tab-active" : ""
            }`}
            onClick={() => setActiveFilter("all")}
          >
            All Projects
          </button>

          {/* Create a button for each project category. */}
          {data.categories.map((c) => (
            <button
              key={c.id}
              className={`filter-tab ${
                activeFilter === c.slug ? "filter-tab-active" : ""
              }`}
              onClick={() => setActiveFilter(c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Display the filtered projects in a grid. */}
        <div className="projects-grid">

          {filtered.map((p, i) => (
            <div
              className="project-card"
              key={p.id}

              // Open the lightbox with the clicked project's index.
              onClick={() => setLightboxIndex(i)}
            >

              {/* Project image loaded from the images folder. */}
              <img
                src={`/images/${p.image}`}
                alt={p.title}
              />

              {/* Overlay containing project information. */}
              <div className="project-overlay">

                {/* Project category. */}
                <span className="project-category">
                  {p.category_name}
                </span>

                {/* Project title. */}
                <h4>{p.title}</h4>

                {/* Project description. */}
                <p>{p.description}</p>

              </div>
            </div>
          ))}

        </div>
      </div>

      {/* 
        Only show the lightbox when a project has been selected.
        The filtered projects are passed so navigation stays
        within the current category.
      */}
      {lightboxIndex !== null && (
        <ProjectLightbox
          projects={filtered}
          index={lightboxIndex}

          // Close the lightbox.
          onClose={() => setLightboxIndex(null)}

          // Change the selected project.
          onNavigate={setLightboxIndex}
        />
      )}

    </section>
  );
}