'use client';
import Link from 'next/link';
import { categoryList, imageSrc } from '@/lib/products';
import { useCatalog } from './useCatalog';

export default function CategoryRow() {
  const products = useCatalog();
  const categoryImage = (name: string) => imageSrc(products.find(p => p.category === name)?.image || products[0]?.image);
  return <div className="category-row">
    {categoryList(products).map(([name, desc]) => <Link className="category-card" key={name} href={`/?category=${encodeURIComponent(name)}`}>
      <img src={categoryImage(name)} alt="" />
      <b>{name}</b><span>{desc}</span>
    </Link>)}
  </div>
}
