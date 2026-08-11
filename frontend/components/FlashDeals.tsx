'use client';
import Link from 'next/link';
import { useDeals } from './DealsProvider';
import { Deal } from '@/lib/products';
import ProductCard from './ProductCard';
import Countdown from './Countdown';

export default function FlashDeals() {
  const { deals } = useDeals();
  if (!deals.length) return null;
  const nearest = deals.reduce((a: Deal | null, d) => (!a || d.ends_at < a.ends_at ? d : a), null);
  return <div className="deals">
    <div className="section-head"><div><h2>Flash Deals</h2><small>Limited time offers. Don't miss out!</small></div><span className="eyebrow">{nearest && <Countdown to={nearest.ends_at}/>}</span></div>
    <div className="deal-grid">{deals.slice(0, 4).map(p => <ProductCard key={p.id} product={p}/>)}</div>
    <Link className="deal-link" href="/deals">View all deals →</Link>
  </div>;
}
