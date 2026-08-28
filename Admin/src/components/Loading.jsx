import React from "react";

export default function Loading({
  text = "Loading...",
}) {
  return (
    <div className="loading-state">

      <div
        className="spinner-border text-warning"
        role="status"
      />

      <span>{text}</span>

    </div>
  );
}