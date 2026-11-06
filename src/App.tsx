import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Collection } from './components/Collection';
import { BouquetModal } from './components/BouquetModal';
import { Cart, Toasts } from './components/Cart';
import { Delivery, Finale, Footer, Moments, Philosophy, Process, Reviews } from './components/Sections';
import { StoreProvider } from './store';
import { useRevealSystem } from './hooks/useRevealSystem';

function Page() {
  useRevealSystem();
  return (
    <>
      <a className="skip" href="#collection">
        Перейти к каталогу
      </a>
      <Header />
      <main>
        <Hero />
        <Collection />
        <Philosophy />
        <Moments />
        <Process />
        <Delivery />
        <Reviews />
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
