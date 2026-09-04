import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  aboutApi,
  projectsApi,
  servicesApi,
  categoriesApi,
} from '../api/adminApi';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [stats, setStats] = useState({
    projects: 0,
    services: 0,
    categories: 0,
    features: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        /*
         * Load all dashboard statistics.
         *
         * Projects     → FULL CRUD endpoint
         * Services     → services/items endpoint
         * Categories   → FULL CRUD endpoint
         * Features     → about/features endpoint
         */
        const [
          projects,
          services,
          categories,
          features,
        ] = await Promise.all([
          projectsApi.list(),
          servicesApi.items.list(),
          categoriesApi.list(),
          aboutApi.features.list(),
        ]);

        if (cancelled) return;

        setStats({
          projects: Array.isArray(projects)
            ? projects.length
            : 0,

          services: Array.isArray(services)
            ? services.length
            : 0,

          categories: Array.isArray(categories)
            ? categories.length
            : 0,

          features: Array.isArray(features)
            ? features.length
            : 0,
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message ||
              'Failed to load dashboard statistics.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);


  /*
   * Dashboard statistic cards.
   */
  const cards = [
    {
      label: 'Projects',
      value: stats.projects,
      icon: 'bi-building',
      to: '/admin/projects',
    },
    {
      label: 'Services',
      value: stats.services,
      icon: 'bi-tools',
      to: '/admin/services',
    },
    {
      label: 'Project Categories',
      value: stats.categories,
      icon: 'bi-tags',
      to: '/admin/projects/categories',
    },
    {
      label: 'About Features',
      value: stats.features,
      icon: 'bi-award',
      to: '/admin/about',
    },
  ];


  return (
    <>
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="page-header">
        <div>
          <h1>Dashboard</h1>

          <p>
            Overview of your Constructify site content
          </p>
        </div>
      </div>


      {/* =====================================================
          ERROR MESSAGE
      ====================================================== */}

      {error && (
        <div
          className="alert alert-danger p-3 mb-3"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle me-2" />
          {error}
        </div>
      )}


      {/* =====================================================
          LOADING
      ====================================================== */}

      {loading ? (
        <div className="loading-state">
          <div
            className="spinner-border"
            role="status"
            aria-hidden="true"
          />

          <span>Loading dashboard…</span>
        </div>
      ) : (
        <>
          {/* =================================================
              STATISTICS
          ================================================== */}

          <div className="dashboard-grid">
            {cards.map((card) => (
              <Link
                key={card.label}
                to={card.to}
                className="stat-card"
              >
                <div className="stat-icon">
                  <i
                    className={`bi ${card.icon}`}
                  />
                </div>

                <div className="stat-info">
                  <span>{card.label}</span>

                  <strong>
                    {card.value}
                  </strong>
                </div>

                <i className="bi bi-chevron-right stat-arrow" />
              </Link>
            ))}
          </div>


          {/* =================================================
              DASHBOARD PANELS
          ================================================== */}

          <div className="dashboard-panels">

            {/* -------------------------------------------------
                WELCOME CARD
            -------------------------------------------------- */}

            <div className="content-card welcome-card">
              <div className="welcome-icon">
                <i className="bi bi-buildings" />
              </div>

              <div>
                <h3>Welcome back</h3>

                <p>
                  Manage the Hero, About, Services,
                  Projects and Categories sections of
                  the Constructify website from here.
                  Changes are saved to the database and
                  will be reflected on the client site.
                </p>
              </div>
            </div>


            {/* -------------------------------------------------
                QUICK ACTIONS
            -------------------------------------------------- */}

            <div className="content-card quick-card">

              <div className="card-heading">
                <h3>Quick actions</h3>
              </div>


              <div className="quick-actions">

                {/* HERO */}

                <Link
                  className="quick-action"
                  to="/admin/hero"
                >
                  <i className="bi bi-layout-text-window" />

                  <span>Edit Hero</span>
                </Link>


                {/* ABOUT */}

                <Link
                  className="quick-action"
                  to="/admin/about"
                >
                  <i className="bi bi-info-circle" />

                  <span>Edit About</span>
                </Link>


                {/* SERVICES */}

                <Link
                  className="quick-action"
                  to="/admin/services"
                >
                  <i className="bi bi-tools" />

                  <span>Edit Services</span>
                </Link>


                {/* PROJECTS */}

                <Link
                  className="quick-action"
                  to="/admin/projects"
                >
                  <i className="bi bi-building" />

                  <span>Manage Projects</span>
                </Link>


                {/* CATEGORIES */}

                <Link
                  className="quick-action"
                  to="/admin/projects"
                >
                  <i className="bi bi-tags" />

                  <span>Manage Categories</span>
                </Link>


                {/* SITE SETTINGS */}

                <Link
                  className="quick-action"
                  to="/admin/site-settings"
                >
                  <i className="bi bi-gear" />

                  <span>Site Settings</span>
                </Link>

              </div>
            </div>

          </div>
        </>
      )}
    </>
  );
}