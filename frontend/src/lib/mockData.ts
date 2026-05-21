import {
  type ActivityItem,
  type Announcement,
  type AuthUser,
  type HackathonEvent,
  type Judge,
  type Participant,
  type ScoreCriterion,
  type ScoreEntry,
  SCORE_CRITERIA,
  type Skill,
  type SkillCategory,
  type SkillLevel,
  type SupportTicket,
  type Team
} from '@/types';

const now = new Date();

const participantNames = [
  'Ayla Karimova',
  'Rauf Mammadli',
  'Nigar Aliyeva',
  'Tural Hasanov',
  'Leyla Rahimli',
  'Fidan Abbasova',
  'Murad Suleymanov',
  'Sevinc Huseynli',
  'Elvin Guliyev',
  'Narmina Jafarova',
  'Orhan Farzaliyev',
  'Zulfiyya Bayramova',
  'Kamran Ismayilov',
  'Aysel Abdullayeva',
  'Samir Verdiyev',
  'Jamal Crawford',
  'Sofia Alvarez',
  'Mina Kim',
  'David Chen',
  'Noah Singh',
  'Sara Rossi',
  'Yusif Rzayev',
  'Laman Miriyeva',
  'Arif Nuriyev'
];

const avatarColors = [
  'bg-violet-500',
  'bg-cyan-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500'
];

const universities = ['ADA University', 'BHOS', 'BSU', 'UNEC', 'Khazar'] as const;

const skillCatalog: Array<{ name: string; category: SkillCategory }> = [
  { name: 'React', category: 'frontend' },
  { name: 'TypeScript', category: 'frontend' },
  { name: 'Node.js', category: 'backend' },
  { name: 'Python', category: 'backend' },
  { name: 'Docker', category: 'devops' },
  { name: 'Kubernetes', category: 'devops' },
  { name: 'TensorFlow', category: 'ml' },
  { name: 'PyTorch', category: 'ml' },
  { name: 'PenTesting', category: 'security' },
  { name: 'Figma', category: 'design' },
  { name: 'Flutter', category: 'mobile' },
  { name: 'Swift', category: 'mobile' },
  { name: 'UI Design', category: 'design' }
];

const levels: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

const expTiers = [
  ...Array(6).fill([0, 1]),
  ...Array(8).fill([1, 3]),
  ...Array(6).fill([3, 5]),
  ...Array(4).fill([5, 7])
] as Array<[number, number]>;

const createSkills = (seed: number): Skill[] => {
  const count = 4 + (seed % 4);
  const picked: Skill[] = [];
  for (let i = 0; i < count; i += 1) {
    const entry = skillCatalog[(seed + i * 2) % skillCatalog.length];
    picked.push({
      name: entry.name,
      category: entry.category,
      level: levels[(seed + i) % levels.length]
    });
  }
  return picked;
};

export const participants: Participant[] = participantNames.map((name, index) => {
  const [min, max] = expTiers[index];
  const exp = Number((min + (index % 3) * ((max - min) / 2)).toFixed(1));
  const firstName = name.split(' ')[0].toLowerCase();
  const created = new Date(now.getTime() - (index + 2) * 86400000 * 8);

  return {
    id: `p-${index + 1}`,
    name,
    email: `${firstName}@teamforge.az`,
    avatarColor: avatarColors[index % avatarColors.length],
    skills: createSkills(index),
    experience: exp,
    previousTeams: index % 4 === 0 ? ['Binary Wolves'] : index % 5 === 0 ? ['Null Pointers'] : [],
    bio: `${name.split(' ')[0]} is a hackathon enthusiast focused on building practical products and mentoring peers.`,
    github: `https://github.com/${firstName}${index}`,
    linkedin: `https://linkedin.com/in/${firstName}-${index}`,
    cvUrl: `/mock-cv/${firstName}.pdf`,
    cvUploadedAt: new Date(created.getTime() + 7200000),
    cvExtractedSkills: createSkills(index + 3).slice(0, 3),
    university: universities[index % universities.length],
    graduationYear: 2026 + (index % 3)
  };
});

