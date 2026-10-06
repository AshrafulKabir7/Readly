import type { NextConfig } from 'next';

// Static export: every page is client-rendered, so the build is plain HTML/JS that any
// static host (Vercel, Netlify, GitHub Pages, Cloudflare Pages) can serve.
const nextConfig: NextConfig = { output: 'export' };

export default nextConfig;
