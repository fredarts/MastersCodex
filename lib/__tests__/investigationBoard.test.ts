import { describe, it, expect } from 'vitest';
import { investigationService } from '../investigation/investigationService';
import { PinBoardItem, StringColor } from '../investigation/investigationTypes';

describe('Investigation Board & Detective String Engine', () => {
  const campaignId = 'test-camp-1';

  it('creates separate default boards for party and personal scopes', () => {
    const partyBoard = investigationService.createDefaultBoard(campaignId, 'party');
    const personalBoard = investigationService.createDefaultBoard(campaignId, 'personal', 'user-123');

    expect(partyBoard.scope).toBe('party');
    expect(partyBoard.items.length).toBeGreaterThan(0);
    expect(partyBoard.connections.length).toBe(2);

    expect(personalBoard.scope).toBe('personal');
    expect(personalBoard.ownerUserId).toBe('user-123');
    expect(personalBoard.connections.length).toBe(0);
  });

  it('blocks self-loop string connections on the same pin', async () => {
    const board = investigationService.createDefaultBoard(campaignId, 'party');
    const pinId = board.items[0].id;

    const res = await investigationService.connectPins(board, pinId, pinId, 'red', 'Invalid loop');
    expect(res.error).toBe('Um pino não pode ser conectado a ele mesmo.');
    expect(res.board.connections.length).toBe(board.connections.length);
  });

  it('connects two valid pins and records color and label', async () => {
    const board = investigationService.createDefaultBoard(campaignId, 'party');
    const fromId = board.items[0].id;
    const toId = board.items[1].id;

    const res = await investigationService.connectPins(
      board, 
      fromId, 
      toId, 
      'green' as StringColor, 
      'Relação de Parentesco', 
      'Detetive Holmes'
    );

    expect(res.error).toBeUndefined();
    expect(res.connection?.stringColor).toBe('green');
    expect(res.connection?.label).toBe('Relação de Parentesco');
  });

  it('performs atomic cascade delete: deleting a pin purges all connected strings', async () => {
    const board = investigationService.createDefaultBoard(campaignId, 'party');
    const targetPinId = 'pin-sample-3'; // Pin with 2 connections in default board

    expect(board.connections.some((c) => c.fromPinId === targetPinId || c.toPinId === targetPinId)).toBe(true);

    const updated = await investigationService.deletePin(board, targetPinId);

    expect(updated.items.some((i) => i.id === targetPinId)).toBe(false);
    // All connections linked to targetPinId must be purged
    expect(updated.connections.some((c) => c.fromPinId === targetPinId || c.toPinId === targetPinId)).toBe(false);
    expect(updated.connections.length).toBe(0);
  });

  it('clones a personal clue to the party board via sharePinToParty bridge', async () => {
    const personalPin: PinBoardItem = {
      id: 'personal-clue-99',
      boardId: 'board-test-personal',
      scope: 'personal',
      ownerUserId: 'user-ranger',
      type: 'clue',
      title: 'Pegadas na Lama',
      description: 'Botas militares tamanho 42 com símbolo élfico.',
      position: { x: 200, y: 300 },
      rotationDeg: 2,
      colorTag: 'yellow',
      pinnedBy: 'Ranger',
    };

    const { partyBoard, sharedPin } = await investigationService.sharePinToParty(
      personalPin, 
      campaignId, 
      'Ranger Elfo'
    );

    expect(sharedPin.id).not.toBe(personalPin.id);
    expect(sharedPin.scope).toBe('party');
    expect(sharedPin.pinnedBy).toContain('Ranger Elfo');
    expect(partyBoard.items.some((i) => i.id === sharedPin.id)).toBe(true);
  });

  it('toggles wax seal state for mystery pins', async () => {
    const board = investigationService.createDefaultBoard(campaignId, 'party');
    const pinId = board.items[0].id;

    const sealed = await investigationService.toggleWaxSeal(board, pinId);
    expect(sealed.items.find((i) => i.id === pinId)?.isWaxSealed).toBe(true);

    const unsealed = await investigationService.toggleWaxSeal(sealed, pinId);
    expect(unsealed.items.find((i) => i.id === pinId)?.isWaxSealed).toBe(false);
  });
});