export const events: HackathonEvent[] = [
  {
    id: 'e-1',
    name: 'Baku Tech Hackathon 2024',
    type: 'hackathon',
    description: '48-hour city-wide build challenge focused on civic technology.',
    startDate: new Date('2024-10-10'),
    endDate: new Date('2024-10-12'),
    location: 'Baku Expo Center',
    status: 'completed',
    teamCount: 26,
    participantCount: 120,
    prize: '10,000 AZN',
    registrationDeadline: new Date('2024-09-30'),
    coverColor: 'from-violet-600 to-indigo-600'
  },
  {
    id: 'e-2',
    name: 'CyberSec CTF Spring',
    type: 'ctf',
    description: 'Capture-the-flag style security tournament for university teams.',
    startDate: new Date('2025-03-20'),
    endDate: new Date('2025-03-22'),
    location: 'BHOS Innovation Hub',
    status: 'completed',
    teamCount: 20,
    participantCount: 92,
    prize: '$6,000',
    registrationDeadline: new Date('2025-03-10'),
    coverColor: 'from-rose-600 to-orange-500'
  },
  {
    id: 'e-3',
    name: 'AI Innovation Sprint 2025',
    type: 'ideasprint',
    description: 'Rapid prototype sprint for AI-powered student solutions.',
    startDate: new Date('2025-06-11'),
    endDate: new Date('2025-06-20'),
    location: 'ADA University',
    status: 'ongoing',
    teamCount: 14,
    participantCount: 72,
    prize: '$12,000',
    registrationDeadline: new Date('2025-05-31'),
    coverColor: 'from-cyan-600 to-teal-500'
  },
  {
    id: 'e-4',
    name: 'Buildathon Summer 2025',
    type: 'buildathon',
    description: 'Product engineering marathon for scalable student projects.',
    startDate: new Date('2025-08-02'),
    endDate: new Date('2025-08-04'),
    location: 'Khazar University',
    status: 'upcoming',
    teamCount: 0,
    participantCount: 0,
    prize: '15,000 AZN',
    registrationDeadline: new Date('2025-07-15'),
    coverColor: 'from-emerald-600 to-lime-500'
  },
  {
    id: 'e-5',
    name: 'Mobile Dev Challenge',
    type: 'hackathon',
    description: 'Cross-platform mobile app challenge with industry mentors.',
    startDate: new Date('2025-10-12'),
    endDate: new Date('2025-10-14'),
    location: 'UNEC Tech Lab',
    status: 'upcoming',
    teamCount: 0,
    participantCount: 0,
    prize: '$8,000',
    registrationDeadline: new Date('2025-09-28'),
    coverColor: 'from-fuchsia-600 to-pink-500'
  }
];

const teamNames = [
  'Binary Wolves',
  'Null Pointers',
  'Stack Overflow',
  'Git Blame',
  '404 Found',
  'Recursive Dreams',
  'Quantum Threads',
  'Code Crafters'
];

const teamChemistry = [86, 82, 74, 67, 61, 55, 48, 42];

export const teams: Team[] = teamNames.map((teamName, index) => {
  const memberStart = index * 3;
  const members = participants.slice(memberStart, memberStart + 3);
  const eventId = index < 3 ? 'e-1' : index < 6 ? 'e-2' : 'e-3';
  const status = index < 6 ? 'completed' : 'active';

  return {
    id: `t-${index + 1}`,
    name: teamName,
    members,
    captainId: members[0]?.id ?? participants[0].id,
    chemistryScore: teamChemistry[index],
    missingSkills: index % 2 === 0 ? ['ml', 'security'] : ['design'],
    eventType: index < 3 ? 'hackathon' : index < 6 ? 'ctf' : 'ideasprint',
    eventId,
    status,
    createdAt: new Date(now.getTime() - (index + 12) * 86400000),
    description: `${teamName} is building a practical solution for its challenge track.`,
    repositoryUrl: `https://github.com/teamforge/${teamName.toLowerCase().replace(/\s+/g, '-')}`,
    projectName: `${teamName} Project`
  };
});

