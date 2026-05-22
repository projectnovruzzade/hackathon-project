import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Star, Users2 } from 'lucide-react';
import { ScoreBarsChart, SkillRadarChart } from '@/components/charts';
import { Badge, Button, Card, EmptyState, Modal, SkillChip } from '@/components/ui';
import { resolvePrimaryRole, resolveTeamRole } from '@/lib/student';
import { useAuthStore } from '@/store/useAuthStore';
import { useEventStore } from '@/store/useEventStore';
import { useParticipantStore } from '@/store/useParticipantStore';
import { useTeamStore } from '@/store/useTeamStore';
import type { Team } from '@/types';

export const StudentTeamPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const joinMode = searchParams.get('mode');

  const currentUser = useAuthStore((state) => state.currentUser);
  const participants = useParticipantStore((state) => state.participants);
  const loadAvailableParticipants = useParticipantStore((state) => state.loadAvailableParticipants);
  const participant = useMemo(
    () => participants.find((item) => item.email === currentUser?.email) ?? participants[0],
    [currentUser?.email, participants]
  );
  const participantId = participant?.id ?? '';
  const participantSkills = participant?.skills ?? [];

  const teamStore = useTeamStore();
  const events = useEventStore((state) => state.events);
  const team = teamStore.getTeamByParticipant(participantId);
  const performanceReviews = useTeamStore((state) => state.performanceReviews);

  const [openModal, setOpenModal] = useState(false);
  const [openMembersModal, setOpenMembersModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [joinError, setJoinError] = useState('');
  const [leaveError, setLeaveError] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);
  const [eventId, setEventId] = useState(events.find((event) => event.status !== 'completed')?.id ?? events[0]?.id ?? '');

  const latestReview = performanceReviews.find((review) => review.teamId === team?.id);
  const reviews = performanceReviews.filter((review) => review.teamId === team?.id).slice(0, 2);
  const uiScoreFromSkills = Math.min(
    25,
    Math.round(
      participantSkills.filter((skill) => skill.category === 'design' || skill.category === 'frontend').length * 3.2 + 8
    )
  );
  const radarData = useMemo(
    () => [
      { category: 'Technical', team: latestReview?.aggregatedScores.technical ?? 16, ideal: 22 },
      { category: 'Presentation', team: latestReview?.aggregatedScores.presentation ?? 15, ideal: 21 },
      { category: 'Team Work', team: latestReview?.aggregatedScores.teamwork ?? 17, ideal: 22 },
      { category: 'Idea Creativity', team: latestReview?.aggregatedScores.innovation ?? 14, ideal: 21 },
      { category: 'UI', team: uiScoreFromSkills, ideal: 20 }
    ],
    [latestReview, uiScoreFromSkills]
  );
  const unassignedCandidates = useMemo(
    () =>
      participants
        .filter((item) => item.id !== participantId)
        .filter((item) => !teamStore.getTeamByParticipant(item.id))
        .sort((a, b) => (b.skills.length + b.experience) - (a.skills.length + a.experience)),
    [participantId, participants, teamStore]
  );
  const filteredCandidates = useMemo(
    () =>
      unassignedCandidates.filter((item) =>
        `${item.name} ${item.email} ${item.university ?? ''}`.toLowerCase().includes(memberQuery.toLowerCase())
      ),
    [memberQuery, unassignedCandidates]
  );

  const sendInvitation = async (targetParticipantId: string) => {
    if (!team) return;
    await teamStore.sendInvitation(team.id, targetParticipantId);
    await loadAvailableParticipants(memberQuery);
  };

  useEffect(() => {
    if (!openMembersModal) return;
    if (!participant?.cvUrl) return;
    void loadAvailableParticipants(memberQuery);
  }, [loadAvailableParticipants, memberQuery, openMembersModal, participant?.cvUrl]);

  const ensureCvBeforeJoining = () => {
    if (participant?.cvUrl) return true;
    setJoinError('Please upload your CV before joining a team.');
    return false;
  };

  const joinSpecificTeam = (targetTeamId: string) => {
    if (!ensureCvBeforeJoining()) return;
    const targetTeam = teamStore.teams.find((item) => item.id === targetTeamId);
    if (!targetTeam) return;

    if (targetTeam.members.some((member) => member.id === participant.id)) {
      navigate('/student/dashboard');
      return;
    }

    teamStore.updateTeam(targetTeam.id, {
      members: participant ? [...targetTeam.members, participant] : targetTeam.members,
      status: targetTeam.status === 'forming' ? 'active' : targetTeam.status
    });
    setJoinError('');
    navigate('/student/dashboard');
  };

  const joinRecommendedTeam = () => {
    if (!ensureCvBeforeJoining()) return;
    const availableTeams = teamStore.teams.filter((item) => item.status !== 'completed');
    const participantCategories = new Set(participantSkills.map((skill) => skill.category));

    const best = [...availableTeams].sort((a, b) => {
      const fitA = a.missingSkills.filter((skill) => participantCategories.has(skill)).length * 10 + a.chemistryScore;
      const fitB = b.missingSkills.filter((skill) => participantCategories.has(skill)).length * 10 + b.chemistryScore;
      return fitB - fitA;
    })[0];

    if (!best) return;
    joinSpecificTeam(best.id);
  };

  const createTeam = () => {
    if (!ensureCvBeforeJoining()) return;
    if (!participant) return;
    const selectedEvent = events.find((event) => event.id === eventId);
    if (!teamName.trim() || !selectedEvent) return;

    const newTeam: Team = {
      id: `new-${Date.now()}`,
      name: teamName.trim(),
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
    setJoinError('');
    navigate('/student/dashboard');
  };

  const leaveTeam = async () => {
    try {
      setIsLeaving(true);
      setLeaveError('');
      await teamStore.leaveMyTeam();
      navigate('/student/dashboard');
    } catch (error) {
      setLeaveError(error instanceof Error ? error.message : 'Failed to leave team.');
    } finally {
      setIsLeaving(false);
    }
  };

  if (!participant) {
    return (
      <Card>
        <p className="text-sm text-slate-300">Loading profile...</p>
      </Card>
    );
  }

  if (!team) {
    const availableTeams = teamStore.teams.filter((item) => item.status !== 'completed').slice(0, 4);
    const canJoinTeam = Boolean(participant.cvUrl);

    return (
      <div className="space-y-6">
        <EmptyState
          icon={Users2}
          title="You're not in a team yet"
          description="Upload your CV and join with AI recommendation or manually."
          ctaLabel="Upload CV"
          onCta={() => navigate('/student/profile')}
        />

        {joinMode && canJoinTeam && (
          <Card className="rounded-xl border border-cyan-400/35 bg-cyan-500/10">
            <p className="text-sm text-cyan-100">
              {joinMode === 'ai'
                ? 'AI mode selected: use the recommended join action below.'
                : 'Manual mode selected: choose one of the teams below.'}
            </p>
          </Card>
        )}

        {!canJoinTeam ? (
          <Card className="rounded-xl border border-amber-400/35 bg-amber-500/10">
            <p className="text-sm text-amber-100">Please upload your CV first. Team join options will unlock right after upload.</p>
          </Card>
        ) : (
          <>
            <Card className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-100">Join Options</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={joinRecommendedTeam}>
                  Join Team with AI
                </Button>
                <Button variant="ghost" onClick={() => setOpenModal(true)}>
                  Create Team Manually
                </Button>
              </div>
              {joinError && (
                <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {joinError}
                </div>
              )}
            </Card>

            <Card>
              <h3 className="mb-3 text-lg font-semibold text-slate-100">Browse available teams to join</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {availableTeams.map((availableTeam) => (
                  <div key={availableTeam.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="font-semibold text-slate-100">{availableTeam.name}</p>
                    <p className="text-xs text-slate-400">Chemistry: {availableTeam.chemistryScore}</p>
                    <Button className="mt-2" variant="ghost" onClick={() => joinSpecificTeam(availableTeam.id)}>
                      Join manually
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

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
            <Button className="w-full" onClick={createTeam}>
              Submit
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-semibold text-slate-100">{team.name}</h3>
          <Badge color="cyan">{team.status}</Badge>
          <Badge color="violet">{events.find((item) => item.id === team.eventId)?.name ?? 'No event'}</Badge>
          <Button
            variant="secondary"
            className="ml-auto"
            onClick={() => setOpenMembersModal(true)}
            disabled={team.captainId !== participant.id}
            title={team.captainId !== participant.id ? 'Only captain can invite members.' : ''}
          >
            Add Team Members
          </Button>
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
                  <p className="text-xs text-slate-400">{resolveTeamRole(member, team.captainId)}</p>
                </div>
                {member.id === team.captainId && <Star className="h-4 w-4 text-amber-300" />}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={openMembersModal} onClose={() => setOpenMembersModal(false)} title="Add Team Members">
        {team.captainId !== participant.id ? (
          <p className="text-sm text-slate-300">Only the team captain can invite new members.</p>
        ) : (
          <div className="space-y-3">
            <input
              value={memberQuery}
              onChange={(event) => setMemberQuery(event.target.value)}
              placeholder="Search students by name, email, university"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />

            {!filteredCandidates.length ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                No available students without team were found.
              </div>
            ) : (
              <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                {filteredCandidates.map((candidate) => {
                  const invited = teamStore.hasInvitation(team.id, candidate.id);
                  const previewSkills = candidate.skills.slice(0, 3);

                  return (
                    <div key={candidate.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-100">{candidate.name}</p>
                          <p className="text-xs text-slate-400">{candidate.email}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge color="cyan">{resolvePrimaryRole(candidate)}</Badge>
                            <Badge color={candidate.cvUrl ? 'emerald' : 'amber'}>
                              {candidate.cvUrl ? 'CV uploaded' : 'CV missing'}
                            </Badge>
                            <Badge color="slate">{candidate.experience}y exp</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setOpenMembersModal(false);
                              navigate(`/student/team/candidate/${candidate.id}`);
                            }}
                          >
                            View Profile
                          </Button>
                          <Button
                            variant={invited ? 'ghost' : 'secondary'}
                            disabled={invited}
                            onClick={async () => sendInvitation(candidate.id)}
                          >
                            {invited ? 'Invitation Sent' : 'Send Invitation'}
                          </Button>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {previewSkills.length ? (
                          previewSkills.map((skill) => (
                            <SkillChip
                              key={`${candidate.id}-${skill.name}-${skill.category}`}
                              label={`${skill.name} (${skill.level})`}
                              category={skill.category}
                            />
                          ))
                        ) : (
                          <p className="text-xs text-slate-500">No skills added yet.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Card>
        <h4 className="mb-4 text-lg font-semibold text-slate-100">Team Analytics Dashboard</h4>
        <SkillRadarChart data={radarData} />
        <p className="mt-4 rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          You have shown growth compared to your last hackathon.
        </p>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold text-slate-100">Recent Hackathon Results</h3>
        {reviews.length ? (
          <>
            <ScoreBarsChart
              data={reviews.map((review, idx) => ({
                name: `Result ${idx + 1}`,
                technical: review.aggregatedScores.technical,
                presentation: review.aggregatedScores.presentation,
                innovation: review.aggregatedScores.innovation,
                teamwork: review.aggregatedScores.teamwork
              }))}
            />
            <div className="mt-3 rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-50">
              <p className="mb-2 flex items-center gap-2 font-semibold text-cyan-100">
                <Sparkles className="h-4 w-4" />
                Performance Insight
              </p>
              <p>You have shown growth compared to your last hackathon.</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">No completed results yet.</p>
        )}
      </Card>

      <Card className="space-y-3">
        <h4 className="text-lg font-semibold text-slate-100">Team Info</h4>
        <label className="text-xs text-slate-400">
          Project name
          <input
            value={team.projectName ?? ''}
            onChange={(event) => {
              teamStore.updateTeam(team.id, { projectName: event.target.value });
              void teamStore.updateMyTeamInfo({ projectName: event.target.value });
            }}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm"
            disabled={team.captainId !== participant.id}
          />
        </label>
        <label className="text-xs text-slate-400">
          Repository URL
          <input
            value={team.repositoryUrl ?? ''}
            onChange={(event) => {
              teamStore.updateTeam(team.id, { repositoryUrl: event.target.value });
              void teamStore.updateMyTeamInfo({ repositoryUrl: event.target.value });
            }}
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm"
            disabled={team.captainId !== participant.id}
          />
        </label>
        <p className="rounded-xl bg-white/5 p-3 text-sm text-slate-300">Created at: {team.createdAt.toDateString()}</p>
        <div className="pt-2">
          <Button variant="ghost" className="border border-rose-400/35 text-rose-200 hover:bg-rose-500/10" onClick={leaveTeam} disabled={isLeaving}>
            {isLeaving ? 'Leaving...' : 'Leave team'}
          </Button>
          {leaveError && <p className="mt-2 text-sm text-rose-300">{leaveError}</p>}
        </div>
      </Card>
    </div>
  );
};
