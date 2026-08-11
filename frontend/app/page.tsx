import Link from 'next/link';
import CategoryRow from '@/components/CategoryRow';
import ProductCard from '@/components/ProductCard';
import FlashDeals from '@/components/FlashDeals';
import { money, fetchCatalog, fetchBanners, imageSrc } from '@/lib/products';

export default async function Home({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const [catalog, banners] = await Promise.all([fetchCatalog(), fetchBanners()]);
  const list = category ? catalog.filter(p => p.category === category) : catalog;
  return <main>
    <div className="container">
      <section className="hero">
        <video className="hero-video" autoPlay muted loop playsInline src="/assets/hero.mp4"/>
        <div className="hero-content">
          <div className="eyebrow">Nepal • PC Hardware & Electronics</div>
          <h1>Power Your<br/>Next Build</h1>
          <p>Premium hardware. Unmatched performance. Build, upgrade and customize your next PC with Horaa Store.</p>
          <div className="actions"><Link className="primary" href="#products">Explore Products</Link><Link className="secondary" href="/build-pc">Build Your PC</Link></div>
        </div>
      </section>

      <section className="trust">
        {[
          ['✦','100% Genuine','Authentic Products'],
          ['♢','Official Warranty','Trusted & Secure'],
          ['↗','Fast Delivery','Across Nepal'],
          ['◈','Secure Payments','Safe & Reliable'],
          ['⌁','24/7 Support','We’re Here']
        ].map(([a,b,c]) => <div className="trust-card" key={b}><b>{a}</b><span><strong>{b}</strong><small>{c}</small></span></div>)}
      </section>

      <section className="section">
        <div className="section-head"><h2>Explore Categories</h2><Link href="/shop">View all →</Link></div>
        <CategoryRow/>
      </section>

      <section className="section" id="products">
        <div className="section-head"><h2>{category || 'Trending Right Now'}</h2>{category ? <Link href="/">View all products →</Link> : <Link href="/shop">View all →</Link>}</div>
        <div className="product-grid">{list.map(p => <ProductCard key={p.id} product={p}/>)}</div>
      </section>

      <section className="split section">
        <div className="promo-stack">
          {banners.map(b => (
            <div className="promo" key={b.id}>
              <span className="eyebrow">{b.eyebrow}</span>
              <h2>{b.title}</h2>
              <p>{b.subtitle}</p>
              <Link className="primary" href={b.button_link || '/deals'}>{b.button_text || 'Shop Now'}</Link>
              <img src={imageSrc(b.image) || catalog[0]?.image} alt={b.title.split('\n')[0]}/>
            </div>
          ))}
        </div>
        <FlashDeals/>
      </section>

      <section className="section">
        <div className="section-head"><h2>Why Choose Horaa Store?</h2></div>
        <div className="why">
          <div>✦<br/><b>Trusted by Thousands</b></div><div>▣<br/><b>Secure Payments</b></div><div>◇<br/><b>Best Prices in Nepal</b></div><div>◉<br/><b>Premium Support</b></div>
        </div>
      </section>
    </div>
    <footer className="footer"><div className="container footer-grid"><div><div className="brand"><img className="brand-logo" src="/assets/horaa-logo-clean.png" alt="Horaa Store"/><span>HORAA STORE</span></div><p>Premium PC hardware and electronics for Nepal.</p></div><div><h4>Shop</h4><Link href="/?category=Graphics%20Cards">Graphics Cards</Link><Link href="/?category=Processors">Processors</Link><Link href="/?category=Memory">RAM</Link><Link href="/?category=Storage">Storage</Link></div><div><h4>Services</h4><Link href="/build-pc">Build PC</Link><Link href="/deals">Deals</Link><a href="#">Warranty</a><a href="#">Delivery</a></div><div><h4>Support</h4><a href="mailto:support@horaastore.com">support@horaastore.com</a><a href="tel:+9779800000000">+977 9800000000</a><p>Nepal</p></div></div></footer>
  </main>
}
