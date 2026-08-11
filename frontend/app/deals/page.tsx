'use client';
import Link from 'next/link';
import { useDeals } from '@/components/DealsProvider';
import ProductCard from '@/components/ProductCard';

export default function DealsPage() {
  const { deals } = useDeals();
  return <main className="container shop"><div className="shop-head"><div><div className="eyebrow">Horaa Store / Deals</div><h1>Flash Deals.</h1><p>Limited-time offers — grab them before the countdown ends.</p></div></div>
    {deals.length ? <div className="product-grid">{deals.map(p => <ProductCard key={p.id} product={p}/>)}</div> : <div className="empty"><h3>No active deals</h3><p>Check back soon — new flash deals are on the way.</p><Link className="primary" href="/shop">Browse shop</Link></div>}
  </main>;
}
