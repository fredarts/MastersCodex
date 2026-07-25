export interface CRDTEvent {
  id: string; // Event ID (UUID)
  entityId: string; // The token/entity being modified
  timestamp: number; // LWW Timestamp
  actionType: 'MOVE' | 'UPDATE_HP' | 'UPDATE_CONDITION' | 'DELETE';
  payload: any;
}

export class CRDTSolver {
  /**
   * Resolves a conflict using Last Writer Wins (LWW).
   * @param localState The current local state
   * @param remoteEvent The incoming remote event
   * @returns boolean True if the remote event should be applied, False if it should be discarded
   */
  static shouldApplyRemoteEvent(localLastModified: number, remoteEventTimestamp: number): boolean {
    return remoteEventTimestamp >= localLastModified;
  }

  /**
   * Generates a sync payload for a specific action
   */
  static createEvent(entityId: string, actionType: CRDTEvent['actionType'], payload: any): CRDTEvent {
    return {
      id: crypto.randomUUID(),
      entityId,
      timestamp: Date.now(),
      actionType,
      payload
    };
  }
}
