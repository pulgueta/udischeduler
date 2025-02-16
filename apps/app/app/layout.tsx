import '@udi/design-system/styles/globals.css';
import { DesignSystemProvider } from '@udi/design-system';
import { fonts } from '@udi/design-system/lib/fonts';
import { Toolbar } from '@udi/feature-flags/components/toolbar';
import type { ReactNode } from 'react';

type RootLayoutProperties = {
  readonly children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html lang="en" className={fonts} suppressHydrationWarning>
    <body>
      <DesignSystemProvider>{children}</DesignSystemProvider>
      <Toolbar />
    </body>
  </html>
);

export default RootLayout;
