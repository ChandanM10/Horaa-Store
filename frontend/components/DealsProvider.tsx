'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { Deal, fetchDeals } from '@/lib/products';

type DealsContextType = {
  deals: Deal[];
  dealOf: (id: string) => Deal | undefined;
};

const DealsContext = createContext<DealsContextType | null>(null);

export function DealsProvider({ children }: { children: React.ReactNode }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  useEffect(() => {
    let alive = true;
    fetchDeals().then((d) => { if (alive) setDeals(d); });
    return () => { alive = false; };
  }, []);
  const dealOf = (id: string) => deals.find((d) => d.id === id);
  return <DealsContext.Provider value={{ deals, dealOf }}>{children}</DealsContext.Provider>;
}

export function useDeals() {
  const ctx = useContext(DealsContext);
  if (!ctx) throw new Error('useDeals must be used inside DealsProvider');
  return ctx;
}
