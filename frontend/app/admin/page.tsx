'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {LayoutDashboard,BarChart3,Package,ShoppingBag,Settings,Search,Bell,Plus,Edit3,EyeOff,Eye,Trash2,ChevronLeft,ChevronRight,X,KeyRound,Check,Zap,Users,Megaphone} from 'lucide-react';
import {money,imageSrc,categories,subCategories} from '@/lib/products';
import {useAuth} from '@/components/AuthProvider';
import Countdown from '@/components/Countdown';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
type SpecRow = [string,string];
type Product = {id:string;name:string;category:string;subcategory?:string;brand:string;price:number;stock:number;active:number;slug?:string;compare_at_price?:number;rating?:number;reviews?:number;short_spec?:string;description?:string;images?:string[];specs?:Record<string,string>};
const blankForm = {id:'',name:'',category:'Graphics Cards',subcategory:'',brand:'',price:0,compareAtPrice:0,stock:0,active:true,shortSpec:'',description:'',images:[] as string[],specs:[['','']] as SpecRow[]};
type TeamMember = {id:string;name:string;role:string;bio:string;quote:string;photo:string;is_founder:boolean;sort_order:number};
const blankTeam: TeamMember = {id:'',name:'',role:'',bio:'',quote:'',photo:'',is_founder:false,sort_order:1};
type Banner = {id:string;eyebrow:string;title:string;subtitle:string;button_text:string;button_link:string;image:string;active:boolean};
const blankBanner: Banner = {id:'',eyebrow:'',title:'',subtitle:'',button_text:'Shop Now',button_link:'/deals',image:'',active:true};
const errMsg=(d:any,fb:string):string=>{const det=d&&d.detail;if(typeof det==='string')return det;if(Array.isArray(det))return det.map((e:any)=>typeof e?.msg==='string'?e.msg:JSON.stringify(e)).join('; ');return fb};

