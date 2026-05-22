import type { Participant } from '@/types';

export type ScoreTier = 'Amateur' | 'Master' | 'Legend';

export const getScoreTier = (value: number): ScoreTier => {
  if (value < 12) return 'Amateur';
  if (value < 20) return 'Master';
  return 'Legend';
};

export const resolveTeamRole = (member: Participant, captainId: string) => {
  if (member.id === captainId) return 'Captain';
  const hasMl = member.skills.some((skill) => skill.category === 'ml');
  const hasSecurity = member.skills.some((skill) => skill.category === 'security');
  const hasDesign = member.skills.some((skill) => skill.category === 'design');
  const hasFrontend = member.skills.some((skill) => skill.category === 'frontend');
  const hasBackend = member.skills.some((skill) => skill.category === 'backend');
  if (hasMl) return 'ML Engineer';
  if (hasSecurity) return 'Security Analyst';
  if (hasDesign) return 'UI/UX Designer';
  if (hasFrontend && hasBackend) return 'Full Stack Developer';
  if (hasFrontend) return 'Front-End Developer';
  if (hasBackend) return 'Back-End Developer';
  return 'Contributor';
};

export const resolvePrimaryRole = (member: Participant) => {
  const hasMl = member.skills.some((skill) => skill.category === 'ml');
  const hasSecurity = member.skills.some((skill) => skill.category === 'security');
  const hasDesign = member.skills.some((skill) => skill.category === 'design');
  const hasFrontend = member.skills.some((skill) => skill.category === 'frontend');
  const hasBackend = member.skills.some((skill) => skill.category === 'backend');
  if (hasMl) return 'ML Engineer';
  if (hasSecurity) return 'Security Analyst';
  if (hasDesign) return 'UI/UX Designer';
  if (hasFrontend && hasBackend) return 'Full Stack Developer';
  if (hasFrontend) return 'Front-End Developer';
  if (hasBackend) return 'Back-End Developer';
  return 'Contributor';
};
