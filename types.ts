
export enum State {
  STATE4_STANDBY = 'State4',
  STATE0_INPUT = 'State0',
  STATE1_ADMIN = 'State1',
  STATE2_UNLOCK = 'State2',
  STATE3_ADD_USER = 'State3',
  STATE_LOCKED = 'State_Locked',
  STATE_FINGERPRINT = 'State_Fingerprint'
}

export interface User {
  id: number;
  password: string;
}

export type FingerprintResult = 'match' | 'no_match' | 'no_finger' | 'error';

export interface LogEntry {
  timestamp: string;
  event: string;
  state: string;
  errorCount: number;
}