export const judges: Judge[] = [
  {
    id: 'j-1',
    name: 'Dr. Aydin Mammadov',
    email: 'aydin@teamforge.az',
    avatarColor: 'bg-cyan-600',
    specialization: 'Academic',
    permissions: ['all'],
    maxPointsPerCriteria: 25,
    criteriaMaxPoints: {
      technical: 25,
      presentation: 25,
      innovation: 25,
      teamwork: 25
    },
    assignedEventIds: ['e-1', 'e-2', 'e-3'],
    totalReviews: 28,
    bio: 'Computer science professor with a focus on software architecture.'
  },
  {
    id: 'j-2',
    name: 'Naila Ibrahimli',
    email: 'naila@teamforge.az',
    avatarColor: 'bg-violet-600',
    specialization: 'Industry Expert',
    permissions: ['technical', 'innovation'],
    maxPointsPerCriteria: 50,
    criteriaMaxPoints: { technical: 50, innovation: 50 },
    assignedEventIds: ['e-1', 'e-3'],
    totalReviews: 16,
    bio: 'Principal engineer leading AI product teams.'
  },
  {
    id: 'j-3',
    name: 'Farid Rustamov',
    email: 'farid@teamforge.az',
    avatarColor: 'bg-emerald-600',
    specialization: 'Alumni',
    permissions: ['presentation', 'teamwork'],
    maxPointsPerCriteria: 30,
    criteriaMaxPoints: { presentation: 30, teamwork: 30 },
    assignedEventIds: ['e-1', 'e-2'],
    totalReviews: 14,
    bio: 'Startup founder and active public speaker.'
  },
  {
    id: 'j-4',
    name: 'Prof. Elena Petrova',
    email: 'elena@teamforge.az',
    avatarColor: 'bg-rose-600',
    specialization: 'Academic',
    permissions: ['technical', 'presentation'],
    maxPointsPerCriteria: 25,
    criteriaMaxPoints: { technical: 25, presentation: 25 },
    assignedEventIds: ['e-2', 'e-3'],
    totalReviews: 11
  },
  {
    id: 'j-5',
    name: 'Kamal Rzayev',
    email: 'kamal@teamforge.az',
    avatarColor: 'bg-amber-600',
    specialization: 'Guest',
    permissions: ['innovation', 'teamwork'],
    maxPointsPerCriteria: 40,
    criteriaMaxPoints: { innovation: 40, teamwork: 40 },
    assignedEventIds: ['e-1', 'e-3'],
    totalReviews: 9
  },
  {
    id: 'j-6',
    name: 'Rachel Morgan',
    email: 'rachel@teamforge.az',
    avatarColor: 'bg-indigo-600',
    specialization: 'Industry Expert',
    permissions: ['presentation', 'innovation'],
    maxPointsPerCriteria: 25,
    criteriaMaxPoints: { presentation: 25, innovation: 25 },
    assignedEventIds: ['e-2', 'e-3'],
    totalReviews: 8
  }
];

const judgeCanScore = (judge: Judge, criterion: ScoreCriterion) => judge.permissions.includes('all') || judge.permissions.includes(criterion);

const criterionMax = (judge: Judge, criterion: ScoreCriterion) => {
  if (judge.permissions.includes('all')) {
    return judge.criteriaMaxPoints?.[criterion] ?? judge.maxPointsPerCriteria;
  }
  return judge.criteriaMaxPoints?.[criterion] ?? judge.maxPointsPerCriteria;
};

