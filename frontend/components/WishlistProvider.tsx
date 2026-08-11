'use client';
import { createContext,useContext,useEffect,useState } from 'react';
import { useAuth } from './AuthProvider';
const API=process.env.NEXT_PUBLIC_API_URL||'http://localhost:8000';
type WishlistCtx={ids:string[];isWishlisted:(id:string)=>boolean;toggleWishlist:(id:string)=>void};
const WishlistContext=createContext<WishlistCtx|null>(null);
export function WishlistProvider({children}:{children:React.ReactNode}){
 const {token}=useAuth();
 const [ids,setIds]=useState<string[]>([]);
 const [ready,setReady]=useState(false);
 useEffect(()=>{if(!ready)return;try{localStorage.setItem('horaa-wishlist',JSON.stringify(ids));}catch{}},[ids,ready]);
 useEffect(()=>{
  if(token){
   fetch(`${API}/api/wishlist`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.ok?r.json():[]).then(d=>setIds(Array.isArray(d)?d:[])).catch(()=>{}).finally(()=>setReady(true));
  }else{
   try{const raw=localStorage.getItem('horaa-wishlist');if(raw)setIds(JSON.parse(raw)||[]);}catch{}
   setReady(true);
  }
 },[token]);
 const toggleWishlist=(id:string)=>{
  const on=!ids.includes(id);
  setIds(prev=>on?[...prev,id]:prev.filter(x=>x!==id));
  if(token){
   const opts={method:on?'POST':'DELETE',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:on?JSON.stringify({product_id:id}):undefined};
   fetch(`${API}/api/wishlist${on?'':'/'+id}`,opts).catch(()=>setIds(prev=>on?prev.filter(x=>x!==id):[...prev,id]));
  }else{
   try{const raw=localStorage.getItem('horaa-wishlist');const cur:Array<string>=raw?JSON.parse(raw):[];const next=on?[...cur,id]:cur.filter(x=>x!==id);localStorage.setItem('horaa-wishlist',JSON.stringify(next));}catch{}
  }
 };
 return <WishlistContext.Provider value={{ids,isWishlisted:(id)=>ids.includes(id),toggleWishlist}}>{children}</WishlistContext.Provider>;
}
export function useWishlist(){const c=useContext(WishlistContext);if(!c)throw new Error('useWishlist must be inside WishlistProvider');return c;}
