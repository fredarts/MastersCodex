'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  UserProfile, 
  UserRoleMode, 
  UserCampaign, 
  CampaignMember,
  World, 
  WorldEntity, 
  GameSession, 
  GameScene, 
  CampaignFeedEvent, 
  CampaignFeedEventType 
} from '@/lib/types';

interface AuthContextType {
  user: UserProfile | null;
  roleMode: UserRoleMode;
  setRoleMode: (role: UserRoleMode) => void;
  userWorlds: World[];
  activeWorld: World | null;
  setActiveWorld: (world: World | null) => void;
  createWorld: (title: string, description?: string, genre?: string) => Promise<World>;
  worldEntities: WorldEntity[];
  createWorldEntity: (entity: Omit<WorldEntity, 'id'>) => Promise<WorldEntity>;
  deleteWorldEntity: (id: string) => Promise<void>;
  userCampaigns: UserCampaign[];
  activeCampaign: UserCampaign | null;
  setActiveCampaign: (campaign: UserCampaign | null) => void;
  campaignMembers: CampaignMember[];
  fetchCampaignMembers: (campaignId: string) => Promise<void>;
  addCampaignMember: (campaignId: string, characterName: string, role?: 'dm' | 'player') => Promise<void>;
  sessions: GameSession[];
  activeSession: GameSession | null;
  setActiveSession: (session: GameSession | null) => void;
  createSession: (title: string, notes?: string) => Promise<GameSession>;
  scenes: GameScene[];
  activeScene: GameScene | null;
  setActiveScene: (scene: GameScene | null) => void;
  createScene: (sceneData: Omit<GameScene, 'id'>) => Promise<GameScene>;
  updateScene: (updatedScene: GameScene) => Promise<void>;
  deleteScene: (id: string) => Promise<void>;
  feedEvents: CampaignFeedEvent[];
  createFeedEvent: (eventData: Omit<CampaignFeedEvent, 'id'>) => Promise<CampaignFeedEvent>;
  toggleFeedEventVisibility: (id: string) => Promise<void>;
  deleteFeedEvent: (id: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  joinCampaignByCode: (code: string, characterName?: string) => Promise<boolean>;
  leaveCampaign: (campaignId: string) => Promise<void>;
  createCampaign: (title: string, worldId?: string, description?: string) => Promise<UserCampaign>;
  loadDemoEverything: () => void;
  isLoading: boolean;
}

const DEMO_USER: UserProfile = {
  id: 'demo-dm-user-123',
  email: 'mestre@valiria.rpg',
  displayName: 'Frederico Monteiro (Game Dev)',
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=MestreAris',
};

const SAMPLE_DEMO_WORLD: World = {
  id: 'world-demo-1',
  dmId: 'demo-dm-user-123',
  title: 'Mythra - Dos Reinos Abençoados',
  genre: 'Fantasia Medieval Heróica',
  description: 'Mundo próspero de cidades de mármore cercado por florestas perigosas e ruínas dracônicas.',
};

const SAMPLE_DEMO_ENTITIES: WorldEntity[] = [
  {
    id: 'ent-1',
    worldId: 'world-demo-1',
    category: 'location',
    name: 'Cidade de Valíria',
    subType: 'Capital Real',
    status: 'active',
    shortDesc: 'Capital majestosa cercada por muralhas brancas e torres de conjuração.',
    attributes: { populacao: '45.000 habitantes', clima: 'Temperado' },
  },
];

const SAMPLE_DEMO_CAMPAIGN: UserCampaign = {
  id: 'camp-demo-1',
  dmId: 'demo-dm-user-123',
  worldId: 'world-demo-1',
  title: 'O Resgate do Rei Tristan III',
  description: 'Os Heróis devem salvar o rei das mãos do terrível Xorax.',
  inviteCode: 'O RE-172',
  role: 'dm',
};

const SAMPLE_DEMO_MEMBERS: CampaignMember[] = [
  {
    id: 'mem-1',
    campaignId: 'camp-demo-1',
    userId: 'demo-dm-user-123',
    role: 'dm',
    displayName: 'Frederico Monteiro (Game Dev)',
  },
];

const SAMPLE_DEMO_SESSION: GameSession = {
  id: 'sess-demo-1',
  campaignId: 'camp-demo-1',
  sessionNumber: 1,
  title: 'Sessão 1: O Encontro na Taverna',
  notes: 'Sessão inicial onde os heróis aceitam a missão real.',
};

const SAMPLE_DEMO_SCENES: GameScene[] = [
  {
    id: 'sc-1',
    sessionId: 'sess-demo-1',
    orderIndex: 1,
    title: '🍺 Taverna do Javali Sangrento',
    sceneType: 'social',
    bgmCategory: 'taverna',
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
    sensoryText: 'O cheiro de hidromel e carne assada preenche o ar abafado da taverna. Risadas e canções ecoam no salão iluminado por tochas.',
    secretNotes: 'O taverneiro gagueja se for questionado sobre o selo do rei.',
  },
];

const SAMPLE_DEMO_FEED_EVENTS: CampaignFeedEvent[] = [
  {
    id: 'ev-1',
    campaignId: 'camp-demo-1',
    sessionId: 'sess-demo-1',
    eventType: 'session_recap',
    title: '📖 Abertura da Jornada em Valíria',
    summary: 'Os heróis se reuniram na Taverna do Javali Sangrento e aceitaram o selo real do Rei Aris III para investigar os ataques nas estradas do norte.',
    isPublic: true,
  },
];

const isValidUUID = (str?: string) => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [roleMode, setRoleModeState] = useState<UserRoleMode>('dm');

