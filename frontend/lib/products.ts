export type Compatibility = {
  socket?: string;
  memoryType?: string;
  formFactor?: string;
  wattage?: number;
  gpuLengthMm?: number;
  cpuCoolerHeightMm?: number;
};

export type Product = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviews: number;
  stock: number;
  image: string;
  shortSpec: string;
  description?: string;
  images?: string[];
  specs: Record<string, string>;
  compatibility?: Compatibility;
};

export const products: Product[] = [
  { id:'gpu-4070ti', slug:'nvidia-geforce-rtx-4070-ti', brand:'NVIDIA', name:'NVIDIA GeForce RTX 4070 Ti', category:'Graphics Cards', price:109999, compareAtPrice:119999, rating:4.8, reviews:128, stock:7, image:'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=85', shortSpec:'12GB GDDR6X', specs:{Memory:'12GB GDDR6X','Boost Clock':'2610 MHz',Interface:'PCIe 4.0','Ray Tracing':'Yes','Recommended PSU':'700W'}, compatibility:{wattage:285,gpuLengthMm:305}},
  { id:'cpu-7800x3d', slug:'amd-ryzen-7-7800x3d', brand:'AMD', name:'AMD Ryzen 7 7800X3D', category:'Processors', price:54999, rating:4.9, reviews:95, stock:11, image:'https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=1200&q=85', shortSpec:'8-Core, 16-Thread', specs:{Cores:'8',Threads:'16',Socket:'AM5',Boost:'5.0 GHz',Cache:'104MB'}, compatibility:{socket:'AM5',wattage:120}},
  { id:'ram-vengeance', slug:'corsair-vengeance-32gb-ddr5', brand:'Corsair', name:'Corsair Vengeance 32GB', category:'Memory', price:21999, compareAtPrice:24999, rating:4.8, reviews:64, stock:18, image:'https://images.unsplash.com/photo-1592664474505-51c549ad15c5?auto=format&fit=crop&w=1200&q=85', shortSpec:'32GB DDR5 6000MHz', specs:{Capacity:'32GB',Type:'DDR5',Speed:'6000MHz',Kit:'2 x 16GB'}, compatibility:{memoryType:'DDR5'}},
  { id:'ssd-990pro', slug:'samsung-990-pro-1tb', brand:'Samsung', name:'Samsung 990 PRO 1TB', category:'Storage', price:13999, compareAtPrice:15999, rating:4.9, reviews:87, stock:22, image:'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1200&q=85', shortSpec:'PCIe 4.0 NVMe', specs:{Capacity:'1TB',Interface:'PCIe 4.0 NVMe',Read:'7450 MB/s',Write:'6900 MB/s'}},
  { id:'mobo-b650', slug:'asus-rog-strix-b650e-f', brand:'ASUS', name:'ASUS ROG Strix B650E-F', category:'Motherboards', price:34999, rating:4.7, reviews:78, stock:5, image:'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85', shortSpec:'AM5 • DDR5 • ATX', specs:{Socket:'AM5',Memory:'DDR5','Form Factor':'ATX',WiFi:'WiFi 6E'}, compatibility:{socket:'AM5',memoryType:'DDR5',formFactor:'ATX'}},
  { id:'psu-850', slug:'corsair-rm850x-850w', brand:'Corsair', name:'Corsair RM850x 850W', category:'Power Supplies', price:16999, rating:4.8, reviews:51, stock:9, image:'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=1200&q=85', shortSpec:'80+ Gold Modular', specs:{Power:'850W',Efficiency:'80+ Gold',Modular:'Fully Modular'}, compatibility:{wattage:850}},
  { id:'case-airflow', slug:'horaa-airflow-atx-case', brand:'Horaa', name:'Horaa Airflow ATX Case', category:'PC Cases', price:12999, rating:4.6, reviews:31, stock:14, image:'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=85', shortSpec:'ATX • 360mm GPU', specs:{'Form Factor':'ATX','GPU Clearance':'360mm','CPU Cooler':'170mm','Fans':'4 included'}, compatibility:{formFactor:'ATX',gpuLengthMm:360,cpuCoolerHeightMm:170}},
  { id:'cooler-kraken', slug:'nzxt-kraken-240', brand:'NZXT', name:'NZXT Kraken 240', category:'Cooling', price:32999, rating:4.7, reviews:44, stock:8, image:'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7b3?auto=format&fit=crop&w=1200&q=85', shortSpec:'240mm AIO', specs:{Radiator:'240mm',Socket:'AM5 / AM4 / LGA1700',Display:'LCD'}, compatibility:{socket:'AM5'}}
];

