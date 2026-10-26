/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["ffmpeg-static"],
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },
};

export default nextConfig;
