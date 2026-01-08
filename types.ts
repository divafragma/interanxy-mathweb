
export type UserRole = 'mahasiswa' | 'dosen';

export interface UserProfile {
  nama: string;
  role: UserRole;
  pass: string;
  joinedRooms?: string[];
}

export type QuestionType = 'pg' | 'boolean' | 'isian' | 'foto';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correct: string;
}

export interface WorkspaceField {
  id: string;
  label: string;
}

export interface Challenge {
  id: string;
  title: string;
  problem: string;
  workspaceFields: WorkspaceField[];
}

export interface Room {
  id: string;
  name: string;
  code: string;
  matkul: string;
  challenges: Challenge[];
  questions: Question[];
}

export interface StudentData {
  id: string;
  name: string;
  group: string;
  // challengeAnswers maps challengeId -> (fieldId -> answer)
  challengeAnswers: Record<string, Record<string, string>>;
  factAnswers: string[];
  reflections: string[]; 
  score: number;
  status: 'active' | 'inactive';
  currentRoomId?: string;
}

export type ViewState = 'login' | 'dashboard' | 'workspace' | 'room';
