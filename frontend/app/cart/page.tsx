'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { useStore } from '@/components/StoreProvider';
import { money } from '@/lib/products';

export default function CartPage() {
  const {cart, cartTotal, setQuantity, removeFromCart} = useStore();
  return <main className="container cart-page">
    <h1>Your Cart</h1>
    {cart.length===0 ? <div className="cart-box empty"><h2>Your cart is empty</h2><p>Add some hardware to start your build.</p><Link className="primary" href="/">Continue Shopping</Link></div> :
    <div className="cart-layout">
      <div className="cart-box">{cart.map(item=><div className="cart-item" key={item.id}>
        <img src={item.image} alt={item.name}/><div><h3>{item.name}</h3><p>{item.shortSpec}</p><div className="cart-controls"><button onClick={()=>setQuantity(item.id,item.quantity-1)}>-</button><b>{item.quantity}</b><button onClick={()=>setQuantity(item.id,item.quantity+1)}>+</button><button onClick={()=>removeFromCart(item.id)} aria-label="Remove"><Trash2 size={14}/></button></div></div><strong>{money(item.price*item.quantity)}</strong>
      </div>)}</div>
      <aside className="summary"><h3>Order Summary</h3><div className="summary-row"><span>Subtotal</span><b>{money(cartTotal)}</b></div><div className="summary-row"><span>Delivery</span><span>Calculated at checkout</span></div><div className="summary-row summary-total"><span>Total</span><b>{money(cartTotal)}</b></div><Link className="primary full-btn" href="/checkout" style={{marginTop:15}}>Proceed to Checkout</Link><p className="notice">Payment gateways such as eSewa, Khalti, Fonepay and cards can be connected to this checkout service.</p></aside>
    </div>}
  </main>
}
