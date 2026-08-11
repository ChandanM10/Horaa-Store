'use client';
import {useEffect,useState} from 'react';
import {Product,products,fetchCatalog} from '@/lib/products';
export function useCatalog(): Product[] {
  const [list,setList]=useState<Product[]>(products);
  useEffect(()=>{let on=true;fetchCatalog().then(l=>{if(on)setList(l)}).catch(()=>{});return ()=>{on=false}},[]);
  return list;
}
