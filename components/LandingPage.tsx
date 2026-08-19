'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Crown, 
  Swords, 
  Sparkles, 
  Dices, 
  Volume2, 
  VolumeX,
  Cpu, 
  Eye, 
  Compass, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ChevronRight, 
  Play, 
  Layers, 
  Lock,
  Award,
  Sparkle,
  RefreshCw,
  Zap,
  Music,
  Send,
  Skull,
  HelpCircle
} from 'lucide-react';
// @ts-ignore
import confetti from 'canvas-confetti';
import { useAuth } from '@/context/AuthContext';

interface LandingPageProps {
  onEnterDM: () => void;
  onEnterPlayer: () => void;
  onOpenAuthModal: () => void;
  onLoadDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterDM,
  onEnterPlayer,
  onOpenAuthModal,
  onLoadDemo,
}) => {
  const { user } = useAuth();
  
  // Carousel State
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isSlideHovered, setIsSlideHovered] = useState<boolean>(false);
  const [activeModuleTab, setActiveModuleTab] = useState<'live_cockpit' | 'battle_3d' | 'worldbuilder' | 'audio' | 'ai'>('live_cockpit');
  const [comparisonFilter, setComparisonFilter] = useState<'all' | 'roll20' | 'foundry' | 'beyond' | 'alchemy'>('all');

  // Interactive Dice Roller State
  const [isRollingDice, setIsRollingDice] = useState<boolean>(false);
  const [diceRollResult, setDiceRollResult] = useState<number | null>(20);
  const [diceRollMessage, setDiceRollMessage] = useState<string>('Role para testar sua sorte!');
  const [rollCount, setRollCount] = useState<number>(0);

  // Interactive Sound Player State
  const [activeSoundtrack, setActiveSoundtrack] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<any[]>([]);

  // Interactive AI Simulator State
  const [activeAIPrompt, setActiveAIPrompt] = useState<string>('npc');
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState<any>({
    title: 'Gromm Barba-de-Ferro (NPC)',
    type: 'Anão da Montanha • Ex-Gladiador & Taverneiro',
    quote: '"Beba a cerveja escura ou saia antes que eu mostre como perdi esse olho."',
    stats: 'CA 16 • HP 68 • Força 18 (+4) • Carisma 8 (-1)',
    hook: 'Possui uma chave de ferro enferrujada para as catacumbas sob a adega da taverna.',
  });

  const heroSlides = [
    {
      id: 0,
      image: '/assets/landing/slide-1-dungeon.jpg',
      badge: '🔦 DYNAMIC LIGHTING & FOG OF WAR',
      badgeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      title: 'Masmorras Táticas com Iluminação Dinâmica Real',
      subtitle: 'Névoa de Guerra precisa com cálculo de sombras por raycasting 360°, tochas com animação de luz e importação instantânea de mapas UVTT / Dungeondraft.',
      tags: ['Linha de Visão (LoS)', 'Tochas & Sombras', 'Importação UVTT', 'Visão no Escuro'],
      actionText: 'Forjar Masmorras',
    },
    {
      id: 1,
      image: '/assets/landing/slide-2-battle3d.jpg',
      badge: '⚔️ BATTLE GRID 3D WEBGL',
      badgeColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
      title: 'Combates 3D Imersivos Direto no Navegador',
      subtitle: 'Posicione miniaturas 3D detalhadas, projete áreas de magias (cones, esferas e linhas iluminadas), controle clima de tempestade e lute a 60 FPS sem baixar nada.',
      tags: ['Miniaturas 3D', 'Áreas de Magia (AoE)', 'Clima & Tempestade', '100% WebGL'],
      actionText: 'Explorar Grid 3D',
    },
    {
      id: 2,
      image: '/assets/landing/slide-3-cockpit.jpg',
      badge: '🎲 LIVE COCKPIT & DADOS 3D SINCRONIZADOS',
      badgeColor: 'text-amber-300 border-amber-400/40 bg-amber-500/15',
      title: 'Centro de Comando do Mestre & Dados Estilo BG3',
      subtitle: 'Rolagens de dados 3D cinematográficas sincronizadas para todos os jogadores com física real. Controle iniciativa, teleprompter, HP live e divisão de loot com um clique.',
      tags: ['Dados 3D Baldur\'s Gate', 'Rolagens Secretas', 'HP Sincronizado', 'Party Loot'],
      actionText: 'Entrar no Cockpit',
    },
    {
      id: 3,
      image: '/assets/landing/slide-4-worldbuilder.jpg',
      badge: '🗺️ WORLDBUILDER & LOREGRAPH RELACIONAL',
      badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      title: 'Crie Mundos Vivos e Teias de Conspiração',
      subtitle: 'Conecte continentes, facções, dinastias nobres e NPCs em um grafo relacional interativo. Mapas mundi com pins clicáveis e IA Co-Pilot com memória de campanha.',
      tags: ['Grafo de Facções', 'Pins no Mapa Mundi', 'Quest Tracker', 'IA Co-Pilot RAG'],
      actionText: 'Criar Cenário',
    },
  ];

  // Auto-play effect with 6.5s duration
  useEffect(() => {
    if (isSlideHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [isSlideHovered, heroSlides.length]);

  // Ambient Embers / Sparks Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Create 45 ambient fire ember particles
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.8,
      speedY: Math.random() * 0.7 + 0.3,
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.4 ? '#f59e0b' : '#ef4444',
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX;

        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  // Handle Interactive 1d20 Roll
  const handleRollInteractiveDice = () => {
    if (isRollingDice) return;
    setIsRollingDice(true);

    let rolls = 0;
    const maxRolls = 14;
    const interval = setInterval(() => {
      const tempVal = Math.floor(Math.random() * 20) + 1;
      setDiceRollResult(tempVal);
      rolls++;

      if (rolls >= maxRolls) {
        clearInterval(interval);
        const finalVal = Math.floor(Math.random() * 20) + 1;
        setDiceRollResult(finalVal);
        setIsRollingDice(false);
        setRollCount((c) => c + 1);

        if (finalVal === 20) {
          setDiceRollMessage('🔥 20 NATURAL! ACERTO CRÍTICO! Os deuses do RPG abençoaram sua mesa!');
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#f59e0b', '#fbbf24', '#d97706', '#10b981'],
            });
          } catch (e) {}
        } else if (finalVal === 1) {
          setDiceRollMessage('💀 1 NATURAL! FALHA CRÍTICA! O dragão acordou faminto...');
        } else if (finalVal >= 15) {
          setDiceRollMessage(`✨ ${finalVal} — Sucesso Espetacular! Golpe certeiro no chefe da masmorra.`);
        } else if (finalVal >= 10) {
          setDiceRollMessage(`⚔️ ${finalVal} — Sucesso Moderado. A aventura continua com tensão.`);
        } else {
          setDiceRollMessage(`🛡️ ${finalVal} — Quase! Prepare sua salvaguarda para o próximo turno.`);
        }
      }
    }, 70);
  };

  // Synthesize ambient sound preview
  const playSoundtrackPreview = (type: 'tavern' | 'battle' | 'dungeon') => {
    if (activeSoundtrack === type) {
      // Stop
      activeOscillatorsRef.current.forEach((node) => {
        try {
          node.stop();
          node.disconnect();
        } catch (e) {}
      });
      activeOscillatorsRef.current = [];
      setActiveSoundtrack(null);
      return;
    }

    // Stop current
    activeOscillatorsRef.current.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {}
    });
    activeOscillatorsRef.current = [];

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.12, ctx.currentTime);
      masterGain.connect(ctx.destination);

      if (type === 'tavern') {
        // Warm tavern chords
        const freqs = [220, 277.18, 329.63, 440];
        freqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.04 / (i + 1), ctx.currentTime);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start();
          activeOscillatorsRef.current.push(osc);
        });
      } else if (type === 'battle') {
        // Deep war drum pulses
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(4, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(20, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        osc.connect(masterGain);
        lfo.start();
        osc.start();
        activeOscillatorsRef.current.push(osc, lfo);
      } else if (type === 'dungeon') {
        // Mystic dungeon drone
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(73.42, ctx.currentTime); // D2
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(146.83, ctx.currentTime);
        osc.connect(masterGain);
        osc2.connect(masterGain);
        osc.start();
        osc2.start();
        activeOscillatorsRef.current.push(osc, osc2);
      }

      setActiveSoundtrack(type);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle AI Simulator change
  const handleSelectAIPrompt = (promptKey: 'npc' | 'encounter' | 'riddle') => {
    setActiveAIPrompt(promptKey);
    setAiGenerating(true);

    setTimeout(() => {
      if (promptKey === 'npc') {
        setAiGeneratedContent({
          title: 'Gromm Barba-de-Ferro (NPC)',
          type: 'Anão da Montanha • Ex-Gladiador & Taverneiro',
          quote: '"Beba a cerveja escura ou saia antes que eu mostre como perdi esse olho."',
          stats: 'CA 16 • HP 68 • Força 18 (+4) • Carisma 8 (-1)',
          hook: 'Possui uma chave de ferro enferrujada para as catacumbas sob a adega da taverna.',
        });
      } else if (promptKey === 'encounter') {
        setAiGeneratedContent({
          title: 'Emboscada na Névoa dos Lamentos (Encontro CR 4)',
          type: 'Ambiente: Pântano Sombrio com Névoa Pesada',
          quote: 'O ranger da água negra cessa. Três sombras com olhos esmeralda emergem dos juncos.',
          stats: '2x Espreitadores do Lodo (CR 1) + 1x Bruxa do Pântano (CR 3)',
          hook: 'A bruxa carrega um amuleto que impede o avanço da névoa de guerra no mapa.',
        });
      } else if (promptKey === 'riddle') {
        setAiGeneratedContent({
          title: 'O Enigma do Portão de Obsidiana (Charada)',
          type: 'Desafio Arcano: CD 14 Investigação / Arcanismo',
          quote: '"Tenho dentes mas não mordo, guardo segredos que não conto, e abro caminhos aos sábios."',
          stats: 'Resposta: A Chave Antiga de Prata (Item no inventário do grupo)',
          hook: 'Se errarem, uma onda de choque de 2d6 de dano de trovão empurra o grupo 3 metros para trás.',
        });
      }
      setAiGenerating(false);
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-[#06080d] text-slate-100 font-sans selection:bg-amber-500/30 selection:text-amber-200 relative overflow-x-hidden">
      
      {/* 🌌 Ambient Canvas for Rising Fire Embers */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-70" />

      {/* Ambient Lighting Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[20%] w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[35%] right-[-5%] w-[700px] h-[700px] bg-rose-950/15 rounded-full blur-[160px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[800px] h-[800px] bg-emerald-950/15 rounded-full blur-[180px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d08_1px,transparent_1px),linear-gradient(to_bottom,#1f293d08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* ========================================================= */}
      {/* 1. TOP NAVBAR / HEADER DE ACESSO FIXO NO TOPO            */}
      {/* ========================================================= */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#080b12]/95 border-b border-[#1c2438] shadow-2xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo + Name */}
          <div 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0 group select-none" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border border-amber-500/40 p-1.5 shadow-[0_0_20px_rgba(245,158,11,0.2)] group-hover:border-amber-400/80 transition-all">
              <img src="/logo.png" alt="Masters Codex" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base md:text-lg tracking-wider text-slate-100 uppercase whitespace-nowrap">
                  MASTER'S <span className="text-amber-500">CODEX</span>
                </span>
                <span className="hidden md:inline-flex items-center text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                  D&D 5E VTT
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-400 hidden lg:block tracking-wide whitespace-nowrap">
                The All-In-One Virtual Tabletop & Worldbuilder
              </span>
            </div>
          </div>

          {/* Navigation Anchors */}
          <nav className="hidden xl:flex items-center gap-6 2xl:gap-8 text-sm font-medium text-slate-300 shrink-0">
            <button 
              onClick={() => scrollToSection('dice-playground')} 
              className="hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            >
              <Dices className="w-4 h-4 text-amber-400" />
              <span>Rolar 1d20</span>
            </button>
            <button 
              onClick={() => scrollToSection('recursos')} 
              className="hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              Recursos
            </button>
            <button 
              onClick={() => scrollToSection('comparativo')} 
              className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Vs Concorrentes</span>
              <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                Vantagem
              </span>
            </button>
            <button 
              onClick={() => scrollToSection('modulos')} 
              className="hover:text-amber-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              Módulos
            </button>
          </nav>

          {/* Action Buttons: Login / DM / Player */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-slate-100 bg-[#121826] hover:bg-[#1a2336] border border-[#243048] hover:border-slate-500 transition-all cursor-pointer shadow-sm whitespace-nowrap"
            >
              {user ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="max-w-[70px] sm:max-w-[100px] truncate">{user.displayName || 'Minha Conta'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">Entrar</span>
                </>
              )}
            </button>

            <button
              onClick={onEnterPlayer}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-200 bg-[#151c2c] hover:bg-[#1f2940] border border-cyan-500/30 hover:border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all cursor-pointer whitespace-nowrap"
              title="Acessar painel do Jogador (Lobby & Ficha)"
            >
              <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
              <span>Jogador</span>
            </button>

            <button
              onClick={onEnterDM}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 border border-amber-300/40 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
              title="Acessar Forja do Mestre (Live Cockpit, Worldbuilder, Combates)"
            >
              <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 shrink-0" />
              <span>Mestre (DM)</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. FULL-WIDTH HERO SLIDESHOW                              */}
      {/* ========================================================= */}
      <section 
        className="pt-20 relative w-full overflow-hidden bg-[#06080d] border-b border-[#1c2438] select-none group z-10"
        onMouseEnter={() => setIsSlideHovered(true)}
        onMouseLeave={() => setIsSlideHovered(false)}
      >
        <div className="relative w-full h-[500px] sm:h-[560px] md:h-[620px] lg:h-[660px] overflow-hidden">
          
          {heroSlides.map((slide, idx) => {
            const isActive = currentSlide === idx;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-all duration-1000 ease-out ${
                  isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 pointer-events-none z-0'
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-[#06080d]/45 to-[#080b13]/40" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#06080d]/95 via-[#06080d]/80 md:via-[#06080d]/40 to-transparent" />
                <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.9)]" />

                <div className="absolute inset-0 z-20 flex items-center pointer-events-none">
                  <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pointer-events-auto">
                    <div className="max-w-2xl space-y-4 sm:space-y-5">
                      
                      <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border backdrop-blur-md shadow-md text-xs font-bold tracking-wider uppercase font-mono ${slide.badgeColor}`}>
                        <Sparkle className="w-3.5 h-3.5 animate-pulse" />
                        <span>{slide.badge}</span>
                      </div>

                      <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-100 tracking-tight leading-[1.1] drop-shadow-2xl">
                        {slide.title}
                      </h2>

                      <p className="text-xs sm:text-sm md:text-base text-slate-200 leading-relaxed font-normal drop-shadow-md max-w-xl">
                        {slide.subtitle}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {slide.tags.map((tag, tIdx) => (
                          <span 
                            key={tIdx}
                            className="px-2.5 py-1 rounded-lg bg-[#0d1322]/90 border border-[#222e47] text-[11px] font-medium text-slate-200 backdrop-blur-md shadow-sm"
                          >
                            ✓ {tag}
                          </span>
                        ))}
                      </div>

                      <div className="pt-3 sm:pt-4 flex items-center gap-3">
                        <button
                          onClick={onEnterDM}
                          className="px-5 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 border border-amber-300/60 shadow-[0_0_25px_rgba(245,158,11,0.35)] flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.03]"
                        >
                          <Crown className="w-4 h-4 text-slate-950" />
                          <span>{slide.actionText}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        <button
                          onClick={onEnterPlayer}
                          className="px-4 sm:px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-slate-200 bg-[#121826]/90 hover:bg-[#1a2336] border border-[#27344e] backdrop-blur-md flex items-center gap-2 cursor-pointer transition-all hover:border-cyan-400/50"
                        >
                          <Swords className="w-4 h-4 text-cyan-400" />
                          <span>Mesa do Jogador</span>
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-[#080b12]/80 hover:bg-amber-500 text-slate-300 hover:text-slate-950 border border-white/10 hover:border-amber-400 backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-2xl"
            title="Slide Anterior"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-[#080b12]/80 hover:bg-amber-500 text-slate-300 hover:text-slate-950 border border-white/10 hover:border-amber-400 backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-2xl"
            title="Próximo Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Tabs Bar */}
        <div className="w-full bg-[#080b12]/95 border-t border-[#1b253b] backdrop-blur-md">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-[#1b253b]">
            {heroSlides.map((slide, idx) => {
              const isActive = currentSlide === idx;
              return (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(idx)}
                  className={`p-3.5 sm:p-4 text-left transition-all relative overflow-hidden cursor-pointer ${
                    isActive ? 'bg-[#121929]' : 'hover:bg-[#0d1320] opacity-70 hover:opacity-100'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500 animate-[progress_6.5s_linear]" />
                  )}
                  
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs font-mono font-bold ${isActive ? 'text-amber-400' : 'text-slate-500'}`}>
                      0{idx + 1}
                    </span>
                    <span className={`text-xs font-bold truncate ${isActive ? 'text-slate-100' : 'text-slate-400'}`}>
                      {slide.title.split(' ')[0]} {slide.title.split(' ')[1]}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5 hidden sm:block">
                    {slide.badge.replace(/[^a-zA-Z &]/g, '')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. 🎲 INTERACTIVE 1D20 PLAYGROUND WIDGET                 */}
      {/* ========================================================= */}
      <section id="dice-playground" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#121827] via-[#0e1320] to-[#151c2d] border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.1)] flex flex-col lg:flex-row items-center justify-between gap-8">
          
          <div className="space-y-3 text-center lg:text-left max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono uppercase">
              <Dices className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Experiência Interativa • Teste seu Destino</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-100">
              Role a Iniciativa da Sua Próxima Campanha!
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              O motor de dados 3D do Master's Codex sincroniza física realista, rolagens secretas e cálculos automáticos para toda a sua mesa. Clique no dado para rolar agora!
            </p>
          </div>

          {/* Dice Roller Card */}
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#090d16]/90 p-5 rounded-2xl border border-[#243048] shadow-inner">
            
            {/* Interactive Glowing D20 */}
            <button
              onClick={handleRollInteractiveDice}
              disabled={isRollingDice}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border-2 ${
                diceRollResult === 20 ? 'border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6)] animate-pulse' : 'border-amber-500/40 hover:border-amber-400 shadow-lg'
              } flex flex-col items-center justify-center gap-1 cursor-pointer transition-all transform hover:scale-105 active:scale-95 group relative select-none`}
              title="Clique para Rolar o D20!"
            >
              <div className="text-3xl sm:text-4xl font-black font-mono text-amber-400 drop-shadow">
                {isRollingDice ? '🎲' : diceRollResult}
              </div>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-300 font-mono tracking-widest uppercase">
                {isRollingDice ? 'Rolando...' : '1d20'}
              </span>
            </button>

            {/* Roll Outcome & Action */}
            <div className="space-y-2 text-center sm:text-left max-w-xs">
              <div className="text-xs font-bold text-amber-300 font-mono flex items-center justify-center sm:justify-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Resultado: {diceRollResult}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {diceRollMessage}
              </p>
              <div className="pt-1">
                <button
                  onClick={handleRollInteractiveDice}
                  disabled={isRollingDice}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
                >
                  <RefreshCw className={`w-3 h-3 ${isRollingDice ? 'animate-spin' : ''}`} />
                  <span>Rolar Novamente</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. MATRIZ COMPARATIVA COM FILTROS GAMIFICADOS             */}
      {/* ========================================================= */}
      <section id="comparativo" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#1a2336] relative z-10 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>Análise Competitiva de Mercado</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-100">
            Por Que o Masters Codex Supera a Concorrência?
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Compare o Masters Codex com as principais plataformas mundiais e descubra por que centenas de mestres estão migrando.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setComparisonFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              comparisonFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-[#101624] text-slate-400 hover:text-slate-200 border border-[#1e283d]'
            }`}
          >
            Todos os Concorrentes
          </button>
          <button
            onClick={() => setComparisonFilter('roll20')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              comparisonFilter === 'roll20'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-[#101624] text-slate-400 hover:text-slate-200 border border-[#1e283d]'
            }`}
          >
            Vs Roll20
          </button>
          <button
            onClick={() => setComparisonFilter('foundry')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              comparisonFilter === 'foundry'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-[#101624] text-slate-400 hover:text-slate-200 border border-[#1e283d]'
            }`}
          >
            Vs Foundry VTT
          </button>
          <button
            onClick={() => setComparisonFilter('beyond')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              comparisonFilter === 'beyond'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-[#101624] text-slate-400 hover:text-slate-200 border border-[#1e283d]'
            }`}
          >
            Vs D&D Beyond
          </button>
        </div>

        {/* Comparison Table Card */}
        <div className="rounded-3xl bg-[#0b0f19] border border-[#1f2a40] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1f2a40] bg-[#0e1422]">
                  <th className="p-4 sm:p-5 text-sm font-bold text-slate-300 min-w-[220px]">
                    Funcionalidade / Vantagem
                  </th>
                  <th className="p-4 sm:p-5 text-sm font-extrabold text-amber-400 bg-amber-500/10 border-x border-amber-500/30 min-w-[170px] text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>Masters Codex</span>
                    </div>
                  </th>
                  {(comparisonFilter === 'all' || comparisonFilter === 'roll20') && (
                    <th className="p-4 sm:p-5 text-xs sm:text-sm font-semibold text-slate-400 text-center min-w-[130px]">
                      Roll20
                    </th>
                  )}
                  {(comparisonFilter === 'all' || comparisonFilter === 'foundry') && (
                    <th className="p-4 sm:p-5 text-xs sm:text-sm font-semibold text-slate-400 text-center min-w-[130px]">
                      Foundry VTT
                    </th>
                  )}
                  {(comparisonFilter === 'all' || comparisonFilter === 'beyond') && (
                    <th className="p-4 sm:p-5 text-xs sm:text-sm font-semibold text-slate-400 text-center min-w-[130px]">
                      D&D Beyond
                    </th>
                  )}
                  {comparisonFilter === 'all' && (
                    <th className="p-4 sm:p-5 text-xs sm:text-sm font-semibold text-slate-400 text-center min-w-[130px]">
                      Alchemy RPG
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#172033] text-xs sm:text-sm">
                
                <tr className="hover:bg-[#111726]/50 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-200">
                    IA Co-Pilot Nativa para Mestres (NPCs, Lore, Quests)
                  </td>
                  <td className="p-4 sm:p-5 text-center font-bold text-amber-300 bg-amber-500/5 border-x border-amber-500/20">
                    <div className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Nativo</span>
                    </div>
                  </td>
                  {(comparisonFilter === 'all' || comparisonFilter === 'roll20') && (
                    <td className="p-4 sm:p-5 text-center text-rose-400/80"><XCircle className="w-4 h-4 mx-auto" /></td>
                  )}
                  {(comparisonFilter === 'all' || comparisonFilter === 'foundry') && (
                    <td className="p-4 sm:p-5 text-center text-rose-400/80"><XCircle className="w-4 h-4 mx-auto" /></td>
                  )}
                  {(comparisonFilter === 'all' || comparisonFilter === 'beyond') && (
                    <td className="p-4 sm:p-5 text-center text-rose-400/80"><XCircle className="w-4 h-4 mx-auto" /></td>
                  )}
                  {comparisonFilter === 'all' && (
                    <td className="p-4 sm:p-5 text-center text-rose-400/80"><XCircle className="w-4 h-4 mx-auto" /></td>
                  )}
                </tr>

                <tr className="hover:bg-[#111726]/50 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-200">
                    Grid Tático 3D Nativo Web (Sem Instalação)
                  </td>
                  <td className="p-4 sm:p-5 text-center font-bold text-amber-300 bg-amber-500/5 border-x border-amber-500/20">
                    <div className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Nativo 3D Web</span>
                    </div>
                  </td>
                  {(comparisonFilter === 'all' || comparisonFilter === 'roll20') && (
                    <td className="p-4 sm:p-5 text-center text-slate-500">2D Apenas</td>
                  )}
                  {(comparisonFilter === 'all' || comparisonFilter === 'foundry') && (
                    <td className="p-4 sm:p-5 text-center text-slate-500">2D (Módulos pesados)</td>
                  )}
                  {(comparisonFilter === 'all' || comparisonFilter === 'beyond') && (
                    <td className="p-4 sm:p-5 text-center text-slate-500">2D Maps Básico</td>
                  )}
                  {comparisonFilter === 'all' && (
                    <td className="p-4 sm:p-5 text-center text-slate-500">Teatro da Mente</td>
                  )}
                </tr>

                <tr className="hover:bg-[#111726]/50 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-200">
                    Iluminação Dinâmica & Fog of War com LoS
                  </td>
                  <td className="p-4 sm:p-5 text-center font-bold text-amber-300 bg-amber-500/5 border-x border-amber-500/20">
                    <div className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Incluso & Rápido</span>
                    </div>
                  </td>
                  {(comparisonFilter === 'all' || comparisonFilter === 'roll20') && (
                    <td className="p-4 sm:p-5 text-center text-amber-400/90 text-xs">Pago (Assinatura)</td>
                  )}
                  {(comparisonFilter === 'all' || comparisonFilter === 'foundry') && (
                    <td className="p-4 sm:p-5 text-center text-emerald-400">Excelente</td>
                  )}
                  {(comparisonFilter === 'all' || comparisonFilter === 'beyond') && (
                    <td className="p-4 sm:p-5 text-center text-rose-400/80"><XCircle className="w-4 h-4 mx-auto" /></td>
                  )}
                  {comparisonFilter === 'all' && (
                    <td className="p-4 sm:p-5 text-center text-rose-400/80"><XCircle className="w-4 h-4 mx-auto" /></td>
                  )}
                </tr>

                <tr className="hover:bg-[#111726]/50 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-slate-200">
                    Worldbuilding com LoreGraph de Relacionamentos
                  </td>
                  <td className="p-4 sm:p-5 text-center font-bold text-amber-300 bg-amber-500/5 border-x border-amber-500/20">
                    <div className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Grafo Interativo</span>
                    </div>
                  </td>
                  {(comparisonFilter === 'all' || comparisonFilter === 'roll20') && (
                    <td className="p-4 sm:p-5 text-center text-rose-400/80"><XCircle className="w-4 h-4 mx-auto" /></td>
                  )}
                  {(comparisonFilter === 'all' || comparisonFilter === 'foundry') && (
                    <td className="p-4 sm:p-5 text-center text-slate-500">Módulos externos</td>
                  )}
                  {(comparisonFilter === 'all' || comparisonFilter === 'beyond') && (
                    <td className="p-4 sm:p-5 text-center text-rose-400/80"><XCircle className="w-4 h-4 mx-auto" /></td>
                  )}
                  {comparisonFilter === 'all' && (
                    <td className="p-4 sm:p-5 text-center text-rose-400/80"><XCircle className="w-4 h-4 mx-auto" /></td>
                  )}
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. 🤖 MINI AI SIMULATOR & 🎵 AUDIO MAESTRO SHOWCASE       */}
      {/* ========================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* AI Simulator Box */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0c101a] border border-[#20293d] shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#1c263b] pb-4">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold font-mono uppercase">
                <Cpu className="w-4 h-4" />
                <span>Simulador de IA Co-Pilot</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                PROVEDOR: GEMINI / OPENAI
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-100">Teste o Gerador de Improviso</h3>
              <p className="text-xs text-slate-400">Clique em um dos botões para ver como a IA forja conteúdo pronto para a mesa em segundos:</p>
            </div>

            {/* Quick Prompt Selectors */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSelectAIPrompt('npc')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeAIPrompt === 'npc'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-[#141b2b] text-slate-300 hover:text-white border border-[#222d42]'
                }`}
              >
                👤 Criar NPC de Taverna
              </button>
              <button
                onClick={() => handleSelectAIPrompt('encounter')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeAIPrompt === 'encounter'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-[#141b2b] text-slate-300 hover:text-white border border-[#222d42]'
                }`}
              >
                ⚔️ Gerar Encontro na Floresta
              </button>
              <button
                onClick={() => handleSelectAIPrompt('riddle')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeAIPrompt === 'riddle'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-[#141b2b] text-slate-300 hover:text-white border border-[#222d42]'
                }`}
              >
                🔮 Criar Charada / Enigma
              </button>
            </div>

            {/* AI Generated Output Card */}
            <div className="p-4 rounded-2xl bg-[#080b12] border border-[#1f2b42] space-y-2.5 min-h-[160px] relative">
              {aiGenerating ? (
                <div className="flex items-center justify-center h-32 gap-2 text-rose-400 text-xs font-mono">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Consultando oráculo da campanha...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-100">{aiGeneratedContent.title}</span>
                    <span className="text-[11px] text-rose-400 font-mono">{aiGeneratedContent.type}</span>
                  </div>
                  <p className="text-xs text-amber-200/90 italic font-serif leading-relaxed">
                    {aiGeneratedContent.quote}
                  </p>
                  <div className="text-[11px] text-slate-300 font-mono bg-[#111726] p-2 rounded-lg border border-[#1c263b]">
                    {aiGeneratedContent.stats}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <strong className="text-amber-400">Gancho Secreto: </strong>
                    {aiGeneratedContent.hook}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Audio Maestro Box */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0c101a] border border-[#20293d] shadow-xl space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1c263b] pb-4">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono uppercase">
                  <Volume2 className="w-4 h-4" />
                  <span>Audio Maestro Live Mixer</span>
                </div>
                <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  SOM DIRETO NO NAVEGADOR
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-100">Sinta a Atmosfera Sonora</h3>
                <p className="text-xs text-slate-400">
                  Esqueça bots do Discord que caem durante o combate. Teste a ambiência do Audio Maestro clicando nas trilhas abaixo:
                </p>
              </div>

              {/* Soundboard Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => playSoundtrackPreview('tavern')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    activeSoundtrack === 'tavern'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-[#121826] border-[#222e47] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">🍺 Taverna</span>
                    {activeSoundtrack === 'tavern' ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3 h-3" />}
                  </div>
                  <span className="text-[10px] text-slate-400 block">Alaúde & Canecos</span>
                </button>

                <button
                  onClick={() => playSoundtrackPreview('battle')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    activeSoundtrack === 'battle'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                      : 'bg-[#121826] border-[#222e47] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">⚔️ Batalha</span>
                    {activeSoundtrack === 'battle' ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3 h-3" />}
                  </div>
                  <span className="text-[10px] text-slate-400 block">Tambores Épicos</span>
                </button>

                <button
                  onClick={() => playSoundtrackPreview('dungeon')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    activeSoundtrack === 'dungeon'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-[#121826] border-[#222e47] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">🌧️ Masmorra</span>
                    {activeSoundtrack === 'dungeon' ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3 h-3" />}
                  </div>
                  <span className="text-[10px] text-slate-400 block">Tensão & Chuva</span>
                </button>
              </div>
            </div>

            {/* Equalizer Visualizer */}
            <div className="p-3 rounded-xl bg-[#080b12] border border-[#1f2b42] flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px] text-slate-300">
                STATUS: {activeSoundtrack ? `TOCANDO TRILHA [${activeSoundtrack.toUpperCase()}]` : 'SILÊNCIO'}
              </span>
              <div className="flex items-end gap-1 h-4">
                <div className={`w-1 bg-amber-400 rounded-full transition-all ${activeSoundtrack ? 'h-4 animate-bounce' : 'h-1'}`} />
                <div className={`w-1 bg-amber-400 rounded-full transition-all ${activeSoundtrack ? 'h-3 animate-pulse' : 'h-1'}`} />
                <div className={`w-1 bg-amber-400 rounded-full transition-all ${activeSoundtrack ? 'h-4 animate-bounce' : 'h-1'}`} />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. OS 6 GRANDES PILARES DE RECURSOS                       */}
      {/* ========================================================= */}
      <section id="recursos" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#1a2336] relative z-10 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Ecossistema Completo</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-100">
            Tudo o que uma Mesa Lendária Precisa.
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Construído para rodar direto no navegador com desempenho impecável e sem plugins que quebram.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="p-7 rounded-3xl bg-[#0b0f1a] border border-[#1f2a40] hover:border-amber-500/40 transition-all group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Dynamic Lighting & FoW</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Raycasting dinâmico de 360 graus com sombras reais. Tokens possuem Darkvision, Tremorsense e Blindsight calculados automaticamente.
            </p>
            <div className="text-xs text-amber-400/90 font-medium flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Importe arquivos UVTT e Dungeondraft</span>
            </div>
          </div>

          <div className="p-7 rounded-3xl bg-[#0b0f1a] border border-[#1f2a40] hover:border-cyan-500/40 transition-all group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Dices className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Dados 3D & Sincronização</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Física realista de dados rolando na tela de todos ao mesmo tempo. Suporte a rolagens secretas de Mestre, macros e histórico persistente.
            </p>
            <div className="text-xs text-cyan-400/90 font-medium flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Broadcast com semente de física idêntica</span>
            </div>
          </div>

          <div className="p-7 rounded-3xl bg-[#0b0f1a] border border-[#1f2a40] hover:border-rose-500/40 transition-all group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">IA Co-Pilot com Memória RAG</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Um assistente treinado nas regras de D&D 5e que lembra de fatos e entidades do seu mundo através de embeddings vetoriais no banco.
            </p>
            <div className="text-xs text-rose-400/90 font-medium flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Geração de imagens de NPCs e cenas</span>
            </div>
          </div>

          <div className="p-7 rounded-3xl bg-[#0b0f1a] border border-[#1f2a40] hover:border-emerald-500/40 transition-all group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Worldbuilder & LoreGraph</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Organize continentes, cidades, facções, NPCs e quests em um grafo interativo que revela conexões secretas e alianças de poder.
            </p>
            <div className="text-xs text-emerald-400/90 font-medium flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Mapas interativos com pins clicáveis</span>
            </div>
          </div>

          <div className="p-7 rounded-3xl bg-[#0b0f1a] border border-[#1f2a40] hover:border-amber-500/40 transition-all group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Volume2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Audio Maestro & Ambiência</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Controle a atmosfera da sala com mixagem de camadas: trilha sonora épica, sons ambientais (chuva, taverna, masmorra) e efeitos de magia.
            </p>
            <div className="text-xs text-amber-400/90 font-medium flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Transições suaves sem estalos de áudio</span>
            </div>
          </div>

          <div className="p-7 rounded-3xl bg-[#0b0f1a] border border-[#1f2a40] hover:border-cyan-500/40 transition-all group space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Ficha 5e & Calculadora CR</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Ficha responsiva otimizada para celular, multiclasse automático, talentos, wild shape e medidor de dificuldade de encontros (Fácil/Médio/Mortal).
            </p>
            <div className="text-xs text-cyan-400/90 font-medium flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Wizard passo a passo de criação de personagem</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. PORTAL DE CONVERSÃO FINAL                              */}
      {/* ========================================================= */}
      <section id="cta-final" className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center relative z-10">
        <div className="rounded-3xl p-8 sm:p-14 bg-gradient-to-b from-[#151e33] via-[#0d1424] to-[#070a12] border-2 border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.2)] space-y-6 relative overflow-hidden">
          
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
            <Crown className="w-8 h-8" />
          </div>
          
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-100 tracking-tight">
            Pronto Para Forjar Sua Próxima Lenda?
          </h2>
          
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Seja você um Mestre preparando um arco épico ou um Jogador pronto para rolar iniciativa, 
            o <span className="text-amber-400 font-semibold">Master's Codex</span> entrega tudo em um só lugar.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onEnterDM}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 border border-amber-300/60 shadow-[0_0_30px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <Crown className="w-5 h-5" />
              <span>Acessar Forja do Mestre</span>
            </button>

            <button
              onClick={onEnterPlayer}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-slate-200 bg-[#151c2d] hover:bg-[#1f2940] border border-cyan-500/40 shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <Swords className="w-5 h-5 text-cyan-400" />
              <span>Acessar Mesa do Jogador</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. FOOTER                                                 */}
      {/* ========================================================= */}
      <footer className="border-t border-[#161e30] py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-slate-400 text-xs flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
          <span className="font-bold text-slate-200">MASTER'S CODEX</span>
          <span>• The Campaign Forge Tool</span>
        </div>

        <div className="text-center md:text-right space-y-1">
          <p>Compatível com as regras do Sistema D&D 5e (SRD 5.1 OGL / CC-BY-4.0).</p>
          <p className="text-slate-500">Desenvolvido com paixão para mestres e jogadores de RPG de mesa.</p>
        </div>
      </footer>

    </div>
  );
};