export const scoreEntries: ScoreEntry[] = teams
  .filter((team) => team.status === 'completed')
  .flatMap((team, teamIndex) => {
    const assigned = [judges[0], judges[(teamIndex % 4) + 1], judges[(teamIndex % 3) + 3]];
    return assigned.map((judge, idx) => {
      const rawBase = 14 + ((teamIndex + idx) % 8);
      const scores = SCORE_CRITERIA.reduce(
        (acc, criterion) => {
          if (!judgeCanScore(judge, criterion)) {
            acc[criterion] = null;
            return acc;
          }
          const max = criterionMax(judge, criterion);
          const value = Math.min(max, rawBase + (idx + 1) * 2);
          acc[criterion] = value;
          return acc;
        },
        {
          technical: null,
          presentation: null,
          innovation: null,
          teamwork: null
        } as Record<ScoreCriterion, number | null>
      );

      return {
        judgeId: judge.id,
        teamId: team.id,
        eventId: team.eventId ?? 'e-1',
        scores,
        comment: 'Strong collaboration with clear iteration loop and visible improvement each checkpoint.',
        submittedAt: new Date(now.getTime() - (teamIndex * 3 + idx + 4) * 86400000)
      } satisfies ScoreEntry;
    });
  });

export const announcements: Announcement[] = [
  {
    id: 'a-1',
    title: 'Urgent: Submission Window Extended',
    content: 'AI Innovation Sprint submissions are extended by 3 hours due to system maintenance.',
    type: 'urgent',
    targetRole: 'all',
    createdAt: new Date('2025-06-18T10:00:00Z'),
    authorId: 'admin-1',
    pinned: true,
    readBy: ['p-2', 'p-5']
  },
  {
    id: 'a-2',
    title: 'Urgent: Judge Briefing at 15:00',
    content: 'All judges assigned to ongoing events must join the scoring sync call at 15:00 Baku time.',
    type: 'urgent',
    targetRole: 'admin',
    createdAt: new Date('2025-06-16T08:20:00Z'),
    authorId: 'admin-1',
    pinned: true,
    readBy: []
  },
  {
    id: 'a-3',
    title: 'Buildathon Summer Registration Open',
    content: 'Registration for Buildathon Summer 2025 is now open. Team captains should confirm roster details.',
    type: 'event',
    targetRole: 'student',
    createdAt: new Date('2025-06-10T10:00:00Z'),
    authorId: 'admin-1',
    pinned: false,
    readBy: ['p-1']
  },
  {
    id: 'a-4',
    title: 'CyberSec CTF Results Published',
    content: 'Final leaderboard for CyberSec CTF Spring has been published in the Results panel.',
    type: 'result',
    targetRole: 'all',
    createdAt: new Date('2025-03-25T12:00:00Z'),
    authorId: 'admin-1',
    pinned: false,
    readBy: ['p-1', 'p-2', 'p-3']
  },
  {
    id: 'a-5',
    title: 'AI Innovation Sprint Kickoff',
    content: 'Kickoff agenda and team room allocations are now available in Events.',
    type: 'event',
    targetRole: 'all',
    createdAt: new Date('2025-06-11T08:00:00Z'),
    authorId: 'admin-1',
    pinned: false,
    readBy: []
  },
  {
    id: 'a-6',
    title: 'Mentor Office Hours Updated',
    content: 'Weekly mentor office hours moved to Wednesdays 18:30.',
    type: 'general',
    targetRole: 'student',
    createdAt: new Date('2025-05-28T14:00:00Z'),
    authorId: 'admin-1',
    pinned: false,
    readBy: ['p-4']
  },
  {
    id: 'a-7',
    title: 'Platform UX Improvements Deployed',
    content: 'The latest UI release improves scoring visibility and profile editing flows.',
    type: 'general',
    targetRole: 'all',
    createdAt: new Date('2025-05-18T14:00:00Z'),
    authorId: 'admin-1',
    pinned: false,
    readBy: []
  },
  {
    id: 'a-8',
    title: 'Upcoming Mobile Dev Challenge Brief',
    content: 'Challenge tracks and partner APIs are now published for the Mobile Dev Challenge.',
    type: 'event',
    targetRole: 'student',
    createdAt: new Date('2025-07-01T09:00:00Z'),
    authorId: 'admin-1',
    pinned: false,
    readBy: []
  }
];

