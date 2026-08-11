'use client';

import Link from 'next/link';
import { Search, Heart, ShoppingCart, UserRound, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useStore } from './StoreProvider';
import { useCatalog } from './useCatalog';
import { useAuth } from './AuthProvider';

export default function Header() {
  const pathname = usePathname();
  const { cartCount } = useStore();
  const { user } = useAuth();
  const products = useCatalog();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  if (pathname === '/admin') return null;
  const matches = query ? products.filter(p => `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(query.toLowerCase())).slice(0, 4) : [];

  return (
    <header className="header">
      <Link href="/" className="brand"><img className="brand-logo" src="/assets/horaa-logo-clean.png" alt="Horaa Store"/><span>HORAA STORE</span></Link>
      <nav className={open ? 'nav open' : 'nav'}>
        <Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/build-pc">Build PC</Link><Link href="/deals">Deals</Link><Link href="/about">About</Link>{user?.is_admin && <Link href="/admin">Dashboard</Link>}
      </nav>
      <div className="header-actions">
        <div className="search">
          <Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..." aria-label="Search products"/>
          {matches.length > 0 && <div className="search-results">{matches.map(p => <Link key={p.id} href={`/product/${p.slug}`} onClick={() => setQuery('')}><span>{p.name}</span><b>NPR {p.price.toLocaleString()}</b></Link>)}</div>}
        </div>
        <Link href="/wishlist" aria-label="Wishlist"><Heart size={18}/></Link>
        <Link href="/cart" className="cart-icon" aria-label="Cart"><ShoppingCart size={18}/><em>{cartCount}</em></Link>
        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X/> : <Menu/>}</button>
        <Link className="account-link" href={user?"/account":"/login"} aria-label="Account"><UserRound size={18}/></Link>
      </div>
    </header>
  );
}
