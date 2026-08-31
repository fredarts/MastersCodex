// Centralização de Estilos de Arte RPG e Configurações de Slideshow
import { OverlayBoxStylePreset, OverlayBoxPosition, OverlayBoxWidth } from '@/lib/types';

export interface RpgArtStyle {
  id: string;
  label: string;
  prompt: string;
}

export const RPG_IMAGE_STYLES: RpgArtStyle[] = [
  { id: 'none', label: '🎨 Estilo Padrão / Automático', prompt: '' },
  { id: 'dark_fantasy', label: '🌑 Dark Fantasy & Grimdark (Elden Ring / Souls)', prompt: 'Dark fantasy art, gritty atmosphere, shadows, high contrast oil painting, Elden Ring and Dark Souls aesthetic, moody chiaroscuro lighting, highly detailed' },
  { id: 'classic_dnd', label: '⚔️ D&D Clássico & MTG (Pintura a Óleo)', prompt: 'Classic high fantasy oil painting, Magic The Gathering card art style, rich pigments, master brushwork, detailed textures, heroic composition' },
  { id: 'cyberpunk', label: '🌆 Cyberpunk & Shadowrun (Arcanopunk)', prompt: 'Cyberpunk fantasy, neon reflections, holographic arcane glyphs, high-tech cybernetics, volumetric rain, dynamic cinematic lighting' },
  { id: 'anime_jrpg', label: '✨ Anime & JRPG Fantasia (Ghibli / Final Fantasy)', prompt: 'High quality anime fantasy concept art, vibrant colors, detailed cel shading, expressive character design, cinematic anime lighting' },
  { id: 'watercolor_parchment', label: '📜 Aquarela em Pergaminho Nobre', prompt: 'Delicate vintage watercolor illustration, aged parchment paper texture, ink wash accents, medieval illuminated manuscript style' },
  { id: 'hyper_cinematic', label: '🎬 Arte Conceitual Hiper-Realista 8K', prompt: 'Cinematic concept art, hyper-realistic, 8k Unreal Engine 5 render, raytraced subsurface scattering, IMAX lighting, photorealistic textures' },
  { id: 'cosmic_horror', label: '🐙 Terror Cósmico / Lovecraftiano (Bloodborne)', prompt: 'Eldritch cosmic horror, sanity-draining atmosphere, eerie glowing runes, tentacles, deep abyss shadows, Bloodborne aesthetic' },
  { id: 'steampunk', label: '⚙️ Steampunk & Engenhocas de Éter (Eberron)', prompt: 'Arcanopunk steampunk fantasy, brass gears, glowing aether crystals, leather and copper mechanisms, smoky Victorian lighting' },
  { id: 'medieval_woodcut', label: '✒️ Gravura Medieval em Madeira / Xilogravura', prompt: 'Black ink linework, medieval woodcut engraving style, hatching cross-hatch shading, gothic grimoire illustration' },
  { id: 'high_epic_fantasy', label: '👑 Alta Fantasia Radiante / Épica', prompt: 'High epic fantasy, radiant golden sunlight, ethereal aura, heroic majestic lighting, pristine crystalline elements, legendary atmosphere' },
  { id: 'gothic_victorian', label: '🦇 Gótico Vitoriano & Vampírico (Castlevania)', prompt: 'Victorian gothic fantasy, Castlevania aesthetic, moonlit velvet textures, wrought iron, crimson accents, baroque architecture' },
  { id: 'nordic_viking', label: '❄️ Nórdico / Mitologia Viking & Gélida', prompt: 'Norse mythology pagan fantasy, frosty blizzard, carved ancient runes, furs, cold blue tones, raw barbaric atmosphere' },
  { id: 'spelljammer_astral', label: '🌌 Mar Astral & Spelljammer Cósmico', prompt: 'Space opera fantasy, astral sea, stardust nebula backdrop, cosmic arcane energies, glowing planetary horizons' },
  { id: 'retro_80s', label: '🛡️ Retrô Fantasia Anos 80 (Frazetta / Elmore)', prompt: 'Retro 1980s fantasy book cover art, Frank Frazetta and Larry Elmore style, dramatic acrylic painting, heroic fantasy' },
  { id: 'solarpunk_druidic', label: '🌿 Druídico Solarpunk & Bio-Mágico', prompt: 'Druidic Solarpunk fantasy, bioluminescent flora, living moss, sun-dappled ancient forest, harmonious nature magic' },
  { id: 'pixel_art', label: '👾 Pixel Art HD-2D / 16-Bit RPG', prompt: 'HD-2D Octopath style pixel art, modern dynamic lighting, retro fantasy aesthetic, rich pixel depth, detailed sprites' },
  { id: 'renaissance_portrait', label: '🕯️ Retrato Renascentista (Rembrandt)', prompt: 'Renaissance master portrait, Rembrandt style chiaroscuro, warm candlelight, dramatic deep shadows, velvet texture' },
  { id: 'synthwave_retro', label: '🔮 Synthwave / Synth-Fantasy Arcano', prompt: 'Synthwave fantasy, vibrant magenta and cyan neon glow, retrofuturistic arcane grid, 80s aesthetic' },
];

