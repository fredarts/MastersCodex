'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Crown, 
  Heart, 
  Skull, 
  Shield, 
  Trash2, 
  Sparkles, 
  Save, 
  Link2,
  Lock,
  Plus,
  Check,
  ExternalLink
} from 'lucide-react';
import { 
  FamilyMemberNode, 
  FamilyRelationshipEdge, 
  FamilyRelationType, 
  SuccessionStatus, 
  WorldEntity 
} from '@/lib/types';
import { getEntityPortraitUrl } from '@/lib/world/entityHelpers';
import { useWorld } from '@/context/WorldContext';
import { toast } from 'sonner';

interface FamilyMemberModalProps {
  isOpen: boolean;
  member: FamilyMemberNode | null;
  allMembers: FamilyMemberNode[];
  relationships: FamilyRelationshipEdge[];
  onClose: () => void;
  onSave: (updatedMember: FamilyMemberNode, newRelationships?: FamilyRelationshipEdge[]) => void;
  onDelete?: (memberId: string) => void;
}

export const FamilyMemberModal: React.FC<FamilyMemberModalProps> = ({
  isOpen,
  member,
  allMembers,
  relationships,
  onClose,
  onSave,
  onDelete,
}) => {
  const { worldEntities, createWorldEntity, activeWorld } = useWorld();
  const npcs = worldEntities.filter((e) => e.category === 'npc');

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [race, setRace] = useState('Humano');
  const [houseOrDynasty, setHouseOrDynasty] = useState('');
  const [generation, setGeneration] = useState(0);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [birthEra, setBirthEra] = useState('');
  const [deathEra, setDeathEra] = useState('');
  const [isAlive, setIsAlive] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [successionStatus, setSuccessionStatus] = useState<SuccessionStatus | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [secrets, setSecrets] = useState('');
  const [customBadge, setCustomBadge] = useState('');
  const [selectedWorldEntityId, setSelectedWorldEntityId] = useState('');
  const [isCreatingNpc, setIsCreatingNpc] = useState(false);

  // Quick Relationship Setup
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedSpouseId, setSelectedSpouseId] = useState('');
  const [relationTypeWithParent, setRelationTypeWithParent] = useState<FamilyRelationType>('parent');
  const [spouseRelationType, setSpouseRelationType] = useState<FamilyRelationType>('spouse');

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setTitle(member.title || '');
      setRace(member.race || 'Humano');
      setHouseOrDynasty(member.houseOrDynasty || '');
      setGeneration(member.generation ?? 0);
      setGender(member.gender || 'male');
      setBirthEra(member.birthEra || '');
      setDeathEra(member.deathEra || '');
      setIsAlive(member.isAlive ?? true);
      setAvatarUrl(member.avatarUrl || '');
      setSuccessionStatus(member.successionStatus);
      setNotes(member.notes || '');
      setSecrets(member.secrets || '');
      setCustomBadge(member.customBadge || '');
      setSelectedWorldEntityId(member.worldEntityId || '');

      // Load parent relationship from tree relationships
      const parentEdge = relationships.find(
        (r) => r.toId === member.id && ['parent', 'bastard', 'adopted'].includes(r.type)
      );
      if (parentEdge) {
        setSelectedParentId(parentEdge.fromId);
        setRelationTypeWithParent(parentEdge.type);
      } else {
        setSelectedParentId('');
        setRelationTypeWithParent('parent');
      }

      // Load spouse / partner relationship from tree relationships
      const spouseEdge = relationships.find(
        (r) =>
          ['spouse', 'ex_spouse', 'betrothed'].includes(r.type) &&
          (r.fromId === member.id || r.toId === member.id)
      );
      if (spouseEdge) {
        const partnerId = spouseEdge.fromId === member.id ? spouseEdge.toId : spouseEdge.fromId;
        setSelectedSpouseId(partnerId);
        setSpouseRelationType(spouseEdge.type);
      } else {
        setSelectedSpouseId('');
        setSpouseRelationType('spouse');
      }
    } else {
      // New member defaults
      setName('');
      setTitle('');
      setRace('Humano');
      setHouseOrDynasty('');
      setGeneration(0);
      setGender('male');
      setBirthEra('');
      setDeathEra('');
      setIsAlive(true);
      setAvatarUrl('');
      setSuccessionStatus(undefined);
      setNotes('');
      setSecrets('');
      setCustomBadge('');
      setSelectedWorldEntityId('');
      setSelectedParentId('');
      setSelectedSpouseId('');
      setRelationTypeWithParent('parent');
      setSpouseRelationType('spouse');
    }
  }, [member, isOpen, relationships]);

  // Handle NPC Link Selection
  const handleSelectNpc = (npcId: string) => {
    setSelectedWorldEntityId(npcId);
    const foundNpc = npcs.find((n) => n.id === npcId);
    if (foundNpc) {
      if (!name) setName(foundNpc.name);
      if (!title && foundNpc.subType) setTitle(foundNpc.subType);
      const portrait = getEntityPortraitUrl(foundNpc);
      if (portrait) {
        setAvatarUrl(portrait);
      }
      setIsAlive(foundNpc.status === 'active' || foundNpc.status === 'allied');
    }
  };

  // Criar Entidade NPC no Worldbuilder a partir deste formulário
  const handleCreateNpcFromMember = async () => {
    if (!name.trim()) {
      toast.error('Informe o nome do personagem antes de forjar o NPC.');
      return;
    }

    setIsCreatingNpc(true);
    try {
      const fullContentLines = [
        `### Informações Genealógicas`,
        `**Casa / Clã:** ${houseOrDynasty || 'Não informado'}`,
        `**Geração:** Geração ${generation}`,
        `**Status de Vida:** ${isAlive ? 'Vivo' : 'Falecido'}`,
        birthEra ? `**Nascimento:** ${birthEra}` : null,
        deathEra && !isAlive ? `**Morte:** ${deathEra}` : null,
        successionStatus ? `**Linha Sucessória:** ${successionStatus}` : null,
        customBadge ? `**Título / Distintivo:** ${customBadge}` : null,
        notes ? `\n### Biografia\n${notes}` : null,
        secrets ? `\n> 🔒 **Segredo do Mestre:** ${secrets}` : null,
      ].filter(Boolean).join('\n');

      const autoTags = [
        houseOrDynasty.trim(),
        'Árvore Genealógica',
        race.trim() || 'Humano',
        title.trim(),
        customBadge.trim() ? customBadge.trim().replace(/^[\p{Emoji}\s]+/gu, '').trim() : null,
      ].filter(Boolean) as string[];

      const createdNpc = await createWorldEntity({
        worldId: activeWorld?.id || 'world-demo-1',
        category: 'npc',
        name: name.trim(),
        subType: title.trim() || (houseOrDynasty ? `Nobre da ${houseOrDynasty}` : 'Personagem de Linhagem'),
        status: isAlive ? 'active' : 'dead',
        shortDesc: notes.trim() || (title ? `${title} da ${houseOrDynasty || 'família'}` : `Membro da ${houseOrDynasty || 'família'}`),
        fullContent: notes.trim() || undefined,
        images: avatarUrl.trim() ? [avatarUrl.trim()] : [],
        tags: autoTags,
        attributes: {
          familyMemberId: member?.id,
          houseOrDynasty: houseOrDynasty.trim(),
          generation: String(generation),
          gender: gender || 'male',
          birthEra: birthEra.trim(),
          deathEra: !isAlive ? deathEra.trim() : '',
          successionStatus: successionStatus || 'none',
          customBadge: customBadge.trim(),
          secrets: secrets.trim(),
          npcRace: race.trim() || 'Humano',
          npcClass: title.trim(),
          npcAlignment: 'Neutro',
          tags: JSON.stringify(autoTags),
        }
      });

      if (createdNpc) {
        setSelectedWorldEntityId(createdNpc.id);
        toast.success(`Entidade NPC "${createdNpc.name}" forjada no Worldbuilder e vinculada com sucesso!`);
      }
    } catch (err: any) {
      toast.error('Erro ao forjar entidade NPC.');
    } finally {
      setIsCreatingNpc(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const memberId = member ? member.id : `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const savedMember: FamilyMemberNode = {
      id: memberId,
      worldEntityId: selectedWorldEntityId || undefined,
      name: name.trim(),
      title: title.trim() || undefined,
      race: race.trim() || undefined,
      houseOrDynasty: houseOrDynasty.trim() || undefined,
      generation: Number(generation),
      gender,
      birthEra: birthEra.trim() || undefined,
      deathEra: !isAlive ? deathEra.trim() || undefined : undefined,
      isAlive,
      avatarUrl: avatarUrl.trim() || undefined,
      successionStatus: successionStatus || undefined,
      notes: notes.trim() || undefined,
      secrets: secrets.trim() || undefined,
      customBadge: customBadge.trim() || undefined,
    };

    // Filter out old parent and spouse edges for this member
    const updatedRelations = relationships.filter((r) => {
      if (r.toId === memberId && ['parent', 'bastard', 'adopted'].includes(r.type)) {
        return false;
      }
      if (
        ['spouse', 'ex_spouse', 'betrothed'].includes(r.type) &&
        (r.fromId === memberId || r.toId === memberId)
      ) {
        return false;
      }
      return true;
    });

    // Add updated parent edge if selected
    if (selectedParentId) {
      updatedRelations.push({
        id: `rel_${Date.now()}_p_${Math.random().toString(36).substring(2, 6)}`,
        fromId: selectedParentId,
        toId: memberId,
        type: relationTypeWithParent,
      });
    }

    // Add updated spouse edge if selected
    if (selectedSpouseId) {
      updatedRelations.push({
        id: `rel_${Date.now()}_s_${Math.random().toString(36).substring(2, 6)}`,
        fromId: memberId,
        toId: selectedSpouseId,
        type: spouseRelationType,
      });
    }

    onSave(savedMember, updatedRelations);
    onClose();
  };

  const otherMembers = allMembers.filter((m) => !member || m.id !== member.id);

  // Calculate existing children and siblings for this member
  const childrenEdges = member
    ? relationships.filter(
        (r) => r.fromId === member.id && ['parent', 'bastard', 'adopted'].includes(r.type)
      )
    : [];
  const childrenMembers = allMembers.filter((m) =>
    childrenEdges.some((ce) => ce.toId === m.id)
  );

  const parentEdge = member
    ? relationships.find(
        (r) => r.toId === member.id && ['parent', 'bastard', 'adopted'].includes(r.type)
      )
    : null;
  const siblingEdges = parentEdge
    ? relationships.filter(
        (r) =>
          r.fromId === parentEdge.fromId &&
          r.toId !== member?.id &&
          ['parent', 'bastard', 'adopted'].includes(r.type)
      )
    : [];
  const siblingMembers = allMembers.filter((m) =>
    siblingEdges.some((se) => se.toId === m.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-[#0e131f] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#141a29]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <User className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {member ? 'Editar Membro da Família' : 'Novo Membro na Árvore'}
              </h3>
              <p className="text-xs text-slate-400">
                Configure os dados genealógicos, sucessão e vínculos de parentesco.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* NPC Worldbuilder Link & Creator */}
          <div className="p-3.5 bg-gradient-to-br from-amber-500/10 to-amber-900/10 border border-amber-500/30 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Link2 className="w-4 h-4" /> Vínculo com NPC do Worldbuilder
              </label>
              {selectedWorldEntityId && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full font-bold">
                  <Check className="w-3 h-3" /> Entidade Vinculada
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedWorldEntityId}
                onChange={(e) => handleSelectNpc(e.target.value)}
                className="flex-1 bg-[#161c2b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="">-- Selecione um NPC Existente --</option>
                {npcs.map((npc) => (
                  <option key={npc.id} value={npc.id}>
                    {npc.name} {npc.subType ? `(${npc.subType})` : ''}
                  </option>
                ))}
              </select>

              {/* Botão de Criar NPC automaticamente */}
              {!selectedWorldEntityId ? (
                <button
                  type="button"
                  disabled={isCreatingNpc || !name.trim()}
                  onClick={handleCreateNpcFromMember}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 disabled:opacity-50 transition-all font-mono whitespace-nowrap"
                  title="Cria automaticamente um NPC no Worldbuilder com os dados deste formulário"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>{isCreatingNpc ? 'Criando NPC...' : '+ Forjar NPC no Mundo'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedWorldEntityId('')}
                  className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors whitespace-nowrap"
                  title="Desvincular do NPC"
                >
                  Desvincular
                </button>
              )}
            </div>

            {/* Preview do NPC vinculado (com foto se existir) */}
            {selectedWorldEntityId && (
              <div className="flex items-center justify-between p-2 bg-[#121724] rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-500/40 bg-slate-800 flex items-center justify-center flex-shrink-0">
                    {(() => {
                      const linked = npcs.find((n) => n.id === selectedWorldEntityId);
                      const img = (linked ? getEntityPortraitUrl(linked) : undefined) || avatarUrl;
                      return img ? (
                        <img src={img} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-slate-400" />
                      );
                    })()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">
                      {npcs.find((n) => n.id === selectedWorldEntityId)?.name || 'NPC Vinculado'}
                    </div>
                    <div className="text-[10px] text-amber-400/90">
                      {npcs.find((n) => n.id === selectedWorldEntityId)?.subType || 'NPC do Worldbuilder'}
                    </div>
                  </div>
                </div>

                {npcs.find((n) => n.id === selectedWorldEntityId)?.images?.[0] && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                    🖼️ Retrato Sincronizado
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Primary Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome do Personagem *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Eddard Stark"
                className="w-full bg-[#161c2b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Título / Cargo Nobre
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Protetor do Norte, Lorde Regente"
                className="w-full bg-[#161c2b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Raça / Espécie
              </label>
              <input
                type="text"
                value={race}
                onChange={(e) => setRace(e.target.value)}
                placeholder="Ex: Humano, Alto Elfo, Anão"
                className="w-full bg-[#161c2b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* House, Generation & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Casa / Clã
              </label>
              <input
                type="text"
                value={houseOrDynasty}
                onChange={(e) => setHouseOrDynasty(e.target.value)}
                placeholder="Ex: Casa Stark"
                className="w-full bg-[#161c2b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Geração (Tier Hierárquico)
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={generation}
                onChange={(e) => setGeneration(parseInt(e.target.value) || 0)}
                className="w-full bg-[#161c2b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Gênero
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-[#161c2b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
                <option value="other">Outro / Neutro</option>
              </select>
            </div>
          </div>

          {/* Life Status & Eras */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-[#131926] rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Status de Vida
              </label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsAlive(true)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                    isAlive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Vivo(a)
                </button>
                <button
                  type="button"
                  onClick={() => setIsAlive(false)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                    !isAlive
                      ? 'bg-rose-700 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Falecido(a)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nascimento (Ano/Era)
              </label>
              <input
                type="text"
                value={birthEra}
                onChange={(e) => setBirthEra(e.target.value)}
                placeholder="Ex: 263 DC"
                className="w-full bg-[#161c2b] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Morte (se falecido)
              </label>
              <input
                type="text"
                disabled={isAlive}
                value={deathEra}
                onChange={(e) => setDeathEra(e.target.value)}
                placeholder="Ex: 298 DC"
                className="w-full bg-[#161c2b] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 disabled:opacity-40 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Succession Status & Badge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Posição na Linha de Sucessão
              </label>
              <select
                value={successionStatus || ''}
                onChange={(e) => setSuccessionStatus((e.target.value as SuccessionStatus) || undefined)}
                className="w-full bg-[#161c2b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value="">Nenhum / Cidadão Comum</option>
                <option value="ruling">👑 Atual Soberano / Monarca / Líder</option>
                <option value="heir_apparent">🛡️ 1º Herdeiro Aparente (Próximo Rei)</option>
                <option value="heir_presumptive">✨ Linha de Sucessão Ativa</option>
                <option value="claimant">⚔️ Reivindicante / Pretendente Rival</option>
                <option value="disinherited">❌ Deserdado(a)</option>
                <option value="abdicated">📜 Abdicou do Trono</option>
                <option value="exiled">🚪 Em Exílio</option>
                <option value="missing">❓ Desaparecido(a)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tag / Distintivo Customizado
              </label>
              <input
                type="text"
                value={customBadge}
                onChange={(e) => setCustomBadge(e.target.value)}
                placeholder="Ex: 💀 Assassinado, 🧙 Arquimago"
                className="w-full bg-[#161c2b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              URL do Retrato / Avatar
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#161c2b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Quick Relationship Selectors */}
          {otherMembers.length > 0 && (
            <div className="p-3 bg-[#131a29] border border-slate-700/80 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
                  <Plus className="w-3.5 h-3.5 text-amber-400" /> Vínculos & Parentesco Direto
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  {childrenMembers.length} filho(s) • {siblingMembers.length} irmão(s)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Progenitor / Pai / Mãe */}
                <div className="space-y-1.5 min-w-0">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                    Filho(a) de (Progenitor):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={selectedParentId}
                      onChange={(e) => setSelectedParentId(e.target.value)}
                      className="sm:col-span-2 w-full min-w-0 bg-[#161c2b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 truncate"
                    >
                      <option value="">-- Sem Progenitor Definido --</option>
                      {otherMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} (G{m.generation})
                        </option>
                      ))}
                    </select>
                    <select
                      value={relationTypeWithParent}
                      onChange={(e) => setRelationTypeWithParent(e.target.value as any)}
                      className="w-full bg-[#161c2b] border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-amber-400"
                    >
                      <option value="parent">👑 Legítimo</option>
                      <option value="bastard">🐺 Bastardo</option>
                      <option value="adopted">📜 Adotado</option>
                    </select>
                  </div>
                </div>

                {/* Cônjuge / Ex-Cônjuge / Prometido */}
                <div className="space-y-1.5 min-w-0">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                    Casado(a) / União com (Cônjuge):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={selectedSpouseId}
                      onChange={(e) => setSelectedSpouseId(e.target.value)}
                      className="sm:col-span-2 w-full min-w-0 bg-[#161c2b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 truncate"
                    >
                      <option value="">-- Sem Cônjuge / Solteiro(a) --</option>
                      {otherMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} (G{m.generation})
                        </option>
                      ))}
                    </select>
                    <select
                      value={spouseRelationType}
                      onChange={(e) => setSpouseRelationType(e.target.value as any)}
                      className="w-full bg-[#161c2b] border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-amber-400"
                    >
                      <option value="spouse">💍 Casado(a)</option>
                      <option value="ex_spouse">💔 Ex-Cônjuge</option>
                      <option value="betrothed">✨ Noivado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Children list display */}
              {childrenMembers.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
                    Filhos(as) Diretos(as) ({childrenMembers.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {childrenMembers.map((child) => {
                      const cEdge = childrenEdges.find((ce) => ce.toId === child.id);
                      const isBastard = cEdge?.type === 'bastard';
                      const isAdopted = cEdge?.type === 'adopted';

                      return (
                        <span
                          key={child.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] bg-[#161c2b] border border-slate-700 text-slate-200"
                        >
                          <span className="font-semibold">{child.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono">G{child.generation}</span>
                          {isBastard && (
                            <span className="text-[9px] text-amber-400 font-bold ml-0.5">🐺 Bastardo</span>
                          )}
                          {isAdopted && (
                            <span className="text-[9px] text-cyan-400 font-bold ml-0.5">📜 Adotado</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Siblings list display */}
              {siblingMembers.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
                    Irmãos(ãs) ({siblingMembers.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {siblingMembers.map((sib) => (
                      <span
                        key={sib.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-[#161c2b] border border-slate-700/60 text-slate-300"
                      >
                        <span>{sib.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono">G{sib.generation}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes & Secret DM Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Biografia Resumida / Notas Públicas
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Fatos conhecidos da história deste personagem..."
                className="w-full bg-[#161c2b] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-1">
                <Lock className="w-3.5 h-3.5" /> Segredos Genealógicos (Visível apenas para o Mestre)
              </label>
              <textarea
                rows={2}
                value={secrets}
                onChange={(e) => setSecrets(e.target.value)}
                placeholder="Ex: Na verdade é filho do conselheiro com a rainha; possui um veneno oculto..."
                className="w-full bg-[#1e141a] border border-rose-900/60 rounded-lg px-3 py-2 text-xs text-rose-200 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {member && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Remover "${member.name}" desta árvore genealógica?`)) {
                    onDelete(member.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-950/50 hover:border-rose-800 border border-transparent transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Excluir Membro
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all"
              >
                <Save className="w-4 h-4" /> Salvar Membro
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
