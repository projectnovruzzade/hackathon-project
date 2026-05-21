import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Avatar, Badge, Button, Card, Modal, ScoreRing, StepIndicator } from '@/components/ui';
import { useEventStore } from '@/store/useEventStore';
import { useParticipantStore } from '@/store/useParticipantStore';
import { useTeamStore } from '@/store/useTeamStore';

export const AdminTeamsPage = () => {
  const events = useEventStore((state) => state.events);
  const participants = useParticipantStore((state) => state.participants);
  const { teams, generateTeams, dissolveTeam, isLoading } = useTeamStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'forming' | 'active' | 'competing' | 'completed'>('all');
  const [eventFilter, setEventFilter] = useState<'all' | string>('all');

  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [eventId, setEventId] = useState(events.find((event) => event.status !== 'completed')?.id ?? events[0].id);
  const [teamSize, setTeamSize] = useState(4);
  const [avoidPrevious, setAvoidPrevious] = useState(true);
  const [diversifyExperience, setDiversifyExperience] = useState(true);
  const [prioritizeSkillBalance, setPrioritizeSkillBalance] = useState(true);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const filtered = useMemo(
    () =>
      teams.filter((team) => {
        const nameMatch = team.name.toLowerCase().includes(search.toLowerCase());
        const statusMatch = statusFilter === 'all' ? true : team.status === statusFilter;
        const eventMatch = eventFilter === 'all' ? true : team.eventId === eventFilter;
        return nameMatch && statusMatch && eventMatch;
      }),
    [teams, search, statusFilter, eventFilter]
  );

  const runPreview = () => {
    const count = Math.ceil(participants.length / teamSize);
    setPreviewCount(count);
  };

  const executeGenerate = async () => {
    await generateTeams(participants, {
      teamSize,
      avoidPreviousTeammates: avoidPrevious,
      diversifyExperience,
      prioritizeSkillBalance,
      eventType: events.find((event) => event.id === eventId)?.type
    });
    setWizardOpen(false);
    setStep(0);
    setPreviewCount(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by team name"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          />
          <select
            value={eventFilter}
            onChange={(event) => setEventFilter(event.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          >
            <option value="all">All events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          >
            <option value="all">All status</option>
            <option value="forming">forming</option>
            <option value="active">active</option>
            <option value="competing">competing</option>
            <option value="completed">completed</option>
          </select>
          <Button className="ml-auto" onClick={() => setWizardOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Generate Teams
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((team) => (
          <Card
            key={team.id}
            className={`border ${
              team.chemistryScore >= 80
                ? 'border-emerald-400/40'
                : team.chemistryScore >= 60
                  ? 'border-amber-400/40'
                  : 'border-rose-400/40'
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-100">{team.name}</p>
                <div className="mt-1 flex gap-2">
                  <Badge color="cyan">{events.find((event) => event.id === team.eventId)?.name ?? 'No event'}</Badge>
                  <Badge color="slate">{team.status}</Badge>
                </div>
              </div>
              <ScoreRing value={team.chemistryScore} size={64} color="#06B6D4" />
            </div>

            <div className="mb-3 flex -space-x-2">
              {team.members.slice(0, 5).map((member) => (
                <div key={member.id} className="rounded-full border border-slate-900 bg-slate-700 p-1">
                  <Avatar name={member.name} color={member.avatarColor} size="sm" />
                </div>
              ))}
              {team.members.length > 5 && (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs text-slate-200">
                  +{team.members.length - 5}
                </span>
              )}
            </div>

            <div className="mb-3 flex flex-wrap gap-1">
              {team.missingSkills.map((skill) => (
                <Badge key={`${team.id}-${skill}`} color="amber">{skill}</Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1">View Detail</Button>
              <Button variant="ghost" className="flex-1">Edit</Button>
              <Button variant="danger" className="flex-1" onClick={() => dissolveTeam(team.id)}>Dissolve</Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={wizardOpen} onClose={() => setWizardOpen(false)} title="Generate Teams Wizard">
        <div className="space-y-5">
          <StepIndicator steps={['Select Event', 'Configure', 'Preview']} activeStep={step} />

          {step === 0 && (
            <div className="space-y-2">
              {events.filter((event) => event.status !== 'completed').map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className={`w-full rounded-xl border p-3 text-left ${
                    eventId === event.id ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-white/10 bg-white/5'
                  }`}
                  onClick={() => setEventId(event.id)}
                >
                  <p className="font-medium text-slate-100">{event.name}</p>
                  <p className="text-xs text-slate-400">{event.type}</p>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <label className="block text-sm text-slate-300">Team size: {teamSize}
                <input
                  type="range"
                  min={2}
                  max={8}
                  value={teamSize}
                  onChange={(event) => setTeamSize(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={avoidPrevious} onChange={(e) => setAvoidPrevious(e.target.checked)} />
                Avoid previous teammates
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={diversifyExperience} onChange={(e) => setDiversifyExperience(e.target.checked)} />
                Diversify experience levels
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={prioritizeSkillBalance}
                  onChange={(e) => setPrioritizeSkillBalance(e.target.checked)}
                />
                Prioritize skill balance
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <Button variant="ghost" onClick={runPreview}>Preview</Button>
              {previewCount !== null && (
                <p className="rounded-xl border border-cyan-300/40 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                  {previewCount} teams will be created from {participants.length} participants.
                </p>
              )}
              <Button className="w-full" disabled={isLoading} onClick={executeGenerate}>
                {isLoading ? 'Generating...' : 'Generate'}
              </Button>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
            <Button variant="secondary" disabled={step === 2} onClick={() => setStep((s) => Math.min(2, s + 1))}>Next</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
