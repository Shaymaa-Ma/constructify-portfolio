import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import "./App.css";

import Login from "./auth/Login";
import Register from "./auth/Register";
import ProtectedRoute from "./auth/ProtectedRoute";

import AdminLayout from "./components/AdminLayout";

import Dashboard from "./pages/Dashboard";
import SiteSettings from "./pages/SiteSettings";
import Hero from "./pages/Hero";
import About from "./pages/About";
import Services from "./pages/Services";
import Projects from "./pages/Projects";
import ProjectCategories from "./pages/ProjectCategories";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Authentication */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/register" element={<Register />} />

        {/* Protected Admin */}
        <Route element={<ProtectedRoute />}>

          <Route path="/admin" element={<AdminLayout />}>

            <Route
              index
              element={<Navigate to="dashboard" replace />}
            />

            <Route
              path="dashboard"
              element={<Dashboard />}
            />

            <Route
              path="site-settings"
              element={<SiteSettings />}
            />

            <Route
              path="hero"
              element={<Hero />}
            />

            <Route
              path="about"
              element={<About />}
            />

            <Route
              path="services"
              element={<Services />}
            />

            <Route
              path="projects"
              element={<Projects />}
            />

            <Route
              path="project-categories"
              element={<ProjectCategories />}
            />



          </Route>

        </Route>

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to="/admin/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}