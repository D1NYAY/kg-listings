/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mini App вызывается напрямую - API идёт на отдельный backend
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  },
};

module.exports = nextConfig;
