import {
  type Announcement,
  type AuthUser,
  type HackathonEvent,
  type Judge,
  type Participant,
  type PerformanceReview,
  type ReportData,
  type ReportFilters,
  type ScoreEntry,
  type ScoreCriterion,
  type Skill,
  type SkillCategory,
  type Team,
  type TeamDirectoryDetail,
  type TeamDirectoryHackathon,
  type TeamDirectoryItem,
  type TeamDirectoryMember,
  type TeamGenerationConfig
} from '@/types';
import { sleep } from '@/lib/utils';

const SKILL_KEYS: SkillCategory[] = ['frontend', 'backend', 'ml', 'security', 'devops', 'design'];

const resolveApiBase = () => {
  const envBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '');
  if (envBase) return envBase;

  if (typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location;
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && port !== '5000') {
      return `${protocol}//${hostname}:5000`;
    }
  }
  return '';
};

const API_BASE = resolveApiBase();

const avatarClass = (value: string | undefined) => {
  const base = (value ?? '').trim();
  if (!base) return 'bg-violet-500';
  if (base.startsWith('bg-')) return base;
  return `bg-${base}-500`;
};

const getToken = () => localStorage.getItem('accessToken');

const authHeaders = () => {
  const token = getToken();
  if (!token) {
    throw new Error('Please login again. Missing access token.');
  }
  return { Authorization: `Bearer ${token}` };
};

const parseApiError = async (response: Response, fallback: string) => {
  try {
    const payload = await response.json();
    return payload?.message ?? payload?.error ?? fallback;
  } catch {
    return fallback;
  }
};

const mapSkill = (skill: any): Skill => ({
  name: String(skill?.name ?? ''),
  level: (skill?.level ?? 'beginner') as Skill['level'],
  category: (skill?.category ?? 'other') as Skill['category']
});

const mapParticipant = (participant: any): Participant => {
  const skills: Skill[] = Array.isArray(participant?.skills) ? participant.skills.map((item: any) => mapSkill(item)) : [];
  const id = String(participant?.id ?? participant?.participantId ?? '');
  const previousTeams = Array.isArray(participant?.previousTeams)
    ? participant.previousTeams.map((item: any) => String(item))
    : participant?.teamId
      ? [String(participant.teamId)]
      : [];
  const mapped: Participant & { role?: string; programTrack?: string } = {
    id,
    name: String(participant?.name ?? participant?.participantName ?? ''),
    email: String(participant?.email ?? participant?.participantEmail ?? ''),
    avatarColor: avatarClass(participant?.avatarColor ?? participant?.avatar_color),
    experience: Number(participant?.experience ?? 0),
    previousTeams,
    bio: participant?.bio ?? '',
    github: participant?.github ?? '',
    linkedin: participant?.linkedin ?? '',
    cvUrl: participant?.cvUrl ?? undefined,
    cvUploadedAt: participant?.cvUploadedAt ? new Date(participant.cvUploadedAt) : undefined,
    university: participant?.university ?? '',
    graduationYear: participant?.graduationYear ?? undefined,
    skills: skills.filter((item: Skill) => item.name),
    cvExtractedSkills: skills.filter((item: Skill, index: number) => participant?.skills?.[index]?.source === 'cv')
  };
  if (participant?.role) mapped.role = String(participant.role);
  if (participant?.programTrack) mapped.programTrack = String(participant.programTrack);
  return mapped;
};

const mapTeam = (team: any): Team => ({
  id: String(team?.id ?? ''),
  name: String(team?.name ?? ''),
  members: Array.isArray(team?.members) ? team.members.map(mapParticipant) : [],
  captainId: String(team?.captainId ?? ''),
  chemistryScore: Number(team?.chemistryScore ?? 0),
  missingSkills: Array.isArray(team?.missingSkills) ? team.missingSkills : [],
  eventType: (team?.eventType ?? 'hackathon') as Team['eventType'],
  eventId: team?.eventId ?? undefined,
  status: (team?.status ?? 'forming') as Team['status'],
  createdAt: team?.createdAt ? new Date(team.createdAt) : new Date(),
  description: team?.description ?? undefined,
  repositoryUrl: team?.repositoryUrl ?? undefined,
  projectName: team?.projectName ?? undefined
});

