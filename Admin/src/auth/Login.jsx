import React, { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  authApi,
  setToken,
} from "../api/adminApi";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response =
        await authApi.login(form);

      if (response?.token) {
        setToken(response.token);
      }

      localStorage.setItem(
        "constructify_admin_user",
        JSON.stringify(
          response?.user || {
            email: form.email,
          }
        )
      );

      navigate("/admin/dashboard");

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-brand">

          <div className="brand-mark">
            C
          </div>

          <div>
            <strong>
              CONSTRUCTIFY
            </strong>

            <span>
              ADMIN PANEL
            </span>
          </div>

        </div>

        <h1 className="auth-title">
          Welcome back
        </h1>

        <p className="auth-subtitle mb-4">
          Sign in to manage your
          construction portfolio.
        </p>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="mb-3">

            <label className="form-label">
              Email
            </label>

            <input
              className="form-control form-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              required
            />

          </div>

          <div className="mb-4">

            <label className="form-label">
              Password
            </label>

            <input
              className="form-control form-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

          </div>

          <button
            className="btn admin-btn w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>

        </form>

        <p className="auth-footer">
          Need an account?{" "}
          <Link to="/admin/register">
            Create one
          </Link>
        </p>

      </div>

    </div>
  );
}