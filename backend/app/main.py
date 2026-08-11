from fastapi import FastAPI, HTTPException, Header, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime, timezone, timedelta
from pathlib import Path
import hashlib, hmac, json, os, re, secrets, sqlite3, uuid
from dotenv import load_dotenv

BASE = Path(__file__).resolve().parent.parent
load_dotenv(BASE / '.env')
UPLOAD_DIR = Path(os.getenv('UPLOAD_DIR', str(BASE / 'uploads')))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = Path(os.getenv('DATABASE_PATH', str(BASE / 'horaa.db')))
ADMIN_TOKEN = os.getenv('ADMIN_TOKEN', 'change-me-in-production')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'itssinghchandan10@gmail.com')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', '@chandan10')
ADMIN_NAME = 'Horaa Admin'

PRODUCTS = [
 {"id":"gpu-4070ti","slug":"nvidia-geforce-rtx-4070-ti","name":"NVIDIA GeForce RTX 4070 Ti","category":"Graphics Cards","brand":"NVIDIA","price":109999,"compareAtPrice":119999,"rating":4.8,"reviews":128,"stock":7,"shortSpec":"12GB GDDR6X","description":"The RTX 4070 Ti pairs NVIDIA's Ada Lovelace architecture with 12GB of GDDR6X memory for blistering 1440p and smooth 4K gaming. DLSS 3 frame generation, ray tracing and the efficient 40-series cooler make it a premium choice for Horaa customers building high-end rigs.","image":"https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1200&q=85","specs":{"Memory":"12GB GDDR6X","Boost Clock":"2610 MHz","Interface":"PCIe 4.0","Ray Tracing":"Yes","Recommended PSU":"700W"},"compatibility":{"wattage":285,"gpuLengthMm":305}},
 {"id":"cpu-7800x3d","slug":"amd-ryzen-7-7800x3d","name":"AMD Ryzen 7 7800X3D","category":"Processors","brand":"AMD","price":54999,"compareAtPrice":None,"rating":4.9,"reviews":95,"stock":11,"shortSpec":"8-Core, 16-Thread","description":"AMD's 3D V-Cache flagship delivers class-leading gaming performance while staying cool and efficient. With 8 cores and 16 threads on the AM5 platform, the 7800X3D is the go-to processor for high-refresh gaming builds sold at Horaa Store.","image":"https://images.unsplash.com/photo-1555617981-dac3880eac6e?auto=format&fit=crop&w=1200&q=85","specs":{"Cores":"8","Threads":"16","Socket":"AM5","Boost":"5.0 GHz","Cache":"104MB"},"compatibility":{"socket":"AM5","wattage":120}},
 {"id":"ram-vengeance","slug":"corsair-vengeance-32gb-ddr5","name":"Corsair Vengeance 32GB","category":"Memory","brand":"Corsair","price":21999,"compareAtPrice":24999,"rating":4.8,"reviews":64,"stock":18,"shortSpec":"32GB DDR5 6000MHz","description":"Corsair Vengeance DDR5 keeps your system responsive with 32GB at 6000MT/s in a low-profile heat spreader. EXPO and XMP profiles make it a one-click upgrade for both Intel and AMD platforms.","image":"https://images.unsplash.com/photo-1592664474505-51c549ad15c5?auto=format&fit=crop&w=1200&q=85","specs":{"Capacity":"32GB","Type":"DDR5","Speed":"6000MHz","Kit":"2 x 16GB"},"compatibility":{"memoryType":"DDR5"}},
 {"id":"ssd-990pro","slug":"samsung-990-pro-1tb","name":"Samsung 990 PRO 1TB","category":"Storage","brand":"Samsung","price":13999,"compareAtPrice":15999,"rating":4.9,"reviews":87,"stock":22,"shortSpec":"PCIe 4.0 NVMe","description":"The Samsung 990 PRO pushes PCIe 4.0 to its limits with 7450 MB/s sequential reads. Perfect for game libraries, video editing and heavy workloads, backed by Samsung's industry-leading reliability.","image":"https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1200&q=85","specs":{"Capacity":"1TB","Interface":"PCIe 4.0 NVMe","Read":"7450 MB/s","Write":"6900 MB/s"},"compatibility":{}},
 {"id":"mobo-b650","slug":"asus-rog-strix-b650e-f","name":"ASUS ROG Strix B650E-F","category":"Motherboards","brand":"ASUS","price":34999,"compareAtPrice":None,"rating":4.7,"reviews":78,"stock":5,"shortSpec":"AM5 • DDR5 • ATX","description":"The ROG Strix B650E-F Gaming WiFi combines PCIe 5.0 support, premium VRMs and WiFi 6E for a rock-solid AM5 foundation. Built for enthusiasts who want clean aesthetics and overclocking headroom.","image":"https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=85","specs":{"Socket":"AM5","Memory":"DDR5","Form Factor":"ATX","WiFi":"WiFi 6E"},"compatibility":{"socket":"AM5","memoryType":"DDR5","formFactor":"ATX"}},
 {"id":"psu-850","slug":"corsair-rm850x-850w","name":"Corsair RM850x 850W","category":"Power Supplies","brand":"Corsair","price":16999,"compareAtPrice":None,"rating":4.8,"reviews":51,"stock":9,"shortSpec":"80+ Gold Modular","description":"Fully modular cabling, 80+ Gold efficiency and a silent 140mm fan make the RM850x the dependable heart of any serious build. Sleeved Type 4 cables keep your case tidy.","image":"https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=1200&q=85","specs":{"Power":"850W","Efficiency":"80+ Gold","Modular":"Fully Modular"},"compatibility":{"wattage":850}},
 {"id":"case-airflow","slug":"horaa-airflow-atx-case","name":"Horaa Airflow ATX Case","category":"PC Cases","brand":"Horaa","price":12999,"compareAtPrice":None,"rating":4.6,"reviews":31,"stock":14,"shortSpec":"ATX • 360mm GPU","description":"Our own Horaa Airflow case pairs a mesh front with four pre-installed fans for excellent thermals. Tempered glass, generous GPU clearance and clean cable routing make building easy.","image":"https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=85","specs":{"Form Factor":"ATX","GPU Clearance":"360mm","CPU Cooler":"170mm","Fans":"4 included"},"compatibility":{"formFactor":"ATX","gpuLengthMm":360,"cpuCoolerHeightMm":170}},
 {"id":"cooler-kraken","slug":"nzxt-kraken-240","name":"NZXT Kraken 240","category":"Cooling","brand":"NZXT","price":32999,"compareAtPrice":None,"rating":4.7,"reviews":44,"stock":8,"shortSpec":"240mm AIO","description":"The NZXT Kraken 240 AIO keeps your CPU cool under load with a 240mm radiator and an LCD display to show temps, GIFs or system stats. Easy mounting across AM5 and LGA1700.","image":"https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7b3?auto=format&fit=crop&w=1200&q=85","specs":{"Radiator":"240mm","Socket":"AM5 / AM4 / LGA1700","Display":"LCD"},"compatibility":{"socket":"AM5"}},
 {"id":"ep-hw-headphones","slug":"horaa-wireless-headphones","name":"Horaa Wireless Headphones","category":"Electronics","subcategory":"Headphones","brand":"Horaa","price":8999,"compareAtPrice":9999,"rating":4.6,"reviews":18,"stock":12,"shortSpec":"Over-ear • 40h battery","description":"Comfortable over-ear wireless headphones with hybrid active noise cancellation, 40 hours of playtime and crisp 40mm drivers. A great everyday companion for music, calls and travel, backed by Horaa's official warranty.","image":"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85","specs":{"Battery":"40 hours","Connectivity":"Bluetooth 5.3","Driver":"40mm","Noise Cancelling":"Hybrid ANC"},"compatibility":{}},
]
PRODUCT_MAP = {p['id']: p for p in PRODUCTS}

