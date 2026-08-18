// Base URL of the PHP API
// It uses the environment variable if available,
// otherwise it uses the local WAMP server URL.
const API_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost/construction-portfolio/Server/api";

//reusable function for sending GET requests to the API
async function get(endpoint) {

  // send a request to the selected API endpoint
  const res = await fetch(`${API_URL}/${endpoint}`);

  // check if the server returned an error response
  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint}`);
  }

  // convert the response from JSON into Js data
  return res.json();
}

// Get all data
export const getSiteSettings = () => get("site-settings.php");
export const getHero = () => get("hero.php");
export const getAbout = () => get("about.php");
export const getServices = () => get("services.php");
export const getProjects = () => get("projects.php");