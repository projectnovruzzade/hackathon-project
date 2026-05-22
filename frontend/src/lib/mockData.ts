import type {
  ActivityItem,
  Announcement,
  AuthUser,
  HackathonEvent,
  Judge,
  Participant,
  ScoreEntry,
  SupportTicket,
  Team,
} from '@/types';

export const participants: Participant[] = [
  {
    id: 'p-1',
    name: 'Novruzzada Tunar',
    email: '12730@holbertonstudents.com',
    avatarColor: 'bg-violet-500',
    skills: [],
    experience: 0,
    previousTeams: [],
    bio: '',
    github: '',
    linkedin: '',
    university: '',
    graduationYear: undefined,
  },
];

export const events: HackathonEvent[] = [];
export const teams: Team[] = [];
export const judges: Judge[] = [];
export const scoreEntries: ScoreEntry[] = [];
export const announcements: Announcement[] = [];
export const supportTickets: SupportTicket[] = [];
export const activityFeed: ActivityItem[] = [];

export const authUsers: AuthUser[] = [
  {
    id: 'student-1',
    name: 'Novruzzada Tunar',
    email: '12730@holbertonstudents.com',
    role: 'student',
    avatarColor: 'bg-violet-500',
  },
  {
    id: 'admin-1',
    name: 'Shamsi Bayramzadeh',
    email: 'admin@teamforge.az',
    role: 'admin',
    avatarColor: 'bg-cyan-600',
  },
];

export const mockCredentials = {
  student: { email: '12730@holbertonstudents.com', password: 'password' },
  admin: { email: 'admin@teamforge.az', password: 'password' },
};

export const faqs: Array<{ q: string; a: string }> = [];
