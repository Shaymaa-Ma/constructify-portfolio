import React from "react";

export default function ConfirmModal({
  show,
  title = "Confirm deletion",
  message,
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!show) return null;

  return (
    <div
      className="modal-backdrop-custom"
      onMouseDown={onCancel}
    >

      <div
        className="confirm-modal"
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >

        <div className="confirm-icon">
          <i className="bi bi-trash3" />
        </div>

        <h3>{title}</h3>

        <p>
          {message ||
            "Are you sure you want to delete this item? This action cannot be undone."}
        </p>

        <div className="d-flex gap-2 justify-content-end mt-4">

          <button
            className="btn btn-light"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? "Deleting..."
              : "Delete"}
          </button>

        </div>

      </div>

    </div>
  );
}