export type UserRole = 'student' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarColor: string;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type SkillCategory =
  | 'frontend'
  | 'backend'
  | 'ml'
  | 'security'
  | 'devops'
  | 'design'
  | 'mobile'
  | 'other';
export type EventType = 'hackathon' | 'ctf' | 'ideasprint' | 'buildathon';
export type TeamStatus = 'forming' | 'active' | 'competing' | 'completed';
export type JudgePermission = 'technical' | 'presentation' | 'innovation' | 'teamwork' | 'all';
export type ScoreCriterion = 'technical' | 'presentation' | 'innovation' | 'teamwork';

export const SCORE_CRITERIA: ScoreCriterion[] = ['technical', 'presentation', 'innovation', 'teamwork'];

export interface Skill {
  name: string;
  level: SkillLevel;
  category: SkillCategory;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  skills: Skill[];
  experience: number;
  previousTeams: string[];
  bio?: string;
  github?: string;
  linkedin?: string;
  cvUrl?: string;
  cvUploadedAt?: Date;
  cvExtractedSkills?: Skill[];
  university?: string;
  graduationYear?: number;
}

export interface EventConfig {
  type: EventType;
  name: string;
  teamSize: number;
  idealProfile: Record<SkillCategory, number>;
  description: string;
}

export interface HackathonEvent {
  id: string;
  name: string;
  type: EventType;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  teamCount: number;
  participantCount: number;
  prize?: string;
  registrationDeadline: Date;
  coverColor: string;
}

export interface Team {
  id: string;
  name: string;
  members: Participant[];
  captainId: string;
  chemistryScore: number;
  missingSkills: SkillCategory[];
  eventType: EventType;
  eventId?: string;
  status: TeamStatus;
  createdAt: Date;
  description?: string;
  repositoryUrl?: string;
  projectName?: string;
}

export interface TeamDirectoryMember {
  id: string;
  name: string;
  email: string;
  roleInTeam: string;
}

export interface TeamDirectoryHackathon {
  eventId: string;
  eventName: string;
  status: string;
  teamName: string;
}

export interface TeamDirectoryItem {
  id: string;
  name: string;
  status: string;
  memberCount: number;
  wantedRoles: string[];
  event: {
    id: string | null;
    name: string;
    status: string;
  };
  members: TeamDirectoryMember[];
}

export interface TeamDirectoryDetail extends TeamDirectoryItem {
  hackathons: TeamDirectoryHackathon[];
  isMember: boolean;
}

export interface Judge {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  specialization: string;
  permissions: JudgePermission[];
  maxPointsPerCriteria: number;
  criteriaMaxPoints?: Partial<Record<ScoreCriterion, number>>;
  assignedEventIds: string[];
  totalReviews: number;
  bio?: string;
}

export interface ScoreEntry {
  judgeId: string;
  teamId: string;
  eventId: string;
  scores: {
    technical: number | null;
    presentation: number | null;
    innovation: number | null;
    teamwork: number | null;
  };
  comment?: string;
  submittedAt: Date;
}

export interface AggregatedScore {
  technical: number;
  presentation: number;
  innovation: number;
  teamwork: number;
  total: number;
}

export interface PerformanceReview {
  teamId: string;
  eventId: string;
  judgeScores: ScoreEntry[];
  aggregatedScores: AggregatedScore;
  rank?: number;
  aiFeedback?: string;
  reviewedAt: Date;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'event' | 'result' | 'general' | 'urgent';
  targetRole: 'all' | 'student' | 'admin';
  createdAt: Date;
  expiresAt?: Date;
  authorId: string;
  pinned: boolean;
  readBy: string[];
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: Date;
  response?: string;
  respondedAt?: Date;
}

export interface TeamGenerationConfig {
  teamSize: number;
  avoidPreviousTeammates: boolean;
  diversifyExperience: boolean;
  prioritizeSkillBalance: boolean;
  eventType?: EventType;
}

export interface ReportFilters {
  eventId?: string;
  from?: Date;
  to?: Date;
}

export interface ReportData {
  type: 'team' | 'participant' | 'judge' | 'event';
  generatedAt: Date;
  payload: Record<string, unknown>;
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  timestamp: Date;
}