const mapEvent = (event: any) => ({
  id: String(event?.id ?? ''),
  name: String(event?.name ?? ''),
  type: event?.type ?? 'hackathon',
  description: String(event?.description ?? ''),
  startDate: event?.startDate ? new Date(event.startDate) : new Date(),
  endDate: event?.endDate ? new Date(event.endDate) : new Date(),
  location: String(event?.location ?? ''),
  status: (event?.status ?? 'upcoming') as 'upcoming' | 'ongoing' | 'completed',
  teamCount: Number(event?.teamCount ?? 0),
  participantCount: Number(event?.participantCount ?? 0),
  prize: event?.prize ?? '',
  registrationDeadline: event?.registrationDeadline ? new Date(event.registrationDeadline) : new Date(),
  coverColor: String(event?.coverColor ?? 'from-violet-500 to-indigo-600')
});

const mapAnnouncement = (announcement: any): Announcement => ({
  id: String(announcement?.id ?? ''),
  title: String(announcement?.title ?? ''),
  content: String(announcement?.content ?? ''),
  type: (announcement?.type ?? 'general') as Announcement['type'],
  targetRole: (announcement?.targetRole ?? 'all') as Announcement['targetRole'],
  createdAt: announcement?.createdAt ? new Date(announcement.createdAt) : new Date(),
  expiresAt: announcement?.expiresAt ? new Date(announcement.expiresAt) : undefined,
  authorId: String(announcement?.authorId ?? 'system'),
  pinned: Boolean(announcement?.pinned),
  readBy: announcement?.isRead ? ['me'] : []
});

const mapScoreEntry = (entry: any): ScoreEntry => {
  const mapped: ScoreEntry & { judgeName?: string } = {
    judgeId: String(entry?.judgeId ?? ''),
    teamId: String(entry?.teamId ?? ''),
    eventId: String(entry?.eventId ?? ''),
    scores: {
      technical: entry?.scores?.technical ?? null,
      presentation: entry?.scores?.presentation ?? null,
      innovation: entry?.scores?.innovation ?? null,
      teamwork: entry?.scores?.teamwork ?? null
    },
    comment: entry?.comment ?? '',
    submittedAt: entry?.submittedAt ? new Date(entry.submittedAt) : new Date()
  };
  if (entry?.judgeName) {
    mapped.judgeName = String(entry.judgeName);
  }
  return mapped;
};

const mapReview = (review: any): PerformanceReview => ({
  teamId: String(review?.teamId ?? ''),
  eventId: String(review?.eventId ?? ''),
  judgeScores: Array.isArray(review?.judgeScores)
    ? review.judgeScores.map((entry: any) =>
        mapScoreEntry({
          judgeId: entry?.judgeId,
          teamId: review?.teamId,
          eventId: review?.eventId,
          scores: entry?.scores,
          comment: entry?.comment,
          submittedAt: entry?.submittedAt
        })
      )
    : [],
  aggregatedScores: {
    technical: Number(review?.aggregatedScores?.technical ?? 0),
    presentation: Number(review?.aggregatedScores?.presentation ?? 0),
    innovation: Number(review?.aggregatedScores?.innovation ?? 0),
    teamwork: Number(review?.aggregatedScores?.teamwork ?? 0),
    total: Number(review?.aggregatedScores?.total ?? 0)
  },
  rank: review?.rank ?? undefined,
  aiFeedback: review?.aiFeedback ?? '',
  reviewedAt: review?.reviewedAt ? new Date(review.reviewedAt) : new Date()
});

