import Link from 'next/link';
import { fetchTeam, imageSrc } from '@/lib/products';

const categories = ['GPUs', 'CPUs', 'Motherboards', 'Memory', 'Cooling'];

export default async function AboutPage() {
  const team = await fetchTeam();
  const founder = team.find(m => m.is_founder) || { id:'founder', name:'', role:'', bio:'', quote:'', photo:'', is_founder:true, sort_order:1 };
  const members = team.filter(m => !m.is_founder);

  return <main className="container about">
    <section className="about-hero">
      <div className="about-hero-content">
        <div className="eyebrow">About Horaa Store</div>
        <h1>Technology. Simplified.</h1>
        <p className="about-hero-sub">More than a store. A place for people who love technology.</p>
        <p className="about-hero-text">Horaa is a modern technology marketplace built for people who don’t just use technology — they live it.</p>
        <p className="about-hero-text">From powerful PC components and gaming hardware to everyday electronics and accessories, we make it easier to discover the right products, make confident decisions, and bring your next upgrade to life.</p>
        <h2>Build Your Dream PC. Your Way.</h2>
        <p className="about-hero-text">Whether you’re building your first PC, creating a powerful gaming setup, upgrading your workstation, or searching for that perfect component, Horaa gives you the tools and technology to build the setup you’ve always imagined.</p>
        <div className="about-steps">
          <span>Choose your components.</span>
          <span>Create your setup.</span>
          <span>Build your dream PC.</span>
        </div>
        <p className="about-hero-closing">Because your perfect PC shouldn’t be someone else’s build.</p>
        <div className="actions about-hero-actions"><Link className="primary" href="/shop">Explore Products</Link><Link className="secondary" href="/build-pc">Build Your Dream PC</Link></div>
      </div>
      <div className="about-hero-media">
        <video src="/assets/about1.mp4" autoPlay muted loop playsInline/>
      </div>
    </section>

    <section className="about-founder">
      <div className="about-founder-quote">
        <div className="about-founder-photo">{founder.photo ? <img src={imageSrc(founder.photo)} alt={founder.name}/> : <span>{founder.name.charAt(0)||'H'}</span>}</div>
        <span className="about-quote-mark">“</span>
        <p>{founder.quote}</p>
        <b>{founder.name}</b><em>{founder.role}</em>
      </div>
      <div className="about-founder-text">
        <h2>Message from our Founder</h2>
        <p>At Horaa, we believe that technology should be an extension of human intent, not a barrier to it. Our journey began with a simple realization: the most powerful tools are those that disappear into the workflow, leaving only the results.</p>
        <p>We are committed to engineering precision and uncompromised quality. Every component we source and every system we architect is a testament to our dedication to the craft of computing.</p>
      </div>
    </section>

    <section className="about-section">
      <div className="section-head"><h2>The Minds Behind the Horaa Store</h2><span>A collective of engineers, designers, and visionaries.</span></div>
      <div className="about-team">
        {members.map(m => <div className="about-card" key={m.id}>
          <div className="about-avatar">{m.photo ? <img src={imageSrc(m.photo)} alt={m.name}/> : <span>{m.name.charAt(0)}</span>}</div>
          <div className="about-card-head"><h3>{m.name}</h3><span>{m.role}</span></div>
          <p>{m.bio}</p>
        </div>)}
      </div>
    </section>

    <section className="about-section">
      <div className="section-head"><h2>Architecting the Future</h2><span>From silicon to system — explore what we build with.</span></div>
      <div className="about-chips">
        {categories.map(c => <Link key={c} className="about-chip" href="/shop">{c}</Link>)}
      </div>
    </section>
  </main>;
}