  // Worlds & Entities State
  const [userWorlds, setUserWorlds] = useState<World[]>([]);
  const [activeWorld, setActiveWorld] = useState<World | null>(null);
  const [worldEntities, setWorldEntities] = useState<WorldEntity[]>([]);

  // Campaigns & Members State
  const [userCampaigns, setUserCampaigns] = useState<UserCampaign[]>([]);
  const [activeCampaign, setActiveCampaignState] = useState<UserCampaign | null>(null);
  const [campaignMembers, setCampaignMembers] = useState<CampaignMember[]>([]);

  // Sessions & Scenes State
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [scenes, setScenes] = useState<GameScene[]>([]);
  const [activeScene, setActiveScene] = useState<GameScene | null>(null);

  // Feed Events State
  const [feedEvents, setFeedEvents] = useState<CampaignFeedEvent[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const setRoleMode = (role: UserRoleMode) => {
    setRoleModeState(role);
    try {
      localStorage.setItem('codex_roleMode', role);
    } catch (e) {}
  };

  const setActiveCampaign = (camp: UserCampaign | null) => {
    setActiveCampaignState(camp);
    try {
      if (camp) {
        localStorage.setItem('codex_activeCampaignId', camp.id);
      } else {
        localStorage.removeItem('codex_activeCampaignId');
      }
    } catch (e) {}
  };

  const loadLocalStorageState = () => {
    try {
      const savedWorlds = localStorage.getItem('codex_worlds');
      const savedCampaigns = localStorage.getItem('codex_campaigns');
      const savedMembers = localStorage.getItem('codex_members');
      const savedSessions = localStorage.getItem('codex_sessions');
      const savedScenes = localStorage.getItem('codex_scenes');
      const savedEntities = localStorage.getItem('codex_entities');
      const savedFeed = localStorage.getItem('codex_feed');
      const savedRoleMode = localStorage.getItem('codex_roleMode') as UserRoleMode;
      const savedActiveCampId = localStorage.getItem('codex_activeCampaignId');

      if (savedWorlds) {
        const parsed = JSON.parse(savedWorlds);
        setUserWorlds((prev) => (JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed));
      }
      if (savedCampaigns) {
        const parsed = JSON.parse(savedCampaigns);
        setUserCampaigns((prev) => (JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed));
      }
      if (savedMembers) {
        const parsed = JSON.parse(savedMembers);
        setCampaignMembers((prev) => (JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed));
      }
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        setSessions((prev) => (JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed));
      }
      if (savedScenes) {
        const parsed = JSON.parse(savedScenes);
        setScenes((prev) => (JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed));
      }
      if (savedEntities) {
        const parsed = JSON.parse(savedEntities);
        setWorldEntities((prev) => (JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed));
      }
      if (savedFeed) {
        const parsed = JSON.parse(savedFeed);
        setFeedEvents((prev) => (JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed));
      }
      if (savedRoleMode) setRoleModeState(savedRoleMode);

      if (savedActiveCampId && userCampaigns.length > 0) {
        const found = userCampaigns.find((c) => c.id === savedActiveCampId);
        if (found && activeCampaign?.id !== found.id) setActiveCampaignState(found);
      }
    } catch (e) {
      console.error('LocalStorage load error:', e);
    }
  };

  // Cross-Tab Broadcast Channel Sync
  useEffect(() => {
    loadLocalStorageState();

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('masters_codex_sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'REFRESH_MEMBERS') {
          if (event.data.campaignId) {
            fetchCampaignMembers(event.data.campaignId);
          }
        }
      };
    } catch (e) {}

