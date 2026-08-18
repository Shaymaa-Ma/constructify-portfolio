import React, { useEffect, useState } from "react";
import { getSiteSettings } from "../api/api";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import About from "../components/About";
import Services from "../components/Services";
import Projects from "../components/Projects";
import Footer from "../components/Footer";

export default function Home() {
  // Store the website settings received from the database.
  const [settings, setSettings] = useState(null);

  // Fetch the website settings when the Home page loads.
  useEffect(() => {
    getSiteSettings().then(setSettings).catch(() => {});
  }, []);

  // Render all main sections of the website
  return (
    <>
      <Navbar settings={settings} />
      <Hero />
      <About />
      <Services />
      <Projects />
      <Footer settings={settings} />
    </>
  );
}