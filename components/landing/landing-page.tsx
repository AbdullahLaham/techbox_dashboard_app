// components/landing/landing-page.tsx
import { AboutSection } from './about-section';
import { Hero } from './hero';
import { ImpactSection } from './impact-section';
import { JoinSection } from './join-section';
import { PipelineSection } from './pipeline-section';
import { ProgramsSection } from './programs-section';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import './landing.css';

// Fonts (Readex Pro, IBM Plex Sans Arabic) are self-hosted in ./fonts and declared in
// landing.css, so dev and build never depend on reaching Google Fonts.

// Without JS the reveal observers never run: show everything as is.
const NO_SCRIPT_STYLES =
  '[data-reveal],.tb-stagger,.tb-track-fill,.tb-eyebrow-line{opacity:1!important;transform:none!important}';

export function LandingPage() {
  return (
    <div className="landing-root min-h-screen overflow-x-clip bg-background font-plex text-foreground antialiased">
      <noscript>
        <style dangerouslySetInnerHTML={{ __html: NO_SCRIPT_STYLES }} />
      </noscript>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-navy-900 focus:px-5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white"
      >
        تخطَّ إلى المحتوى
      </a>

      <SiteHeader />
      <main id="main">
        <Hero />
        <AboutSection />
        <ProgramsSection />
        <PipelineSection />
        <ImpactSection />
        <JoinSection />
      </main>
      <SiteFooter />
    </div>
  );
}
