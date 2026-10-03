/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build plain static files (HTML/JS/CSS) into the "out" folder.
  // Works on Netlify AND is what Capacitor needs to wrap it as a mobile app.
  output: "export",

  // Next's image optimizer needs a server, which a static export doesn't have.
  images: { unoptimized: true },

  // /dashboard/ -> dashboard/index.html (more reliable inside a mobile app)
  trailingSlash: true,
};

export default nextConfig;
