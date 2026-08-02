'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserCampaign, CampaignMember, CampaignFeedEvent } from '@/lib/types';
import { campaignService } from '@/lib/services/campaignService';
import { toast } from 'sonner';

interface CampaignContextType {
  userCampaigns: UserCampaign[];
  setUserCampaigns: React.Dispatch<React.SetStateAction<UserCampaign[]>>;
  activeCampaign: UserCampaign | null;
  setActiveCampaign: (campaign: UserCampaign | null) => void;
  campaignMembers: CampaignMember[];
  setCampaignMembers: React.Dispatch<React.SetStateAction<CampaignMember[]>>;
  fetchCampaignMembers: (campaignId: string) => Promise<void>;
  addCampaignMember: (campaignId: string, characterName: string, role?: 'dm' | 'player') => Promise<void>;
  removeCampaignMember: (memberId: string) => Promise<void>;
  updateCampaignMemberModelUrl: (campaignId: string, characterName: string, modelUrl: string) => Promise<void>;
  createCampaign: (title: string, worldId?: string, description?: string) => Promise<UserCampaign | null>;
  updateCampaign: (updatedCampaign: UserCampaign) => Promise<void>;
  joinCampaignByCode: (code: string, characterName?: string, modelUrl?: string) => Promise<boolean>;
  leaveCampaign: (campaignId: string) => Promise<void>;
  feedEvents: CampaignFeedEvent[];
  setFeedEvents: React.Dispatch<React.SetStateAction<CampaignFeedEvent[]>>;
  createFeedEvent: (eventData: Omit<CampaignFeedEvent, 'id'>) => Promise<CampaignFeedEvent | null>;
  toggleFeedEventVisibility: (id: string) => Promise<void>;
  deleteFeedEvent: (id: string) => Promise<void>;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const CampaignProvider: React.FC<{ children: React.ReactNode; currentUserId?: string }> = ({
  children,
  currentUserId,
}) => {
  const [userCampaigns, setUserCampaigns] = useState<UserCampaign[]>([]);
  const [activeCampaign, setActiveCampaignState] = useState<UserCampaign | null>(null);
  const [campaignMembers, setCampaignMembers] = useState<CampaignMember[]>([]);
  const [feedEvents, setFeedEvents] = useState<CampaignFeedEvent[]>([]);

  useEffect(() => {
    campaignService.fetchUserCampaigns(currentUserId).then((res) => {
      if (res.ok) {
        const camps = res.value;
        if (camps.length > 0) {
          setUserCampaigns(camps);
          const savedActiveId = typeof window !== 'undefined' ? localStorage.getItem('codex_activeCampaignId') : null;
          const found = savedActiveId ? camps.find((c) => c.id === savedActiveId) : null;
          const target = found || camps[0];
          setActiveCampaignState(target);

          campaignService.fetchCampaignMembers(target.id, currentUserId).then((mRes) => {
            if (mRes.ok) setCampaignMembers(mRes.value);
            else toast.error(mRes.error.message);
          });
          campaignService.fetchFeedEvents(target.id, currentUserId).then((fRes) => {
            if (fRes.ok) setFeedEvents(fRes.value);
            else toast.error(fRes.error.message);
          });
        }
      } else {
        toast.error(res.error.message);
      }
    });
  }, [currentUserId]);

  const setActiveCampaign = (camp: UserCampaign | null) => {
    setActiveCampaignState(camp);
    try {
      if (camp) {
        localStorage.setItem('codex_activeCampaignId', camp.id);
        campaignService.fetchCampaignMembers(camp.id, currentUserId).then((mRes) => {
          if (mRes.ok) setCampaignMembers(mRes.value);
          else toast.error(mRes.error.message);
        });
        campaignService.fetchFeedEvents(camp.id, currentUserId).then((fRes) => {
          if (fRes.ok) setFeedEvents(fRes.value);
          else toast.error(fRes.error.message);
        });
      } else {
        localStorage.removeItem('codex_activeCampaignId');
      }
    } catch (e) {}
  };

  const fetchCampaignMembers = useCallback(async (campaignId: string) => {
    const res = await campaignService.fetchCampaignMembers(campaignId, currentUserId);
    if (res.ok) {
      setCampaignMembers(res.value);
    } else {
      toast.error(res.error.message);
    }
  }, [currentUserId]);

  const addCampaignMember = async (campaignId: string, characterName: string, role: 'dm' | 'player' = 'player') => {
    const res = await campaignService.addCampaignMember(campaignId, characterName, role, currentUserId);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    const newMember = res.value;
    setCampaignMembers((prev) => [...prev.filter((m) => m.id !== newMember.id), newMember]);
  };

  const removeCampaignMember = async (memberId: string) => {
    const res = await campaignService.removeCampaignMember(memberId, currentUserId);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }

    setCampaignMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const updateCampaignMemberModelUrl = async (campaignId: string, characterName: string, modelUrl: string) => {
    const res = await campaignService.updateCampaignMemberModelUrl(campaignId, characterName, modelUrl, currentUserId);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }

    setCampaignMembers((prev) =>
      prev.map((m) =>
        m.campaignId === campaignId && m.characterName?.toLowerCase() === characterName.toLowerCase()
          ? { ...m, modelUrl }
          : m
      )
    );
  };

