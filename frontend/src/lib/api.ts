import {
  type AuthUser,
  type Participant,
  type PerformanceReview,
  type ReportData,
  type ReportFilters,
  type Team,
  type TeamGenerationConfig,
  type SkillCategory
} from '@/types';
import { authUsers, mockCredentials } from '@/lib/mockData';
import { sleep } from '@/lib/utils';

const SKILL_KEYS: SkillCategory[] = ['frontend', 'backend', 'ml', 'security', 'devops', 'design'];

const normalizeScore = (value: number, maxPoints: number) => (value / maxPoints) * 25;

export const login = async (email: string, password: string): Promise<AuthUser | null> => {
  await sleep(800);
  const matchedRole =
    email === mockCredentials.student.email && password === mockCredentials.student.password
      ? 'student'
      : email === mockCredentials.admin.email && password === mockCredentials.admin.password
        ? 'admin'
        : null;

  if (!matchedRole) {
    return null;
  }

  return authUsers.find((user) => user.role === matchedRole) ?? null;
};

interface CVProgress {
  stage: 'uploading' | 'extracting' | 'done';
  progress: number;
}

export const extractSkillsFromCV = async (
  file: File,
  onProgress?: (progress: CVProgress) => void
): Promise<Partial<Participant>> => {
  if (!file) {
    throw new Error('No file provided');
  }

  for (let i = 1; i <= 5; i += 1) {
    onProgress?.({ stage: 'uploading', progress: i * 15 });
    await sleep(130);
  }

  for (let i = 1; i <= 5; i += 1) {
    onProgress?.({ stage: 'extracting', progress: 55 + i * 8 });
    await sleep(190);
  }

  const inferredName = file.name.replace(/\.[^/.]+$/, '');

  const result: Partial<Participant> = {
    name: inferredName || 'Unknown Candidate',
    bio: 'Extracted from CV: motivated builder with cross-functional collaboration experience.',
    cvUrl: URL.createObjectURL(file),
    cvUploadedAt: new Date(),
    cvExtractedSkills: [
      { name: 'TypeScript', level: 'advanced', category: 'frontend' },
      { name: 'Node.js', level: 'intermediate', category: 'backend' },
      { name: 'PyTorch', level: 'intermediate', category: 'ml' }
    ]
  };

  onProgress?.({ stage: 'done', progress: 100 });
  await sleep(180);

  return result;
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

const experienceSpreadScore = (members: Participant[]) => {
  const exps = members.map((m) => m.experience);
  const min = Math.min(...exps);
  const max = Math.max(...exps);
  return Math.min(1, (max - min) / 4);
};

const overlapPenaltyScore = (members: Participant[]) => {
  let overlaps = 0;
  for (let i = 0; i < members.length; i += 1) {
    for (let j = i + 1; j < members.length; j += 1) {
      const shared = members[i].previousTeams.filter((team) => members[j].previousTeams.includes(team));
      overlaps += shared.length;
    }
  }
  return overlaps;
};

const chemistryScore = (members: Participant[]) => {
  const bucket = new Map<SkillCategory, number>();
  members.forEach((member) => {
    member.skills.forEach((skill) => {
      bucket.set(skill.category, (bucket.get(skill.category) ?? 0) + 1);
    });
  });

  const complementarity = Math.min(1, bucket.size / 6);
  const expDiversity = experienceSpreadScore(members);
  const overlapPenalty = overlapPenaltyScore(members);
  const noOverlap = Math.max(0, 1 - overlapPenalty * 0.22);

  const raw = complementarity * 40 + expDiversity * 30 + noOverlap * 30;
  return Math.round(raw);
};

export const buildTeams = async (
  participants: Participant[],
  config: TeamGenerationConfig
): Promise<Team[]> => {
  await sleep(1500);
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

    if (!config.avoidPreviousTeammates) {
      target.push(participant);
      return;
    }

    const hasOverlap = target.some((member) =>
      member.previousTeams.some((prevTeam) => participant.previousTeams.includes(prevTeam))
    );

    if (!hasOverlap) {
      target.push(participant);
      return;
    }

    const fallback = draft.find((group) =>
      group.length < teamSize &&
      group.every((member) => !member.previousTeams.some((prevTeam) => participant.previousTeams.includes(prevTeam)))
    );

    (fallback ?? target).push(participant);
  });

  const idealProfile = config.eventType === 'ctf'
    ? { frontend: 1, backend: 2, ml: 1, security: 4, devops: 2, design: 1 }
    : config.eventType === 'ideasprint'
      ? { frontend: 2, backend: 2, ml: 3, security: 1, devops: 1, design: 2 }
      : { frontend: 3, backend: 3, ml: 1, security: 1, devops: 2, design: 2 };

  const teams: Team[] = draft.map((members, idx) => {
    const coverage = new Set<SkillCategory>();
    members.forEach((m) => m.skills.forEach((s) => coverage.add(s.category)));

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
      description: 'Auto-generated using TeamForge AI mock balancer.'
    };
  });

  return teams;
};

export const getAIFeedback = async (review: PerformanceReview): Promise<string> => {
  await sleep(2000);
  const { technical, presentation, innovation, teamwork, total } = review.aggregatedScores;

  return `Your team demonstrates a strong baseline with a current normalized total of ${total.toFixed(
    1
  )}/100. Technical delivery (${technical.toFixed(
    1
  )}) is improving through cleaner architecture decisions, but there is still room to simplify interfaces and strengthen automated validation for edge cases. Presentation (${presentation.toFixed(
    1
  )}) has improved with clearer structure, and judges noted confident communication; continue tightening problem framing in the opening minute. Innovation (${innovation.toFixed(
    1
  )}) stands out when solutions connect directly to measurable user outcomes, so prioritize evidence-backed claims during demos. Teamwork (${teamwork.toFixed(
    1
  )}) reflects healthy collaboration rhythms; keep pairing across specialty boundaries to reduce bottlenecks. For the next cycle, focus on one high-impact technical milestone and one storytelling milestone to maximize score lift.`;
};

export const generateReport = async <T extends ReportData['type']>(
  type: T,
  filters: ReportFilters
): Promise<ReportData> => {
  await sleep(1000);

  const payload: Record<string, unknown> = {
    filters,
    highlights: [
      'Average chemistry improved by 8% quarter-over-quarter',
      'Security skill demand remains highest in CTF events',
      'Judge scoring completion currently at 92%'
    ],
    normalizationExample: normalizeScore(42, 50)
  };

  return {
    type,
    generatedAt: new Date(),
    payload
  };
};
