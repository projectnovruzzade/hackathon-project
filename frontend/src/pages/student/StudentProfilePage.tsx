import { useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { BriefcaseBusiness, Link as LinkIcon, Upload } from 'lucide-react';
import { PerformanceLineChart } from '@/components/charts';
import { Avatar, Badge, Button, Card, ProgressBar, SkillChip, Tabs } from '@/components/ui';
import * as api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useParticipantStore } from '@/store/useParticipantStore';
import { useTeamStore } from '@/store/useTeamStore';
import type { Participant, Skill, SkillCategory, SkillLevel } from '@/types';

const levels: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
const categories: SkillCategory[] = ['frontend', 'backend', 'ml', 'security', 'devops', 'design', 'mobile', 'other'];

const isValidLevel = (value: string): value is SkillLevel => levels.includes(value as SkillLevel);
const isValidCategory = (value: string): value is SkillCategory => categories.includes(value as SkillCategory);

const normalizeSkills = (value: unknown): Skill[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      if (!name) return null;
      const level = typeof item.level === 'string' && isValidLevel(item.level) ? item.level : 'beginner';
      const category = typeof item.category === 'string' && isValidCategory(item.category) ? item.category : 'other';
      return { name, level, category };
    })
    .filter((item): item is Skill => Boolean(item));
};

