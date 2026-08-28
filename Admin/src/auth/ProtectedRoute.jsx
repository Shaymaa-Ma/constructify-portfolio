import React from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { getToken } from "../api/adminApi";

export default function ProtectedRoute() {
  const location = useLocation();

  const token = getToken();

  const user = localStorage.getItem(
    "constructify_admin_user"
  );

  if (!token && !user) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
}