export const supportTickets: SupportTicket[] = [
  {
    id: 's-1',
    userId: 'p-1',
    subject: 'Technical Issue',
    message: 'Upload progress stalls at 80% when CV is larger than 4MB.',
    status: 'in_progress',
    createdAt: new Date('2025-06-14T07:00:00Z')
  },
  {
    id: 's-2',
    userId: 'p-1',
    subject: 'Event Question',
    message: 'Can our team switch from AI Sprint to Buildathon after registration?',
    status: 'resolved',
    createdAt: new Date('2025-06-09T11:00:00Z'),
    response: 'Yes, until the registration deadline. Use the team settings panel.',
    respondedAt: new Date('2025-06-09T18:30:00Z')
  }
];

export const activityFeed: ActivityItem[] = [
  { id: 'act-1', actor: 'Ayla Karimova', action: 'uploaded CV and approved 4 extracted skills', timestamp: new Date(now.getTime() - 3600000) },
  { id: 'act-2', actor: 'Admin', action: 'posted urgent submission extension notice', timestamp: new Date(now.getTime() - 7200000) },
  { id: 'act-3', actor: 'Dr. Aydin Mammadov', action: 'submitted score for Stack Overflow', timestamp: new Date(now.getTime() - 10800000) },
  { id: 'act-4', actor: 'Nigar Aliyeva', action: 'created team Recursive Dreams', timestamp: new Date(now.getTime() - 14400000) },
  { id: 'act-5', actor: 'Rauf Mammadli', action: 'joined AI Innovation Sprint', timestamp: new Date(now.getTime() - 18000000) },
  { id: 'act-6', actor: 'Admin', action: 'added new judge Rachel Morgan', timestamp: new Date(now.getTime() - 21600000) },
  { id: 'act-7', actor: 'Farid Rustamov', action: 'submitted CTF teamwork score', timestamp: new Date(now.getTime() - 25200000) },
  { id: 'act-8', actor: 'Leyla Rahimli', action: 'opened support ticket about registration', timestamp: new Date(now.getTime() - 28800000) }
];

export const authUsers: AuthUser[] = [
  {
    id: 'student-1',
    name: participants[0].name,
    email: 'student@teamforge.az',
    role: 'student',
    avatarColor: participants[0].avatarColor
  },
  {
    id: 'admin-1',
    name: 'TeamForge Admin',
    email: 'admin@teamforge.az',
    role: 'admin',
    avatarColor: 'bg-cyan-600'
  }
];

export const mockCredentials = {
  student: { email: 'student@teamforge.az', password: 'password' },
  admin: { email: 'admin@teamforge.az', password: 'password' }
};

export const faqs = [
  {
    q: 'How are teams matched?',
    a: 'Team matching prioritizes skill complementarity, balanced experience, and reduced repeat teammates.'
  },
  {
    q: 'Can I join multiple hackathons?',
    a: 'Yes, but active schedule conflicts may block overlapping registrations.'
  },
  {
    q: 'How are judge scores normalized?',
    a: 'Scores are normalized to a 25-point basis per criterion before final aggregation.'
  },
  {
    q: 'Can captains be changed?',
    a: 'Yes, captains can transfer leadership from the team detail panel.'
  },
  {
    q: 'What CV formats are accepted?',
    a: 'PDF, DOCX, PNG, and JPG are accepted.'
  },
  {
    q: 'How do I mark announcements as read?',
    a: 'Open the announcement detail pane to automatically mark it as read.'
  },
  {
    q: 'Can admins override scores?',
    a: 'Yes, admins can override per judge row with audit-safe mock action logs.'
  },
  {
    q: 'Where can I find event timelines?',
    a: 'Event timelines are shown on the Hackathons page and each event detail card.'
  }
];
