import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Collection } from './components/Collection';
import { BouquetModal } from './components/BouquetModal';
import { Cart, Toasts } from './components/Cart';
import { About, Delivery, Faq, Footer, HowTo, Moments, Reviews } from './components/Sections';
import { FinaleScene, Lookbook, Marquee } from './components/Scenes';
import { marquees } from './config/content';
import { StoreProvider } from './store';
import { useRevealSystem } from './hooks/useRevealSystem';

function Page() {
  useRevealSystem();
  return (
    <>
      <a className="skip" href="#collection">
        Перейти к каталогу
      </a>
      <div className="progress" aria-hidden="true" />
      <Header />
      <main>
        <Hero />
        <Lookbook />
        <Collection />
        <Marquee words={marquees[0].words} photo={marquees[0].photo} />
        <Moments />
        <HowTo />
        <About />
        <Delivery />
        <Marquee words={marquees[1].words} reverse />
        <Reviews />
        <Faq />
        <FinaleScene />
      </main>
      <Footer />
      <BouquetModal />
      <Cart />
      <Toasts />
    </>
  );
}

export function App() {
  return (
    <StoreProvider>
      <Page />
    </StoreProvider>
  );
}
