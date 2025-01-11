/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wdfrtqeljulkoqnllxad.supabase.co",
        port: "",
        pathname: "/**",
      },
    ],
    domains: ['fal.media'],
  },
  experimental: {
    appDir: true,
  },
};

export default nextConfig;