const mapAdminJudge = (judge: any): Judge => {
  const permissions = Array.isArray(judge?.permissions) ? judge.permissions : [];
  const criteriaMaxPoints: Partial<Record<ScoreCriterion, number>> = {};
  const permissionKeys = permissions
    .map((item: any) => String(item?.criterion ?? ''))
    .filter((item: string) => item) as ScoreCriterion[];

  permissions.forEach((item: any) => {
    const key = String(item?.criterion ?? '') as ScoreCriterion;
    if (!key) return;
    criteriaMaxPoints[key] = Number(item?.maxPoints ?? 25);
  });

  const maxPointsPerCriteria = permissions.length
    ? Math.max(...permissions.map((item: any) => Number(item?.maxPoints ?? 25)))
    : 25;

  return {
    id: String(judge?.id ?? ''),
    name: String(judge?.name ?? ''),
    email: String(judge?.email ?? ''),
    avatarColor: avatarClass(judge?.avatarColor ?? judge?.avatar_color ?? 'cyan'),
    specialization: String(judge?.specialization ?? 'Industry Expert'),
    permissions: permissionKeys.length ? permissionKeys : ['all'],
    maxPointsPerCriteria,
    criteriaMaxPoints: Object.keys(criteriaMaxPoints).length ? criteriaMaxPoints : undefined,
    assignedEventIds: Array.isArray(judge?.assignedEventIds) ? judge.assignedEventIds.map((id: any) => String(id)) : [],
    totalReviews: Number(judge?.totalReviews ?? 0),
    bio: judge?.bio ?? ''
  };
};

const mapAdminScoreEntry = (entry: any): ScoreEntry =>
  mapScoreEntry({
    judgeId: entry?.judgeId,
    teamId: entry?.teamId,
    eventId: entry?.eventId,
    scores: {
      technical: entry?.technical ?? null,
      presentation: entry?.presentation ?? null,
      innovation: entry?.innovation ?? null,
      teamwork: entry?.teamwork ?? null
    },
    comment: entry?.comment,
    submittedAt: entry?.submittedAt
  });

const mapTeamDirectoryMember = (member: any): TeamDirectoryMember => ({
  id: String(member?.id ?? ''),
  name: String(member?.name ?? ''),
  email: String(member?.email ?? ''),
  roleInTeam: String(member?.roleInTeam ?? 'member')
});

const mapTeamDirectoryHackathon = (row: any): TeamDirectoryHackathon => ({
  eventId: String(row?.eventId ?? ''),
  eventName: String(row?.eventName ?? ''),
  status: String(row?.status ?? ''),
  teamName: String(row?.teamName ?? '')
});

const mapTeamDirectoryItem = (row: any): TeamDirectoryItem => ({
  id: String(row?.id ?? ''),
  name: String(row?.name ?? ''),
  status: String(row?.status ?? 'active'),
  memberCount: Number(row?.memberCount ?? 0),
  wantedRoles: Array.isArray(row?.wantedRoles) ? row.wantedRoles.map((item: any) => String(item)) : [],
  event: {
    id: row?.event?.id ? String(row.event.id) : null,
    name: String(row?.event?.name ?? 'No active hackathon'),
    status: String(row?.event?.status ?? 'inactive')
  },
  members: Array.isArray(row?.members) ? row.members.map(mapTeamDirectoryMember) : []
});

export const login = async (email: string, password: string): Promise<AuthUser | null> => {
  const backendUrl = `${API_BASE}/api/auth/login`;
  const response = await fetch(backendUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  if (!payload?.accessToken || !payload?.user) {
    return null;
  }

  localStorage.setItem('accessToken', payload.accessToken);
  return payload.user as AuthUser;
};

interface CVProgress {
  stage: 'uploading' | 'extracting' | 'done';
  progress: number;
}

export const extractSkillsFromCV = async (
  file: File,
  onProgress?: (progress: CVProgress) => void
): Promise<{ participant: Participant; team: Team | null; cvExtractedSkills: Skill[] }> => {
  if (!file) {
    throw new Error('No file provided');
  }

  const backendUrl = `${API_BASE}/api/student/cv/upload`;
  onProgress?.({ stage: 'uploading', progress: 25 });

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(backendUrl, {
    method: 'POST',
    headers: authHeaders(),
    body: formData
  });

  onProgress?.({ stage: 'extracting', progress: 80 });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'CV parsing failed.'));
  }

  const payload = await response.json();
  const participant = mapParticipant(payload?.participant ?? {});
  const extractedSkills = Array.isArray(payload?.cvExtractedSkills) ? payload.cvExtractedSkills.map(mapSkill) : [];

  onProgress?.({ stage: 'done', progress: 100 });
  return {
    participant: {
      ...participant,
      cvExtractedSkills: extractedSkills
    },
    team: payload?.team ? mapTeam(payload.team) : null,
    cvExtractedSkills: extractedSkills
  };
};

