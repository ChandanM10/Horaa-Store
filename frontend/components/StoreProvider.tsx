'use client';
import { createContext,useContext,useEffect,useMemo,useState } from 'react';
import { Product } from '@/lib/products';
type CartItem=Product&{quantity:number};
type StoreContextType={cart:CartItem[];addToCart:(p:Product,q?:number)=>void;removeFromCart:(id:string)=>void;setQuantity:(id:string,quantity:number)=>void;clearCart:()=>void;cartCount:number;cartTotal:number};
const StoreContext=createContext<StoreContextType|null>(null);
export function StoreProvider({children}:{children:React.ReactNode}){
 const [cart,setCart]=useState<CartItem[]>([]); const [ready,setReady]=useState(false);
 useEffect(()=>{try{const raw=localStorage.getItem('horaa-cart');if(raw)setCart(JSON.parse(raw));}finally{setReady(true)}},[]);
 useEffect(()=>{if(!ready)return;try{localStorage.setItem('horaa-cart',JSON.stringify(cart));}catch{}},[cart,ready]);
 const value=useMemo(()=>({cart,addToCart:(p:Product,q=1)=>setCart(c=>{const found=c.find(x=>x.id===p.id);return found?c.map(x=>x.id===p.id?{...x,quantity:Math.min(x.quantity+q,p.stock)}:x):[...c,{...p,quantity:Math.min(q,p.stock)}]}),removeFromCart:(id:string)=>setCart(c=>c.filter(x=>x.id!==id)),setQuantity:(id:string,quantity:number)=>setCart(c=>quantity<=0?c.filter(x=>x.id!==id):c.map(x=>x.id===id?{...x,quantity:Math.min(quantity,x.stock)}:x)),clearCart:()=>setCart([]),cartCount:cart.reduce((a,x)=>a+x.quantity,0),cartTotal:cart.reduce((a,x)=>a+x.quantity*x.price,0)}),[cart]);
 return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useStore(){const ctx=useContext(StoreContext);if(!ctx)throw new Error('useStore must be used inside StoreProvider');return ctx;}
