import { Hero } from '@/components/marketing/hero';
import { Features } from '@/components/marketing/features';
import { Benefits } from '@/components/marketing/benefits';
import { Stats } from '@/components/marketing/stats';
import { Testimonials } from '@/components/marketing/testimonials';
import { Pricing } from '@/components/marketing/pricing';
import { Faq } from '@/components/marketing/faq';
import { Cta } from '@/components/marketing/cta';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Benefits />
      <Stats />
      <Testimonials />
      <Pricing />
      <Faq />
      <Cta />
    </>
  );
}
