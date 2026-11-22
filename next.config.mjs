/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.1.230', '192.168.1.241', '10.255.255.172', '192.168.1.67'],
  serverExternalPackages: ['@prisma/client', 'prisma', 'tesseract.js', 'better-sqlite3'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