const categoryTaglines: Record<string,string> = {'Graphics Cards':'High performance','Processors':'Power your system','Motherboards':'Built to perform','Memory':'Speed & stability','Storage':'Blazing fast','Power Supplies':'Stable & efficient','PC Cases':'Build in style','Cooling':'Keep it cool','Electronics':'Everyday tech & gadgets'};
export const categories: [string,string][] = Object.keys(categoryTaglines).map(k=>[k,categoryTaglines[k]]);
export const categoryList = (list: Product[]): [string,string][] => {
  const counts: Record<string,number> = {};
  const order: string[] = [];
  for (const p of list) {
    if (!counts[p.category]) { counts[p.category] = 0; order.push(p.category); }
    counts[p.category] += 1;
  }
  for (const [c] of categories) {
    if (!order.includes(c)) order.push(c);
  }
  return order.map(c => [c, categoryTaglines[c] || `${counts[c]} products`]);
};
export const subCategorySeeds: Record<string,string[]> = {'Electronics':['Phones','Headphones','AirPods','Video Player','Other']};
export const subCategories = (category:string, list: {category:string;subcategory?:string}[]): string[] => {
  const set = new Set<string>(subCategorySeeds[category] || []);
  for (const p of list) {
    if (p.category === category && p.subcategory) set.add(p.subcategory);
  }
  return Array.from(set);
};
export const money = (n:number) => new Intl.NumberFormat('en-NP',{style:'currency',currency:'NPR',maximumFractionDigits:0}).format(n).replace('NPR','NPR');

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
let catalogCache: Product[] | null = null;
let catalogInflight: Promise<Product[]> | null = null;

export const imageSrc = (u?: string) => (u ? (u.startsWith('/') ? `${API}${u}` : u) : undefined);

const mapProduct = (p: any): Product => ({
  ...p,
  compareAtPrice: p.compare_at_price,
  shortSpec: p.short_spec || '',
  description: p.description || '',
  images: Array.isArray(p.images) ? p.images : [p.image].filter(Boolean),
  image: (Array.isArray(p.images) && p.images[0]) || p.image,
  compatibility: p.compatibility || {},
});

export function fetchCatalog(): Promise<Product[]> {
  if (catalogCache) return Promise.resolve(catalogCache);
  if (!catalogInflight) {
    catalogInflight = fetch(`${API}/api/products`)
      .then((r) => { if (!r.ok) throw new Error('catalog'); return r.json(); })
      .then((list) => { catalogCache = list.map(mapProduct); return catalogCache as Product[]; })
      .catch(() => { catalogCache = products; return products; });
  }
  return catalogInflight;
}

export type Deal = Product & { deal_price: number; ends_at: string; discount_pct: number };
let dealsCache: Deal[] | null = null;
let dealsInflight: Promise<Deal[]> | null = null;

export function fetchDeals(): Promise<Deal[]> {
  if (dealsCache) return Promise.resolve(dealsCache);
  if (!dealsInflight) {
    dealsInflight = fetch(`${API}/api/deals`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => { dealsCache = (Array.isArray(list) ? list : []).map(mapProduct) as Deal[]; return dealsCache as Deal[]; })
      .catch(() => { dealsCache = []; return dealsCache as Deal[]; });
  }
  return dealsInflight;
}

export type TeamMember = { id:string; name:string; role:string; bio:string; quote:string; photo:string; is_founder:boolean|number; sort_order:number };

export function fetchTeam(): Promise<TeamMember[]> {
  return fetch(`${API}/api/team`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : []))
    .then((list) => (Array.isArray(list) ? list : []) as TeamMember[])
    .catch(() => [] as TeamMember[]);
}

export type Banner = { id:string; eyebrow:string; title:string; subtitle:string; button_text:string; button_link:string; image:string; active:boolean };

export function fetchBanners(): Promise<Banner[]> {
  return fetch(`${API}/api/banners`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : []))
    .then((list) => (Array.isArray(list) ? list : []) as Banner[])
    .catch(() => [] as Banner[]);
}
