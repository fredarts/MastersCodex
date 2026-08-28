import { describe, it, expect } from 'vitest';
import {
  isWallSegmentBlockingVision,
  isWallSegmentBlockingMovement,
  isWallSegmentBlockingLight,
  findDoorNearPoint,
  toggleDoorState,
  hasLineOfSight,
  getDoorSoundPreset,
} from '../../components/map/visionCore';
import { WallSegment } from '@/lib/types';
import { Cell } from '../../components/MapMaker';

describe('visionCore - Occlusion & Barrier Rules', () => {
  const solidWall: WallSegment = {
    id: 'w1',
    x1: 0,
    y1: 5,
    x2: 10,
    y2: 5,
    type: 'wall',
    blocksLight: true,
    blocksVision: true,
    blocksMovement: true,
  };

  const closedDoor: WallSegment = {
    id: 'd1',
    x1: 4,
    y1: 5,
    x2: 6,
    y2: 5,
    type: 'door',
    doorState: 'closed',
    blocksLight: true,
    blocksVision: true,
    blocksMovement: true,
  };

  const openDoor: WallSegment = {
    id: 'd2',
    x1: 4,
    y1: 5,
    x2: 6,
    y2: 5,
    type: 'door',
    doorState: 'open',
    blocksLight: true,
    blocksVision: true,
    blocksMovement: true,
  };

  const windowBarrier: WallSegment = {
    id: 'win1',
    x1: 2,
    y1: 5,
    x2: 4,
    y2: 5,
    type: 'window',
    blocksLight: false,
    blocksVision: false,
    blocksMovement: true,
  };

  const illusionWall: WallSegment = {
    id: 'ill1',
    x1: 0,
    y1: 2,
    x2: 5,
    y2: 2,
    type: 'illusion',
    blocksLight: false,
    blocksVision: true,
    blocksMovement: false,
    secretFoundBy: ['player-1'],
  };

  it('correctly evaluates vision blocking for solid walls, doors, windows and illusions', () => {
    expect(isWallSegmentBlockingVision(solidWall)).toBe(true);
    expect(isWallSegmentBlockingVision(closedDoor)).toBe(true);
    expect(isWallSegmentBlockingVision(openDoor)).toBe(false);
    expect(isWallSegmentBlockingVision(windowBarrier)).toBe(false);

    // Illusion wall: blocks player-2, does NOT block player-1 who discovered it
    expect(isWallSegmentBlockingVision(illusionWall, 'player-2')).toBe(true);
    expect(isWallSegmentBlockingVision(illusionWall, 'player-1')).toBe(false);
  });

  it('correctly evaluates physical movement blocking (windows block movement, open doors and illusions do not)', () => {
    expect(isWallSegmentBlockingMovement(solidWall)).toBe(true);
    expect(isWallSegmentBlockingMovement(closedDoor)).toBe(true);
    expect(isWallSegmentBlockingMovement(windowBarrier)).toBe(true); // Windows block movement!
    expect(isWallSegmentBlockingMovement(openDoor)).toBe(false); // Open doors allow movement!
    expect(isWallSegmentBlockingMovement(illusionWall)).toBe(false); // Illusions allow physical passage!
  });

  it('correctly evaluates light propagation (windows allow light, closed doors block light)', () => {
    expect(isWallSegmentBlockingLight(solidWall)).toBe(true);
    expect(isWallSegmentBlockingLight(closedDoor)).toBe(true);
    expect(isWallSegmentBlockingLight(openDoor)).toBe(false);
    expect(isWallSegmentBlockingLight(windowBarrier)).toBe(false); // Windows allow light through!
  });
});

