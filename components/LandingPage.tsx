
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sphere, Environment, Points, PointMaterial, Torus, MeshWobbleMaterial } from '@react-three/drei';
import { 
  ArrowRight, Zap, X, CheckCircle2, Lock, 
  ShieldCheck, Database, Search, Fingerprint, Sparkles, Clock, Target, Workflow,
  ShieldAlert, Beaker, Cpu, Globe, Scale, FileText, Shield
} from 'lucide-react';
import Logo from './Logo';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

const ScienceMorph = ({ triggerRef }: { triggerRef: React.RefObject<HTMLElement> }) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);
  const { mouse, viewport } = useThree();

  useEffect(() => {
    if (!groupRef.current || !triggerRef.current) return;

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: triggerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
      }
    });

    timeline.to(groupRef.current.rotation, { y: Math.PI * 4, ease: "none" }, 0);
    timeline.to(groupRef.current.scale, { x: 0.25, y: 0.25, z: 0.25, ease: "power2.inOut" }, 0.1);
    timeline.to(groupRef.current.position, { x: 2.5, y: -1.5, ease: "power2.inOut" }, 0.4);

    return () => { ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, [triggerRef]);

  useFrame(() => {
    if (groupRef.current) {
      const targetX = (mouse.x * viewport.width) / 18;
      const targetY = (mouse.y * viewport.height) / 18;
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.02);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.02);
    }
    if (ringRef.current) {
      ringRef.current.rotation.x += 0.004;
      ringRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.2} rotationIntensity={0.8} floatIntensity={1.2}>
        <mesh ref={coreRef}>
          <octahedronGeometry args={[2.5, 0]} />
          <MeshWobbleMaterial
            color="#14b8a6"
            speed={1.5}
            factor={0.3}
            transparent
            opacity={0.12}
            emissive="#14b8a6"
            emissiveIntensity={0.8}
          />
        </mesh>
      </Float>

      <group ref={ringRef}>
        {[0, 1, 2].map((i) => (
          <Torus key={i} args={[4 + i * 0.4, 0.008, 16, 100]} rotation={[i * Math.PI / 4, i * Math.PI / 6, 0]}>
            <meshStandardMaterial color="#2dd4bf" transparent opacity={0.08} />
          </Torus>
        ))}
      </group>
      
      <Points limit={2000}>
        <PointMaterial transparent color="#5eead4" size={0.02} sizeAttenuation={true} depthWrite={false} blending={THREE.AdditiveBlending} />
        {Array.from({ length: 600 }).map((_, i) => (
          <primitive key={i} object={new THREE.Vector3((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15)} />
        ))}
      </Points>
    </group>
  );
};

