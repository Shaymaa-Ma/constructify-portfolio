import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi } from '../api/adminApi';

const emptyForm = {
  name: '',
  slug: '',
  display_order: 0,
};

export default function ProjectCategories() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [categories, setCategories] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    ...emptyForm,
  });

  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);

  useEffect(() => {
    load();
  }, []);

  /* =========================
     LOAD
  ========================= */

  async function load() {
    setLoading(true);
    setError('');

    try {
      const list =
        await categoriesApi.list();

      setCategories(list || []);
    } catch (err) {
      setError(
        err.message ||
          'Failed to load categories.'
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     START EDIT
  ========================= */

  function startEdit(category) {
    setEditingId(category.id);

    setForm({
      name: category.name || '',
      slug: category.slug || '',
      display_order:
        category.display_order ?? 0,
    });

    setError('');
    setSuccess('');
  }

  /* =========================
     RESET
  ========================= */

  function resetForm() {
    setEditingId(null);

    setForm({
      ...emptyForm,
    });

    setError('');
  }

  /* =========================
     CHANGE
  ========================= */

  function handleChange(e) {
    const {
      name,
      value,
    } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  /* =========================
     SUBMIT
  ========================= */

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!form.name.trim()) {
      setError(
        'Category name is required.'
      );
      return;
    }

    setSaving(true);

    try {
      const categoryData = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        display_order:
          Number(form.display_order) || 0,
      };

      if (editingId) {
        await categoriesApi.update(
          editingId,
          categoryData
        );

        setSuccess(
          'Category updated successfully.'
        );
      } else {
        await categoriesApi.create(
          categoryData
        );

        setSuccess(
          'Category created successfully.'
        );
      }

      resetForm();

      await load();
    } catch (err) {
      setError(
        err.message ||
          'Failed to save category.'
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================
     DELETE
  ========================= */

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      await categoriesApi.remove(
        deleteTarget.id
      );

      setSuccess(
        'Category deleted successfully.'
      );

      setDeleteTarget(null);

      await load();
    } catch (err) {
      setError(
        err.message ||
          'Failed to delete category.'
      );

      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {/* =========================
          HEADER
      ========================= */}

      <div className="page-header">
        <div>
          <h1>Project Categories</h1>

          <p>
            Categories used to filter the
            projects gallery
          </p>
        </div>

        <Link
          className="admin-btn btn"
          to="/admin/projects"
        >
          <i className="bi bi-arrow-left me-2" />
          Back to Projects
        </Link>
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
          FORM + LIST
      ========================= */}

      <div className="split-manager">

        {/* FORM */}

        <form
          className="content-card form-card"
          onSubmit={handleSubmit}
        >
          <div className="card-heading">
            <h3>
              {editingId
                ? 'Edit Category'
                : 'Add Category'}
            </h3>
          </div>

          <div className="row g-3">

            {/* NAME */}

            <div className="col-12">
              <label className="form-label">
                Name
              </label>

              <input
                className="form-input form-control"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* SLUG */}

            <div className="col-12">
              <label className="form-label">
                Slug
              </label>

              <input
                className="form-input form-control"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="auto-generated from name if left blank"
              />
            </div>

            {/* ORDER */}

            <div className="col-12">
              <label className="form-label">
                Display Order
              </label>

              <input
                className="form-input form-control"
                type="number"
                name="display_order"
                value={
                  form.display_order
                }
                onChange={handleChange}
              />
            </div>

          </div>

          {/* ACTIONS */}

          <div className="form-actions-modern">

            <button
              className="admin-btn btn"
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Saving…'
                : editingId
                ? 'Save Changes'
                : 'Add Category'}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn-icon"
                style={{
                  width: 'auto',
                  padding: '0 16px',
                }}
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}

          </div>
        </form>

        {/* LIST */}

        <div className="content-card list-card">

          <div className="card-heading">
            <h3>All Categories</h3>
          </div>

          {loading ? (
            <div className="loading-state">
              <div
                className="spinner-border"
                role="status"
              />

              <span>
                Loading categories…
              </span>
            </div>
          ) : (
            <div className="stack-list">

              {categories.map(
                (category, index) => (
                  <div
                    className="data-item"
                    key={category.id}
                  >

                    <div className="category-number">
                      {index + 1}
                    </div>

                    <div className="data-info">

                      <strong>
                        {category.name}
                      </strong>

                      <span>
                        /{category.slug}
                        {' · '}
                        order{' '}
                        {category.display_order ??
                          0}
                      </span>

                    </div>

                    <div className="data-actions">

                      {/* EDIT */}

                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() =>
                          startEdit(
                            category
                          )
                        }
                        title="Edit"
                      >
                        <i className="bi bi-pencil" />
                      </button>

                      {/* DELETE */}

                      <button
                        type="button"
                        className="btn-icon btn-danger"
                        onClick={() =>
                          setDeleteTarget(
                            category
                          )
                        }
                        title="Delete"
                      >
                        <i className="bi bi-trash" />
                      </button>

                    </div>
                  </div>
                )
              )}

              {categories.length === 0 && (
                <div className="empty-state">
                  No categories yet.
                </div>
              )}

            </div>
          )}
        </div>
      </div>

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
              Delete "{deleteTarget.name}"?
            </h3>

            <p>
              Categories that still have
              projects assigned to them
              can't be deleted.
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
                  : 'Delete Category'}
              </button>

              <button
                type="button"
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