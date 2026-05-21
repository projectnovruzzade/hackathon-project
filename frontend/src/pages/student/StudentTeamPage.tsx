import { useMemo, useState } from 'react';
import { Star, Users2 } from 'lucide-react';
import { SkillRadarChart, TeamChemistryChart } from '@/components/charts';
import { Badge, Button, Card, EmptyState, Modal, SkillChip } from '@/components/ui';
import { useEventStore } from '@/store/useEventStore';
import { useParticipantStore } from '@/store/useParticipantStore';
import { useTeamStore } from '@/store/useTeamStore';
import type { Team } from '@/types';

export const StudentTeamPage = () => {
  const participant = useParticipantStore((state) => state.participants[0]);
  const teamStore = useTeamStore();
  const events = useEventStore((state) => state.events);
  const team = teamStore.getTeamByParticipant(participant.id);

  const [openModal, setOpenModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [eventId, setEventId] = useState(events.find((event) => event.status !== 'completed')?.id ?? events[0].id);

  const radarData = useMemo(
    () => [
      { category: 'frontend', team: 4, ideal: 4 },
      { category: 'backend', team: 3, ideal: 4 },
      { category: 'ml', team: 2, ideal: 3 },
      { category: 'security', team: 2, ideal: 2 },
      { category: 'devops', team: 1, ideal: 2 },
      { category: 'design', team: 3, ideal: 2 }
    ],
    []
  );

  const getTeamRole = (memberId: string) => {
    if (memberId === team?.captainId) return 'Captain';
    const member = team?.members.find((item) => item.id === memberId);
    if (!member) return 'Contributor';
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
    return 'Generalist';
  };

  const createTeam = () => {
    const selectedEvent = events.find((event) => event.id === eventId);
    if (!teamName.trim() || !selectedEvent) return;

    const newTeam: Team = {
      id: `new-${Date.now()}`,
      name: teamName,
      members: [participant],
      captainId: participant.id,
      chemistryScore: 62,
      missingSkills: ['backend', 'ml'],
      eventType: selectedEvent.type,
      eventId: selectedEvent.id,
      status: 'forming',
      createdAt: new Date(),
      description: teamDesc
    };

    teamStore.addTeam(newTeam);
    setOpenModal(false);
    setTeamName('');
    setTeamDesc('');
  };

  if (!team) {
    const availableTeams = teamStore.teams.filter((item) => item.status !== 'completed').slice(0, 4);

    return (
      <div className="space-y-6">
        <EmptyState
          icon={Users2}
          title="You're not in a team yet"
          description="Browse active teams or create a new one for your next competition."
          ctaLabel="Create new team"
          onCta={() => setOpenModal(true)}
        />

        <Card>
          <h3 className="mb-3 text-lg font-semibold text-slate-100">Browse available teams to join</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {availableTeams.map((availableTeam) => (
              <div key={availableTeam.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="font-semibold text-slate-100">{availableTeam.name}</p>
                <p className="text-xs text-slate-400">Chemistry: {availableTeam.chemistryScore}</p>
                <Button className="mt-2" variant="ghost">Request to join</Button>
              </div>
            ))}
          </div>
        </Card>

        <Modal open={openModal} onClose={() => setOpenModal(false)} title="Create New Team">
          <div className="space-y-3">
            <input
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Team name"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            />
            <select
              value={eventId}
              onChange={(event) => setEventId(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
            <textarea
              value={teamDesc}
              onChange={(event) => setTeamDesc(event.target.value)}
              placeholder="Description"
              className="h-24 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            />
            <Button className="w-full" onClick={createTeam}>Submit</Button>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <div className="space-y-6">
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold text-slate-100">{team.name}</h3>
            <Badge color="cyan">{team.status}</Badge>
            <Badge color="violet">{events.find((item) => item.id === team.eventId)?.name ?? 'No event'}</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {team.members.map((member) => (
              <div
                key={member.id}
                className={`rounded-xl border p-3 transition hover:border-violet-300/40 ${
                  member.id === team.captainId
                    ? 'border-violet-400/50 bg-gradient-to-br from-violet-500/15 to-cyan-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-100">{member.name}</p>
                    <p className="text-xs text-slate-400">{getTeamRole(member.id)}</p>
                  </div>
                  {member.id === team.captainId && <Star className="h-4 w-4 text-amber-300" />}
                </div>
                <div className="flex flex-wrap gap-1">
                  {member.skills.slice(0, 3).map((skill) => (
                    <SkillChip key={skill.name} label={skill.name} category={skill.category} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h4 className="mb-4 text-lg font-semibold text-slate-100">Team Analytics</h4>
          <div className="grid gap-5 xl:grid-cols-2">
            <SkillRadarChart data={radarData} />
            <div className="space-y-4">
              <TeamChemistryChart score={team.chemistryScore} />
              <div>
                <p className="mb-2 text-sm font-medium text-slate-200">Missing skills</p>
                <div className="space-y-2">
                  {team.missingSkills.map((skill) => (
                    <div key={skill} className="flex items-center justify-between rounded-lg bg-white/5 p-2">
                      <SkillChip label={skill} category={skill} />
                      <Button variant="ghost">Find teammate</Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

      </div>

      <Card className="space-y-3">
        <h4 className="text-lg font-semibold text-slate-100">Team Info</h4>
        <label className="text-xs text-slate-400">
          Project name
          <input
            value={team.projectName ?? ''}
            onChange={(event) => teamStore.updateTeam(team.id, { projectName: event.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm"
            disabled={team.captainId !== participant.id}
          />
        </label>
        <label className="text-xs text-slate-400">
          Repository URL
          <input
            value={team.repositoryUrl ?? ''}
            onChange={(event) => teamStore.updateTeam(team.id, { repositoryUrl: event.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm"
            disabled={team.captainId !== participant.id}
          />
        </label>
        <p className="rounded-xl bg-white/5 p-3 text-sm text-slate-300">Created at: {team.createdAt.toDateString()}</p>
      </Card>
    </div>
  );
};