const SectionHeader = ({ tag, title, desc, align = 'center' }: { tag: string, title: string, desc?: string, align?: 'left' | 'center' }) => (
  <div className={`mb-12 ${align === 'center' ? 'text-center mx-auto' : 'text-left'} max-w-3xl px-4`}>
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-medical-500/5 border border-medical-500/20 text-medical-400 text-[8px] font-black uppercase tracking-[0.4em] mb-4`}>
      <Sparkles className="w-2.5 h-2.5 text-medical-500" />
      {tag}
    </div>
    <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white leading-tight">
      {title}
    </h2>
    {desc && <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed max-w-2xl tracking-tight">{desc}</p>}
  </div>
);

interface LandingPageProps { onStart: () => void; }

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const containerRef = useRef<HTMLElement>(null);

  const logs = [
    "Établissement d'une connexion sécurisée...",
    "Montage du système de fichiers clinique PRISMA...",
    "Initialisation du cluster Agentic Scout...",
    "Handshake terminé. Espace de travail prêt."
  ];

  const handleStart = () => {
    setIsScanning(true);
    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < logs.length) {
        setBootLogs(prev => [...prev, `> ${logs[logIndex]}`]);
        logIndex++;
      } else {
        clearInterval(interval);
        setTimeout(onStart, 600);
      }
    }, 300);
  };

  return (
    <div className="bg-[#020617] text-white selection:bg-medical-500/40">
      <div className="scan-overlay opacity-10" />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 10], fov: 35 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#14b8a6" />
          <ScienceMorph triggerRef={containerRef} />
          <Environment preset="night" />
        </Canvas>
      </div>

      <nav className="fixed top-0 w-full z-[100] px-6 py-4 flex justify-between items-center bg-slate-950/40 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Logo className="w-10 h-10 shadow-lg transform transition-transform group-hover:scale-110" />
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tighter leading-none">MediMind</span>
            <span className="text-[7px] text-medical-500 font-mono tracking-[0.4em] uppercase font-black">Recherche Autonome</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="hidden lg:flex gap-6 text-[8px] font-black uppercase tracking-[0.4em] text-slate-500">
              <a href="#benefits" className="hover:text-medical-400 transition-colors">Impact</a>
              <a href="#pipeline" className="hover:text-medical-400 transition-colors">Architecture</a>
              <a href="#integrity" className="hover:text-medical-400 transition-colors">Sécurité</a>
           </div>
           <button 
             onClick={() => setShowAuthModal(true)} 
             className="bg-white text-slate-950 px-5 py-2 rounded-lg text-[9px] font-black tracking-[0.2em] transition-all hover:bg-medical-400 shadow-xl active:scale-95"
           >
             ACCÉDER_À_L_ESPACE
           </button>
        </div>
      </nav>

      <main ref={containerRef} className="relative z-10">
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-16">
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="flex justify-center mb-6">
               <div className="px-3 py-1 rounded-full bg-slate-900/60 border border-white/5 backdrop-blur-md flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-medical-500 animate-ping" />
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Noyau_v3.5_Actif</span>
               </div>
            </div>
            <h1 className="text-4xl md:text-7xl font-black tracking-tight mb-6 text-white leading-tight">
              Recherche <br />
              <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-medical-400 to-indigo-500">Clinique Autonome.</span>
            </h1>
            <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto font-medium leading-relaxed mb-10 tracking-tight">
              Un agent de recherche haute-fidélité mimant les processus cognitifs rigoureux des comités scientifiques. De la synthèse à la conception d'essais.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <button 
                 onClick={() => setShowAuthModal(true)}
                 className="px-8 py-4 bg-medical-500 text-slate-950 rounded-xl font-black text-base tracking-tight flex items-center gap-3 shadow-xl hover:scale-105 transition-all group"
               >
                 Commencer <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </button>
               <a href="#benefits" className="px-6 py-4 bg-slate-900/50 border border-white/5 text-white rounded-xl font-black text-base tracking-tight hover:bg-slate-800 transition-all">
                 Architecture
               </a>
            </div>
          </div>
        </section>

        <section id="benefits" className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
             <SectionHeader 
               tag="L'Avantage Clinique" 
               title="Conçu pour la Rigueur." 
               desc="Ingénierie répondant aux exigences absolues de la synthèse de preuves cliniques."
             />
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: Target, title: 'Zéro Hallucination', desc: 'Chaque affirmation est validée par rapport aux bases NIH et PubMed. La logique non-sourcée est purgée.' },
                  { icon: Clock, title: 'Vélocité Extrême', desc: 'Compressez des mois de revue systématique en quelques secondes. Concentrez-vous sur la découverte.' },
                  { icon: ShieldCheck, title: 'Résultats Certifiés', desc: 'Les rapports sont conformes IMRAD et standardisés MeSH. Prêts pour les comités de lecture.' }
                ].map((benefit, i) => (
                  <div key={i} className="p-8 rounded-2xl bg-slate-900/30 border border-white/5 hover:border-medical-500/20 transition-all group">
                     <div className="w-12 h-12 bg-medical-500/5 rounded-xl border border-medical-500/10 flex items-center justify-center mb-5 group-hover:bg-medical-500 transition-colors">
                        <benefit.icon className="w-6 h-6 text-medical-500 group-hover:text-slate-950 transition-colors" />
                     </div>
                     <h3 className="text-lg font-bold text-white mb-3 tracking-tight uppercase">{benefit.title}</h3>
                     <p className="text-slate-500 text-sm leading-relaxed">{benefit.desc}</p>
                  </div>
                ))}
             </div>
          </div>
        </section>

        <section id="pipeline" className="py-24 px-6 bg-slate-950/40">
          <div className="max-w-5xl mx-auto text-center">
             <SectionHeader 
               tag="La Pile de Découverte" 
               title="Clusters Autonomes." 
               desc="Un environnement multi-agents synchronisé mimant un comité MD/PhD."
             />
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Search, name: 'Agent Scout', metrics: '120 Articles/min' },
                { icon: Beaker, name: 'Agent Pathologiste', metrics: '99% Véracité' },
                { icon: Workflow, name: 'Agent Protocole', metrics: 'Opti ISO' },
                { icon: ShieldAlert, name: 'Agent Garde', metrics: 'Zéro Bruit' }
              ].map((agent, i) => (
                <div key={i} className="glass-hud group p-6 rounded-2xl border-white/5 hover:border-medical-500/20 transition-all flex flex-col items-center">
                   <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center mb-4 border border-white/5 group-hover:bg-medical-500 group-hover:text-slate-950 transition-colors">
                      <agent.icon className="w-5 h-5" />
                   </div>
                   <h4 className="text-sm font-bold mb-2 text-white tracking-tight">{agent.name}</h4>
                   <span className="text-[9px] font-black font-mono text-medical-500 uppercase tracking-widest">{agent.metrics}</span>
                </div>
              ))}
             </div>
          </div>
        </section>

        <section id="integrity" className="py-24 px-6 border-y border-white/5">
          <div className="max-w-5xl mx-auto">
             <SectionHeader 
               tag="Intégrité & Conformité" 
               title="La Confiance est le Noyau." 
               desc="Protocoles avancés garantissant que vos données de recherche restent privées, éthiques et scientifiquement solides."
             />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { 
                    icon: Lock, 
                    title: 'Souveraineté des Données', 
                    desc: 'Chiffrement AES-256 de bout en bout. Vos paramètres et entrées ne sont jamais utilisés pour entraîner des modèles IA globaux.' 
                  },
                  { 
                    icon: Scale, 
                    title: 'Cadre IA Éthique', 
                    desc: 'Algorithmes anti-biais surveillant les interactions agents. Chaque revue suit les directives PRISMA et GRADE.' 
                  },
                  { 
                    icon: Shield, 
                    title: 'Alignement Institutionnel', 
                    desc: 'Architecturé pour s\'aligner sur les standards HIPAA-ready et les principes de minimisation des données RGPD.' 
                  },
                  { 
                    icon: FileText, 
                    title: 'Rigueur MeSH', 
                    desc: 'Toute la terminologie est mappée sur le thésaurus Medical Subject Headings (MeSH), garantissant l\'interopérabilité mondiale.' 
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 p-6 rounded-3xl bg-slate-900/20 border border-white/5 hover:bg-slate-900/40 transition-all">
                     <div className="w-14 h-14 shrink-0 bg-medical-500/10 rounded-2xl flex items-center justify-center text-medical-400 border border-medical-500/20">
                        <item.icon className="w-7 h-7" />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-white mb-2 tracking-tight uppercase">{item.title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium">{item.desc}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </section>

        <section className="py-32 px-6 text-center">
           <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8 text-white">
                Lancez Votre Prochaine <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-medical-400 to-indigo-500 italic font-serif">Session de Recherche.</span>
              </h2>
              <button 
                onClick={() => setShowAuthModal(true)}
                className="group px-8 py-4 bg-medical-500 text-slate-950 font-black rounded-xl text-xl transition-all transform hover:scale-105 shadow-2xl flex items-center gap-4 mx-auto"
              >
                Initialiser le Noyau <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </section>
      </main>

      {showAuthModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => !isScanning && setShowAuthModal(false)} />
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full relative z-10 shadow-2xl overflow-hidden">
            {isScanning && (
              <div className="absolute inset-0 z-50 bg-[#020617] p-10 flex flex-col items-center justify-center animate-in fade-in">
                 <div className="w-32 h-32 rounded-2xl border-2 border-medical-500/20 flex items-center justify-center relative mb-8">
                    <div className="absolute inset-0 rounded-2xl border-t-2 border-medical-500 animate-[spin_1s_linear_infinite]" />
                    <Logo className="w-16 h-16 animate-pulse" />
                 </div>
                 <h4 className="text-lg font-black text-white uppercase tracking-[0.4em] mb-4">Démarrage_Noyau</h4>
                 <div className="w-full space-y-1.5 font-mono text-[8px] text-emerald-500/80">
                   {bootLogs.map((log, i) => <div key={i}>{log}</div>)}
                   <div className="w-1 h-2 bg-emerald-500 animate-pulse inline-block" />
                 </div>
              </div>
            )}
            <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-slate-600 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            <div className="text-center mb-8">
               <div className="w-16 h-16 bg-medical-500 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-xl"><Lock className="w-8 h-8 text-slate-950" /></div>
               <h3 className="text-2xl font-black mb-2 uppercase text-white tracking-tight">Authentification</h3>
               <p className="text-slate-500 text-base font-medium">Certifier la conformité aux standards de gouvernance clinique.</p>
            </div>
            <div className="space-y-6">
               <div className="p-6 rounded-2xl bg-slate-950 border border-white/5">
                  <p className="text-[12px] text-slate-500 leading-relaxed italic mb-6">
                    Je reconnais que MediMind est une couche d'orchestration autonome et que la vérification humaine finale est obligatoire.
                  </p>
                  <label className="flex items-center gap-4 cursor-pointer group/check">
                    <div className={`w-7 h-7 rounded-lg border-2 transition-all flex items-center justify-center ${agreedToTerms ? 'bg-medical-500 border-medical-500' : 'border-slate-800 bg-slate-900'}`}>
                       <input type="checkbox" className="hidden" checked={agreedToTerms} onChange={() => setAgreedToTerms(!agreedToTerms)} />
                       {agreedToTerms && <CheckCircle2 className="w-4 h-4 text-slate-950" />}
                    </div>
                    <span className="text-base font-bold text-slate-300">J'accepte les standards.</span>
                  </label>
               </div>
               <button 
                onClick={handleStart} 
                disabled={!agreedToTerms} 
                className="w-full py-5 bg-medical-500 hover:bg-white text-slate-950 font-black rounded-xl transition-all disabled:opacity-20 flex items-center justify-center gap-3 text-xl shadow-xl"
               >
                 ENTRER <Zap className="w-5 h-5 fill-current" />
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
