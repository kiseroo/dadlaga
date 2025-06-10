/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Add headers to allow KML files to be properly accessed
  async headers() {
    return [
      {
        // Matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-Requested-With, Content-Type" }
        ]
      },
      {        // Matching all KML files
        source: "/khoroo2021/:path*",
        headers: [
          { key: "Content-Type", value: "application/vnd.google-earth.kml+xml" },
          { key: "Access-Control-Allow-Origin", value: "*" }
        ]
      }
    ];
  },
  // Handle large KML files
  api: {
    responseLimit: '8mb',
  }
};

module.exports = nextConfig;