export default function Admin(){
  const {user,token:sessionToken,logout,updateUser,loading}=useAuth();
  const [token,setToken]=useState('');
  const [orders,setOrders]=useState<any[]>([]);
  const [products,setProducts]=useState<Product[]>([]);
  const [analytics,setAnalytics]=useState<any>(null);
  const [deals,setDeals]=useState<any[]>([]);
  const [dealModal,setDealModal]=useState<{open:boolean;editing:string;product_id:string;deal_price:string;duration_hours:string;active:boolean}>({open:false,editing:'',product_id:'',deal_price:'',duration_hours:'24',active:true});
  const [dealError,setDealError]=useState('');
  const [view,setView]=useState('inventory');
  const [error,setError]=useState('');
  const [editing,setEditing]=useState<Product|null>(null);
  const [form,setForm]=useState(blankForm);
  const [showEditor,setShowEditor]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [addingCat,setAddingCat]=useState(false);
  const [addingSub,setAddingSub]=useState(false);
  const [filter,setFilter]=useState<'all'|'active'|'hidden'|'out'>('all');
  const [q,setQ]=useState('');
  const [page,setPage]=useState(1);
  const [settingsTab,setSettingsTab]=useState('personal');
  const [profile,setProfile]=useState({firstName:(user?.name||'').split(' ')[0]||'',lastName:(user?.name||'').split(' ').slice(1).join(' '),phone:user?.phone||''});
  const [pwd,setPwd]=useState({current:'',next:'',confirm:''});
  const [settingsMsg,setSettingsMsg]=useState<{kind:string;text:string}>({kind:'',text:''});
  const [notif,setNotif]=useState({low_stock:true,new_orders:true,weekly:false});
  const [team,setTeam]=useState<TeamMember[]>([]);
  const [showTeamEditor,setShowTeamEditor]=useState(false);
  const [teamEditing,setTeamEditing]=useState<TeamMember|null>(null);
  const [teamForm,setTeamForm]=useState<TeamMember>(blankTeam);
  const [teamError,setTeamError]=useState('');
  const [teamUploading,setTeamUploading]=useState(false);
  const [banners,setBanners]=useState<Banner[]>([]);
  const [showBannerEditor,setShowBannerEditor]=useState(false);
  const [bannerEditing,setBannerEditing]=useState<Banner|null>(null);
  const [bannerForm,setBannerForm]=useState<Banner>(blankBanner);
  const [bannerError,setBannerError]=useState('');
  const [bannerUploading,setBannerUploading]=useState(false);
  const pageSize=8;

  const load=async(t:string)=>{setError('');const h={Authorization:`Bearer ${t}`};const rs=await Promise.all([fetch(`${API}/api/admin/orders`,{headers:h}),fetch(`${API}/api/admin/products`,{headers:h}),fetch(`${API}/api/admin/analytics`,{headers:h}),fetch(`${API}/api/admin/deals`,{headers:h}),fetch(`${API}/api/admin/team`,{headers:h}),fetch(`${API}/api/admin/banners`,{headers:h})]);if(rs.some(r=>!r.ok)){setError('Invalid admin token or backend unavailable.');return}setOrders(await rs[0].json());setProducts(await rs[1].json());setAnalytics(await rs[2].json());setDeals(await rs[3].json());setTeam(await rs[4].json());setBanners(await rs[5].json());sessionStorage.setItem('horaa-admin-token',t);setToken(t)};
  useEffect(()=>{const t=sessionStorage.getItem('horaa-admin-token');if(t){load(t)}else if(sessionToken&&user?.is_admin){load(sessionToken)}},[sessionToken,user]);

  const filtered=useMemo(()=>{let l=products.slice();if(filter==='active')l=l.filter(p=>p.active);if(filter==='hidden')l=l.filter(p=>!p.active);if(filter==='out')l=l.filter(p=>p.stock<=0);if(q)l=l.filter(p=>`${p.name} ${p.id} ${p.brand} ${p.category}`.toLowerCase().includes(q.toLowerCase()));return l},[products,filter,q]);
  const uniqueCats=useMemo(()=>{const s=new Set<string>([form.category]);categories.forEach(([c])=>s.add(c));products.forEach(p=>s.add(p.category));return Array.from(s).sort()},[products,form.category]);
  const subCats=useMemo(()=>form.category?subCategories(form.category,products):[],[form.category,products]);
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize));const cur=Math.min(page,pages);const pageList=filtered.slice((cur-1)*pageSize,cur*pageSize);

  const updateOrder=async(id:string,status:string)=>{await fetch(`${API}/api/admin/orders/${id}`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({status})});load(token)};
  const openNew=()=>{setEditing(null);setForm(blankForm);setError('');setShowEditor(true)};
  const startEdit=(p:Product)=>{setEditing(p);setForm({id:p.id,name:p.name,category:p.category,subcategory:p.subcategory||'',brand:p.brand,price:p.price,compareAtPrice:p.compare_at_price||0,stock:p.stock,active:!!p.active,shortSpec:p.short_spec||'',description:p.description||'',images:Array.isArray(p.images)?p.images:[],specs:Object.keys(p.specs||{}).length?Object.entries(p.specs||{}) as SpecRow[]:[['','']]});setError('');setShowEditor(true)};
  const saveProduct=async()=>{if(!form.id.trim()){setError('Product ID is required.');return}if(!form.name.trim()){setError('Product title is required.');return}if(!form.category.trim()){setError('Category is required.');return}if(!form.brand.trim()){setError('Brand is required.');return}const payload={id:form.id.trim(),name:form.name.trim(),category:form.category.trim(),subcategory:form.subcategory.trim(),brand:form.brand.trim(),price:+form.price||0,compare_at_price:+form.compareAtPrice||null,stock:+form.stock||0,active:form.active,short_spec:form.shortSpec,description:form.description,images:form.images.filter(Boolean),specs:Object.fromEntries(form.specs.filter(([k,v])=>k&&v))};const url=editing?`${API}/api/admin/products/${editing.id}`:`${API}/api/admin/products`;const r=await fetch(url,{method:editing?'PATCH':'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok){const d=await r.json().catch(()=>({}));setError(errMsg(d,'Could not save product.'));return}setShowEditor(false);setEditing(null);setAddingCat(false);setAddingSub(false);load(token)};
  const remove=async(id:string)=>{if(!confirm('Hide this product from the store?'))return;await fetch(`${API}/api/admin/products/${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});load(token)};
  const toggleActive=async(p:Product)=>{await fetch(`${API}/api/admin/products/${p.id}`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({...p,active:!p.active})});load(token)};

  const openNewDeal=()=>{setDealError('');setDealModal({open:true,editing:'',product_id:products[0]?.id||'',deal_price:'',duration_hours:'24',active:true})};
  const startEditDeal=(d:any)=>{setDealError('');setDealModal({open:true,editing:d.id,product_id:d.id,deal_price:String(d.deal_price),duration_hours:String(d.duration_hours||24),active:!!d.active})};
  const saveDeal=async()=>{const dp=+dealModal.deal_price;const dh=+dealModal.duration_hours;const prod=products.find(p=>p.id===dealModal.product_id);if(!dealModal.product_id){setDealError('Pick a product.');return}if(!dp||dp<=0){setDealError('Enter a valid deal price.');return}if(prod&&dp>=prod.price){setDealError('Deal price must be lower than the regular price.');return}if(!dh||dh<=0||dh>720){setDealError('Duration must be between 1 and 720 hours.');return}const body={product_id:dealModal.product_id,deal_price:dp,duration_hours:dh,active:dealModal.active};const url=dealModal.editing?`${API}/api/admin/deals/${dealModal.editing}`:`${API}/api/admin/deals`;const r=await fetch(url,{method:dealModal.editing?'PATCH':'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok){const d=await r.json().catch(()=>({}));setDealError(errMsg(d,'Could not save deal.'));return}setDealModal({...dealModal,open:false});load(token)};
  const toggleDeal=async(d:any)=>{await fetch(`${API}/api/admin/deals/${d.id}`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({active:!d.active})});load(token)};
  const removeDeal=async(d:any)=>{if(!confirm('Remove this flash deal?'))return;await fetch(`${API}/api/admin/deals/${d.id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});load(token)};

  const openNewTeam=()=>{setTeamEditing(null);setTeamForm(blankTeam);setTeamError('');setShowTeamEditor(true)};
  const startEditTeam=(m:TeamMember)=>{setTeamEditing(m);setTeamForm({...m,is_founder:!!m.is_founder});setTeamError('');setShowTeamEditor(true)};
  const saveTeam=async()=>{if(!teamForm.name.trim()){setTeamError('Name is required.');return}if(!teamForm.role.trim()){setTeamError('Role is required.');return}const payload={name:teamForm.name.trim(),role:teamForm.role.trim(),bio:teamForm.bio,quote:teamForm.quote,photo:teamForm.photo,is_founder:teamForm.is_founder,sort_order:teamForm.sort_order};const url=teamEditing?`${API}/api/admin/team/${teamEditing.id}`:`${API}/api/admin/team`;const r=await fetch(url,{method:teamEditing?'PATCH':'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok){const d=await r.json().catch(()=>({}));setTeamError(errMsg(d,'Could not save member.'));return}setShowTeamEditor(false);setTeamEditing(null);load(token)};
  const removeTeam=async(id:string)=>{if(!confirm('Remove this team member?'))return;await fetch(`${API}/api/admin/team/${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});load(token)};
  const uploadTeamPhoto=async(files:FileList|null)=>{if(!files||!files.length)return;setTeamUploading(true);const fd=new FormData();fd.append('file',files[0]);const r=await fetch(`${API}/api/admin/upload`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd});const d=await r.json().catch(()=>({}));setTeamUploading(false);if(r.ok&&d.url)setTeamForm({...teamForm,photo:d.url});else setTeamError(errMsg(d,'Upload failed.'))};

  const openNewBanner=()=>{setBannerError('');setBannerEditing(null);setBannerForm(blankBanner);setShowBannerEditor(true)};
  const startEditBanner=(b:Banner)=>{setBannerError('');setBannerEditing(b);setBannerForm({...b});setShowBannerEditor(true)};
  const saveBanner=async()=>{if(!bannerForm.title.trim()){setBannerError('Title is required.');return}const body={eyebrow:bannerForm.eyebrow.trim(),title:bannerForm.title,subtitle:bannerForm.subtitle,button_text:bannerForm.button_text,button_link:bannerForm.button_link,image:bannerForm.image,active:bannerForm.active};const url=bannerEditing?`${API}/api/admin/banners/${bannerEditing.id}`:`${API}/api/admin/banners`;const r=await fetch(url,{method:bannerEditing?'PATCH':'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok){const d=await r.json().catch(()=>({}));setBannerError(errMsg(d,'Could not save banner.'));return}setShowBannerEditor(false);setBannerEditing(null);load(token)};
  const toggleBanner=async(b:Banner)=>{await fetch(`${API}/api/admin/banners/${b.id}`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({...b,active:!b.active})});load(token)};
  const removeBanner=async(b:Banner)=>{if(!confirm('Remove this banner?'))return;await fetch(`${API}/api/admin/banners/${b.id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});load(token)};
  const uploadBannerImage=async(files:FileList|null)=>{if(!files||!files.length)return;setBannerUploading(true);const fd=new FormData();fd.append('file',files[0]);const r=await fetch(`${API}/api/admin/upload`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd});const d=await r.json().catch(()=>({}));setBannerUploading(false);if(r.ok&&d.url)setBannerForm({...bannerForm,image:d.url});else setBannerError(errMsg(d,'Upload failed.'))};

  const uploadFiles=async(files:FileList|null)=>{if(!files||!files.length)return;setUploading(true);for(const f of Array.from(files)){const fd=new FormData();fd.append('file',f);const r=await fetch(`${API}/api/admin/upload`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd});const d=await r.json().catch(()=>({}));if(r.ok&&d.url)setForm(prev=>({...prev,images:[...prev.images,d.url]}))}setUploading(false)};
  const moveImage=(i:number,dir:number)=>{const imgs=[...form.images];const j=i+dir;if(j<0||j>=imgs.length)return;[imgs[i],imgs[j]]=[imgs[j],imgs[i]];setForm({...form,images:imgs})};
  const setSpec=(i:number,idx:0|1,v:string)=>{const s=[...form.specs];s[i][idx]=v;setForm({...form,specs:s})};
  useEffect(()=>{if(user){const parts=(user.name||'').split(' ');setProfile({firstName:parts[0]||'',lastName:parts.slice(1).join(' '),phone:user.phone||''})}},[user?.id]);
  useEffect(()=>{try{const s=localStorage.getItem('horaa-notif');if(s)setNotif(JSON.parse(s))}catch{}},[]);
  const toggleNotif=(k:keyof typeof notif)=>{const n={...notif,[k]:!notif[k]};setNotif(n);localStorage.setItem('horaa-notif',JSON.stringify(n))};
  const saveProfile=async()=>{setSettingsMsg({kind:'',text:''});const name=`${profile.firstName} ${profile.lastName}`.trim();if(name.length<2){setSettingsMsg({kind:'err',text:'Please enter your name.'});return}const r=await fetch(`${API}/api/auth/me`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({name,phone:profile.phone||'',avatar:user?.avatar||''})});const d=await r.json().catch(()=>({}));if(!r.ok){setSettingsMsg({kind:'err',text:errMsg(d,'Could not save profile.')});return}updateUser(d);setSettingsMsg({kind:'ok',text:'Profile updated.'})};
  const changePassword=async()=>{setSettingsMsg({kind:'',text:''});if(!pwd.current||!pwd.next){setSettingsMsg({kind:'err',text:'Fill in all password fields.'});return}if(pwd.next!==pwd.confirm){setSettingsMsg({kind:'err',text:'New passwords do not match.'});return}const r=await fetch(`${API}/api/auth/change-password`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({current_password:pwd.current,new_password:pwd.next})});const d=await r.json().catch(()=>({}));if(!r.ok){setSettingsMsg({kind:'err',text:errMsg(d,'Could not change password.')});return}setPwd({current:'',next:'',confirm:''});setSettingsMsg({kind:'ok',text:'Password changed.'})};
  const uploadAvatar=async(files:FileList|null)=>{if(!files||!files.length)return;setUploading(true);const fd=new FormData();fd.append('file',files[0]);const r=await fetch(`${API}/api/admin/upload`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:fd});const d=await r.json().catch(()=>({}));setUploading(false);if(!r.ok||!d.url){setSettingsMsg({kind:'err',text:errMsg(d,'Upload failed.')});return}const up=await fetch(`${API}/api/auth/me`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({name:user?.name||'Admin',phone:user?.phone||'',avatar:d.url})});const ud=await up.json().catch(()=>({}));if(up.ok)updateUser(ud);setSettingsMsg({kind:up.ok?'ok':'err',text:up.ok?'Avatar updated.':errMsg(ud,'Could not update avatar.')})};

  if(loading)return <main className="admin-ui"><div className="au-login"><p className="au-muted">Checking session…</p></div></main>;
  if(!token)return <main className="admin-ui"><div className="au-login"><div className="au-brand au-login-brand"><img className="au-brand-logo" src="/assets/horaa-logo-clean.png" alt="HORAA"/><div><h1>HORAA STORE</h1><p>Management Portal</p></div></div><h2>Store dashboard</h2><p>Sign in with the administrator account to manage the store.</p><Link className="au-btn au-btn-primary" href="/login?admin=1">Sign in as Admin</Link>{error&&<div className="au-error">{error}</div>}</div></main>;

  const nav=[{id:'overview',icon:<LayoutDashboard size={18}/>,label:'Overview'},{id:'analysis',icon:<BarChart3 size={18}/>,label:'Analysis'},{id:'inventory',icon:<Package size={18}/>,label:'Inventory'},{id:'deals',icon:<Zap size={18}/>,label:'Deals'},{id:'banners',icon:<Megaphone size={18}/>,label:'Banners'},{id:'team',icon:<Users size={18}/>,label:'Team'},{id:'orders',icon:<ShoppingBag size={18}/>,label:'Orders'},{id:'settings',icon:<Settings size={18}/>,label:'Settings'}];

  return <main className="admin-ui">
    <aside className="au-side">
      <div className="au-brand"><img className="au-brand-logo" src="/assets/horaa-logo-clean.png" alt="HORAA"/><div><h1>HORAA STORE</h1><p>Management Portal</p></div></div>
      <nav className="au-nav">{nav.map(n=><button key={n.id} className={view===n.id?'active':''} onClick={()=>setView(n.id)}>{n.icon}<span>{n.label}</span></button>)}</nav>
      <div className="au-side-bottom">
        <div className="au-user">{user?.avatar?<img className="au-avatar-img" src={imageSrc(user.avatar)} alt=""/>:<div className="au-avatar">{(user?.name||'A').charAt(0)}</div>}<div><b>{user?.name||'Admin'}</b><small>{user?.email}</small></div></div>
        <button className="au-btn au-btn-outline au-btn-block" onClick={()=>{sessionStorage.removeItem('horaa-admin-token');setToken('');logout();window.location.href='/'}}>Sign out</button>
      </div>
    </aside>

    <div className="au-main">
      <header className="au-top">
        <div className="au-mobile-brand">HORAA STORE</div>
        <div className="au-search"><Search size={16}/><input value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder="Search inventory..."/></div>
        <div className="au-actions"><button className="au-icon" title="Notifications"><Bell size={18}/></button></div>
      </header>

      {view==='overview'&&<div className="au-content">
        <div className="au-head"><div><h2>Overview</h2><p>Store performance at a glance.</p></div></div>
        <div className="au-stats">
          <div className="au-stat"><small>Orders</small><b>{analytics?.orders??orders.length}</b></div>
          <div className="au-stat"><small>Revenue</small><b>{money(analytics?.revenue??0)}</b></div>
          <div className="au-stat"><small>Pending</small><b>{analytics?.pending??0}</b></div>
          <div className="au-stat"><small>Low stock</small><b>{analytics?.low_stock??0}</b></div>
        </div>
        <div className="au-card"><h3>Low stock watch</h3>{(analytics?.low_stock_items||[]).map((p:Product)=><div className="au-line" key={p.id}><span>{p.name}</span><b>{p.stock} left</b></div>)}{!analytics?.low_stock_items?.length&&<p className="au-muted">Inventory is healthy.</p>}</div>
      </div>}

      {view==='analysis'&&<div className="au-content">
        <div className="au-head"><div><h2>Analysis</h2><p>Sales and revenue breakdown.</p></div></div>
        <div className="au-stats">
          <div className="au-stat"><small>Avg order value</small><b>{money(analytics?.avg_order_value??0)}</b></div>
          <div className="au-stat"><small>Total orders</small><b>{analytics?.orders??0}</b></div>
          <div className="au-stat"><small>Total revenue</small><b>{money(analytics?.revenue??0)}</b></div>
        </div>
        <div className="au-card"><h3>Sales — last 14 days</h3>{(()=>{const days=(analytics?.sales_by_day||[]) as {date:string;total:number}[];const max=Math.max(1,...days.map(d=>d.total));return <div className="au-chart">{days.map(d=><div className="au-bar" key={d.date}><i style={{height:`${Math.max(2,Math.round(d.total/max*100))}%`}}/><span>{d.date.slice(5)}</span><b>{d.total?money(d.total):''}</b></div>)}</div>})()}</div>
        <div className="au-grid">
          <div className="au-card"><h3>Top selling products</h3>{(analytics?.top_products||[]).map((p:any)=><div className="au-line" key={p.name}><span>{p.name}</span><b>{p.units} units • {money(p.revenue)}</b></div>)}{!(analytics?.top_products||[]).length&&<p className="au-muted">No sales yet.</p>}</div>
          <div className="au-card"><h3>Revenue by payment</h3>{Object.entries(analytics?.revenue_by_payment||{}).map(([k,v]:any)=><div className="au-line" key={k}><span>{k}</span><b>{money(v)}</b></div>)}{!Object.keys(analytics?.revenue_by_payment||{}).length&&<p className="au-muted">No payments yet.</p>}</div>
          <div className="au-card"><h3>Orders by status</h3>{Object.entries(analytics?.orders_by_status||{}).map(([k,v]:any)=><div className="au-line" key={k}><span>{k}</span><b>{v}</b></div>)}{!Object.keys(analytics?.orders_by_status||{}).length&&<p className="au-muted">No orders yet.</p>}</div>
        </div>
      </div>}

      {view==='inventory'&&<div className="au-content">
        <div className="au-head"><div><h2>Inventory</h2><p>Manage your product catalog, pricing, and availability.</p></div><button className="au-btn au-btn-primary" onClick={openNew}><Plus size={15}/> ADD PRODUCT</button></div>
        <div className="au-toolbar">
          <div className="au-filters">{[['all','ALL PRODUCTS'],['active','ACTIVE'],['hidden','HIDDEN'],['out','OUT OF STOCK']].map(([k,l])=><button key={k} className={filter===k?'active':''} onClick={()=>{setFilter(k as any);setPage(1)}}>{l}</button>)}</div>
          <span className="au-muted au-count">{filtered.length} results</span>
        </div>
        <div className="au-table-wrap">
          <table className="au-table">
            <thead><tr><th className="w-10">&#10003;</th><th>PRODUCT</th><th>SKU</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th className="ta-r">ACTIONS</th></tr></thead>
            <tbody>
              {pageList.map(p=><tr className="au-tr" key={p.id}>
                <td className="w-10"><input type="checkbox"/></td>
                <td><div className="au-prod"><div className="au-prod-img"><img src={imageSrc((p.images||[])[0]||'')} alt=""/></div><div><b>{p.name}</b><span>{p.category} • {p.brand}</span></div></div></td>
                <td className="au-muted">{p.id}</td>
                <td>{money(p.price)}</td>
                <td className={p.stock<=0?'au-danger':''}>{p.stock}</td>
                <td><span className={'au-badge '+(p.active?'':'au-badge-hidden')}><i/>{p.active?'ACTIVE':'HIDDEN'}</span></td>
                <td className="ta-r"><div className="au-row-actions">
                  <button title="Edit" onClick={()=>startEdit(p)}><Edit3 size={15}/></button>
                  <button title={p.active?'Hide':'Show'} onClick={()=>toggleActive(p)}>{p.active?<EyeOff size={15}/>:<Eye size={15}/>}</button>
                  <button title="Delete" className="au-danger" onClick={()=>remove(p.id)}><Trash2 size={15}/></button>
                </div></td>
              </tr>)}
              {!pageList.length&&<tr><td colSpan={7}><div className="au-empty">No products match this view.</div></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="au-pager">
          <span className="au-muted">Showing {(cur-1)*pageSize+1} to {Math.min(cur*pageSize,filtered.length)} of {filtered.length} results</span>
          <div><button className={cur===1?'disabled':''} disabled={cur===1} onClick={()=>setPage(cur-1)}><ChevronLeft size={15}/></button>{Array.from({length:pages},(_,i)=>i+1).map(n=><button key={n} className={n===cur?'active':''} onClick={()=>setPage(n)}>{n}</button>)}{pages>1&&<span className="au-muted">…</span>}<button className={cur===pages?'disabled':''} disabled={cur===pages} onClick={()=>setPage(cur+1)}><ChevronRight size={15}/></button></div>
        </div>
      </div>}

      {view==='team'&&<div className="au-content">
        <div className="au-head"><div><h2>Team</h2><p>Manage the About page team members, profiles and photos.</p></div><button className="au-btn au-btn-primary" onClick={openNewTeam}><Plus size={15}/> ADD MEMBER</button></div>
        <div className="au-table-wrap">
          <table className="au-table">
            <thead><tr><th>MEMBER</th><th>ROLE</th><th>TYPE</th><th className="ta-r">ACTIONS</th></tr></thead>
            <tbody>{team.map(m=><tr className="au-tr" key={m.id}>
              <td><div className="au-prod"><div className="au-team-avatar">{m.photo?<img src={imageSrc(m.photo)} alt=""/>:<span>{m.name.charAt(0)}</span>}</div><div><b>{m.name}</b><span className="au-muted">{m.id}</span></div></div></td>
              <td>{m.role}</td>
              <td><span className={'au-badge '+(m.is_founder?'':'au-badge-hidden')}><i/>{m.is_founder?'FOUNDER':'TEAM'}</span></td>
              <td className="ta-r"><div className="au-row-actions">
                <button title="Edit" onClick={()=>startEditTeam(m)}><Edit3 size={15}/></button>
                <button title="Remove" className="au-danger" onClick={()=>removeTeam(m.id)}><Trash2 size={15}/></button>
              </div></td>
            </tr>)}{!team.length&&<tr><td colSpan={4}><div className="au-empty">No team members yet.</div></td></tr>}</tbody>
          </table>
        </div>
      </div>}

      {view==='orders'&&<div className="au-content">
        <div className="au-head"><div><h2>Orders</h2><p>Track and update customer orders.</p></div></div>
        <div className="au-table-wrap">
          <table className="au-table">
            <thead><tr><th>ORDER</th><th>CUSTOMER</th><th>ITEMS</th><th>TOTAL</th><th>PAYMENT</th><th>STATUS</th></tr></thead>
            <tbody>{orders.map(o=><tr className="au-tr" key={o.id}>
              <td><b>{o.id}</b></td>
              <td><b>{o.customer.name}</b><span className="au-muted au-sub">{o.customer.phone} • {o.customer.city}</span></td>
              <td>{o.items.reduce((a:any,i:any)=>a+i.quantity,0)}</td>
              <td>{money(o.total)}</td>
              <td className="au-muted">{o.payment_method.toUpperCase()}</td>
              <td><select className="au-status" value={o.status} onChange={e=>updateOrder(o.id,e.target.value)}><option>pending</option><option>confirmed</option><option>processing</option><option>shipped</option><option>delivered</option><option>cancelled</option></select></td>
            </tr>)}{!orders.length&&<tr><td colSpan={6}><div className="au-empty">No orders yet.</div></td></tr>}</tbody>
          </table>
        </div>
      </div>}

      {view==='deals'&&<div className="au-content">
        <div className="au-head"><div><h2>Flash Deals</h2><p>Set limited-time deal prices and durations for store products.</p></div><button className="au-btn au-btn-primary" onClick={openNewDeal}><Plus size={15}/> NEW DEAL</button></div>
        <div className="au-table-wrap">
          <table className="au-table">
            <thead><tr><th>PRODUCT</th><th>REGULAR</th><th>DEAL PRICE</th><th>OFF</th><th>ENDS IN</th><th>STATUS</th><th className="ta-r">ACTIONS</th></tr></thead>
            <tbody>{deals.map(d=><tr className="au-tr" key={d.id}>
              <td><div className="au-prod"><div className="au-prod-img"><img src={imageSrc((d.images||[])[0]||'')} alt=""/></div><div><b>{d.name}</b><span>{d.category}{d.subcategory?` • ${d.subcategory}`:''}</span></div></div></td>
              <td className="au-muted">{money(d.price)}</td>
              <td><b className="au-deal-price">{money(d.deal_price)}</b></td>
              <td className="au-deal-off">-{d.discount_pct||0}%</td>
              <td>{d.live?<Countdown to={d.ends_at}/>:<span className="au-muted">{d.expired?'Expired':'—'}</span>}</td>
              <td><span className={'au-badge '+(d.live?'':'au-badge-hidden')}><i/>{d.live?'LIVE':(d.expired?'EXPIRED':'DISABLED')}</span></td>
              <td className="ta-r"><div className="au-row-actions">
                <button title="Edit" onClick={()=>startEditDeal(d)}><Edit3 size={15}/></button>
                <button title={d.active?'Disable':'Enable'} onClick={()=>toggleDeal(d)}>{d.active?<EyeOff size={15}/>:<Eye size={15}/>}</button>
                <button title="Remove" className="au-danger" onClick={()=>removeDeal(d)}><Trash2 size={15}/></button>
              </div></td>
            </tr>)}{!deals.length&&<tr><td colSpan={7}><div className="au-empty">No flash deals yet — create your first one.</div></td></tr>}</tbody>
          </table>
        </div>
      </div>}

      {view==='banners'&&<div className="au-content">
        <div className="au-head"><div><h2>Homepage Banners</h2><p>Edit the promo banners shown on the storefront. Active banners display in the order listed.</p></div><button className="au-btn au-btn-primary" onClick={openNewBanner}><Plus size={15}/> ADD BANNER</button></div>
        <div className="au-table-wrap">
          <table className="au-table">
            <thead><tr><th>BANNER</th><th>EYEBROW</th><th>BUTTON</th><th>STATUS</th><th className="ta-r">ACTIONS</th></tr></thead>
            <tbody>{banners.map(b=><tr className="au-tr" key={b.id}>
              <td><div className="au-prod"><div className="au-prod-img"><img src={imageSrc(b.image)||''} alt=""/></div><div><b>{b.title.split('\n')[0]}</b><span className="au-muted">{b.id}</span></div></div></td>
              <td className="au-muted">{b.eyebrow||'—'}</td>
              <td className="au-muted">{b.button_text}{b.button_link?` → ${b.button_link}`:''}</td>
              <td><span className={'au-badge '+(b.active?'':'au-badge-hidden')}><i/>{b.active?'ACTIVE':'HIDDEN'}</span></td>
              <td className="ta-r"><div className="au-row-actions">
                <button title="Edit" onClick={()=>startEditBanner(b)}><Edit3 size={15}/></button>
                <button title={b.active?'Hide':'Show'} onClick={()=>toggleBanner(b)}>{b.active?<EyeOff size={15}/>:<Eye size={15}/>}</button>
                <button title="Remove" className="au-danger" onClick={()=>removeBanner(b)}><Trash2 size={15}/></button>
              </div></td>
            </tr>)}{!banners.length&&<tr><td colSpan={5}><div className="au-empty">No banners yet — create your first one.</div></td></tr>}</tbody>
          </table>
        </div>
      </div>}

      {view==='settings'&&<div className="au-content">
        <div className="au-head"><div><h2>Settings</h2><p>Manage your profile, security, and preferences.</p></div></div>
        {settingsMsg.text&&<div className={settingsMsg.kind==='err'?'au-error':'au-ok'}>{settingsMsg.text}</div>}
        <div className="au-settings-layout">
          <nav className="au-settings-nav">{['personal','security','notifications'].map(t=><button key={t} className={settingsTab===t?'active':''} onClick={()=>setSettingsTab(t)}>{t==='personal'?'Personal Information':t==='security'?'Security & Password':'Notifications'}</button>)}</nav>
          <div className="au-settings-panels">
            {settingsTab==='personal'&&<section className="au-card"><h3>Personal Information</h3>
              <div className="au-profile-top">
                {user?.avatar?<img className="au-avatar-lg" src={imageSrc(user.avatar)} alt=""/>:<div className="au-avatar-lg au-avatar-initial">{(user?.name||'A').charAt(0)}</div>}
                <div><label className="au-btn au-btn-outline au-upload">Change avatar{uploading?'…':''}<input type="file" accept="image/*" onChange={e=>uploadAvatar(e.target.files)}/></label><p className="au-muted">JPG or PNG.</p></div>
              </div>
              <div className="au-editor-grid">
                <label><span>First name</span><input className="au-input" value={profile.firstName} onChange={e=>setProfile({...profile,firstName:e.target.value})}/></label>
                <label><span>Last name</span><input className="au-input" value={profile.lastName} onChange={e=>setProfile({...profile,lastName:e.target.value})}/></label>
                <label><span>Email address</span><input className="au-input" disabled value={user?.email||''}/></label>
                <label><span>Role</span><input className="au-input" disabled value="Administrator"/></label>
                <label className="au-full"><span>Phone</span><input className="au-input" value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})}/></label>
              </div>
              <div className="au-modal-actions"><button className="au-btn au-btn-primary" onClick={saveProfile}><Check size={15}/> Save changes</button></div>
            </section>}
            {settingsTab==='security'&&<section className="au-card"><h3>Security & Password</h3>
              <div className="au-editor-grid">
                <label className="au-full"><span>Current password</span><input className="au-input" type="password" value={pwd.current} onChange={e=>setPwd({...pwd,current:e.target.value})}/></label>
                <label><span>New password</span><input className="au-input" type="password" value={pwd.next} onChange={e=>setPwd({...pwd,next:e.target.value})}/></label>
                <label><span>Confirm new password</span><input className="au-input" type="password" value={pwd.confirm} onChange={e=>setPwd({...pwd,confirm:e.target.value})}/></label>
              </div>
              <div className="au-modal-actions"><button className="au-btn au-btn-primary" onClick={changePassword}><KeyRound size={15}/> Update password</button></div>
            </section>}
            {settingsTab==='notifications'&&<section className="au-card"><h3>Notifications</h3>
              <div className="au-notif-list">{[['low_stock','Low stock alerts','Get notified when a product drops to 5 units or fewer.'],['new_orders','New orders','A notification for every new customer order.'],['weekly','Weekly summary','A weekly report of revenue and order activity.']].map(([k,title,desc]:any)=><div className="au-notif-row" key={k}><div><b>{title}</b><span className="au-muted">{desc}</span></div><button className={'au-switch '+(notif[k as keyof typeof notif]?'on':'')} onClick={()=>toggleNotif(k as keyof typeof notif)}><i/></button></div>)}</div>
            </section>}
          </div>
        </div>
      </div>}

      <footer className="au-footer"><div><b>HORAA</b><span className="au-muted">© 2026 HORAA. Internal Admin System.</span></div><div className="au-footer-links"><a href="#">Support</a><a href="#">Privacy Policy</a><a href="#">System Status</a></div></footer>
    </div>

    {showEditor&&<div className="au-modal">
      <div className="au-modal-box">
        <div className="au-modal-head"><h3>{editing?'Edit product':'Add product'}<span className="au-muted">Title, images, description, specifications, pricing and stock</span></h3><button className="au-icon" onClick={()=>setShowEditor(false)}><X size={18}/></button></div>
        {error&&<div className="au-error">{error}</div>}
        <div className="au-editor-grid">
          <label><span>Product ID</span><input className="au-input" disabled={editing!==null} placeholder="e.g. cpu-7800x3d" value={form.id} onChange={e=>setForm({...form,id:e.target.value})}/></label>
          <label><span>Title</span><input className="au-input" placeholder="Product title" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label><span>Brand</span><input className="au-input" placeholder="e.g. NVIDIA" value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})}/></label>
          <label><span>Category</span><div className="au-cat-field">{addingCat?<><input className="au-input" placeholder="Type a new category" value={form.category} onChange={e=>setForm({...form,category:e.target.value,subcategory:''})}/><button type="button" className="au-btn au-btn-outline au-btn-sm" onClick={()=>{setAddingCat(false);setForm({...form,category:uniqueCats[0]||'',subcategory:''})}}>Cancel</button></>:<><select className="au-input" value={form.category} onChange={e=>{setAddingSub(false);setForm({...form,category:e.target.value,subcategory:''})}}>{uniqueCats.map(c=><option key={c} value={c}>{c}</option>)}</select><button type="button" className="au-btn au-btn-outline au-btn-sm" onClick={()=>{setAddingCat(true);setForm({...form,category:'',subcategory:''})}}>＋ New</button></>}</div></label>
          {subCats.length>0&&<label><span>Sub-category</span><div className="au-cat-field">{addingSub?<><input className="au-input" placeholder="Type a new sub-category" value={form.subcategory} onChange={e=>setForm({...form,subcategory:e.target.value})}/><button type="button" className="au-btn au-btn-outline au-btn-sm" onClick={()=>{setAddingSub(false);setForm({...form,subcategory:subCats[0]||''})}}>Cancel</button></>:<><select className="au-input" value={form.subcategory} onChange={e=>setForm({...form,subcategory:e.target.value})}><option value="">— Select —</option>{subCats.map(c=><option key={c} value={c}>{c}</option>)}</select><button type="button" className="au-btn au-btn-outline au-btn-sm" onClick={()=>{setAddingSub(true);setForm({...form,subcategory:''})}}>＋ New</button></>}</div></label>}
          <label><span>Price (NPR)</span><input className="au-input" type="number" value={form.price} onChange={e=>setForm({...form,price:+e.target.value})}/></label>
          <label><span>Compare-at price (NPR)</span><input className="au-input" type="number" value={form.compareAtPrice} onChange={e=>setForm({...form,compareAtPrice:+e.target.value})}/></label>
          <label><span>Stock</span><input className="au-input" type="number" value={form.stock} onChange={e=>setForm({...form,stock:+e.target.value})}/></label>
          <label><span>Short spec (shown on cards)</span><input className="au-input" placeholder="e.g. 12GB GDDR6X" value={form.shortSpec} onChange={e=>setForm({...form,shortSpec:e.target.value})}/></label>
          <label className="au-check"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/><span>Active — visible in store</span></label>
          <label className="au-full"><span>Description</span><textarea className="au-input" rows={4} placeholder="Full product description shown on the Overview tab" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
        </div>
        <div className="au-section"><b>Product images <span className="au-muted">(upload as many as you want)</span></b>
          <div className="au-img-grid">{form.images.map((u,i)=><div className="au-img-slot" key={i}><img src={imageSrc(u)} alt=""/><input className="au-input" value={u} onChange={e=>{const imgs=[...form.images];imgs[i]=e.target.value;setForm({...form,images:imgs})}} placeholder="Image URL"/><div className="au-img-actions"><button type="button" onClick={()=>moveImage(i,-1)} disabled={i===0}>↑</button><button type="button" onClick={()=>moveImage(i,1)} disabled={i===form.images.length-1}>↓</button><button type="button" className="au-danger" onClick={()=>setForm({...form,images:form.images.filter((_,x)=>x!==i)})}>×</button></div></div>)}</div>
          <div className="au-img-tools"><label className="au-btn au-btn-outline au-upload">Upload images{uploading?'…':''}<input type="file" multiple accept="image/*" onChange={e=>uploadFiles(e.target.files)}/></label><button className="au-btn au-btn-outline" onClick={()=>setForm({...form,images:[...form.images,'']})}>+ Add image URL</button></div>
        </div>
        <div className="au-section"><b>Specifications</b>
          <div className="au-specs">{form.specs.map((row,i)=><div className="au-spec-row" key={i}><input className="au-input" placeholder="Name (e.g. Resolution)" value={row[0]} onChange={e=>setSpec(i,0,e.target.value)}/><input className="au-input" placeholder="Value (e.g. 1440p)" value={row[1]} onChange={e=>setSpec(i,1,e.target.value)}/><button type="button" className="au-danger au-spec-del" onClick={()=>setForm({...form,specs:form.specs.filter((_,x)=>x!==i)})}>×</button></div>)}</div>
          <button className="au-btn au-btn-outline" onClick={()=>setForm({...form,specs:[...form.specs,['','']]})}>+ Add specification</button>
        </div>
        <div className="au-modal-actions"><button className="au-btn au-btn-primary" onClick={saveProduct}>{editing?'Save changes':'Add product'}</button><button className="au-btn au-btn-outline" onClick={()=>setShowEditor(false)}>Cancel</button></div>
      </div>
    </div>}

    {dealModal.open&&<div className="au-modal">
      <div className="au-modal-box">
        <div className="au-modal-head"><h3>{dealModal.editing?'Edit deal':'New flash deal'}<span className="au-muted">Set a limited-time price for a product</span></h3><button className="au-icon" onClick={()=>setDealModal({...dealModal,open:false})}><X size={18}/></button></div>
        {dealError&&<div className="au-error">{dealError}</div>}
        <div className="au-editor-grid">
          <label className="au-full"><span>Product</span><select className="au-input" disabled={!!dealModal.editing} value={dealModal.product_id} onChange={e=>setDealModal({...dealModal,product_id:e.target.value})}>{products.map(p=><option key={p.id} value={p.id}>{p.name} — {money(p.price)}</option>)}</select></label>
          <label><span>Deal price (NPR)</span><input className="au-input" type="number" placeholder="Must be below regular price" value={dealModal.deal_price} onChange={e=>setDealModal({...dealModal,deal_price:e.target.value})}/></label>
          <label><span>Duration (hours)</span><input className="au-input" type="number" min="1" max="720" value={dealModal.duration_hours} onChange={e=>setDealModal({...dealModal,duration_hours:e.target.value})}/></label>
          <label className="au-check"><input type="checkbox" checked={dealModal.active} onChange={e=>setDealModal({...dealModal,active:e.target.checked})}/><span>Active — show in store</span></label>
        </div>
        <div className="au-modal-actions"><button className="au-btn au-btn-primary" onClick={saveDeal}>{dealModal.editing?'Save changes':'Create deal'}</button><button className="au-btn au-btn-outline" onClick={()=>setDealModal({...dealModal,open:false})}>Cancel</button></div>
      </div>
    </div>}

    {showTeamEditor&&<div className="au-modal">
      <div className="au-modal-box">
        <div className="au-modal-head"><h3>{teamEditing?'Edit team member':'Add team member'}<span className="au-muted">Name, role, bio, quote and profile photo</span></h3><button className="au-icon" onClick={()=>setShowTeamEditor(false)}><X size={18}/></button></div>
        {teamError&&<div className="au-error">{teamError}</div>}
        <div className="au-profile-top" style={{marginTop:4}}>
          {teamForm.photo?<img className="au-avatar-lg" src={imageSrc(teamForm.photo)} alt=""/>:<div className="au-avatar-lg au-avatar-initial">{teamForm.name.charAt(0)||'H'}</div>}
          <div><label className="au-btn au-btn-outline au-upload">Upload photo{teamUploading?'…':''}<input type="file" accept="image/*" onChange={e=>uploadTeamPhoto(e.target.files)}/></label><p className="au-muted">JPG or PNG profile photo.</p></div>
        </div>
        <div className="au-editor-grid">
          <label><span>Name</span><input className="au-input" value={teamForm.name} onChange={e=>setTeamForm({...teamForm,name:e.target.value})}/></label>
          <label><span>Role</span><input className="au-input" value={teamForm.role} onChange={e=>setTeamForm({...teamForm,role:e.target.value})}/></label>
          <label className="au-full"><span>Bio</span><textarea className="au-input" rows={3} value={teamForm.bio} onChange={e=>setTeamForm({...teamForm,bio:e.target.value})}/></label>
          <label className="au-full"><span>Founder quote (shown on the About page founder card)</span><textarea className="au-input" rows={3} value={teamForm.quote} onChange={e=>setTeamForm({...teamForm,quote:e.target.value})}/></label>
          <label className="au-check"><input type="checkbox" checked={teamForm.is_founder} onChange={e=>setTeamForm({...teamForm,is_founder:e.target.checked})}/><span>Founder — shows the profile photo with quote below it</span></label>
        </div>
        <div className="au-modal-actions"><button className="au-btn au-btn-primary" onClick={saveTeam}>{teamEditing?'Save changes':'Add member'}</button><button className="au-btn au-btn-outline" onClick={()=>setShowTeamEditor(false)}>Cancel</button></div>
      </div>
    </div>}

    {showBannerEditor&&<div className="au-modal">
      <div className="au-modal-box">
        <div className="au-modal-head"><h3>{bannerEditing?'Edit banner':'Add banner'}<span className="au-muted">Promo card shown on the homepage</span></h3><button className="au-icon" onClick={()=>setShowBannerEditor(false)}><X size={18}/></button></div>
        {bannerError&&<div className="au-error">{bannerError}</div>}
        <div className="au-profile-top" style={{marginTop:4}}>
          {bannerForm.image?<img className="au-banner-thumb" src={imageSrc(bannerForm.image)} alt=""/>:<div className="au-avatar-lg au-avatar-initial">IMG</div>}
          <div><label className="au-btn au-btn-outline au-upload">Upload image{bannerUploading?'…':''}<input type="file" accept="image/*" onChange={e=>uploadBannerImage(e.target.files)}/></label><p className="au-muted">White-background product photo blends into the card.</p></div>
        </div>
        <div className="au-editor-grid">
          <label><span>Eyebrow (small label)</span><input className="au-input" placeholder="e.g. Limited time" value={bannerForm.eyebrow} onChange={e=>setBannerForm({...bannerForm,eyebrow:e.target.value})}/></label>
          <label className="au-full"><span>Title</span><textarea className="au-input" rows={2} placeholder="Use a new line for a line break — e.g. Summer Sale&#10;Up to 40% Off" value={bannerForm.title} onChange={e=>setBannerForm({...bannerForm,title:e.target.value})}/></label>
          <label className="au-full"><span>Subtitle</span><input className="au-input" value={bannerForm.subtitle} onChange={e=>setBannerForm({...bannerForm,subtitle:e.target.value})}/></label>
          <label><span>Button text</span><input className="au-input" value={bannerForm.button_text} onChange={e=>setBannerForm({...bannerForm,button_text:e.target.value})}/></label>
          <label><span>Button link</span><input className="au-input" placeholder="e.g. /deals" value={bannerForm.button_link} onChange={e=>setBannerForm({...bannerForm,button_link:e.target.value})}/></label>
          <label className="au-check"><input type="checkbox" checked={bannerForm.active} onChange={e=>setBannerForm({...bannerForm,active:e.target.checked})}/><span>Active — show on homepage</span></label>
        </div>
        <div className="au-modal-actions"><button className="au-btn au-btn-primary" onClick={saveBanner}>{bannerEditing?'Save changes':'Add banner'}</button><button className="au-btn au-btn-outline" onClick={()=>setShowBannerEditor(false)}>Cancel</button></div>
      </div>
    </div>}
  </main>;
}