describe('visionCore - Interactive Door Hit-Testing & Toggling', () => {
  const walls: WallSegment[] = [
    { id: 'w1', x1: 0, y1: 5, x2: 4, y2: 5, type: 'wall', blocksLight: true, blocksVision: true, blocksMovement: true },
    { id: 'd1', x1: 4, y1: 5, x2: 6, y2: 5, type: 'door', doorState: 'closed', blocksLight: true, blocksVision: true, blocksMovement: true, materialType: 'wood' },
    { id: 'w2', x1: 6, y1: 5, x2: 10, y2: 5, type: 'wall', blocksLight: true, blocksVision: true, blocksMovement: true },
  ];

  it('finds door near click coordinate (4.9, 5.1)', () => {
    const hit = findDoorNearPoint(4.9, 5.1, walls, 0.5);
    expect(hit).not.toBeNull();
    expect(hit?.wall.id).toBe('d1');
  });

  it('returns null if click is far from door (8.0, 5.0)', () => {
    const hit = findDoorNearPoint(8.0, 5.0, walls, 0.5);
    expect(hit).toBeNull();
  });

  it('allows DM to toggle closed door to open, and open to closed', () => {
    const door = walls[1];
    const openRes = toggleDoorState(door, { isDm: true });
    expect(openRes.action).toBe('opened');
    expect(openRes.updatedWall.doorState).toBe('open');

    const closeRes = toggleDoorState(openRes.updatedWall, { isDm: true });
    expect(closeRes.action).toBe('closed');
    expect(closeRes.updatedWall.doorState).toBe('closed');
  });

  it('allows DM to lock/unlock door with forceLockToggle', () => {
    const door = walls[1];
    const lockRes = toggleDoorState(door, { isDm: true, forceLockToggle: true });
    expect(lockRes.action).toBe('locked');
    expect(lockRes.updatedWall.doorState).toBe('locked');

    const unlockRes = toggleDoorState(lockRes.updatedWall, { isDm: true, forceLockToggle: true });
    expect(unlockRes.action).toBe('unlocked');
    expect(unlockRes.updatedWall.doorState).toBe('closed');
  });

  it('blocks player from interacting if too far (> 1.6m)', () => {
    const door = walls[1]; // center at (5, 5)
    const farPlayerPos = { x: 1, y: 1 }; // distance ~ 5.6m
    const res = toggleDoorState(door, { isDm: false, playerPosition: farPlayerPos });
    expect(res.action).toBe('failed_distance');
  });

  it('blocks player from opening locked door', () => {
    const lockedDoor: WallSegment = { ...walls[1], doorState: 'locked' };
    const nearPlayerPos = { x: 5, y: 4.5 }; // distance 0.5m
    const res = toggleDoorState(lockedDoor, { isDm: false, playerPosition: nearPlayerPos });
    expect(res.action).toBe('failed_locked');
  });
});

describe('visionCore - Line of Sight (LOS) Through Barriers', () => {
  const dummyGrid: Cell[][] = Array(10).fill(null).map((_, r) =>
    Array(10).fill(null).map((_, c) => ({ x: c, y: r, type: 'floor' as const, fog: false }))
  );

  it('has Line of Sight through an open door', () => {
    const openWalls: WallSegment[] = [
      { id: 'd1', x1: 4, y1: 5, x2: 6, y2: 5, type: 'door', doorState: 'open', blocksLight: true, blocksVision: true, blocksMovement: true },
    ];
    // From (5, 2) to (5, 8) through the door at y=5
    const los = hasLineOfSight(5, 2, 5, 8, dummyGrid, openWalls, 40);
    expect(los).toBe(true);
  });

  it('has NO Line of Sight through a closed door', () => {
    const closedWalls: WallSegment[] = [
      { id: 'd1', x1: 4, y1: 5, x2: 6, y2: 5, type: 'door', doorState: 'closed', blocksLight: true, blocksVision: true, blocksMovement: true },
    ];
    const los = hasLineOfSight(5, 2, 5, 8, dummyGrid, closedWalls, 40);
    expect(los).toBe(false);
  });

  it('has Line of Sight through a window barrier', () => {
    const windowWalls: WallSegment[] = [
      { id: 'win1', x1: 4, y1: 5, x2: 6, y2: 5, type: 'window', blocksLight: false, blocksVision: false, blocksMovement: true },
    ];
    const los = hasLineOfSight(5, 2, 5, 8, dummyGrid, windowWalls, 40);
    expect(los).toBe(true);
  });
});
