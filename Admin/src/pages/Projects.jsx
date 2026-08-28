import React, { useEffect, useState } from 'react';
import { projectsApi, categoriesApi } from '../api/adminApi';

const IMAGE_BASE = 'http://localhost/construction-portfolio/uploads';

const emptyForm = {
  category_id: '',
  title: '',
  description: '',
  display_order: 0,
};

export default function Projects() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);

  /* =========================
     PROJECT MODAL
  ========================= */

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [modalSaving, setModalSaving] = useState(false);

  /* =========================
     IMAGE
  ========================= */

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  /* =========================
     DELETE
  ========================= */

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');

    try {
      const [projectList, categoryList] = await Promise.all([
        projectsApi.list(),
        categoriesApi.list(),
      ]);

      setProjects(projectList || []);
      setCategories(categoryList || []);
    } catch (err) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     ADD PROJECT
  ========================= */

  function openAddModal() {
    setEditingId(null);
    setForm({
      ...emptyForm,
    });

    setImageFile(null);
    setImagePreview(null);

    setError('');
    setModalOpen(true);
  }

  /* =========================
     EDIT PROJECT
  ========================= */

  function openEditModal(project) {
    setEditingId(project.id);

    setForm({
      category_id: project.category_id ?? '',
      title: project.title || '',
      description: project.description || '',
      display_order: project.display_order ?? 0,
    });

    setImageFile(null);

    setImagePreview(
      project.image
        ? `${IMAGE_BASE}/${project.image}`
        : null
    );

    setError('');
    setModalOpen(true);
  }

  /* =========================
     CLOSE MODAL
  ========================= */

  function closeModal() {
    if (modalSaving) return;

    setModalOpen(false);
    setEditingId(null);

    setForm({
      ...emptyForm,
    });

    setImageFile(null);
    setImagePreview(null);
  }

  /* =========================
     FORM CHANGE
  ========================= */

  function handleFormChange(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  /* =========================
     IMAGE PICK
  ========================= */

  function handleImagePick(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setImageFile(file);

    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
  }

  /* =========================
     SAVE PROJECT
  ========================= */

  async function handleModalSave(e) {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!form.title.trim()) {
      setError('Project title is required.');
      return;
    }

    if (!form.category_id) {
      setError('Please select a category.');
      return;
    }

    setModalSaving(true);

    try {
      /*
       * IMPORTANT:
       * The current adminApi.js accepts only the project object.
       *
       * imageFile is therefore NOT sent here.
       *
       * If your PHP API supports image upload, we should
       * update adminApi.js to use FormData first.
       */

      const projectData = {
        category_id: Number(form.category_id),
        title: form.title.trim(),
        description: form.description.trim(),
        display_order: Number(form.display_order) || 0,
      };

      if (editingId) {
        await projectsApi.update(
          editingId,
          projectData
        );

        setSuccess('Project updated successfully.');
      } else {
        await projectsApi.create(
          projectData
        );

        setSuccess('Project created successfully.');
      }

      closeModal();

      await load();
    } catch (err) {
      setError(
        err.message ||
          'Failed to save the project.'
      );
    } finally {
      setModalSaving(false);
    }
  }

  /* =========================
     DELETE PROJECT
  ========================= */

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await projectsApi.remove(
        deleteTarget.id
      );

      setSuccess(
        'Project deleted successfully.'
      );

      setDeleteTarget(null);

      await load();
    } catch (err) {
      setError(
        err.message ||
          'Failed to delete project.'
      );
    } finally {
      setDeleting(false);
    }
  }

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="loading-state">
        <div
          className="spinner-border"
          role="status"
        />
        <span>Loading projects…</span>
      </div>
    );
  }

  return (
    <>
      {/* =========================
          HEADER
      ========================= */}

      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>
            Manage the project gallery shown
            on the homepage
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
          }}
        >
          <a
            href="/admin/projects/categories"
            className="admin-btn btn"
          >
            <i className="bi bi-tags me-2" />
            Categories
          </a>

          <button
            className="admin-btn btn"
            type="button"
            onClick={openAddModal}
          >
            <i className="bi bi-plus-lg me-2" />
            Add Project
          </button>
        </div>
      </div>

      {/* =========================
          ALERTS
      ========================= */}

      {error && (
        <div className="alert alert-danger p-3 mb-3">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success p-3 mb-3">
          {success}
        </div>
      )}

      {/* =========================
          PROJECT LIST
      ========================= */}

      <div className="projects-admin-grid">
        {projects.map((project) => (
          <div
            className="project-admin-card"
            key={project.id}
          >
            {/* IMAGE */}

            <div className="project-admin-image">
              {project.image ? (
                <img
                  src={`${IMAGE_BASE}/${project.image}`}
                  alt={project.title}
                />
              ) : (
                <i className="bi bi-image" />
              )}
            </div>

            {/* BODY */}

            <div className="project-admin-body">

              <span className="project-badge">
                {project.category_name ||
                  'Uncategorized'}
              </span>

              <h3>
                {project.title}
              </h3>

              <p>
                {project.description ||
                  'No description'}
              </p>

              <div className="project-meta">
                <span>
                  <i className="bi bi-sort-numeric-down me-1" />
                  Order{' '}
                  {project.display_order ?? 0}
                </span>
              </div>

              {/* ACTIONS */}

              <div className="project-card-actions">

                <button
                  type="button"
                  className="btn-icon"
                  onClick={() =>
                    openEditModal(project)
                  }
                  title="Edit"
                >
                  <i className="bi bi-pencil" />
                </button>

                <button
                  type="button"
                  className="btn-icon btn-danger"
                  onClick={() =>
                    setDeleteTarget(project)
                  }
                  title="Delete"
                >
                  <i className="bi bi-trash" />
                </button>

              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="empty-state">
            No projects yet.
          </div>
        )}
      </div>

      {/* =========================
          ADD / EDIT MODAL
      ========================= */}

      {modalOpen && (
        <div
          className="modal-backdrop-custom"
          onClick={closeModal}
        >
          <div
            className="confirm-modal"
            style={{
              width: 'min(560px, 100%)',
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="card-heading">
              <h3>
                {editingId
                  ? 'Edit Project'
                  : 'Add Project'}
              </h3>
            </div>

            <form
              onSubmit={handleModalSave}
            >
              <div className="row g-3">

                {/* TITLE */}

                <div className="col-12">
                  <label className="form-label">
                    Title
                  </label>

                  <input
                    className="form-input form-control"
                    name="title"
                    value={form.title}
                    onChange={
                      handleFormChange
                    }
                    required
                  />
                </div>

                {/* CATEGORY */}

                <div className="col-md-8">
                  <label className="form-label">
                    Category
                  </label>

                  <select
                    className="form-input form-control form-select"
                    name="category_id"
                    value={
                      form.category_id
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                  >
                    <option value="">
                      Select category…
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* ORDER */}

                <div className="col-md-4">
                  <label className="form-label">
                    Order
                  </label>

                  <input
                    className="form-input form-control"
                    type="number"
                    name="display_order"
                    value={
                      form.display_order
                    }
                    onChange={
                      handleFormChange
                    }
                  />
                </div>

                {/* DESCRIPTION */}

                <div className="col-12">
                  <label className="form-label">
                    Description
                  </label>

                  <textarea
                    className="form-input form-control"
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleFormChange
                    }
                    rows="4"
                  />
                </div>

                {/* IMAGE */}

                <div className="col-12">
                  <label className="form-label">
                    Image
                  </label>

                  <div>
                    {imagePreview ? (
                      <img
                        className="project-form-preview mb-2"
                        src={imagePreview}
                        alt="Project preview"
                      />
                    ) : (
                      <div className="image-placeholder compact mb-2">
                        <i className="bi bi-image" />
                      </div>
                    )}

                    <label
                      className="admin-btn btn btn-sm mb-0"
                      style={{
                        cursor: 'pointer',
                      }}
                    >
                      <i className="bi bi-upload me-2" />
                      Choose Image

                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={
                          handleImagePick
                        }
                      />
                    </label>
                  </div>

                  {!imageFile && (
                    <small className="text-muted d-block mt-2">
                      Image upload requires the
                      upload method in adminApi.js.
                    </small>
                  )}
                </div>
              </div>

              {/* ACTIONS */}

              <div className="form-actions-modern">

                <button
                  className="admin-btn btn"
                  type="submit"
                  disabled={modalSaving}
                >
                  {modalSaving
                    ? 'Saving…'
                    : editingId
                    ? 'Save Changes'
                    : 'Create Project'}
                </button>

                <button
                  className="btn-icon"
                  type="button"
                  onClick={closeModal}
                  disabled={modalSaving}
                  style={{
                    width: 'auto',
                    padding: '0 16px',
                  }}
                >
                  Cancel
                </button>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================
          DELETE MODAL
      ========================= */}

      {deleteTarget && (
        <div
          className="modal-backdrop-custom"
          onClick={() =>
            setDeleteTarget(null)
          }
        >
          <div
            className="confirm-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="confirm-icon">
              <i className="bi bi-exclamation-triangle" />
            </div>

            <h3>
              Delete "{deleteTarget.title}"?
            </h3>

            <p>
              This will permanently remove
              the project. This can't be
              undone.
            </p>

            <div className="form-actions-modern">

              <button
                className="admin-btn btn"
                style={{
                  background:
                    'var(--danger)',
                }}
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting
                  ? 'Deleting…'
                  : 'Delete Project'}
              </button>

              <button
                className="btn-icon"
                onClick={() =>
                  setDeleteTarget(null)
                }
                disabled={deleting}
                style={{
                  width: 'auto',
                  padding: '0 16px',
                }}
              >
                Cancel
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}