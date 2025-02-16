import '@udi/design-system/styles/globals.css';
import './styles/web.css';
import { Toolbar as CMSToolbar } from '@udi/cms/components/toolbar';
import { DesignSystemProvider } from '@udi/design-system';
import { fonts } from '@udi/design-system/lib/fonts';
import { cn } from '@udi/design-system/lib/utils';
import { Toolbar } from '@udi/feature-flags/components/toolbar';
import type { ReactNode } from 'react';
import { Footer } from './components/footer';
import { Header } from './components/header';

type RootLayoutProperties = {
  readonly children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html
    lang="en"
    className={cn(fonts, 'scroll-smooth')}
    suppressHydrationWarning
  >
    <body>
      <DesignSystemProvider>
        <Header />
        {children}
        <Footer />
      </DesignSystemProvider>
      <Toolbar />
      <CMSToolbar />
    </body>
  </html>
);

export default RootLayout;
