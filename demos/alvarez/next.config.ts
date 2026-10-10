import type { NextConfig } from 'next';
import path from 'node:path';
const config: NextConfig = {
  turbopack: { root: path.resolve(__dirname) },
  output: process.env.DEMO_SERVER === '1' ? 'standalone' : 'export',
  basePath: '/demo/alvarezinmobiliaria',
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};
export default config;
