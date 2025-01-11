/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wdfrtqeljulkoqnllxad.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fal.media",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    appDir: true,
  },
};

export default nextConfig;
