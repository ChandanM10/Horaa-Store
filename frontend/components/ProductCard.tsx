'use client';

import Link from 'next/link';
import { Heart, ShoppingCart } from 'lucide-react';
import { Product, money, imageSrc } from '@/lib/products';
import { useStore } from './StoreProvider';
import { useWishlist } from './WishlistProvider';
import { useDeals } from './DealsProvider';
import Countdown from './Countdown';
import { useState } from 'react';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useStore();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { dealOf } = useDeals();
  const deal = dealOf(product.id);
  const [added, setAdded] = useState(false);
  const liked = isWishlisted(product.id);
  const price = deal ? deal.deal_price : product.price;
  const compare = deal ? product.price : product.compareAtPrice;
  const discount = deal ? deal.discount_pct : (product.compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0);
  const handleAdd = () => { addToCart(deal ? { ...product, price: deal.deal_price } : product); setAdded(true); setTimeout(() => setAdded(false), 1200); };

  return <article className="product-card">
    <div className="product-image-wrap">
      <button type="button" className={liked ? 'heart liked' : 'heart'} onClick={() => toggleWishlist(product.id)} aria-label="Wishlist"><Heart size={16} fill={liked ? 'currentColor' : 'none'}/></button>
      {discount > 0 && <span className="discount">-{discount}%</span>}
      <Link href={`/product/${product.slug}`}><img src={imageSrc(product.image)} alt={product.name}/></Link>
    </div>
    <div className="product-info">
      <small>{product.brand}{product.subcategory&&<span className="subcat"> · {product.subcategory}</span>}</small>
      <Link href={`/product/${product.slug}`}><h3>{product.name}</h3></Link>
      <p>{product.shortSpec}</p>
      {deal && <span className="deal-chip"><Countdown to={deal.ends_at}/></span>}
      <div className="rating">★ {product.rating} <span>({product.reviews})</span></div>
      <div className="price-row"><strong>{money(price)}</strong>{compare && <del>{money(compare)}</del>}</div>
      <button type="button" className={added ? 'add-btn added' : 'add-btn'} onClick={handleAdd}>{added ? 'Added ✓' : <><ShoppingCart size={15}/> Add to Cart</>}</button>
    </div>
  </article>
}