export interface SlideTransitionOption {
  id: 'magical_dissolve' | 'dream_waves' | 'arcane_vision' | 'book_page_flip_3d' | 'dark_mist' | 'crossfade';
  label: string;
  description: string;
  icon: string;
}

export const SLIDE_TRANSITION_OPTIONS: SlideTransitionOption[] = [
  {
    id: 'magical_dissolve',
    label: 'Dissolve Mágico & Centelhas',
    description: 'Dissolução orgânica com fagulhas de éter douradas.',
    icon: 'Sparkles',
  },
  {
    id: 'dream_waves',
    label: 'Sonhos & Ondas Etéreas',
    description: 'Distorção senoidal fluida com dispersão cromática para sonhos e memórias.',
    icon: 'CloudMoon',
  },
  {
    id: 'book_page_flip_3d',
    label: 'Virar Página de Grimório 3D',
    description: 'Efeito 3D da folha curvando e virando como um livro clássico.',
    icon: 'BookOpen',
  },
  {
    id: 'arcane_vision',
    label: 'Visão Arcana & Clarividência',
    description: 'Flash místico de energia cósmica e fendas dimensionais.',
    icon: 'Eye',
  },
  {
    id: 'dark_mist',
    label: 'Névoa Sombria & Mistério',
    description: 'Cortina de sombras e fumaça revelando o novo cenário.',
    icon: 'Wind',
  },
  {
    id: 'crossfade',
    label: 'Crossfade Cinemático Suave',
    description: 'Transição clássica suave e sem distorções.',
    icon: 'Layers',
  },
];

export interface SlideAspectRatioOption {
  id: '16:9' | '4:3' | '1:1' | '9:16';
  label: string;
  description: string;
  cssAspect: string;
}

export const SLIDE_ASPECT_RATIO_OPTIONS: SlideAspectRatioOption[] = [
  { id: '16:9', label: '16:9 Widescreen', description: 'Ideal para TVs e Monitores', cssAspect: 'aspect-video' },
  { id: '4:3', label: '4:3 Clássico', description: 'Estilo Grimório / Retro', cssAspect: 'aspect-[4/3]' },
  { id: '1:1', label: '1:1 Quadrado', description: 'Retratos e Fichas', cssAspect: 'aspect-square' },
  { id: '9:16', label: '9:16 Vertical', description: 'Mobile / Retrato Estendido', cssAspect: 'aspect-[9/16]' },
];

// =========================================================================
// PRESETS VISUAIS DE CAIXAS DE TEXTO / LEGENDAS RPG
// =========================================================================

export interface OverlayStylePresetOption {
  id: OverlayBoxStylePreset;
  name: string;
  description: string;
  badge: string;
  containerClasses: string;
  titleClasses: string;
  textClasses: string;
}

export const OVERLAY_STYLE_PRESETS: OverlayStylePresetOption[] = [
  {
    id: 'cinematic',
    name: 'Cinemático Minimalista',
    description: 'Faixa preta semi-transparente fosca elegante estilo cinema.',
    badge: '🎬 Cinemático',
    containerClasses: 'bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl',
    titleClasses: 'text-amber-400 font-mono font-bold uppercase tracking-wider',
    textClasses: 'text-slate-100 font-serif italic',
  },
  {
    id: 'scroll_parchment',
    name: 'Pergaminho & Tomo Medieval',
    description: 'Papiro envelhecido escuro com bordas douradas e tipografia clássica.',
    badge: '📜 Pergaminho',
    containerClasses: 'bg-[#18130e]/95 backdrop-blur-md border-2 border-amber-600/50 shadow-[0_0_20px_rgba(217,119,6,0.2)] rounded-xl ring-1 ring-amber-900/40',
    titleClasses: 'text-amber-300 font-serif font-black uppercase tracking-widest',
    textClasses: 'text-amber-100/90 font-serif italic',
  },
  {
    id: 'arcane_ether',
    name: 'Éter Arcano & Místico',
    description: 'Efeito glassmorphism com aura luminosa azul-ciano e runas.',
    badge: '🔮 Arcano',
    containerClasses: 'bg-[#0a0f1d]/90 backdrop-blur-lg border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.25)] rounded-2xl',
    titleClasses: 'text-cyan-300 font-mono font-extrabold uppercase tracking-widest drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]',
    textClasses: 'text-cyan-50 font-sans leading-relaxed',
  },
  {
    id: 'dark_fantasy',
    name: 'Dark Fantasy & Grimdark',
    description: 'Preto fosco profundo de ferro forjado e toques de rubi (Souls-like).',
    badge: '⚔️ Grimdark',
    containerClasses: 'bg-[#0d0f12]/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-lg ring-1 ring-rose-950/40',
    titleClasses: 'text-rose-400 font-serif font-black uppercase tracking-widest',
    textClasses: 'text-slate-300 font-serif',
  },
  {
    id: 'imperial_gold',
    name: 'Nobreza Imperial & Épico',
    description: 'Fundo aveludado régio com moldura de filigrana em ouro nobre.',
    badge: '👑 Imperial',
    containerClasses: 'bg-[#14101e]/95 backdrop-blur-md border-2 border-amber-400/60 shadow-[0_0_30px_rgba(251,191,36,0.25)] rounded-2xl',
    titleClasses: 'text-amber-300 font-serif font-black uppercase tracking-widest drop-shadow-md',
    textClasses: 'text-amber-50 font-serif italic font-medium',
  },
  {
    id: 'rustic_tavern',
    name: 'Taverna & Rústico Nórdico',
    description: 'Carvalho escuro, bordas em bronze batido e atmosfera acolhedora.',
    badge: '🪓 Taverna',
    containerClasses: 'bg-[#18120b]/95 backdrop-blur-md border border-amber-700/60 shadow-xl rounded-xl',
    titleClasses: 'text-amber-400 font-serif font-bold uppercase tracking-wide',
    textClasses: 'text-amber-200/90 font-serif',
  },
];