def slugify(s:str)->str:
    s=s.lower().replace(' & ','-').replace('&','-').replace('  ',' ').strip()
    s=re.sub(r'[^a-z0-9 -]','',s).replace(' ','-')
    s=re.sub(r'-+','-',s).strip('-')
    return s or 'product'
def parse_product(d):
    for k in ('images','specs','compatibility'):
        if d.get(k) is not None: d[k]=json.loads(d[k])
    if not d.get('images'): d['images']=[]
    if not d.get('specs'): d['specs']={}
    if not d.get('compatibility'): d['compatibility']={}
    return d

app = FastAPI(title='Horaa Store API', version='3.0.0')
app.add_middleware(CORSMiddleware, allow_origins=os.getenv('CORS_ORIGINS','http://localhost:3000').split(','), allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
app.mount('/uploads', StaticFiles(directory=UPLOAD_DIR), name='uploads')

def db():
    con=sqlite3.connect(DB_PATH); con.row_factory=sqlite3.Row; return con

def init_db():
    con=db()
    con.executescript('''
    CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, customer TEXT NOT NULL, items TEXT NOT NULL, subtotal INTEGER NOT NULL, shipping INTEGER NOT NULL, total INTEGER NOT NULL, payment_method TEXT NOT NULL, payment_status TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, phone TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, product_id TEXT NOT NULL, user_id TEXT NOT NULL, rating INTEGER NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS wishlists (user_id TEXT NOT NULL, product_id TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(user_id, product_id));
    CREATE TABLE IF NOT EXISTS saved_builds (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, components TEXT NOT NULL, total INTEGER NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS coupons (code TEXT PRIMARY KEY, kind TEXT NOT NULL, value INTEGER NOT NULL, min_order INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS flash_deals (product_id TEXT PRIMARY KEY, deal_price INTEGER NOT NULL, duration_hours INTEGER NOT NULL, ends_at TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, brand TEXT NOT NULL, price INTEGER NOT NULL, stock INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS team_members (id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, bio TEXT NOT NULL DEFAULT '', quote TEXT NOT NULL DEFAULT '', photo TEXT NOT NULL DEFAULT '', is_founder INTEGER NOT NULL DEFAULT 0, sort_order INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS banners (id TEXT PRIMARY KEY, eyebrow TEXT NOT NULL DEFAULT '', title TEXT NOT NULL, subtitle TEXT NOT NULL DEFAULT '', button_text TEXT NOT NULL DEFAULT 'Shop Now', button_link TEXT NOT NULL DEFAULT '/deals', image TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL);
    ''')
    pcols=[r[1] for r in con.execute('PRAGMA table_info(products)').fetchall()]
    for col,ctype in {'slug':'TEXT','compare_at_price':'INTEGER','rating':'REAL NOT NULL DEFAULT 4.5','reviews':'INTEGER NOT NULL DEFAULT 0','short_spec':'TEXT','description':'TEXT','images':'TEXT','specs':'TEXT','compatibility':'TEXT'}.items():
        if col not in pcols:
            con.execute(f'ALTER TABLE products ADD COLUMN {col} {ctype}')
    if 'subcategory' not in pcols:
        con.execute("ALTER TABLE products ADD COLUMN subcategory TEXT NOT NULL DEFAULT ''")
    now=datetime.now(timezone.utc).isoformat()
    for p in PRODUCTS:
        if con.execute('SELECT 1 FROM products WHERE id=?',(p['id'],)).fetchone():
            con.execute('UPDATE products SET name=?,category=?,brand=?,price=?,stock=?,slug=?,compare_at_price=?,rating=?,reviews=?,short_spec=?,description=?,images=?,specs=?,compatibility=?,subcategory=? WHERE id=?',
                (p['name'],p['category'],p['brand'],p['price'],p['stock'],p['slug'],p.get('compareAtPrice'),p.get('rating',4.5),p.get('reviews',0),p['shortSpec'],p['description'],json.dumps(p.get('images',[p['image']])),json.dumps(p.get('specs',{})),json.dumps(p.get('compatibility',{})),p.get('subcategory',''),p['id']))
        else:
            con.execute('INSERT INTO products (id,name,category,brand,price,stock,active,updated_at,slug,compare_at_price,rating,reviews,short_spec,description,images,specs,compatibility,subcategory) VALUES (?,?,?,?,?,?,1,?,?,?,?,?,?,?,?,?,?,?)',
                (p['id'],p['name'],p['category'],p['brand'],p['price'],p['stock'],now,p['slug'],p.get('compareAtPrice'),p.get('rating',4.5),p.get('reviews',0),p['shortSpec'],p['description'],json.dumps(p.get('images',[p['image']])),json.dumps(p.get('specs',{})),json.dumps(p.get('compatibility',{})),p.get('subcategory','')))
    if con.execute('SELECT COUNT(*) FROM coupons').fetchone()[0] == 0:
        con.executemany('INSERT INTO coupons VALUES (?,?,?,?,?)',[('HORAA10','percent',10,20000,1),('WELCOME2000','fixed',2000,30000,1)])
    if con.execute('SELECT COUNT(*) FROM flash_deals').fetchone()[0] == 0:
        now=datetime.now(timezone.utc).isoformat()
        con.executemany('INSERT INTO flash_deals (product_id,deal_price,duration_hours,ends_at,active,created_at) VALUES (?,?,?,?,?,?)',[
            ('gpu-4070ti',99999,72,(datetime.now(timezone.utc)+timedelta(hours=72)).isoformat(),1,now),
            ('cpu-7800x3d',49999,48,(datetime.now(timezone.utc)+timedelta(hours=48)).isoformat(),1,now),
        ])
    if con.execute('SELECT COUNT(*) FROM team_members').fetchone()[0] == 0:
        con.executemany('INSERT INTO team_members (id,name,role,bio,quote,photo,is_founder,sort_order) VALUES (?,?,?,?,?,?,?,?)',[
            ('founder','Bishal Sharma','Founder & CEO','','Building Horaa with a passion for technology that empowers human potential.','',1,1),
            ('team-1','Srijana Maharjan','Lead Systems Architect','Specializing in thermal dynamics and liquid cooling integration.','','',0,2),
            ('team-2','Anish Gurung','UX Design Lead','Crafting the seamless digital interfaces that bridge the gap between user and hardware.','','',0,3),
            ('team-3','Priya Thapa','Director of Engineering','Leading our hardware architecture team with over 15 years of experience in high-performance computing.','','',0,4),
        ])
    if con.execute('SELECT COUNT(*) FROM banners').fetchone()[0] == 0:
        now=datetime.now(timezone.utc).isoformat()
        con.execute('INSERT INTO banners (id,eyebrow,title,subtitle,button_text,button_link,image,active,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
            ('banner-summer','Limited time','Summer Sale\nUp to 40% Off','Special offers on selected PC hardware.','Shop Now','/deals','/assets/image212.png',1,now))
    cols=[r[1] for r in con.execute('PRAGMA table_info(users)').fetchall()]
    if 'is_admin' not in cols:
        con.execute('ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0')
    if 'avatar' not in cols:
        con.execute("ALTER TABLE users ADD COLUMN avatar TEXT NOT NULL DEFAULT ''")
    if not con.execute('SELECT 1 FROM users WHERE email=?',(ADMIN_EMAIL,)).fetchone():
        now=datetime.now(timezone.utc).isoformat()
        con.execute('INSERT INTO users (id,name,email,phone,password_hash,is_admin,created_at) VALUES (?,?,?,?,?,1,?)',('USR-ADMIN',ADMIN_NAME,ADMIN_EMAIL,'',hash_password(ADMIN_PASSWORD),now))
    else:
        con.execute('UPDATE users SET name=?, password_hash=?, is_admin=1 WHERE email=?',(ADMIN_NAME,hash_password(ADMIN_PASSWORD),ADMIN_EMAIL))
    con.commit(); con.close()

def hash_password(password:str)->str:
    salt=secrets.token_bytes(16); digest=hashlib.pbkdf2_hmac('sha256',password.encode(),salt,120000); return salt.hex()+':'+digest.hex()
def verify_password(password:str, stored:str)->bool:
    salt_hex,digest_hex=stored.split(':'); digest=hashlib.pbkdf2_hmac('sha256',password.encode(),bytes.fromhex(salt_hex),120000); return hmac.compare_digest(digest.hex(),digest_hex)
init_db()
def user_from_token(token:str|None):
    if not token: return None
    con=db(); row=con.execute('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?',(token,)).fetchone(); con.close(); return dict(row) if row else None
def admin_user():
    con=db(); row=con.execute('SELECT * FROM users WHERE email=?',(ADMIN_EMAIL,)).fetchone(); con.close(); return dict(row) if row else None
def profile_user(authorization:str|None):
    if not authorization or not authorization.startswith('Bearer '): raise HTTPException(401,'Login required')
    if authorization[7:]==ADMIN_TOKEN: return admin_user()
    u=user_from_token(authorization[7:]);
    if not u: raise HTTPException(401,'Invalid session')
    return u
def auth(authorization:str|None):
    if not authorization or not authorization.startswith('Bearer '): raise HTTPException(401,'Login required')
    u=user_from_token(authorization[7:]);
    if not u: raise HTTPException(401,'Invalid session')
    return u
def admin_guard(authorization:str|None):
    if not authorization or not authorization.startswith('Bearer '): raise HTTPException(401,'Unauthorized')
    token=authorization[7:]
    if token==ADMIN_TOKEN: return
    u=user_from_token(token)
    if not u or not u.get('is_admin'): raise HTTPException(401,'Unauthorized')
def catalog():
    con=db(); rows=[dict(r) for r in con.execute('SELECT * FROM products WHERE active=1 ORDER BY name')]; con.close(); return [parse_product(r) for r in rows]

def serialize(row):
    d=dict(row); d['customer']=json.loads(d['customer']); d['items']=json.loads(d['items']); return d

class Customer(BaseModel):
    name:str=Field(min_length=2,max_length=100); email:EmailStr; phone:str=Field(min_length=7,max_length=30); address:str=Field(min_length=5,max_length=500); city:str=Field(min_length=2,max_length=80)
class OrderItem(BaseModel): product_id:str; quantity:int=Field(ge=1,le=50)
class OrderCreate(BaseModel): customer:Customer; items:list[OrderItem]; payment_method:str=Field(pattern='^(cod|esewa|khalti|fonepay)$'); coupon_code:str|None=None
class StatusUpdate(BaseModel): status:str=Field(pattern='^(pending|confirmed|processing|shipped|delivered|cancelled)$')
class Register(BaseModel): name:str=Field(min_length=2,max_length=100); email:EmailStr; phone:str=Field(min_length=7,max_length=30); password:str=Field(min_length=8,max_length=100)
class Login(BaseModel): email:EmailStr; password:str
class ReviewCreate(BaseModel): product_id:str; rating:int=Field(ge=1,le=5); title:str=Field(min_length=2,max_length=100); body:str=Field(min_length=3,max_length=1000)
class WishlistChange(BaseModel): product_id:str
class BuildCreate(BaseModel): name:str=Field(min_length=2,max_length=100); components:dict[str,str]; total:int=Field(ge=0)
class CouponCheck(BaseModel): code:str; subtotal:int=Field(ge=0)
class ProductCreate(BaseModel): id:str=Field(min_length=1,max_length=80); name:str=Field(min_length=1,max_length=200); category:str=Field(min_length=1,max_length=80); brand:str=Field(min_length=1,max_length=80); price:int=Field(ge=0); stock:int=Field(ge=0); active:bool=True; slug:str|None=None; compare_at_price:int|None=None; rating:float|None=None; reviews:int|None=None; short_spec:str=''; description:str=''; images:list[str]=[]; specs:dict[str,str]={}; compatibility:dict[str,object]={}; subcategory:str=''
class ProfileUpdate(BaseModel): name:str=Field(min_length=2,max_length=100); phone:str=''; avatar:str|None=''
class PasswordChange(BaseModel): current_password:str=Field(min_length=1); new_password:str=Field(min_length=8,max_length=100)
class DealCreate(BaseModel): product_id:str=Field(min_length=1); deal_price:int=Field(ge=1); duration_hours:int=Field(ge=1,le=720); active:bool=True
class DealUpdate(BaseModel): deal_price:int|None=Field(default=None,ge=1); duration_hours:int|None=Field(default=None,ge=1,le=720); active:bool|None=None
class TeamMember(BaseModel): id:str|None=None; name:str=Field(min_length=1,max_length=100); role:str=Field(min_length=1,max_length=100); bio:str=''; quote:str=''; photo:str=''; is_founder:bool=False; sort_order:int=0
class Banner(BaseModel): id:str|None=None; eyebrow:str=''; title:str=Field(min_length=1,max_length=200); subtitle:str=''; button_text:str=''; button_link:str=''; image:str=''; active:bool=True

@app.get('/api/health')
def health(): return {'status':'ok','service':'horaa-store-api','version':'3.0.0'}
@app.get('/api/products')
def products(q:str|None=None,category:str|None=None,subcategory:str|None=None,min_price:int=0,max_price:int=10**9):
    data=catalog();
    if q: data=[p for p in data if q.lower() in f"{p['name']} {p['brand']} {p['category']} {p.get('subcategory','')}".lower()]
    if category and category!='all': data=[p for p in data if p['category']==category]
    if subcategory and subcategory!='all': data=[p for p in data if p.get('subcategory','')==subcategory]
    return [p for p in data if min_price<=p['price']<=max_price]
@app.get('/api/products/{product_id}')
def product_detail(product_id:str):
    for p in catalog():
        if p['id']==product_id or p.get('slug')==product_id: return p
    raise HTTPException(404,'Product not found')

@app.post('/api/auth/register',status_code=201)
def register(payload:Register):
    con=db()
    if con.execute('SELECT 1 FROM users WHERE email=?',(payload.email,)).fetchone(): con.close(); raise HTTPException(409,'Email already registered')
    uid='USR-'+uuid.uuid4().hex[:10].upper(); now=datetime.now(timezone.utc).isoformat();     con.execute('INSERT INTO users (id,name,email,phone,password_hash,is_admin,created_at) VALUES (?,?,?,?,?,0,?)',(uid,payload.name,payload.email,payload.phone,hash_password(payload.password),now)); token=secrets.token_urlsafe(32); con.execute('INSERT INTO sessions VALUES (?,?,?)',(token,uid,now)); con.commit(); con.close(); return {'token':token,'user':{'id':uid,'name':payload.name,'email':payload.email,'phone':payload.phone,'avatar':'','is_admin':False}}
@app.post('/api/auth/login')
def login(payload:Login):
    con=db(); row=con.execute('SELECT * FROM users WHERE email=?',(payload.email,)).fetchone()
    if not row or not verify_password(payload.password,row['password_hash']): con.close(); raise HTTPException(401,'Invalid email or password')
    token=secrets.token_urlsafe(32); now=datetime.now(timezone.utc).isoformat(); con.execute('INSERT INTO sessions VALUES (?,?,?)',(token,row['id'],now)); con.commit(); con.close(); return {'token':token,'user':{'id':row['id'],'name':row['name'],'email':row['email'],'phone':row['phone'],'avatar':row['avatar'] if 'avatar' in row.keys() else '','is_admin':bool(row['is_admin'])}}
@app.get('/api/auth/me')
def me(authorization:str|None=Header(None)): u=auth(authorization); return {'id':u['id'],'name':u['name'],'email':u['email'],'phone':u['phone'],'avatar':u.get('avatar') or '','is_admin':bool(u.get('is_admin'))}
@app.patch('/api/auth/me')
def update_profile(payload:ProfileUpdate,authorization:str|None=Header(None)):
    u=profile_user(authorization); con=db(); con.execute('UPDATE users SET name=?,phone=?,avatar=? WHERE id=?',(payload.name,payload.phone,payload.avatar or '',u['id'])); con.commit(); con.close(); return {'id':u['id'],'name':payload.name,'email':u['email'],'phone':payload.phone,'avatar':payload.avatar or '','is_admin':bool(u.get('is_admin'))}
@app.post('/api/auth/change-password')
def change_password(payload:PasswordChange,authorization:str|None=Header(None)):
    u=profile_user(authorization); con=db(); row=con.execute('SELECT password_hash FROM users WHERE id=?',(u['id'],)).fetchone()
    if not row or not verify_password(payload.current_password,row['password_hash']): con.close(); raise HTTPException(400,'Current password is incorrect')
    con.execute('UPDATE users SET password_hash=? WHERE id=?',(hash_password(payload.new_password),u['id'])); con.commit(); con.close(); return {'ok':True}

@app.post('/api/orders',status_code=201)
def create_order(payload:OrderCreate):
    if not payload.items: raise HTTPException(400,'Cart is empty')
    current={p['id']:p for p in catalog()}; deal_map=live_deal_map(); requested={}
    for item in payload.items: requested[item.product_id]=requested.get(item.product_id,0)+item.quantity
    for pid,qty in requested.items():
        p=current.get(pid)
        if not p: raise HTTPException(400,f'Unknown product: {pid}')
        if qty>p['stock']: raise HTTPException(409,f"{p['name']} has only {p['stock']} in stock")
    subtotal=sum(deal_map.get(pid,current[pid]['price'])*qty for pid,qty in requested.items()); discount=0
    if payload.coupon_code:
        con=db(); c=con.execute('SELECT * FROM coupons WHERE code=? AND active=1',(payload.coupon_code.upper(),)).fetchone(); con.close()
        if not c: raise HTTPException(400,'Invalid coupon')
        if subtotal<c['min_order']: raise HTTPException(400,f"Minimum order for this coupon is NPR {c['min_order']:,}")
        discount=round(subtotal*c['value']/100) if c['kind']=='percent' else c['value']; discount=min(discount,subtotal)
    shipping=0 if subtotal-discount>=10000 else 150; total=subtotal-discount+shipping
    items=[{'product_id':pid,'name':current[pid]['name'],'quantity':qty,'unit_price':deal_map.get(pid,current[pid]['price'])} for pid,qty in requested.items()]
    oid=f"HRS-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"; payment_status='cod_pending' if payload.payment_method=='cod' else 'pending'; now=datetime.now(timezone.utc).isoformat()
    con=db(); con.execute('BEGIN')
    for pid,qty in requested.items(): con.execute('UPDATE products SET stock=stock-? WHERE id=? AND stock>=?',(qty,pid,qty))
    con.execute('INSERT INTO orders VALUES (?,?,?,?,?,?,?,?,?,?)',(oid,payload.customer.model_dump_json(),json.dumps(items),subtotal,shipping,total,payload.payment_method,payment_status,'pending',now)); con.commit(); con.close()
    return {'order_id':oid,'subtotal':subtotal,'discount':discount,'shipping':shipping,'total':total,'payment_status':payment_status,'message':'Order created. Connect merchant credentials to complete online gateway handoff.'}

@app.get('/api/orders/{order_id}')
def get_order(order_id:str):
    con=db(); row=con.execute('SELECT * FROM orders WHERE id=?',(order_id,)).fetchone(); con.close()
    if not row: raise HTTPException(404,'Order not found')
    return serialize(row)

@app.get('/api/admin/orders')
def admin_orders(authorization:str|None=Header(None)):
    admin_guard(authorization); con=db(); rows=con.execute('SELECT * FROM orders ORDER BY created_at DESC').fetchall(); con.close(); return [serialize(r) for r in rows]
@app.patch('/api/admin/orders/{order_id}')
def update_order(order_id:str,payload:StatusUpdate,authorization:str|None=Header(None)):
    admin_guard(authorization); con=db(); cur=con.execute('UPDATE orders SET status=? WHERE id=?',(payload.status,order_id)); con.commit(); con.close();
    if not cur.rowcount: raise HTTPException(404,'Order not found')
    return {'ok':True}

@app.get('/api/admin/products')
def admin_products(authorization:str|None=Header(None)):
    admin_guard(authorization); con=db(); rows=[dict(r) for r in con.execute('SELECT * FROM products ORDER BY category,name')]; con.close(); return [parse_product(r) for r in rows]
@app.post('/api/admin/products',status_code=201)
def admin_create_product(payload:ProductCreate,authorization:str|None=Header(None)):
    admin_guard(authorization); con=db(); now=datetime.now(timezone.utc).isoformat(); slug=payload.slug or slugify(payload.name)
    try: con.execute('INSERT INTO products (id,name,category,brand,price,stock,active,updated_at,slug,compare_at_price,rating,reviews,short_spec,description,images,specs,compatibility,subcategory) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',(payload.id,payload.name,payload.category,payload.brand,payload.price,payload.stock,int(payload.active),now,slug,payload.compare_at_price,payload.rating if payload.rating is not None else 4.5,payload.reviews if payload.reviews is not None else 0,payload.short_spec,payload.description,json.dumps(payload.images),json.dumps(payload.specs),json.dumps(payload.compatibility),payload.subcategory)); con.commit()
    except sqlite3.IntegrityError: con.close(); raise HTTPException(409,'Product ID already exists')
    con.close(); return {'ok':True}
@app.patch('/api/admin/products/{pid}')
def admin_update_product(pid:str,payload:ProductCreate,authorization:str|None=Header(None)):
    admin_guard(authorization); con=db(); now=datetime.now(timezone.utc).isoformat(); slug=payload.slug or slugify(payload.name)
    cur=con.execute('UPDATE products SET name=?,category=?,brand=?,price=?,stock=?,active=?,updated_at=?,slug=?,compare_at_price=?,rating=?,reviews=?,short_spec=?,description=?,images=?,specs=?,compatibility=?,subcategory=? WHERE id=?',(payload.name,payload.category,payload.brand,payload.price,payload.stock,int(payload.active),now,slug,payload.compare_at_price,payload.rating if payload.rating is not None else 4.5,payload.reviews if payload.reviews is not None else 0,payload.short_spec,payload.description,json.dumps(payload.images),json.dumps(payload.specs),json.dumps(payload.compatibility),payload.subcategory,pid)); con.commit(); con.close();
    if not cur.rowcount: raise HTTPException(404,'Product not found')
    return {'ok':True}
@app.delete('/api/admin/products/{pid}')
def admin_delete_product(pid:str,authorization:str|None=Header(None)):
    admin_guard(authorization); con=db(); cur=con.execute('UPDATE products SET active=0 WHERE id=?',(pid,)); con.commit(); con.close();
    if not cur.rowcount: raise HTTPException(404,'Product not found')
    return {'ok':True}
@app.post('/api/admin/upload')
def upload_image(file:UploadFile=File(...),authorization:str|None=Header(None)):
    admin_guard(authorization)
    data=file.file.read()
    if len(data)>10*1024*1024: raise HTTPException(413,'Image too large (max 10MB)')
    ext=os.path.splitext(file.filename or '')[1].lower() or '.jpg'
    if ext not in ('.jpg','.jpeg','.png','.webp','.gif','.avif'): raise HTTPException(400,'Unsupported image type')
    name=f"{datetime.now().strftime('%Y%m%d%H%M%S')}-{secrets.token_hex(4)}{ext}"
    with open(UPLOAD_DIR/name,'wb') as f: f.write(data)
    return {'url':f'/uploads/{name}'}

def live_deal_map():
    con=db(); now=datetime.now(timezone.utc).isoformat()
    rows=[dict(r) for r in con.execute('SELECT product_id,deal_price FROM flash_deals WHERE active=1 AND ends_at>?',(now,))]; con.close()
    return {r['product_id']:r['deal_price'] for r in rows}

@app.get('/api/deals')
def deals():
    con=db(); now=datetime.now(timezone.utc).isoformat()
    rows=[dict(r) for r in con.execute('SELECT * FROM flash_deals WHERE active=1 AND ends_at>?',(now,))]; con.close()
    prods={p['id']:p for p in catalog()}
    out=[]
    for r in rows:
        p=prods.get(r['product_id'])
        if not p or not p.get('active'): continue
        p=dict(p); p['deal_price']=r['deal_price']; p['ends_at']=r['ends_at']; p['discount_pct']=round((1-r['deal_price']/p['price'])*100) if p.get('price') else 0
        out.append(p)
    return out

@app.get('/api/admin/deals')
def admin_deals(authorization:str|None=Header(None)):
    admin_guard(authorization); con=db(); now=datetime.now(timezone.utc).isoformat()
    rows=[dict(r) for r in con.execute('SELECT * FROM flash_deals')]; con.close()
    prods={p['id']:p for p in catalog()}
    out=[]
    for r in rows:
        p=prods.get(r['product_id'])
        if not p: continue
        p=dict(p); p['deal_price']=r['deal_price']; p['duration_hours']=r['duration_hours']; p['ends_at']=r['ends_at']; p['active']=bool(r['active'])
        p['expired']=r['ends_at']<=now; p['live']=bool(r['active']) and not p['expired'] and bool(p.get('active'))
        p['discount_pct']=round((1-r['deal_price']/p['price'])*100) if p.get('price') else 0
        out.append(p)
    return out

@app.post('/api/admin/deals',status_code=201)
def admin_create_deal(payload:DealCreate,authorization:str|None=Header(None)):
    admin_guard(authorization); con=db()
    p=con.execute('SELECT * FROM products WHERE id=?',(payload.product_id,)).fetchone(); con.close()
    if not p: raise HTTPException(404,'Product not found')
    if payload.deal_price>=p['price']: raise HTTPException(400,'Deal price must be lower than the regular price')
    now=datetime.now(timezone.utc); ends=(now+timedelta(hours=payload.duration_hours)).isoformat(); now_iso=now.isoformat()
    con=db(); con.execute('INSERT INTO flash_deals (product_id,deal_price,duration_hours,ends_at,active,created_at) VALUES (?,?,?,?,?,?) ON CONFLICT(product_id) DO UPDATE SET deal_price=excluded.deal_price, duration_hours=excluded.duration_hours, ends_at=excluded.ends_at, active=excluded.active',(payload.product_id,payload.deal_price,payload.duration_hours,ends,int(payload.active),now_iso)); con.commit(); con.close()
    return {'ok':True}

@app.patch('/api/admin/deals/{product_id}')
def admin_update_deal(product_id:str,payload:DealUpdate,authorization:str|None=Header(None)):
    admin_guard(authorization); con=db(); row=con.execute('SELECT * FROM flash_deals WHERE product_id=?',(product_id,)).fetchone()
    if not row: con.close(); raise HTTPException(404,'Deal not found')
    p=con.execute('SELECT * FROM products WHERE id=?',(product_id,)).fetchone(); con.close()
    if not p: raise HTTPException(404,'Product not found')
    new_price=payload.deal_price if payload.deal_price is not None else row['deal_price']
    if new_price>=p['price']: raise HTTPException(400,'Deal price must be lower than the regular price')
    new_hours=payload.duration_hours if payload.duration_hours is not None else row['duration_hours']
    new_active=payload.active if payload.active is not None else bool(row['active'])
    ends=row['ends_at']
    if payload.duration_hours is not None: ends=(datetime.now(timezone.utc)+timedelta(hours=new_hours)).isoformat()
    con=db(); con.execute('UPDATE flash_deals SET deal_price=?,duration_hours=?,ends_at=?,active=? WHERE product_id=?',(new_price,new_hours,ends,int(new_active),product_id)); con.commit(); con.close()
    return {'ok':True}

@app.delete('/api/admin/deals/{product_id}')
def admin_delete_deal(product_id:str,authorization:str|None=Header(None)):
    admin_guard(authorization); con=db(); cur=con.execute('DELETE FROM flash_deals WHERE product_id=?',(product_id,)); con.commit(); con.close()
    if not cur.rowcount: raise HTTPException(404,'Deal not found')
    return {'ok':True}

@app.get('/api/team')
def team_members():
    con=db(); rows=[dict(r) for r in con.execute('SELECT * FROM team_members ORDER BY sort_order')]; con.close()
    return rows

@app.get('/api/admin/team')
def admin_team(authorization:str|None=Header(None)):
    admin_guard(authorization); return team_members()
@app.post('/api/admin/team',status_code=201)
def admin_create_team(payload:TeamMember,authorization:str|None=Header(None)):
    admin_guard(authorization); con=db(); mid=payload.id or ('TM-'+uuid.uuid4().hex[:8].upper())
    if con.execute('SELECT 1 FROM team_members WHERE id=?',(mid,)).fetchone(): con.close(); raise HTTPException(409,'Member ID already exists')
    con.execute('INSERT INTO team_members (id,name,role,bio,quote,photo,is_founder,sort_order) VALUES (?,?,?,?,?,?,?,?)',(mid,payload.name,payload.role,payload.bio,payload.quote,payload.photo,int(payload.is_founder),payload.sort_order)); con.commit(); con.close(); return {'id':mid,'ok':True}
@app.patch('/api/admin/team/{mid}')
def admin_update_team(mid:str,payload:TeamMember,authorization:str|None=Header(None)):
    admin_guard(authorization); con=db(); cur=con.execute('UPDATE team_members SET name=?,role=?,bio=?,quote=?,photo=?,is_founder=?,sort_order=? WHERE id=?',(payload.name,payload.role,payload.bio,payload.quote,payload.photo,int(payload.is_founder),payload.sort_order,mid)); con.commit(); con.close();
    if not cur.rowcount: raise HTTPException(404,'Team member not found')
    return {'ok':True}
@app.delete('/api/admin/team/{mid}')
def admin_delete_team(mid:str,authorization:str|None=Header(None)):
    admin_guard(authorization); con=db(); cur=con.execute('DELETE FROM team_members WHERE id=?',(mid,)); con.commit(); con.close()
    if not cur.rowcount: raise HTTPException(404,'Team member not found')
    return {'ok':True}

def serialize_banner(r):
    d=dict(r); d['active']=bool(d['active']); return d

@app.get('/api/banners')
def banners():
    con=db(); rows=[serialize_banner(r) for r in con.execute('SELECT * FROM banners WHERE active=1 ORDER BY created_at')]; con.close(); return rows
@app.get('/api/admin/banners')
def admin_banners(authorization:str|None=Header(None)):
    admin_guard(authorization); con=db(); rows=[serialize_banner(r) for r in con.execute('SELECT * FROM banners ORDER BY created_at')]; con.close(); return rows
@app.post('/api/admin/banners',status_code=201)
def admin_create_banner(payload:Banner,authorization:str|None=Header(None)):
    admin_guard(authorization); con=db(); bid=payload.id or ('BNR-'+uuid.uuid4().hex[:8].upper())
    if con.execute('SELECT 1 FROM banners WHERE id=?',(bid,)).fetchone(): con.close(); raise HTTPException(409,'Banner ID already exists')
    con.execute('INSERT INTO banners (id,eyebrow,title,subtitle,button_text,button_link,image,active,created_at) VALUES (?,?,?,?,?,?,?,?,?)',(bid,payload.eyebrow,payload.title,payload.subtitle,payload.button_text,payload.button_link,payload.image,int(payload.active),datetime.now(timezone.utc).isoformat())); con.commit(); con.close(); return {'id':bid,'ok':True}
@app.patch('/api/admin/banners/{bid}')
def admin_update_banner(bid:str,payload:Banner,authorization:str|None=Header(None)):
    admin_guard(authorization); con=db(); cur=con.execute('UPDATE banners SET eyebrow=?,title=?,subtitle=?,button_text=?,button_link=?,image=?,active=? WHERE id=?',(payload.eyebrow,payload.title,payload.subtitle,payload.button_text,payload.button_link,payload.image,int(payload.active),bid)); con.commit(); con.close();
    if not cur.rowcount: raise HTTPException(404,'Banner not found')
    return {'ok':True}
@app.delete('/api/admin/banners/{bid}')
def admin_delete_banner(bid:str,authorization:str|None=Header(None)):
    admin_guard(authorization); con=db(); cur=con.execute('DELETE FROM banners WHERE id=?',(bid,)); con.commit(); con.close()
    if not cur.rowcount: raise HTTPException(404,'Banner not found')
    return {'ok':True}

@app.post('/api/coupons/check')
def check_coupon(payload:CouponCheck):
    con=db(); c=con.execute('SELECT * FROM coupons WHERE code=? AND active=1',(payload.code.upper(),)).fetchone(); con.close()
    if not c: raise HTTPException(404,'Invalid coupon')
    if payload.subtotal<c['min_order']: raise HTTPException(400,f"Minimum order is NPR {c['min_order']:,}")
    discount=round(payload.subtotal*c['value']/100) if c['kind']=='percent' else c['value']; return {'code':c['code'],'discount':min(discount,payload.subtotal)}

@app.get('/api/reviews/{product_id}')
def reviews(product_id:str):
    con=db(); rows=[dict(r) for r in con.execute('SELECT r.id,r.rating,r.title,r.body,r.created_at,u.name FROM reviews r JOIN users u ON u.id=r.user_id WHERE product_id=? ORDER BY r.created_at DESC',(product_id,))]; con.close(); return rows
@app.post('/api/reviews')
def add_review(payload:ReviewCreate,authorization:str|None=Header(None)):
    u=auth(authorization); rid='REV-'+uuid.uuid4().hex[:10]; con=db(); con.execute('INSERT INTO reviews VALUES (?,?,?,?,?,?,?)',(rid,payload.product_id,u['id'],payload.rating,payload.title,payload.body,datetime.now(timezone.utc).isoformat())); con.commit(); con.close(); return {'ok':True,'id':rid}

@app.get('/api/wishlist')
def wishlist(authorization:str|None=Header(None)):
    u=auth(authorization); con=db(); ids=[r['product_id'] for r in con.execute('SELECT product_id FROM wishlists WHERE user_id=?',(u['id'],))]; con.close(); return ids
@app.post('/api/wishlist')
def add_wishlist(payload:WishlistChange,authorization:str|None=Header(None)):
    u=auth(authorization); con=db(); con.execute('INSERT OR IGNORE INTO wishlists VALUES (?,?,?)',(u['id'],payload.product_id,datetime.now(timezone.utc).isoformat())); con.commit(); con.close(); return {'ok':True}
@app.delete('/api/wishlist/{product_id}')
def remove_wishlist(product_id:str,authorization:str|None=Header(None)):
    u=auth(authorization); con=db(); con.execute('DELETE FROM wishlists WHERE user_id=? AND product_id=?',(u['id'],product_id)); con.commit(); con.close(); return {'ok':True}

@app.get('/api/builds')
def builds(authorization:str|None=Header(None)):
    u=auth(authorization); con=db(); rows=[dict(r) for r in con.execute('SELECT * FROM saved_builds WHERE user_id=? ORDER BY created_at DESC',(u['id'],))]; con.close();
    for r in rows: r['components']=json.loads(r['components'])
    return rows
@app.post('/api/builds',status_code=201)
def save_build(payload:BuildCreate,authorization:str|None=Header(None)):
    u=auth(authorization); bid='BLD-'+uuid.uuid4().hex[:10]; con=db(); con.execute('INSERT INTO saved_builds VALUES (?,?,?,?,?,?)',(bid,u['id'],payload.name,json.dumps(payload.components),payload.total,datetime.now(timezone.utc).isoformat())); con.commit(); con.close(); return {'id':bid}
@app.delete('/api/builds/{build_id}')
def delete_build(build_id:str,authorization:str|None=Header(None)):
    u=auth(authorization); con=db(); cur=con.execute('DELETE FROM saved_builds WHERE id=? AND user_id=?',(build_id,u['id'])); con.commit(); con.close();
    if not cur.rowcount: raise HTTPException(404,'Build not found')
    return {'ok':True}

@app.get('/api/admin/analytics')
def analytics(authorization:str|None=Header(None)):
    admin_guard(authorization); con=db()
    orders=[dict(r) for r in con.execute('SELECT * FROM orders')]; products=[parse_product(dict(r)) for r in con.execute('SELECT * FROM products WHERE active=1')]; con.close()
    active=[o for o in orders if o['status']!='cancelled']
    revenue=sum(o['total'] for o in active); low=[p for p in products if p['stock']<=5]
    today=datetime.now(timezone.utc).date(); day_totals={}
    for o in active: day_totals[o['created_at'][:10]]=day_totals.get(o['created_at'][:10],0)+o['total']
    sales_by_day=[{'date':(today-timedelta(days=i)).isoformat(),'total':day_totals.get((today-timedelta(days=i)).isoformat(),0)} for i in range(13,-1,-1)]
    agg={}
    for o in orders:
        for it in json.loads(o['items']):
            e=agg.setdefault(it['product_id'],{'name':it['name'],'units':0,'revenue':0})
            e['units']+=it['quantity']; e['revenue']+=it['unit_price']*it['quantity']
    top_products=sorted(agg.values(),key=lambda e:e['revenue'],reverse=True)[:5]
    by_pay={}
    for o in active: by_pay[o['payment_method']]=by_pay.get(o['payment_method'],0)+o['total']
    by_status={}
    for o in orders: by_status[o['status']]=by_status.get(o['status'],0)+1
    avg=round(revenue/len(active)) if active else 0
    return {'orders':len(orders),'revenue':revenue,'pending':sum(o['status']=='pending' for o in orders),'products':len(products),'low_stock':len(low),'low_stock_items':low,'sales_by_day':sales_by_day,'top_products':top_products,'revenue_by_payment':by_pay,'orders_by_status':by_status,'avg_order_value':avg}
