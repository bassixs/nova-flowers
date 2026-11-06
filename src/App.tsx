import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Collection } from './components/Collection';
import { BouquetModal } from './components/BouquetModal';
import { Cart, Toasts } from './components/Cart';
import { About, Delivery, Faq, Finale, Footer, HowTo, Moments, Reviews } from './components/Sections';
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
        <Collection />
        <Moments />
        <HowTo />
        <About />
        <Delivery />
        <Reviews />
        <Faq />
        <Finale />
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