export const fetchStudentProfile = async (): Promise<Participant> => {
  const response = await fetch(`${API_BASE}/api/student/profile`, {
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to load profile.'));
  }
  const payload = await response.json();
  return mapParticipant(payload?.participant ?? {});
};

export const updateStudentProfile = async (updates: Partial<Participant>): Promise<Participant> => {
  const response = await fetch(`${API_BASE}/api/student/profile`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to update profile.'));
  }
  const payload = await response.json();
  return mapParticipant(payload?.participant ?? {});
};

export const fetchStudentTeam = async (): Promise<Team | null> => {
  const response = await fetch(`${API_BASE}/api/student/team`, {
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to load team.'));
  }
  const payload = await response.json();
  return payload?.team ? mapTeam(payload.team) : null;
};

export const updateStudentTeam = async (updates: { projectName?: string; repositoryUrl?: string; description?: string }) => {
  const response = await fetch(`${API_BASE}/api/student/team`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to update team.'));
  }
  const payload = await response.json();
  return payload?.team ? mapTeam(payload.team) : null;
};

export const leaveStudentTeam = async (): Promise<Team | null> => {
  const response = await fetch(`${API_BASE}/api/student/team/leave`, {
    method: 'POST',
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to leave team.'));
  }
  const payload = await response.json();
  return payload?.team ? mapTeam(payload.team) : null;
};

export const fetchStudentEvents = async () => {
  const response = await fetch(`${API_BASE}/api/student/events?perPage=50`, {
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to load events.'));
  }
  const payload = await response.json();
  return Array.isArray(payload?.events) ? payload.events.map(mapEvent) : [];
};

export const fetchStudentAnnouncements = async (): Promise<{ announcements: Announcement[]; unreadCount: number }> => {
  const response = await fetch(`${API_BASE}/api/student/announcements`, {
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to load announcements.'));
  }
  const payload = await response.json();
  return {
    announcements: Array.isArray(payload?.announcements) ? payload.announcements.map(mapAnnouncement) : [],
    unreadCount: Number(payload?.unreadCount ?? 0)
  };
};

export const markAnnouncementRead = async (announcementId: string) => {
  await fetch(`${API_BASE}/api/student/announcements/${announcementId}/read`, {
    method: 'POST',
    headers: authHeaders()
  });
};

export const markAllAnnouncementsRead = async () => {
  await fetch(`${API_BASE}/api/student/announcements/read-all`, {
    method: 'POST',
    headers: authHeaders()
  });
};

export const fetchStudentParticipants = async (query = ''): Promise<Participant[]> => {
  const qp = query ? `?q=${encodeURIComponent(query)}` : '';
  const response = await fetch(`${API_BASE}/api/student/participants${qp}`, {
    headers: authHeaders()
  });
  if (response.status === 403) {
    return [];
  }
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to load participants.'));
  }
  const payload = await response.json();
  return Array.isArray(payload?.participants) ? payload.participants.map(mapParticipant) : [];
};

export const fetchStudentParticipantDetail = async (participantId: string): Promise<Participant | null> => {
  const response = await fetch(`${API_BASE}/api/student/participants/${participantId}`, {
    headers: authHeaders()
  });
  if (response.status === 403) {
    return null;
  }
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to load participant detail.'));
  }
  const payload = await response.json();
  return payload?.participant ? mapParticipant(payload.participant) : null;
};

export const sendStudentTeamInvitation = async (participantId: string): Promise<Team | null> => {
  const response = await fetch(`${API_BASE}/api/student/team/invitations`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ participantId })
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to send invitation.'));
  }
  const payload = await response.json();
  return payload?.team ? mapTeam(payload.team) : null;
};

export const fetchStudentReviews = async (): Promise<PerformanceReview[]> => {
  const response = await fetch(`${API_BASE}/api/student/reviews`, {
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to load reviews.'));
  }
  const payload = await response.json();
  return Array.isArray(payload?.reviews) ? payload.reviews.map(mapReview) : [];
};

export const fetchStudentHistoryHackathons = async (): Promise<
  Array<{ id: string; eventId: string; eventName: string; status: string; startDate: Date; endDate: Date; summary: string }>
> => {
  const response = await fetch(`${API_BASE}/api/student/history-hackathons`, {
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to load history hackathons.'));
  }
  const payload = await response.json();
  return Array.isArray(payload?.history)
    ? payload.history.map((row: any) => ({
        id: String(row?.id ?? ''),
        eventId: String(row?.eventId ?? ''),
        eventName: String(row?.eventName ?? ''),
        status: String(row?.status ?? ''),
        startDate: row?.startDate ? new Date(row.startDate) : new Date(),
        endDate: row?.endDate ? new Date(row.endDate) : new Date(),
        summary: String(row?.summary ?? '')
      }))
    : [];
};

export const fetchTeamsDirectory = async (query = ''): Promise<TeamDirectoryItem[]> => {
  const qp = query ? `?q=${encodeURIComponent(query)}` : '';
  const response = await fetch(`${API_BASE}/api/student/teams${qp}`, {
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to load teams.'));
  }
  const payload = await response.json();
  return Array.isArray(payload?.teams) ? payload.teams.map(mapTeamDirectoryItem) : [];
};

export const fetchTeamDirectoryDetail = async (teamId: string): Promise<TeamDirectoryDetail | null> => {
  const response = await fetch(`${API_BASE}/api/student/teams/${teamId}`, {
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to load team detail.'));
  }
  const payload = await response.json();
  if (!payload?.team) return null;
  const base = mapTeamDirectoryItem(payload.team);
  return {
    ...base,
    hackathons: Array.isArray(payload?.team?.hackathons) ? payload.team.hackathons.map(mapTeamDirectoryHackathon) : [],
    isMember: Boolean(payload?.team?.isMember)
  };
};

export const requestJoinTeam = async (teamId: string): Promise<{ joined: boolean; team: TeamDirectoryItem | null }> => {
  const response = await fetch(`${API_BASE}/api/student/teams/${teamId}/join-request`, {
    method: 'POST',
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to send join request.'));
  }
  const payload = await response.json();
  return {
    joined: Boolean(payload?.joined),
    team: payload?.team ? mapTeamDirectoryItem(payload.team) : null
  };
};

export const fetchSupportTickets = async () => {
  const response = await fetch(`${API_BASE}/api/student/support-tickets`, {
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to load support tickets.'));
  }
  const payload = await response.json();
  return Array.isArray(payload?.tickets)
    ? payload.tickets.map((ticket: any) => ({
        id: String(ticket?.id ?? ''),
        userId: String(ticket?.userId ?? ''),
        subject: String(ticket?.subject ?? ''),
        message: String(ticket?.message ?? ''),
        status: ticket?.status ?? 'open',
        createdAt: ticket?.createdAt ? new Date(ticket.createdAt) : new Date(),
        response: ticket?.response ?? undefined,
        respondedAt: ticket?.respondedAt ? new Date(ticket.respondedAt) : undefined
      }))
    : [];
};

export const createSupportTicket = async (subject: string, message: string) => {
  const response = await fetch(`${API_BASE}/api/student/support-tickets`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, message })
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to create support ticket.'));
  }
  return response.json();
};

export const fetchAdminParticipants = async (): Promise<Participant[]> => {
  const response = await fetch(`${API_BASE}/api/admin/participants`, {
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to load participants.'));
  }
  const payload = await response.json();
  return Array.isArray(payload?.participants) ? payload.participants.map(mapParticipant) : [];
};

export const fetchAdminTeams = async (): Promise<Team[]> => {
  const response = await fetch(`${API_BASE}/api/admin/teams`, {
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to load teams.'));
  }
  const payload = await response.json();
  return Array.isArray(payload?.teams) ? payload.teams.map(mapTeam) : [];
};

export const fetchAdminEvents = async (): Promise<HackathonEvent[]> => {
  const response = await fetch(`${API_BASE}/api/admin/events`, {
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to load events.'));
  }
  const payload = await response.json();
  return Array.isArray(payload?.events) ? payload.events.map(mapEvent) : [];
};

export const fetchAdminJudges = async (): Promise<Judge[]> => {
  const response = await fetch(`${API_BASE}/api/admin/judges`, {
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to load judges.'));
  }
  const payload = await response.json();
  return Array.isArray(payload?.judges) ? payload.judges.map(mapAdminJudge) : [];
};

export const fetchAdminScores = async (): Promise<ScoreEntry[]> => {
  const response = await fetch(`${API_BASE}/api/admin/scores`, {
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to load scores.'));
  }
  const payload = await response.json();
  return Array.isArray(payload?.scores) ? payload.scores.map(mapAdminScoreEntry) : [];
};

export const fetchAdminAnnouncements = async (): Promise<Announcement[]> => {
  const response = await fetch(`${API_BASE}/api/admin/announcements`, {
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error(await parseApiError(response, 'Failed to load announcements.'));
  }
  const payload = await response.json();
  return Array.isArray(payload?.announcements) ? payload.announcements.map(mapAnnouncement) : [];
};

const categoryCoverage = (participant: Participant) => {
  const score = new Map<SkillCategory, number>();
  participant.skills.forEach((skill) => {
    score.set(skill.category, (score.get(skill.category) ?? 0) + 1);
  });
  return score;
};

const participantDiversityScore = (participant: Participant) => {
  const coverage = categoryCoverage(participant);
  return coverage.size * 2 + participant.skills.length / 3;
};

const chemistryScore = (members: Participant[]) => {
  const bucket = new Map<SkillCategory, number>();
  members.forEach((member) => {
    member.skills.forEach((skill) => {
      bucket.set(skill.category, (bucket.get(skill.category) ?? 0) + 1);
    });
  });
  const complementarity = Math.min(1, bucket.size / 6);
  const expDiversity = Math.min(1, (Math.max(...members.map((m) => m.experience)) - Math.min(...members.map((m) => m.experience))) / 4);
  const raw = complementarity * 60 + expDiversity * 40;
  return Math.round(raw);
};

export const buildTeams = async (
  participants: Participant[],
  config: TeamGenerationConfig
): Promise<Team[]> => {
  await sleep(1200);
  if (participants.length < 2) {
    throw new Error('Not enough participants to build teams');
  }

  const sorted = [...participants].sort((a, b) => participantDiversityScore(b) - participantDiversityScore(a));
  const teamSize = Math.max(2, Math.min(8, config.teamSize));
  const draft: Participant[][] = [];
  sorted.forEach((participant) => {
    const target = draft.find((group) => group.length < teamSize);
    if (!target) {
      draft.push([participant]);
      return;
    }
    target.push(participant);
  });

  const idealProfile = config.eventType === 'ctf'
    ? { frontend: 1, backend: 2, ml: 1, security: 4, devops: 2, design: 1 }
    : config.eventType === 'ideasprint'
      ? { frontend: 2, backend: 2, ml: 3, security: 1, devops: 1, design: 2 }
      : { frontend: 3, backend: 3, ml: 1, security: 1, devops: 2, design: 2 };

  return draft.map((members, idx) => {
    const missingSkills = SKILL_KEYS.filter((key) => {
      const target = idealProfile[key as keyof typeof idealProfile];
      const actual = members.reduce(
        (sum, member) => sum + member.skills.filter((skill) => skill.category === key).length,
        0
      );
      return actual < target;
    });

    return {
      id: `gen-${idx + 1}-${Date.now()}`,
      name: `Generated Team ${idx + 1}`,
      members,
      captainId: members[0].id,
      chemistryScore: chemistryScore(members),
      missingSkills,
      eventType: config.eventType ?? 'hackathon',
      status: 'forming',
      createdAt: new Date(),
      description: 'Auto-generated team'
    };
  });
};

export const getAIFeedback = async (review: PerformanceReview): Promise<string> => {
  await sleep(600);
  const { technical, presentation, innovation, teamwork, total } = review.aggregatedScores;
  return `Team total ${total.toFixed(1)}/100. Technical ${technical.toFixed(1)}, presentation ${presentation.toFixed(
    1
  )}, innovation ${innovation.toFixed(1)}, teamwork ${teamwork.toFixed(1)}.`;
};

export const generateReport = async <T extends ReportData['type']>(
  type: T,
  filters: ReportFilters
): Promise<ReportData> => {
  await sleep(400);
  return {
    type,
    generatedAt: new Date(),
    payload: {
      filters,
      highlights: ['Backend sourced report payload'],
      normalizationExample: 21
    }
  };
};
