import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-shell">

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="admin-content">

        <Topbar
          onMenu={() => setSidebarOpen(true)}
        />

        <main className="admin-main">
          <Outlet />
        </main>

      </div>

    </div>
  );
}