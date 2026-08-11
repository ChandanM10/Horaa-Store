'use client';
import {useMemo,useState} from 'react';
import {categoryList,subCategories} from '@/lib/products';
import {useCatalog} from '@/components/useCatalog';
import ProductCard from '@/components/ProductCard';
export default function Shop(){
  const catalog=useCatalog();
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState('all');
  const [sub,setSub]=useState('all');
  const [sort,setSort]=useState('featured');
  const [max,setMax]=useState(150000);
  const subs=useMemo(()=>category==='all'?[]:subCategories(category,catalog),[category,catalog]);
  const list=useMemo(()=>{
    let a=catalog.filter(p=>(category==='all'||p.category===category)&&(sub==='all'||p.subcategory===sub)&&p.price<=max&&`${p.name} ${p.brand} ${p.shortSpec} ${p.subcategory||''}`.toLowerCase().includes(query.toLowerCase()));
    if(sort==='price-low')a.sort((x,y)=>x.price-y.price);
    if(sort==='price-high')a.sort((x,y)=>y.price-x.price);
    if(sort==='rating')a.sort((x,y)=>y.rating-x.rating);
    return a;
  },[catalog,query,category,sub,sort,max]);
  return <main className="container shop"><div className="shop-head"><div><div className="eyebrow">Horaa Store / Shop</div><h1>Find the right hardware.</h1><p>Genuine PC components with NPR pricing, warranty and Nepal delivery.</p></div><div className="shop-search"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search GPU, CPU, RAM..."/></div></div><div className="shop-layout"><aside className="filters"><b>Categories</b><button className={category==='all'?'active':''} onClick={()=>{setCategory('all');setSub('all')}}>All products</button>{categoryList(catalog).map(([c])=><button className={category===c?'active':''} key={c} onClick={()=>{setCategory(c);setSub('all')}}>{c}</button>)}
    {subs.length>0&&<><hr/><b>Sub-categories</b><button className={sub==='all'?'active':''} onClick={()=>setSub('all')}>All {category}</button>{subs.map(s=><button className={sub===s?'active':''} key={s} onClick={()=>setSub(s)}>{s}</button>)}</>}
    <hr/><b>Maximum price</b><input type="range" min="1000" max="150000" step="1000" value={max} onChange={e=>setMax(+e.target.value)}/><span>NPR {max.toLocaleString()}</span></aside><section><div className="results-bar"><span>{list.length} products</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="rating">Top rated</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></div><div className="product-grid">{list.map(p=><ProductCard key={p.id} product={p}/>)}</div>{!list.length&&<div className="empty"><h3>No products found</h3><p>Try another category or adjust the price filter.</p></div>}</section></div></main>;
}