export const OVERLAY_POSITION_OPTIONS: { id: OverlayBoxPosition; label: string; zone: string }[] = [
  { id: 'bottom-center', label: 'Base Central (Padrão)', zone: 'bottom' },
  { id: 'bottom-left', label: 'Base Esquerda', zone: 'bottom' },
  { id: 'bottom-right', label: 'Base Direita', zone: 'bottom' },
  { id: 'top-center', label: 'Topo Central (Capítulo)', zone: 'top' },
  { id: 'top-left', label: 'Topo Esquerdo', zone: 'top' },
  { id: 'top-right', label: 'Topo Direito', zone: 'top' },
  { id: 'center', label: 'Centro da Tela (Destaque)', zone: 'center' },
];

export const OVERLAY_WIDTH_OPTIONS: { id: OverlayBoxWidth; label: string; widthClass: string }[] = [
  { id: 'compact', label: 'Compacto (45%)', widthClass: 'w-full max-w-[45%]' },
  { id: 'medium', label: 'Médio (65%)', widthClass: 'w-full max-w-[65%]' },
  { id: 'wide', label: 'Amplo (85%)', widthClass: 'w-full max-w-[85%]' },
  { id: 'full', label: 'Largura Total (100%)', widthClass: 'w-full max-w-full' },
];

export const OVERLAY_FONT_SIZE_OPTIONS = [
  { id: 'sm', label: 'Pequeno', class: 'text-xs' },
  { id: 'base', label: 'Normal', class: 'text-sm' },
  { id: 'lg', label: 'Grande', class: 'text-base' },
  { id: 'xl', label: 'Destaque Épico', class: 'text-lg md:text-xl' },
];

export interface OverlayFontFamilyOption {
  id: import('@/lib/types').OverlayFontFamily;
  label: string;
  badge: string;
  fontClass: string;
  titleClass: string;
}

export const OVERLAY_FONT_FAMILIES: OverlayFontFamilyOption[] = [
  {
    id: 'cinzel',
    label: '👑 Cinzel • Épica & Nobreza Imperial',
    badge: 'Cinzel',
    fontClass: 'font-serif tracking-wide',
    titleClass: 'font-serif uppercase tracking-widest font-black',
  },
  {
    id: 'medieval',
    label: '📜 MedievalSharp • Manuscrito Clássico',
    badge: 'Medieval',
    fontClass: 'font-serif italic font-medium',
    titleClass: 'font-serif uppercase tracking-wider font-extrabold',
  },
  {
    id: 'uncial',
    label: '🔮 Uncial / Runas • Grimório Arcano',
    badge: 'Arcano',
    fontClass: 'font-mono tracking-normal leading-relaxed',
    titleClass: 'font-mono uppercase tracking-widest font-black',
  },
  {
    id: 'serif_noble',
    label: '⚜️ Playfair • Elegância Nobre & Romance',
    badge: 'Nobre',
    fontClass: 'font-serif italic font-normal',
    titleClass: 'font-serif uppercase tracking-wider font-bold',
  },
  {
    id: 'runic',
    label: '⚔️ Gótica & Nórdica • Grimdark Forjado',
    badge: 'Gótico',
    fontClass: 'font-serif font-bold tracking-tight',
    titleClass: 'font-serif uppercase tracking-widest font-black',
  },
  {
    id: 'clean',
    label: '🎬 Inter • Cinemático Moderno',
    badge: 'Clean',
    fontClass: 'font-sans font-medium',
    titleClass: 'font-sans uppercase tracking-wider font-bold',
  },
];
