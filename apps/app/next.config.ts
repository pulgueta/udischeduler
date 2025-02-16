import { env } from '@/env';
import { withToolbar } from '@udi/feature-flags/lib/toolbar';
import { config, withAnalyzer } from '@udi/next-config';
import { withLogtail, withSentry } from '@udi/observability/next-config';
import type { NextConfig } from 'next';

let nextConfig: NextConfig = withToolbar(withLogtail({ ...config }));

if (env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

if (env.ANALYZE === 'true') {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;
