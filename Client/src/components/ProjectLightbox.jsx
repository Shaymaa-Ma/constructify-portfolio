// Import React and the useEffect hook.
// useEffect is used here to listen for keyboard events.
import React, { useEffect } from "react";

/*
  ProjectLightbox displays a selected project in a full-screen overlay.

  It allows the user to:
  - Close the lightbox.
  - Move to the previous project.
  - Move to the next project.
  - Use the Escape, Left Arrow, and Right Arrow keyboard keys.
*/

// Define and export the ProjectLightbox component.
// It receives projects, the current index, and functions for closing/navigating.
export default function ProjectLightbox({
  projects,
  index,
  onClose,
  onNavigate
}) {

  // Get the currently selected project using its index.
  const project = projects[index];

  // useEffect is used to add keyboard navigation.
  useEffect(() => {

    // Create a function that handles keyboard key presses.
    function handleKey(e) {

      // If the user presses Escape, close the lightbox.
      if (e.key === "Escape") onClose();

      // If the user presses the Right Arrow,
      // move to the next project.
      if (e.key === "ArrowRight") {
        onNavigate((index + 1) % projects.length);
      }

      // If the user presses the Left Arrow,
      // move to the previous project.
      if (e.key === "ArrowLeft") {
        onNavigate((index - 1 + projects.length) % projects.length);
      }
    }

    // Add the keyboard event listener to the entire browser window.
    window.addEventListener("keydown", handleKey);

    // Remove the event listener when the component is removed
    // or when one of the dependencies changes.
    return () => window.removeEventListener("keydown", handleKey);

  // Re-run the effect when the current index, project count,
  // close function, or navigation function changes.
  }, [index, projects.length, onClose, onNavigate]);

  // If there is no project at the current index,
  // do not render anything.
  if (!project) return null;

  // Return the full-screen lightbox.
  return (

    // Main lightbox overlay.
    // Clicking the background closes the lightbox.
    <div
      className="lightbox-overlay"
      onClick={onClose}
    >

      {/* Close button in the top corner. */}
      <button
        className="lightbox-close"
        onClick={onClose}
        aria-label="Close"
      >

        {/* Bootstrap X icon. */}
        <i className="bi bi-x-lg"></i>

      </button>

      {/* Previous-project arrow button. */}
      <button
        className="lightbox-arrow lightbox-arrow-left"

        // Stop the click from reaching the overlay,
        // then navigate to the previous project.
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(
            (index - 1 + projects.length) % projects.length
          );
        }}

        // Accessibility label for screen readers.
        aria-label="Previous project"
      >

        {/* Bootstrap left chevron icon. */}
        <i className="bi bi-chevron-left"></i>

      </button>

      {/* 
        Main lightbox content.
        stopPropagation prevents clicking the image/content
        from closing the lightbox.
      */}
      <div
        className="lightbox-content"
        onClick={(e) => e.stopPropagation()}
      >

        {/* 
          Display the selected project image.
          The image filename comes from the database.
        */}
        <img
          src={`/images/${project.image}`}
          alt={project.title}
        />

        {/* Display the selected project's title below the image. */}
        <div className="lightbox-caption">
          {project.title}
        </div>

      </div>

      {/* Next-project arrow button. */}
      <button
        className="lightbox-arrow lightbox-arrow-right"

        // Stop the click from closing the overlay,
        // then navigate to the next project.
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(
            (index + 1) % projects.length
          );
        }}

        // Accessibility label for screen readers.
        aria-label="Next project"
      >

        {/* Bootstrap right chevron icon. */}
        <i className="bi bi-chevron-right"></i>

      </button>

    </div>
  );
}