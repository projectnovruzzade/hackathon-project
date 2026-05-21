import { useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { BriefcaseBusiness, Link as LinkIcon, Upload } from 'lucide-react';
import { PerformanceLineChart } from '@/components/charts';
import { Avatar, Badge, Button, Card, ProgressBar, SkillChip, Tabs } from '@/components/ui';
import * as api from '@/lib/api';
import { useParticipantStore } from '@/store/useParticipantStore';
import { useTeamStore } from '@/store/useTeamStore';
import type { Skill, SkillCategory, SkillLevel } from '@/types';

const levels: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
const categories: SkillCategory[] = ['frontend', 'backend', 'ml', 'security', 'devops', 'design', 'mobile', 'other'];

export const StudentProfilePage = () => {
  const participant = useParticipantStore((state) => state.participants[0]);
  const updateParticipant = useParticipantStore((state) => state.updateParticipant);
  const team = useTeamStore((state) => state.getTeamByParticipant(participant.id));
  const [tab, setTab] = useState('skills');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'extracting' | 'done'>('idle');
  const [draftSkill, setDraftSkill] = useState<Skill>({ name: '', level: 'beginner', category: 'frontend' });

  const categorySummary = useMemo(() => {
    const map = new Map<SkillCategory, number>();
    participant.skills.forEach((skill) => map.set(skill.category, (map.get(skill.category) ?? 0) + 1));
    return categories.map((category) => ({ category, count: map.get(category) ?? 0 }));
  }, [participant.skills]);

  const strongest = [...participant.skills].slice(0, 3);

  const teamRole = useMemo(() => {
    if (!team) return 'Unassigned';
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
  }, [participant.id, participant.skills, team]);

  const track = useMemo(() => {
    const categoriesSet = new Set(participant.skills.map((skill) => skill.category));
    if (categoriesSet.has('ml')) return 'Machine Learning';
    if (categoriesSet.has('security')) return 'Cyber Security';
    if (categoriesSet.has('frontend') && categoriesSet.has('backend')) return 'Full Stack';
    if (categoriesSet.has('frontend') && categoriesSet.has('ml')) return 'GenAI';
    return 'Computer Science';
  }, [participant.skills]);

  const cohort = `Cohort ${participant.graduationYear ?? 2026}`;

  const onDrop = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    setUploadStage('uploading');
    const extracted = await api.extractSkillsFromCV(file, (progress) => {
      setUploadProgress(progress.progress);
      setUploadStage(progress.stage);
    });

    updateParticipant(participant.id, {
      cvUrl: extracted.cvUrl,
      cvUploadedAt: extracted.cvUploadedAt,
      cvExtractedSkills: extracted.cvExtractedSkills
    });
    setUploadStage('done');
  };

  const dropzone = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
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
          value={participant.bio ?? ''}
          onChange={(event) => updateParticipant(participant.id, { bio: event.target.value })}
          className="h-24 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200 outline-none"
        />

        <label className="text-xs text-slate-400">
          GitHub
          <input
            value={participant.github ?? ''}
            onChange={(event) => updateParticipant(participant.id, { github: event.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm"
          />
        </label>

        <label className="text-xs text-slate-400">
          LinkedIn
          <input
            value={participant.linkedin ?? ''}
            onChange={(event) => updateParticipant(participant.id, { linkedin: event.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm"
          />
        </label>
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
                    <p className="text-sm text-slate-200">Drag & drop CV (PDF/DOCX/JPG/PNG)</p>
                  </div>

                  {uploadStage !== 'idle' && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {uploadStage === 'done' ? 'Done' : uploadStage}
                      </p>
                      <ProgressBar value={uploadProgress} />
                    </div>
                  )}

                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-200">AI Extracted Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {participant.cvExtractedSkills?.map((skill) => (
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
              <SkillChip key={skill.name} label={skill.name} category={skill.category} />
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