const mergeUniqueSkills = (skills: Skill[]): Skill[] => {
  const seen = new Set<string>();
  return skills.filter((skill) => {
    const key = `${skill.name.toLowerCase()}::${skill.category}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const resolveProgramTrack = (participant?: Participant): string => {
  const university = (participant?.university ?? '').trim().toLowerCase();
  if (university === 'full stack') return 'Full Stack Development';
  if (university === 'computer science') return 'Computer Science';
  if (university === 'cyber security') return 'Cyber Security';
  if (university === 'machine learning') return 'Machine Learning';

  const categoriesSet = new Set((participant?.skills ?? []).map((skill) => skill.category));
  if (categoriesSet.has('ml')) return 'Machine Learning';
  if (categoriesSet.has('security')) return 'Cyber Security';
  if (categoriesSet.has('frontend') && categoriesSet.has('backend')) return 'Full Stack Development';
  if (categoriesSet.has('frontend') && categoriesSet.has('ml')) return 'GenAI';
  return 'Computer Science';
};

const resolveCohort = (participant?: Participant): string => {
  const university = (participant?.university ?? '').trim().toLowerCase();
  if (university === 'full stack') return 'BAK FS11';
  return `Cohort ${participant?.graduationYear ?? 2026}`;
};

export const StudentProfilePage = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const participants = useParticipantStore((state) => state.participants);
  const participant = useMemo<Participant | undefined>(
    () => participants.find((item) => item.email === currentUser?.email) ?? participants[0],
    [currentUser?.email, participants]
  );
  const participantId = participant?.id ?? 'anonymous';
  const updateParticipant = useParticipantStore((state) => state.updateParticipant);
  const saveMyProfile = useParticipantStore((state) => state.saveMyProfile);
  const team = useTeamStore((state) => state.getTeamByParticipant(participantId));
  const setMyTeam = useTeamStore((state) => state.setMyTeam);
  const [tab, setTab] = useState('skills');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'extracting' | 'done'>('idle');
  const [uploadError, setUploadError] = useState('');
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState('');
  const [draftSkill, setDraftSkill] = useState<Skill>({ name: '', level: 'beginner', category: 'frontend' });
  const [bioDraft, setBioDraft] = useState('');
  const [githubDraft, setGithubDraft] = useState('');
  const [linkedinDraft, setLinkedinDraft] = useState('');
  const extractedSkills = useMemo(() => normalizeSkills(participant?.cvExtractedSkills), [participant?.cvExtractedSkills]);
  const summarySkills = useMemo(
    () => mergeUniqueSkills([...(participant?.skills ?? []), ...extractedSkills]),
    [participant?.skills, extractedSkills]
  );

  const categorySummary = useMemo(() => {
    const map = new Map<SkillCategory, number>();
    summarySkills.forEach((skill) => map.set(skill.category, (map.get(skill.category) ?? 0) + 1));
    return categories.map((category) => ({ category, count: map.get(category) ?? 0 }));
  }, [summarySkills]);

  const strongest = [...summarySkills].slice(0, 3);

  const teamRole = useMemo(() => {
    if (!team) return 'Unassigned';
    if (!participant) return 'Unassigned';
    if (team.captainId === participant.id) return 'Captain';
    const hasMl = participant.skills.some((skill) => skill.category === 'ml');
    const hasSecurity = participant.skills.some((skill) => skill.category === 'security');
    const hasDesign = participant.skills.some((skill) => skill.category === 'design');
    const hasFrontend = participant.skills.some((skill) => skill.category === 'frontend');
    const hasBackend = participant.skills.some((skill) => skill.category === 'backend');
    if (hasMl) return 'ML Engineer';
    if (hasSecurity) return 'Security Analyst';
    if (hasDesign) return 'UI/UX Designer';
    if (hasFrontend && hasBackend) return 'Full Stack Developer';
    if (hasFrontend) return 'Front-End Developer';
    if (hasBackend) return 'Back-End Developer';
    return 'Contributor';
  }, [participant, participant?.id, participant?.skills, team]);

  const track = useMemo(() => resolveProgramTrack(participant), [participant]);
  const cohort = useMemo(() => resolveCohort(participant), [participant]);

  useEffect(() => {
    setBioDraft(participant?.bio ?? '');
    setGithubDraft(participant?.github ?? '');
    setLinkedinDraft(participant?.linkedin ?? '');
  }, [participant?.bio, participant?.github, participant?.linkedin]);

  const onDrop = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (!participant) return;
    setUploadError('');

    try {
      setUploadStage('uploading');
      const extracted = await api.extractSkillsFromCV(file, (progress) => {
        setUploadProgress(progress.progress);
        setUploadStage(progress.stage);
      });
      const normalizedExtractedSkills = normalizeSkills(extracted.participant.cvExtractedSkills);

      updateParticipant(participant.id, {
        cvUrl: extracted.participant.cvUrl,
        cvUploadedAt: extracted.participant.cvUploadedAt,
        cvExtractedSkills: normalizedExtractedSkills
      });
      if (extracted.team) setMyTeam(extracted.team);
      setUploadStage('done');
    } catch (error) {
      setUploadStage('idle');
      setUploadProgress(0);
      setUploadError(error instanceof Error ? error.message : 'CV upload failed.');
    }
  };

  const saveProfile = async () => {
    if (!participant) return;
    setProfileSaveLoading(true);
    setProfileSaveMessage('');
    const saved = await saveMyProfile({
      bio: bioDraft,
      github: githubDraft,
      linkedin: linkedinDraft
    });
    setProfileSaveLoading(false);
    setProfileSaveMessage(saved ? 'Profile saved.' : 'Save failed. Please try again.');
  };

  if (!participant) {
    return (
      <Card>
        <p className="text-sm text-slate-300">Loading profile...</p>
      </Card>
    );
  }

  const dropzone = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
    }
  });

  const addSkill = () => {
    if (!draftSkill.name.trim()) return;
    updateParticipant(participant.id, { skills: [...participant.skills, { ...draftSkill, name: draftSkill.name.trim() }] });
    setDraftSkill({ name: '', level: 'beginner', category: 'frontend' });
  };

  const removeSkill = (idx: number) => {
    updateParticipant(participant.id, { skills: participant.skills.filter((_, index) => index !== idx) });
  };

  const timelineData = [
    { name: 'Baku 2024', score: 71 },
    { name: 'CTF Spring', score: 78 },
    { name: 'AI Sprint', score: 82 }
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[280px,1fr,280px]">
      <Card className="space-y-4">
        <div className="flex flex-col items-center gap-3">
          <Avatar name={participant.name} color={participant.avatarColor} size="lg" />
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-100">{participant.name}</p>
            <p className="text-sm text-slate-400">{participant.university}</p>
            <p className="text-xs text-slate-500">Class of {participant.graduationYear}</p>
          </div>
          <Badge color="violet">{participant.experience} years</Badge>
          <div className="w-full space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 text-left">
            <p className="text-xs uppercase tracking-wide text-slate-500">Role in Team</p>
            <p className="text-sm font-semibold text-slate-100">{teamRole}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">Program Track</p>
            <p className="text-sm font-semibold text-slate-100">{track}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">Cohort</p>
            <p className="text-sm font-semibold text-slate-100">{cohort}</p>
          </div>
        </div>

        <textarea
          value={bioDraft}
          onChange={(event) => {
            setBioDraft(event.target.value);
            setProfileSaveMessage('');
          }}
          className="h-24 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200 outline-none"
        />

        <label className="text-xs text-slate-400">
          GitHub
          <input
            value={githubDraft}
            onChange={(event) => {
              setGithubDraft(event.target.value);
              setProfileSaveMessage('');
            }}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm"
          />
        </label>

        <label className="text-xs text-slate-400">
          LinkedIn
          <input
            value={linkedinDraft}
            onChange={(event) => {
              setLinkedinDraft(event.target.value);
              setProfileSaveMessage('');
            }}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm"
          />
        </label>

        <Button onClick={saveProfile} disabled={profileSaveLoading}>
          {profileSaveLoading ? 'Saving...' : 'Save Profile'}
        </Button>
        {profileSaveMessage && <p className="text-xs text-slate-300">{profileSaveMessage}</p>}
      </Card>

      <Card>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            {
              id: 'skills',
              label: 'Skills & CV',
              content: (
                <div className="space-y-5">
                  <div
                    {...dropzone.getRootProps()}
                    className="cursor-pointer rounded-xl border border-dashed border-violet-400/40 bg-violet-500/5 p-5 text-center"
                  >
                    <input {...dropzone.getInputProps()} />
                    <Upload className="mx-auto mb-2 h-5 w-5 text-violet-300" />
                    <p className="text-sm text-slate-200">Drag & drop CV (PDF)</p>
                  </div>

                  {uploadStage !== 'idle' && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {uploadStage === 'done' ? 'Done' : uploadStage}
                      </p>
                      <ProgressBar value={uploadProgress} />
                    </div>
                  )}
                  {uploadError && (
                    <p className="text-sm text-rose-300">{uploadError}</p>
                  )}

                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-200">AI Extracted Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {extractedSkills.map((skill) => (
                        <SkillChip key={`${skill.name}-${skill.category}`} label={skill.name} category={skill.category} />
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-4">
                    <input
                      value={draftSkill.name}
                      onChange={(event) => setDraftSkill((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="Skill name"
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm"
                    />
                    <select
                      value={draftSkill.level}
                      onChange={(event) => setDraftSkill((prev) => ({ ...prev, level: event.target.value as SkillLevel }))}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-slate-100 outline-none focus:border-violet-400/50"
                    >
                      {levels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                    <select
                      value={draftSkill.category}
                      onChange={(event) =>
                        setDraftSkill((prev) => ({ ...prev, category: event.target.value as SkillCategory }))
                      }
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm text-slate-100 outline-none focus:border-violet-400/50"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <Button onClick={addSkill}>Add Skill</Button>
                  </div>

                  <div className="space-y-2">
                    {participant.skills.map((skill, idx) => (
                      <div key={`${skill.name}-${idx}`} className="flex items-center justify-between rounded-lg bg-white/5 p-2">
                        <div className="flex items-center gap-2">
                          <SkillChip label={skill.name} category={skill.category} />
                          <Badge color="slate">{skill.level}</Badge>
                        </div>
                        <Button variant="ghost" onClick={() => removeSkill(idx)}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            },
            {
              id: 'history',
              label: 'Hackathon History',
              content: (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {timelineData.map((item, idx) => (
                      <div key={item.name} className="rounded-xl bg-white/5 p-3">
                        <p className="text-sm font-semibold text-slate-100">{item.name}</p>
                        <p className="text-xs text-slate-400">Team #{idx + 1} - Final score {item.score}</p>
                      </div>
                    ))}
                  </div>
                  <PerformanceLineChart data={timelineData} />
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                    Best performance: AI Sprint (82/100)
                  </div>
                </div>
              )
            }
          ]}
        />
      </Card>

      <Card className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-100">Skill Summary</h3>
        <div className="space-y-2">
          {categorySummary.filter((item) => item.count > 0).map((item) => (
            <div key={item.category} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
              <span className="capitalize text-slate-300">{item.category}</span>
              <span className="text-slate-100">{item.count}</span>
            </div>
          ))}
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-300">Top Skills</h4>
          <div className="flex flex-wrap gap-2">
            {strongest.map((skill) => (
              <SkillChip key={`${skill.name}-${skill.category}`} label={skill.name} category={skill.category} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
          <div className="mb-1 flex items-center gap-2 text-slate-200">
            <BriefcaseBusiness className="h-4 w-4" /> Experience
          </div>
          {participant.experience < 2 ? 'Early career explorer' : participant.experience < 5 ? 'Growth-stage builder' : 'Advanced contributor'}
        </div>

        <a href={participant.github} className="inline-flex items-center gap-2 text-sm text-cyan-300">
          <LinkIcon className="h-4 w-4" /> Profile links updated
        </a>
      </Card>
    </div>
  );
};