  const createCampaign = async (title: string, worldId?: string, description = ''): Promise<UserCampaign | null> => {
    const res = await campaignService.createCampaign(title, worldId, description, currentUserId);
    if (!res.ok) {
      toast.error(res.error.message);
      return null;
    }
    const newCamp = res.value;
    setUserCampaigns((prev) => [...prev, newCamp]);
    setActiveCampaign(newCamp);
    return newCamp;
  };

  const updateCampaign = async (updatedCampaign: UserCampaign) => {
    const res = await campaignService.updateCampaign(updatedCampaign, currentUserId);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }

    setUserCampaigns((prev) => prev.map((c) => (c.id === updatedCampaign.id ? updatedCampaign : c)));
    if (activeCampaign?.id === updatedCampaign.id) {
      setActiveCampaignState(updatedCampaign);
    }
  };

  const joinCampaignByCode = async (code: string, characterName?: string, modelUrl?: string): Promise<boolean> => {
    const res = await campaignService.joinCampaignByCode(code, currentUserId || 'demo-user-1', characterName);
    if (!res.ok) {
      toast.error(res.error.message);
      return false;
    }
    if (res.value) {
      const { campaign, member } = res.value;
      setUserCampaigns((prev) => {
        if (prev.some((c) => c.id === campaign.id)) return prev;
        return [...prev, campaign];
      });

      if (member) {
        setCampaignMembers((prev) => [...prev.filter((m) => m.id !== member.id), member]);
        if (modelUrl) {
          await updateCampaignMemberModelUrl(campaign.id, characterName || '', modelUrl);
        }
      }

      setActiveCampaign(campaign);
      return true;
    }

    return false;
  };

  const leaveCampaign = async (campaignId: string) => {
    const res = await campaignService.leaveCampaign(campaignId, currentUserId || '');
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }

    setUserCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    if (activeCampaign?.id === campaignId) {
      setActiveCampaign(null);
    }
  };

  const createFeedEvent = async (eventData: Omit<CampaignFeedEvent, 'id'>): Promise<CampaignFeedEvent | null> => {
    const payload = {
      ...eventData,
      campaignId: eventData.campaignId || activeCampaign?.id || 'camp-demo-1',
    };
    const res = await campaignService.createFeedEvent(payload, currentUserId);
    if (!res.ok) {
      toast.error(res.error.message);
      return null;
    }
    const newEvent = res.value;
    setFeedEvents((prev) => [newEvent, ...prev]);
    return newEvent;
  };

  const toggleFeedEventVisibility = async (id: string) => {
    const res = await campaignService.toggleFeedEventVisibility(id, activeCampaign?.id);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }

    setFeedEvents((prev) => prev.map((e) => (e.id === id ? { ...e, isPublic: !e.isPublic } : e)));
  };

  const deleteFeedEvent = async (id: string) => {
    const res = await campaignService.deleteFeedEvent(id, activeCampaign?.id);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }

    setFeedEvents((prev) => prev.filter((e) => e.id !== id));
  };


  return (
    <CampaignContext.Provider
      value={{
        userCampaigns,
        setUserCampaigns,
        activeCampaign,
        setActiveCampaign,
        campaignMembers,
        setCampaignMembers,
        fetchCampaignMembers,
        addCampaignMember,
        removeCampaignMember,
        updateCampaignMemberModelUrl,
        createCampaign,
        updateCampaign,
        joinCampaignByCode,
        leaveCampaign,
        feedEvents,
        setFeedEvents,
        createFeedEvent,
        toggleFeedEventVisibility,
        deleteFeedEvent,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
};

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};
