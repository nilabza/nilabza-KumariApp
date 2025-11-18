
export enum Role {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system',
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  isHelpful?: boolean | null;
}

export interface UserProfile {
  name: string;
  age: number;
  location: string;
}
