import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import "./App.css";

/*
Single route for now — the video only shows one scrolling page
(Home/About/Services/Projects as anchors on it). react-router is
wired up so Team / Pages / Contact can each become a real <Route>
later without restructuring the app.
*/

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
