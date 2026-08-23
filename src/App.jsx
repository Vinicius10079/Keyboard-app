import { useState, useEffect } from 'react';
import './App.css';
import ProductCard from './components/ProductCard';

import analogBanner from './assets/banners/banner_analog.jpg';
import fmBanner from './assets/banners/banner_fm.jpg';
import acousticBanner from './assets/banners/banner_acoustic.jpg';
import otherBanner from './assets/banners/banner_others.jpg';

const defaultProducts = [
  {
    id: 'analogico',
    name: 'JSP1 Analog',
    image: analogBanner,
    link: 'C:\\Program Files\\Surge Synth Team\\Surge XT\\Surge XT.exe'
  },
  {
    id: 'fm',
    name: 'JSP1 FM',
    image: fmBanner,
    link: 'C:\\Program Files\\Dexed\\Dexed.exe'
  },
  {
    id: 'acustico',
    name: 'JSP1 Acoustic',
    image: acousticBanner,
    link: 'C:\\Program Files\\Decent Sampler\\DecentSampler.exe'
  },
  {
    id: 'others',
    name: 'JSP1 Others',
    image: otherBanner,
    link: 'C:\\Program Files\\discoDSP\\OB-Xd 3.exe'
  },
];

function App() {
  const [products, setProducts] = useState(defaultProducts);

  // Ao iniciar, mescla os caminhos salvos (se houver) com os defaults
  useEffect(() => {
    async function loadSavedLinks() {
      const savedConfig = await window.electronAPI.getConfig();
      setProducts((prev) =>
        prev.map((product) =>
          savedConfig[product.id]
            ? { ...product, link: savedConfig[product.id] }
            : product
        )
      );
    }
    loadSavedLinks();
  }, []);

  const handleLinkChange = (id, newLink) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, link: newLink } : product
      )
    );
  };

  return (
    <main className="app">
      <header>
        <h1>JPS</h1>
      </header>
      
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          image={product.image}
          link={product.link}
          onLinkChange={handleLinkChange}
        />
      ))}
      <br/>
    </main>
  );
}

export default App;