    const handleStorageChange = () => {
      loadLocalStorageState();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (bc) bc.close();
    };
  }, [activeCampaign?.id]);

  // Save to LocalStorage
  useEffect(() => {
    try {
      if (userWorlds.length > 0) {
        localStorage.setItem('codex_worlds', JSON.stringify(userWorlds));
      }
      if (userCampaigns.length > 0) {
        localStorage.setItem('codex_campaigns', JSON.stringify(userCampaigns));
      }
      if (campaignMembers.length > 0) {
        localStorage.setItem('codex_members', JSON.stringify(campaignMembers));
      }
      if (sessions.length > 0) {
        localStorage.setItem('codex_sessions', JSON.stringify(sessions));
      }
      if (scenes.length > 0) {
        localStorage.setItem('codex_scenes', JSON.stringify(scenes));
      }
      if (worldEntities.length > 0) {
        localStorage.setItem('codex_entities', JSON.stringify(worldEntities));
      }
      if (feedEvents.length > 0) {
        localStorage.setItem('codex_feed', JSON.stringify(feedEvents));
      }
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  }, [userWorlds, userCampaigns, campaignMembers, sessions, scenes, worldEntities, feedEvents]);

  useEffect(() => {
    if (activeWorld) {
      fetchWorldEntities(activeWorld.id);
    } else {
      setWorldEntities([]);
    }
  }, [activeWorld?.id]);

  useEffect(() => {
    if (activeCampaign) {
      fetchCampaignSessions(activeCampaign.id);
      fetchCampaignFeed(activeCampaign.id);
      fetchCampaignMembers(activeCampaign.id);
    } else {
      setSessions([]);
      setActiveSession(null);
      setScenes([]);
      setActiveScene(null);
      setFeedEvents([]);
      setCampaignMembers([]);
    }
  }, [activeCampaign?.id]);

  useEffect(() => {
    if (activeSession) {
      fetchSessionScenes(activeSession.id);
    } else {
      setScenes([]);
      setActiveScene(null);
    }
  }, [activeSession?.id]);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      setIsLoading(true);
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const u = session.user;
          const profile: UserProfile = {
            id: u.id,
            email: u.email || '',
            displayName: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Aventureiro',
            avatarUrl: u.user_metadata?.avatar_url,
          };
          setUser(profile);
          fetchUserWorldsAndCampaigns(u.id);
        } else {
          setUser(DEMO_USER);
        }
        setIsLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const u = session.user;
          const profile: UserProfile = {
            id: u.id,
            email: u.email || '',
            displayName: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Aventureiro',
            avatarUrl: u.user_metadata?.avatar_url,
          };
          setUser(profile);
          fetchUserWorldsAndCampaigns(u.id);
        } else {
          setUser(DEMO_USER);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      setUser(DEMO_USER);
      if (userWorlds.length === 0) {
        setUserWorlds([SAMPLE_DEMO_WORLD]);
        setActiveWorld(SAMPLE_DEMO_WORLD);
      }
      if (userCampaigns.length === 0) {
        setUserCampaigns([SAMPLE_DEMO_CAMPAIGN]);
        setActiveCampaignState(SAMPLE_DEMO_CAMPAIGN);
      }
      if (campaignMembers.length === 0) {
        setCampaignMembers(SAMPLE_DEMO_MEMBERS);
      }
      setSessions([SAMPLE_DEMO_SESSION]);
      setActiveSession(SAMPLE_DEMO_SESSION);
      setScenes(SAMPLE_DEMO_SCENES);
      setActiveScene(SAMPLE_DEMO_SCENES[0]);
      setFeedEvents(SAMPLE_DEMO_FEED_EVENTS);
      setIsLoading(false);
    }
  }, []);

  const fetchUserWorldsAndCampaigns = async (userId: string) => {
    try {
      const { data: worldsData, error: worldsError } = await supabase
        .from('worlds')
        .select('*')
        .eq('dm_id', userId);

      if (worldsError) {
        console.warn('Aviso: Não foi possível carregar os mundos do Supabase:', worldsError.message);
      } else if (worldsData && worldsData.length > 0) {
        const formattedWorlds: World[] = worldsData.map((w) => ({
          id: w.id,
          dmId: w.dm_id,
          title: w.title,
          genre: w.genre || 'Fantasia Medieval',
          description: w.description,
        }));
        setUserWorlds((prev) => (JSON.stringify(prev) === JSON.stringify(formattedWorlds) ? prev : formattedWorlds));
        if (!activeWorld) setActiveWorld(formattedWorlds[0]);
      }

      const { data: campsData, error: campsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('dm_id', userId);

      if (campsError) {
        console.warn('Aviso: Não foi possível carregar as campanhas do Supabase (Verifique se executou o schema.sql no Supabase):', campsError.message);
      }

      const { data: joinedData, error: joinedError } = await supabase
        .from('campaign_members')
        .select('campaign_id, role, character_name, campaigns(*)')
        .eq('user_id', userId);

      if (joinedError) {
        console.warn('Aviso: Não foi possível carregar as participações do Supabase:', joinedError.message);
      }

      const allCamps: UserCampaign[] = [];

      if (campsData && campsData.length > 0) {
        campsData.forEach((c) => {
          allCamps.push({
            id: c.id,
            dmId: c.dm_id,
            worldId: c.world_id,
            title: c.title,
            description: c.description,
            inviteCode: c.invite_code,
            role: 'dm',
          });
        });
      }

      if (joinedData && joinedData.length > 0) {
        joinedData.forEach((j: any) => {
          if (j.campaigns && !allCamps.some((x) => x.id === j.campaigns.id)) {
            allCamps.push({
              id: j.campaigns.id,
              dmId: j.campaigns.dm_id,
              worldId: j.campaigns.world_id,
              title: j.campaigns.title,
              description: j.campaigns.description,
              inviteCode: j.campaigns.invite_code,
              role: j.role || 'player',
              characterName: j.character_name,
            });
          }
        });
      }

      if (allCamps.length > 0) {
        setUserCampaigns((prev) => (JSON.stringify(prev) === JSON.stringify(allCamps) ? prev : allCamps));
        if (!activeCampaign) {
          const savedActiveCampId = localStorage.getItem('codex_activeCampaignId');
          const found = allCamps.find((c) => c.id === savedActiveCampId);
          setActiveCampaignState(found || allCamps[0]);
        }
      } else {
        // Se a busca no Supabase não retornar campanhas ou falhar por tabela inexistente, carrega dados salvos localmente
        loadLocalStorageState();
      }
    } catch (e) {
      console.error('Error fetching worlds & campaigns:', e);
      loadLocalStorageState();
    }
  };

  const fetchCampaignMembers = async (campaignId: string) => {
    let combinedMembers: CampaignMember[] = [];

    // 1. Fetch from Supabase if configured and valid UUID
    if (isSupabaseConfigured() && isValidUUID(campaignId)) {
      try {
        const { data: membersData } = await supabase
          .from('campaign_members')
          .select('*')
          .eq('campaign_id', campaignId);

        if (membersData && membersData.length > 0) {
          combinedMembers = membersData.map((m: any) => ({
            id: m.id,
            campaignId: m.campaign_id,
            userId: m.user_id,
            role: m.role,
            characterName: m.character_name,
            displayName: m.character_name || 'Jogador',
            joinedAt: m.joined_at,
          }));
        }
      } catch (e) {
        console.error('Error fetching campaign members from Supabase:', e);
      }
    }

    // 2. Combine with LocalStorage members so locally joined members are NEVER lost
    try {
      const savedMembersStr = localStorage.getItem('codex_members');
      if (savedMembersStr) {
        const localMembers: CampaignMember[] = JSON.parse(savedMembersStr);
        const filteredLocal = localMembers.filter((m) => m.campaignId === campaignId);

        filteredLocal.forEach((lm) => {
          if (!combinedMembers.some((m) => m.id === lm.id || (m.characterName === lm.characterName && m.role === lm.role))) {
            combinedMembers.push(lm);
          }
        });
      }
    } catch (e) {}

    // Ensure DM entry is present if missing
    if (activeCampaign && !combinedMembers.some((m) => m.role === 'dm')) {
      combinedMembers.unshift({
        id: `mem-dm-${activeCampaign.id}`,
        campaignId: activeCampaign.id,
        userId: activeCampaign.dmId || 'demo-dm-user-123',
        role: 'dm',
        displayName: user?.displayName || 'Frederico Monteiro (Game Dev)',
      });
    }

    setCampaignMembers((prev) => {
      const prevStr = JSON.stringify(prev);
      const nextStr = JSON.stringify(combinedMembers);
      if (prevStr === nextStr) return prev;
      return combinedMembers;
    });
  };

  const addCampaignMember = async (campaignId: string, characterName: string, role: 'dm' | 'player' = 'player') => {
    const charName = characterName.trim();
    const newMember: CampaignMember = {
      id: `mem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      campaignId,
      userId: `user-manual-${Date.now()}`,
      role,
      characterName: charName,
      displayName: charName,
    };

    if (isSupabaseConfigured() && isValidUUID(campaignId)) {
      try {
        await supabase.from('profiles').upsert({
          id: newMember.userId,
          email: `${newMember.userId}@codex.rpg`,
          display_name: charName,
        });

        const { data: memberResult } = await supabase.from('campaign_members').insert({
          campaign_id: campaignId,
          user_id: newMember.userId,
          role,
          character_name: charName,
        }).select().single();

        if (memberResult?.id) {
          newMember.id = memberResult.id;
        }
      } catch (e) {
        console.error('Error inserting manual campaign member into Supabase:', e);
      }
    }

    try {
      const savedMembersStr = localStorage.getItem('codex_members');
      let allMembers: CampaignMember[] = savedMembersStr ? JSON.parse(savedMembersStr) : [];
      if (!allMembers.some((m) => m.campaignId === campaignId && m.characterName === charName)) {
        allMembers.push(newMember);
      }
      localStorage.setItem('codex_members', JSON.stringify(allMembers));
    } catch (e) {}

    setCampaignMembers((prev) => {
      if (prev.some((m) => m.campaignId === campaignId && m.characterName === charName)) return prev;
      return [...prev, newMember];
    });
    
    // Broadcast via BroadcastChannel
    try {
      const bc = new BroadcastChannel('masters_codex_sync');
      bc.postMessage({ type: 'REFRESH_MEMBERS', campaignId });
      bc.close();
    } catch (e) {}
  };

  const joinCampaignByCode = async (code: string, characterName?: string): Promise<boolean> => {
    const rawCode = code.trim();
    const cleanCode = rawCode.toUpperCase();
    const normalizedCode = cleanCode.replace(/[\s-]/g, '');
    const charName = characterName?.trim() || 'Personagem Novo';
    const userId = user?.id || `user-pl-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let targetCampaignId: string | null = null;
    let targetCampaignTitle = `Mesa de Jogo (${cleanCode})`;
    let targetCampaignDesc = 'Mesa de RPG conectada via código de convite.';
    let targetWorldId: string | undefined = undefined;
    let targetDmId = 'demo-dm-user-123';

    // 1. Search in Supabase if active
    if (isSupabaseConfigured()) {
      try {
        // Upsert profile safely without blocking if fails
        try {
          await supabase.from('profiles').upsert({
            id: userId,
            email: user?.email || `${userId}@codex.rpg`,
            display_name: user?.displayName || charName,
          }, { onConflict: 'id' });
        } catch (pe) {
          console.warn('Profile upsert warning:', pe);
        }

        const { data: campsList } = await supabase
          .from('campaigns')
          .select('*');

        let campData = campsList?.find((c) => c.invite_code?.replace(/[\s-]/g, '').toUpperCase() === normalizedCode);

        if (campData) {
          targetCampaignId = campData.id;
          targetCampaignTitle = campData.title;
          targetCampaignDesc = campData.description;
          targetWorldId = campData.world_id;
          targetDmId = campData.dm_id;

          try {
            const { error: memErr } = await supabase.from('campaign_members').upsert({
              campaign_id: campData.id,
              user_id: userId,
              role: 'player',
              character_name: charName,
            }, { onConflict: 'campaign_id,user_id,character_name' });

            if (memErr) {
              console.warn('Upsert falhou devido a restrição no Supabase, tentando insert direto:', memErr.message);
              await supabase.from('campaign_members').insert({
                campaign_id: campData.id,
                user_id: userId,
                role: 'player',
                character_name: charName,
              });
            }
          } catch (me) {
            console.error('Error joining campaign member in Supabase:', me);
          }
        }
      } catch (e) {
        console.error('Error querying Supabase campaign by code:', e);
      }
    }

    // 2. Search LocalStorage for matching campaign
    if (!targetCampaignId) {
      let storedCamps: UserCampaign[] = userCampaigns;
      try {
        const saved = localStorage.getItem('codex_campaigns');
        if (saved) storedCamps = JSON.parse(saved);
      } catch (e) {}

      const foundLocal = storedCamps.find(
        (c) => c.inviteCode.replace(/[\s-]/g, '').toUpperCase() === normalizedCode
      );

      if (foundLocal) {
        targetCampaignId = foundLocal.id;
        targetCampaignTitle = foundLocal.title;
        targetCampaignDesc = foundLocal.description || targetCampaignDesc;
        targetWorldId = foundLocal.worldId;
        targetDmId = foundLocal.dmId;
      } else {
        targetCampaignId = `camp-${normalizedCode}`;
      }
    }

    const joinedCamp: UserCampaign = {
      id: targetCampaignId,
      dmId: targetDmId,
      worldId: targetWorldId,
      title: targetCampaignTitle,
      description: targetCampaignDesc,
      inviteCode: cleanCode,
      role: 'player',
      characterName: charName,
    };

    const newMember: CampaignMember = {
      id: `mem-pl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      campaignId: targetCampaignId,
      userId,
      role: 'player',
      characterName: charName,
      displayName: user?.displayName || charName,
    };

    // Save to LocalStorage for cross-browser / cross-tab fallback
    try {
      const savedCampsStr = localStorage.getItem('codex_campaigns');
      let allCamps: UserCampaign[] = savedCampsStr ? JSON.parse(savedCampsStr) : [];
      if (!allCamps.some((c) => c.id === joinedCamp.id)) {
        allCamps.push(joinedCamp);
      }
      localStorage.setItem('codex_campaigns', JSON.stringify(allCamps));

      const savedMemsStr = localStorage.getItem('codex_members');
      let allMems: CampaignMember[] = savedMemsStr ? JSON.parse(savedMemsStr) : [];

      if (!allMems.some((m) => m.campaignId === targetCampaignId && m.role === 'dm')) {
        allMems.push({
          id: `mem-dm-${targetCampaignId}`,
          campaignId: targetCampaignId,
          userId: targetDmId,
          role: 'dm',
          displayName: 'Frederico Monteiro (Game Dev)',
        });
      }

      if (!allMems.some((m) => m.campaignId === targetCampaignId && m.characterName === charName)) {
        allMems.push(newMember);
      }
      localStorage.setItem('codex_members', JSON.stringify(allMems));
      localStorage.setItem('codex_activeCampaignId', joinedCamp.id);
      localStorage.setItem('codex_roleMode', 'player');
    } catch (e) {}

    setUserCampaigns((prev) => {
      if (prev.some((c) => c.id === joinedCamp.id)) return prev;
      return [...prev, joinedCamp];
    });

    setActiveCampaignState(joinedCamp);
    setRoleModeState('player');
    await fetchCampaignMembers(targetCampaignId);

    // Broadcast via BroadcastChannel
    try {
      const bc = new BroadcastChannel('masters_codex_sync');
      bc.postMessage({ type: 'REFRESH_MEMBERS', campaignId: targetCampaignId });
      bc.close();
    } catch (e) {}

    return true;
  };

  const leaveCampaign = async (campaignId: string) => {
    const userId = user?.id;

    // 1. If Supabase is active and valid UUID, delete member row
    if (isSupabaseConfigured() && isValidUUID(campaignId) && userId) {
      try {
        await supabase
          .from('campaign_members')
          .delete()
          .eq('campaign_id', campaignId)
          .eq('user_id', userId);
      } catch (e) {
        console.error('Error leaving campaign in Supabase:', e);
      }
    }

    // 2. Remove campaign from userCampaigns state & LocalStorage
    setUserCampaigns((prev) => {
      const next = prev.filter((c) => c.id !== campaignId);
      try {
        localStorage.setItem('codex_campaigns', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // 3. Remove members from campaignMembers state & LocalStorage
    setCampaignMembers((prev) => {
      const next = prev.filter((m) => m.campaignId !== campaignId || m.role === 'dm');
      try {
        localStorage.setItem('codex_members', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // 4. Reset activeCampaign if the left campaign was active
    if (activeCampaign?.id === campaignId) {
      const remaining = userCampaigns.filter((c) => c.id !== campaignId);
      const nextActive = remaining.length > 0 ? remaining[0] : null;
      setActiveCampaign(nextActive);
    }

    // 5. Broadcast refresh
    try {
      const bc = new BroadcastChannel('masters_codex_sync');
      bc.postMessage({ type: 'REFRESH_MEMBERS', campaignId });
      bc.close();
    } catch (e) {}
  };

  const fetchWorldEntities = async (worldId: string) => {
    // 1. Load local entities first
    try {
      const saved = localStorage.getItem('codex_entities');
      if (saved) {
        const parsed: WorldEntity[] = JSON.parse(saved);
        const filtered = parsed.filter((e) => e.worldId === worldId);
        if (filtered.length > 0) {
          setWorldEntities((prev) => {
            const merged = [...filtered];
            prev.forEach((p) => {
              if (p.worldId === worldId && !merged.some((m) => m.id === p.id)) merged.push(p);
            });
            return merged;
          });
        }
      }
    } catch (e) {}

    if (!isSupabaseConfigured() || !isValidUUID(worldId)) return;

    try {
      const { data: entitiesData } = await supabase
        .from('world_entities')
        .select('*')
        .eq('world_id', worldId);

      if (entitiesData) {
        const formatted: WorldEntity[] = entitiesData.map((e) => ({
          id: e.id,
          worldId: e.world_id,
          category: e.category,
          name: e.name,
          subType: e.sub_type,
          status: e.status || 'active',
          shortDesc: e.short_desc,
          fullContent: e.full_content,
          attributes: e.attributes,
          connections: e.connections || [],
        }));
        setWorldEntities((prev) => {
          const merged = [...formatted];
          prev.forEach((p) => {
            if (p.worldId === worldId && !merged.some((m) => m.id === p.id)) merged.push(p);
          });
          return merged;
        });
      }
    } catch (e) {
      console.error('Error fetching world entities:', e);
    }
  };

  const fetchCampaignSessions = async (campaignId: string) => {
    // 1. Load local sessions first
    let localForCamp: GameSession[] = [];
    try {
      const saved = localStorage.getItem('codex_sessions');
      if (saved) {
        const parsed: GameSession[] = JSON.parse(saved);
        localForCamp = parsed.filter((s) => s.campaignId === campaignId);
        if (localForCamp.length > 0) {
          setSessions((prev) => {
            const merged = [...localForCamp];
            prev.forEach((p) => {
              if (p.campaignId === campaignId && !merged.some((m) => m.id === p.id)) merged.push(p);
            });
            return merged.sort((a, b) => a.sessionNumber - b.sessionNumber);
          });
          if (!activeSession) setActiveSession(localForCamp[0]);
        }
      }
    } catch (e) {}

    if (!isSupabaseConfigured() || !isValidUUID(campaignId)) return;

    try {
      const { data: sessionsData } = await supabase
        .from('sessions')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('session_number', { ascending: true });

      if (sessionsData && sessionsData.length > 0) {
        const formatted: GameSession[] = sessionsData.map((s) => ({
          id: s.id,
          campaignId: s.campaign_id,
          sessionNumber: s.session_number,
          title: s.title,
          notes: s.notes,
        }));
        setSessions((prev) => {
          const merged = [...formatted];
          localForCamp.forEach((l) => {
            if (!merged.some((m) => m.id === l.id)) merged.push(l);
          });
          return merged.sort((a, b) => a.sessionNumber - b.sessionNumber);
        });
        if (!activeSession) setActiveSession(formatted[0]);
      }
    } catch (e) {
      console.error('Error fetching sessions:', e);
    }
  };

  const fetchSessionScenes = async (sessionId: string) => {
    // 1. Load local scenes first for this session only
    let localForSession: GameScene[] = [];
    try {
      const saved = localStorage.getItem('codex_scenes');
      if (saved) {
        const parsed: GameScene[] = JSON.parse(saved);
        localForSession = parsed.filter((sc) => sc.sessionId === sessionId);
      }
    } catch (e) {}

    const sortedLocal = [...localForSession].sort((a, b) => a.orderIndex - b.orderIndex);
    setScenes(sortedLocal);
    setActiveScene(sortedLocal.length > 0 ? sortedLocal[0] : null);

    if (!isSupabaseConfigured() || !isValidUUID(sessionId)) return;

    try {
      const { data: scenesData } = await supabase
        .from('scenes')
        .select('*')
        .eq('session_id', sessionId)
        .order('order_index', { ascending: true });

      if (scenesData) {
        const formatted: GameScene[] = scenesData.map((sc) => ({
          id: sc.id,
          sessionId: sc.session_id,
          orderIndex: sc.order_index,
          title: sc.title,
          sceneType: sc.scene_type as any,
          npcName: sc.npc_name,
          sensoryText: sc.sensory_text,
          secretNotes: sc.secret_notes,
          bgmCategory: sc.bgm_category,
          imageUrl: sc.image_url,
          npcAudioUrl: sc.npc_audio_url,
          sfxShortcuts: sc.sfx_shortcuts || [],
          combatants: sc.combatants || [],
        }));
        const merged = [...formatted];
        sortedLocal.forEach((l) => {
          if (!merged.some((m) => m.id === l.id)) merged.push(l);
        });
        merged.sort((a, b) => a.orderIndex - b.orderIndex);

        setScenes(merged);
        setActiveScene(merged.length > 0 ? merged[0] : null);
      }
    } catch (e) {
      console.error('Error fetching scenes:', e);
    }
  };

  const fetchCampaignFeed = async (campaignId: string) => {
    // 1. Load local feed first
    try {
      const saved = localStorage.getItem('codex_feed');
      if (saved) {
        const parsed: CampaignFeedEvent[] = JSON.parse(saved);
        const filtered = parsed.filter((f) => f.campaignId === campaignId);
        if (filtered.length > 0) {
          setFeedEvents((prev) => {
            const merged = [...filtered];
            prev.forEach((p) => {
              if (p.campaignId === campaignId && !merged.some((m) => m.id === p.id)) merged.push(p);
            });
            return merged;
          });
        }
      }
    } catch (e) {}

    if (!isSupabaseConfigured() || !isValidUUID(campaignId)) return;

    try {
      const { data: feedData } = await supabase
        .from('campaign_feed_events')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (feedData) {
        const formatted: CampaignFeedEvent[] = feedData.map((f) => ({
          id: f.id,
          campaignId: f.campaign_id,
          sessionId: f.session_id,
          eventType: f.event_type as any,
          title: f.title,
          summary: f.summary,
          details: f.details,
          isPublic: f.is_public ?? true,
        }));
        setFeedEvents((prev) => {
          const merged = [...formatted];
          prev.forEach((p) => {
            if (p.campaignId === campaignId && !merged.some((m) => m.id === p.id)) merged.push(p);
          });
          return merged;
        });
      }
    } catch (e) {
      console.error('Error fetching feed events:', e);
    }
  };

  const createFeedEvent = async (eventData: Omit<CampaignFeedEvent, 'id'>): Promise<CampaignFeedEvent> => {
    const newEvent: CampaignFeedEvent = {
      ...eventData,
      id: `ev-${Date.now()}`,
    };

    if (isSupabaseConfigured() && isValidUUID(eventData.campaignId)) {
      try {
        const { data: feedResult } = await supabase.from('campaign_feed_events').insert({
          campaign_id: eventData.campaignId,
          session_id: isValidUUID(eventData.sessionId) ? eventData.sessionId : null,
          event_type: eventData.eventType,
          title: eventData.title,
          summary: eventData.summary,
          details: eventData.details || {},
          is_public: eventData.isPublic,
        }).select().single();

        if (feedResult?.id) {
          newEvent.id = feedResult.id;
        }
      } catch (e) {
        console.error('Error inserting feed event into Supabase:', e);
      }
    }

    setFeedEvents((prev) => {
      const next = [newEvent, ...prev];
      try {
        localStorage.setItem('codex_feed', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    return newEvent;
  };

  const toggleFeedEventVisibility = async (id: string) => {
    const target = feedEvents.find((e) => e.id === id);
    if (!target) return;
    const updatedPublic = !target.isPublic;

    if (isSupabaseConfigured() && isValidUUID(id)) {
      await supabase
        .from('campaign_feed_events')
        .update({ is_public: updatedPublic })
        .eq('id', id);
    }

    setFeedEvents((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, isPublic: updatedPublic } : e));
      try {
        localStorage.setItem('codex_feed', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const deleteFeedEvent = async (id: string) => {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      await supabase.from('campaign_feed_events').delete().eq('id', id);
    }
    setFeedEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem('codex_feed', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const createSession = async (title: string, notes?: string): Promise<GameSession> => {
    if (!activeCampaign) throw new Error('No active campaign');
    const num = sessions.length + 1;
    const newSess: GameSession = {
      id: `sess-${Date.now()}`,
      campaignId: activeCampaign.id,
      sessionNumber: num,
      title,
      notes,
    };

    if (isSupabaseConfigured() && isValidUUID(activeCampaign.id)) {
      try {
        const { data: sessResult } = await supabase.from('sessions').insert({
          campaign_id: activeCampaign.id,
          session_number: num,
          title,
          notes,
        }).select().single();

        if (sessResult?.id) {
          newSess.id = sessResult.id;
        }
      } catch (e) {
        console.error('Error inserting session into Supabase:', e);
      }
    }

    setSessions((prev) => {
      const next = [...prev, newSess];
      try {
        localStorage.setItem('codex_sessions', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setScenes([]);
    setActiveScene(null);
    setActiveSession(newSess);
    return newSess;
  };

  const createScene = async (sceneData: Omit<GameScene, 'id'>): Promise<GameScene> => {
    const newScene: GameScene = {
      ...sceneData,
      id: `sc-${Date.now()}`,
    };

    if (isSupabaseConfigured() && isValidUUID(sceneData.sessionId)) {
      try {
        const { data: scResult } = await supabase.from('scenes').insert({
          session_id: sceneData.sessionId,
          order_index: sceneData.orderIndex,
          title: sceneData.title,
          scene_type: sceneData.sceneType,
          npc_name: sceneData.npcName,
          sensory_text: sceneData.sensoryText,
          secret_notes: sceneData.secretNotes,
          bgm_category: sceneData.bgmCategory,
          image_url: sceneData.imageUrl,
          npc_audio_url: sceneData.npcAudioUrl,
          sfx_shortcuts: sceneData.sfxShortcuts || [],
          combatants: sceneData.combatants || [],
        }).select().single();

        if (scResult?.id) {
          newScene.id = scResult.id;
        }
      } catch (e) {
        console.error('Error inserting scene into Supabase:', e);
      }
    }

    setScenes((prev) => {
      const next = [...prev, newScene];
      try {
        localStorage.setItem('codex_scenes', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setActiveScene(newScene);
    return newScene;
  };

  const updateScene = async (updatedScene: GameScene) => {
    if (isSupabaseConfigured() && isValidUUID(updatedScene.id)) {
      await supabase
        .from('scenes')
        .update({
          title: updatedScene.title,
          scene_type: updatedScene.sceneType,
          npc_name: updatedScene.npcName,
          sensory_text: updatedScene.sensoryText,
          secret_notes: updatedScene.secretNotes,
          bgm_category: updatedScene.bgmCategory,
          image_url: updatedScene.imageUrl,
          npc_audio_url: updatedScene.npcAudioUrl,
          sfx_shortcuts: updatedScene.sfxShortcuts || [],
          combatants: updatedScene.combatants || [],
        })
        .eq('id', updatedScene.id);
    }

    setScenes((prev) => {
      const next = prev.map((s) => (s.id === updatedScene.id ? updatedScene : s));
      try {
        localStorage.setItem('codex_scenes', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    if (activeScene?.id === updatedScene.id) {
      setActiveScene(updatedScene);
    }
  };

  const deleteScene = async (id: string) => {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      await supabase.from('scenes').delete().eq('id', id);
    }
    setScenes((prev) => {
      const next = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem('codex_scenes', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const createWorldEntity = async (entity: Omit<WorldEntity, 'id'>): Promise<WorldEntity> => {
    const newEntity: WorldEntity = {
      ...entity,
      id: `ent-${Date.now()}`,
    };

    if (isSupabaseConfigured() && isValidUUID(entity.worldId)) {
      try {
        const { data: entResult } = await supabase.from('world_entities').insert({
          world_id: entity.worldId,
          category: entity.category,
          name: entity.name,
          sub_type: entity.subType,
          status: entity.status,
          short_desc: entity.shortDesc,
          full_content: entity.fullContent,
          attributes: entity.attributes || {},
          connections: entity.connections || [],
        }).select().single();

        if (entResult?.id) {
          newEntity.id = entResult.id;
        }
      } catch (e) {
        console.error('Error inserting world entity into Supabase:', e);
      }
    }

    setWorldEntities((prev) => [...prev, newEntity]);
    return newEntity;
  };

  const deleteWorldEntity = async (id: string) => {
    if (isSupabaseConfigured() && isValidUUID(id)) {
      await supabase.from('world_entities').delete().eq('id', id);
    }
    setWorldEntities((prev) => prev.filter((e) => e.id !== id));
  };

  const createWorld = async (title: string, description?: string, genre: string = 'Fantasia Medieval'): Promise<World> => {
    const newWorld: World = {
      id: `world-${Date.now()}`,
      dmId: user?.id || 'demo-dm-user-123',
      title,
      genre,
      description,
    };

    if (isSupabaseConfigured() && user) {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email || `${user.id}@codex.rpg`,
          display_name: user.displayName,
        });

        const { data: wData } = await supabase.from('worlds').insert({
          dm_id: user.id,
          title,
          genre,
          description,
        }).select().single();

        if (wData?.id) {
          newWorld.id = wData.id;
        }
      } catch (e) {
        console.error('Error creating world in Supabase:', e);
      }
    }

    setUserWorlds((prev) => [...prev, newWorld]);
    setActiveWorld(newWorld);
    return newWorld;
  };

  const createCampaign = async (title: string, worldId?: string, description?: string): Promise<UserCampaign> => {
    const code = `${title.slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const userId = user?.id || 'demo-dm-user-123';
    const newCamp: UserCampaign = {
      id: `camp-${Date.now()}`,
      dmId: userId,
      worldId,
      title,
      description: description || 'Minha nova campanha de RPG D&D 5e.',
      inviteCode: code,
      role: 'dm',
    };

    const newMember: CampaignMember = {
      id: `mem-${Date.now()}`,
      campaignId: newCamp.id,
      userId,
      role: 'dm',
      displayName: user?.displayName || 'Frederico Monteiro (Game Dev)',
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          email: user?.email || `${userId}@codex.rpg`,
          display_name: user?.displayName || 'Frederico Monteiro (Game Dev)',
        });

        const validWorldId = isValidUUID(worldId) ? worldId : null;

        const { data: cData, error: cErr } = await supabase.from('campaigns').insert({
          dm_id: userId,
          world_id: validWorldId,
          title,
          description,
          invite_code: code,
        }).select().single();

        if (cErr) {
          console.error('Error inserting campaign into Supabase:', cErr);
        }

        if (cData) {
          newCamp.id = cData.id;
          newMember.campaignId = cData.id;
          await supabase.from('campaign_members').insert({
            campaign_id: cData.id,
            user_id: userId,
            role: 'dm',
          });
        }
      } catch (e) {
        console.error('Error creating campaign in Supabase:', e);
      }
    }

    setUserCampaigns((prev) => [...prev, newCamp]);
    setCampaignMembers((prev) => [...prev, newMember]);
    setActiveCampaign(newCamp);
    setRoleMode('dm');

    try {
      const savedCampsStr = localStorage.getItem('codex_campaigns');
      let allCamps: UserCampaign[] = savedCampsStr ? JSON.parse(savedCampsStr) : [];
      allCamps.push(newCamp);
      localStorage.setItem('codex_campaigns', JSON.stringify(allCamps));

      const savedMemsStr = localStorage.getItem('codex_members');
      let allMems: CampaignMember[] = savedMemsStr ? JSON.parse(savedMemsStr) : [];
      allMems.push(newMember);
      localStorage.setItem('codex_members', JSON.stringify(allMems));
    } catch (e) {}

    return newCamp;
  };

  const signInWithGoogle = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });
    } else {
      setUser({
        id: `user-google-${Date.now()}`,
        email: 'jogador.google@gmail.com',
        displayName: 'Jogador Google',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=GooglePlayer',
      });
    }
  };

  const signInWithEmail = async (email: string) => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signInWithOtp({ email });
    } else {
      setUser({
        id: `user-${Date.now()}`,
        email,
        displayName: email.split('@')[0],
      });
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setUserWorlds([]);
    setActiveWorld(null);
    setWorldEntities([]);
    setUserCampaigns([]);
    setActiveCampaign(null);
    setCampaignMembers([]);
    setSessions([]);
    setActiveSession(null);
    setScenes([]);
    setActiveScene(null);
    setFeedEvents([]);
    localStorage.clear();
  };

  const loadDemoEverything = () => {
    setUserWorlds((prev) => [...prev, SAMPLE_DEMO_WORLD]);
    setActiveWorld(SAMPLE_DEMO_WORLD);
    setWorldEntities(SAMPLE_DEMO_ENTITIES);
    setUserCampaigns((prev) => [...prev, SAMPLE_DEMO_CAMPAIGN]);
    setActiveCampaign(SAMPLE_DEMO_CAMPAIGN);
    setCampaignMembers(SAMPLE_DEMO_MEMBERS);
    setSessions([SAMPLE_DEMO_SESSION]);
    setActiveSession(SAMPLE_DEMO_SESSION);
    setScenes(SAMPLE_DEMO_SCENES);
    setActiveScene(SAMPLE_DEMO_SCENES[0]);
    setFeedEvents(SAMPLE_DEMO_FEED_EVENTS);
    setRoleMode('dm');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        roleMode,
        setRoleMode,
        userWorlds,
        activeWorld,
        setActiveWorld,
        createWorld,
        worldEntities,
        createWorldEntity,
        deleteWorldEntity,
        userCampaigns,
        activeCampaign,
        setActiveCampaign,
        campaignMembers,
        fetchCampaignMembers,
        addCampaignMember,
        sessions,
        activeSession,
        setActiveSession,
        createSession,
        scenes,
        activeScene,
        setActiveScene,
        createScene,
        updateScene,
        deleteScene,
        feedEvents,
        createFeedEvent,
        toggleFeedEventVisibility,
        deleteFeedEvent,
        signInWithGoogle,
        signInWithEmail,
        signOut,
        joinCampaignByCode,
        leaveCampaign,
        createCampaign,
        loadDemoEverything,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
