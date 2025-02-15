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
        hostname: "xndjwmkypyilvkyczvbj.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "fal.media",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "v3.fal.media",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "v3.fal.media",
        pathname: "/files/**",
      },
      {
        protocol: "https",
        hostname: "docs.google.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
  // Add the redirects function here
  async redirects() {
    return [
      {
        source: "/",
        destination: "/sign-in",
        permanent: false, // Use 'true' if the redirect is permanent
      },
    ];
  },
};

module.exports = nextConfig;
