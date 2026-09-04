import React, { useEffect, useState } from 'react';
import { projectsApi, categoriesApi, getImageUrl } from '../api/adminApi';

const emptyProjectForm = {
  category_id: '',
  title: '',
  description: '',
  display_order: 0,
};

const emptyCategoryForm = {
  name: '',
  slug: '',
  display_order: 0,
};

export default function Projects() {

  const [tab, setTab] = useState('projects'); // 'projects' | 'categories'

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);

  /* =========================================================
     PROJECT MODAL
  ========================================================= */

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [modalSaving, setModalSaving] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [deleteProjectTarget, setDeleteProjectTarget] = useState(null);
  const [deletingProject, setDeletingProject] = useState(false);

  // Availability toggle in progress for a given project id.
  const [togglingProjectId, setTogglingProjectId] = useState(null);

  /* =========================================================
     CATEGORY FORM
  ========================================================= */

  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [categorySaving, setCategorySaving] = useState(false);

  // Availability toggle in progress for a given category id.
  const [togglingCategoryId, setTogglingCategoryId] = useState(null);

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

    console.log("PROJECTS:", projectList);
    console.log("CATEGORIES:", categoryList);

    setProjects(projectList || []);
    setCategories(categoryList || []);
  } catch (err) {
    console.error("LOAD ERROR:", err);
    setError(err.message || 'Failed to load projects.');
  } finally {
    setLoading(false);
  }
}

  function switchTab(next) {
    setTab(next);
    setError('');
    setSuccess('');
  }

  // is_available comes back from PHP as 1 / 0 (or possibly a
  // string "1"/"0" depending on the driver) — normalize to bool.
  function isAvailable(record) {
    return Number(record?.is_available) !== 0;
  }

  /* =========================================================
     PROJECT: ADD / EDIT MODAL
  ========================================================= */

  function openAddModal() {
    setEditingProjectId(null);
    setProjectForm(emptyProjectForm);
    setImageFile(null);
    setImagePreview(null);
    setError('');
    setModalOpen(true);
  }

  function openEditModal(project) {
    setEditingProjectId(project.id);

    setProjectForm({
      category_id: project.category_id ?? '',
      title: project.title || '',
      description: project.description || '',
      display_order: project.display_order ?? 0,
    });

    setImageFile(null);
    setImagePreview(
      project.image ? getImageUrl(project.image) : null
    );

    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    if (modalSaving) return;

    setModalOpen(false);
    setEditingProjectId(null);
    setProjectForm(emptyProjectForm);
    setImageFile(null);
    setImagePreview(null);
  }

  function handleProjectFormChange(e) {
    const { name, value } = e.target;
    setProjectForm((current) => ({ ...current, [name]: value }));
  }

  function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleModalSave(e) {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!projectForm.title.trim()) {
      setError('Project title is required.');
      return;
    }

    if (!projectForm.category_id) {
      setError('Please select a category.');
      return;
    }

    setModalSaving(true);

    try {

      const projectData = {
        category_id: Number(projectForm.category_id),
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
        display_order: Number(projectForm.display_order) || 0,
      };

      // The image file (when a new one was picked) rides along in
      // the same payload — projectsApi.create/update switch to
      // multipart automatically whenever this is a real File.
      if (imageFile) {
        projectData.image = imageFile;
      }

      if (editingProjectId) {
        await projectsApi.update(editingProjectId, projectData);
        setSuccess('Project updated successfully.');
      } else {
        await projectsApi.create(projectData);
        setSuccess('Project created successfully.');
      }

      closeModal();
      await load();

    } catch (err) {
      setError(err.message || 'Failed to save the project.');
    } finally {
      setModalSaving(false);
    }
  }

  async function confirmDeleteProject() {
    if (!deleteProjectTarget) return;

    setDeletingProject(true);
    setError('');
    setSuccess('');

    try {
      await projectsApi.remove(deleteProjectTarget.id);
      setSuccess('Project deleted successfully.');
      setDeleteProjectTarget(null);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to delete project.');
    } finally {
      setDeletingProject(false);
    }
  }

  async function toggleProjectAvailability(project) {
    setError('');
    setSuccess('');
    setTogglingProjectId(project.id);

    const makingAvailable = !isAvailable(project);

    try {
      await projectsApi.setAvailability(project.id, makingAvailable);
      setSuccess(
        makingAvailable
          ? 'Project marked available.'
          : 'Project marked unavailable.'
      );
      await load();
    } catch (err) {
      setError(err.message || 'Failed to update project availability.');
    } finally {
      setTogglingProjectId(null);
    }
  }

  /* =========================================================
     CATEGORIES
  ========================================================= */

  function startEditCategory(category) {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name || '',
      slug: category.slug || '',
      display_order: category.display_order ?? 0,
    });
    setError('');
    setSuccess('');
  }

  function resetCategoryForm() {
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
  }

  function handleCategoryFormChange(e) {
    const { name, value } = e.target;
    setCategoryForm((current) => ({ ...current, [name]: value }));
  }

  async function handleCategorySubmit(e) {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!categoryForm.name.trim()) {
      setError('Category name is required.');
      return;
    }

    setCategorySaving(true);

    try {

      const categoryData = {
        name: categoryForm.name.trim(),
        slug: categoryForm.slug.trim(),
        display_order: Number(categoryForm.display_order) || 0,
      };

      if (editingCategoryId) {
        await categoriesApi.update(editingCategoryId, categoryData);
        setSuccess('Category updated successfully.');
      } else {
        await categoriesApi.create(categoryData);
        setSuccess('Category created successfully.');
      }

      resetCategoryForm();
      await load();

    } catch (err) {
      setError(err.message || 'Failed to save category.');
    } finally {
      setCategorySaving(false);
    }
  }

  async function toggleCategoryAvailability(category) {
    setError('');
    setSuccess('');
    setTogglingCategoryId(category.id);

    const makingAvailable = !isAvailable(category);

    try {
      await categoriesApi.setAvailability(category.id, makingAvailable);
      setSuccess(
        makingAvailable
          ? 'Category marked available.'
          : 'Category marked unavailable.'
      );
      await load();
    } catch (err) {
      setError(err.message || 'Failed to update category availability.');
    } finally {
      setTogglingCategoryId(null);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner-border" role="status" />
        <span>Loading projects…</span>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>Manage the project gallery and categories shown on the homepage</p>
        </div>

        {tab === 'projects' && (
          <button className="admin-btn btn" type="button" onClick={openAddModal}>
            <i className="bi bi-plus-lg me-2" />
            Add Project
          </button>
        )}
      </div>

      {/* =====================================================
          TABS
      ====================================================== */}

      <div className="admin-nav" style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        <button
          type="button"
          className={`nav-button ${tab === 'projects' ? 'active' : ''}`}
          style={{ flex: 'none' }}
          onClick={() => switchTab('projects')}
        >
          <i className="bi bi-buildings-fill" />
          <span>Projects</span>
        </button>
        <button
          type="button"
          className={`nav-button ${tab === 'categories' ? 'active' : ''}`}
          style={{ flex: 'none' }}
          onClick={() => switchTab('categories')}
        >
          <i className="bi bi-tags-fill" />
          <span>Categories</span>
        </button>
      </div>

      {error && <div className="alert alert-danger p-3 mb-3">{error}</div>}
      {success && <div className="alert alert-success p-3 mb-3">{success}</div>}

      {/* =====================================================
          PROJECTS TAB
      ====================================================== */}

      {tab === 'projects' && (
        <>
          <div className="projects-admin-grid">
            {projects.map((project) => {
              const available = isAvailable(project);
              const toggling = togglingProjectId === project.id;

              return (
                <div
                  className="project-admin-card"
                  key={project.id}
                  style={!available ? { opacity: 0.6 } : undefined}
                >
                  <div className="project-admin-image">
                    {project.image ? (
                      <img src={getImageUrl(project.image)} alt={project.title} />
                    ) : (
                      <i className="bi bi-image" />
                    )}
                  </div>

                  <div className="project-admin-body">
                    <span className="project-badge">
                      {project.category_name || 'Uncategorized'}
                    </span>

                    {!available && (
                      <span className="project-badge" style={{ background: 'var(--danger)', marginLeft: 6 }}>
                        Unavailable
                      </span>
                    )}

                    <h3>{project.title}</h3>
                    <p>{project.description || 'No description'}</p>

                    <div className="project-meta">
                      <span>
                        <i className="bi bi-sort-numeric-down me-1" />
                        Order {project.display_order ?? 0}
                      </span>
                    </div>

                    <div className="project-card-actions">
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => openEditModal(project)}
                        title="Edit"
                      >
                        <i className="bi bi-pencil" />
                      </button>

                      <button
                        type="button"
                        className={`btn-icon ${available ? '' : 'btn-danger'}`}
                        onClick={() => toggleProjectAvailability(project)}
                        disabled={toggling}
                        title={available ? 'Mark unavailable' : 'Mark available'}
                      >
                        <i className={`bi ${available ? 'bi-eye' : 'bi-eye-slash'}`} />
                      </button>

                      <button
                        type="button"
                        className="btn-icon btn-danger"
                        onClick={() => setDeleteProjectTarget(project)}
                        title="Delete"
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {projects.length === 0 && (
              <div className="empty-state">No projects yet.</div>
            )}
          </div>

          {modalOpen && (
            <div className="modal-backdrop-custom" onClick={closeModal}>
              <div
                className="confirm-modal"
                style={{ width: 'min(560px, 100%)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="card-heading">
                  <h3>{editingProjectId ? 'Edit Project' : 'Add Project'}</h3>
                </div>

                <form onSubmit={handleModalSave}>
                  <div className="row g-3">

                    <div className="col-12">
                      <label className="form-label">Title</label>
                      <input
                        className="form-input form-control"
                        name="title"
                        value={projectForm.title}
                        onChange={handleProjectFormChange}
                        required
                      />
                    </div>

                    <div className="col-md-8">
                      <label className="form-label">Category</label>
                      <select
                        className="form-input form-control form-select"
                        name="category_id"
                        value={projectForm.category_id}
                        onChange={handleProjectFormChange}
                        required
                      >
                        <option value="">Select category…</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Order</label>
                      <input
                        className="form-input form-control"
                        type="number"
                        name="display_order"
                        value={projectForm.display_order}
                        onChange={handleProjectFormChange}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-input form-control"
                        name="description"
                        value={projectForm.description}
                        onChange={handleProjectFormChange}
                        rows="4"
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Image</label>
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
                          style={{ cursor: 'pointer' }}
                        >
                          <i className="bi bi-upload me-2" />
                          {imageFile ? 'Change Image' : 'Choose Image'}
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleImagePick}
                          />
                        </label>
                      </div>
                    </div>

                  </div>

                  <div className="form-actions-modern">
                    <button className="admin-btn btn" type="submit" disabled={modalSaving}>
                      {modalSaving ? 'Saving…' : editingProjectId ? 'Save Changes' : 'Create Project'}
                    </button>

                    <button
                      className="btn-icon"
                      type="button"
                      onClick={closeModal}
                      disabled={modalSaving}
                      style={{ width: 'auto', padding: '0 16px' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {deleteProjectTarget && (
            <div className="modal-backdrop-custom" onClick={() => setDeleteProjectTarget(null)}>
              <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-icon">
                  <i className="bi bi-exclamation-triangle" />
                </div>

                <h3>Delete "{deleteProjectTarget.title}"?</h3>
                <p>This will permanently remove the project and its image. This can't be undone.</p>

                <div className="form-actions-modern">
                  <button
                    className="admin-btn btn"
                    style={{ background: 'var(--danger)' }}
                    onClick={confirmDeleteProject}
                    disabled={deletingProject}
                  >
                    {deletingProject ? 'Deleting…' : 'Delete Project'}
                  </button>

                  <button
                    className="btn-icon"
                    onClick={() => setDeleteProjectTarget(null)}
                    disabled={deletingProject}
                    style={{ width: 'auto', padding: '0 16px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* =====================================================
          CATEGORIES TAB
      ====================================================== */}

      {tab === 'categories' && (
        <div className="split-manager">

          <form className="content-card form-card" onSubmit={handleCategorySubmit}>
            <div className="card-heading">
              <h3>{editingCategoryId ? 'Edit Category' : 'Add Category'}</h3>
            </div>

            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Name</label>
                <input
                  className="form-input form-control"
                  name="name"
                  value={categoryForm.name}
                  onChange={handleCategoryFormChange}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label">Slug</label>
                <input
                  className="form-input form-control"
                  name="slug"
                  value={categoryForm.slug}
                  onChange={handleCategoryFormChange}
                  placeholder="auto-generated from name if left blank"
                />
              </div>

              <div className="col-12">
                <label className="form-label">Display Order</label>
                <input
                  className="form-input form-control"
                  type="number"
                  name="display_order"
                  value={categoryForm.display_order}
                  onChange={handleCategoryFormChange}
                />
              </div>
            </div>

            <div className="form-actions-modern">
              <button className="admin-btn btn" type="submit" disabled={categorySaving}>
                {categorySaving ? 'Saving…' : editingCategoryId ? 'Save Changes' : 'Add Category'}
              </button>

              {editingCategoryId && (
                <button
                  type="button"
                  className="btn-icon"
                  style={{ width: 'auto', padding: '0 16px' }}
                  onClick={resetCategoryForm}
                  disabled={categorySaving}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="content-card list-card">
            <div className="card-heading">
              <h3>All Categories</h3>
            </div>

            <div className="stack-list">
              {categories.map((category, index) => {
                const available = isAvailable(category);
                const toggling = togglingCategoryId === category.id;

                return (
                  <div
                    className="data-item"
                    key={category.id}
                    style={!available ? { opacity: 0.6 } : undefined}
                  >
                    <div className="category-number">{index + 1}</div>

                    <div className="data-info">
                      <strong>{category.name}</strong>
                      <span>
                        /{category.slug} · order {category.display_order ?? 0}
                        {!available && ' · Unavailable'}
                      </span>
                    </div>

                    <div className="data-actions">
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => startEditCategory(category)}
                        title="Edit"
                      >
                        <i className="bi bi-pencil" />
                      </button>

                      <button
                        type="button"
                        className={`btn-icon ${available ? '' : 'btn-danger'}`}
                        onClick={() => toggleCategoryAvailability(category)}
                        disabled={toggling}
                        title={available ? 'Mark unavailable' : 'Mark available'}
                      >
                        <i className={`bi ${available ? 'bi-eye' : 'bi-eye-slash'}`} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {categories.length === 0 && (
                <div className="empty-state">No categories yet.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}