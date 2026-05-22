import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import * as api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useParticipantStore } from '@/store/useParticipantStore';
import { useTeamStore } from '@/store/useTeamStore';
import type { TeamDirectoryDetail } from '@/types';

export const StudentTeamDirectoryDetailPage = () => {
  const { teamId = '' } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const participants = useParticipantStore((state) => state.participants);
  const participant = useMemo(
    () => participants.find((item) => item.email === currentUser?.email) ?? participants[0],
    [currentUser?.email, participants]
  );
  const participantId = participant?.id ?? '';
  const myTeam = useTeamStore((state) => state.getTeamByParticipant(participantId));

  const [team, setTeam] = useState<TeamDirectoryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const loadDetail = async () => {
    if (!teamId) return;
    setLoading(true);
    setError('');
    try {
      const detail = await api.fetchTeamDirectoryDetail(teamId);
      setTeam(detail);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load team detail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [teamId]);

  const onJoin = async () => {
    if (!teamId) return;
    setJoinLoading(true);
    setError('');
    setInfo('');
    try {
      await api.requestJoinTeam(teamId);
      setInfo('You have joined this team successfully.');
      await loadDetail();
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Join request failed.');
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading || !team) {
    return (
      <Card>
        <p className="text-sm text-slate-300">{loading ? 'Loading team detail...' : 'Team not found.'}</p>
      </Card>
    );
  }

  const isMyTeam = myTeam?.id === team.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => navigate('/student/teams')}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Teams
        </Button>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-2xl font-semibold text-slate-100">{team.name}</h3>
            <p className="text-sm text-slate-400">{team.event.name}</p>
          </div>
          <Badge color={team.status === 'active' ? 'cyan' : 'violet'}>{team.status}</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-100">Team Members</p>
            <div className="space-y-2">
              {team.members.map((member) => (
                <div key={member.id} className="rounded-lg bg-white/5 p-2">
                  <p className="text-sm font-medium text-slate-100">{member.name}</p>
                  <p className="text-xs text-slate-400">{member.email}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-100">Roles Needed</p>
            <div className="flex flex-wrap gap-1">
              {team.wantedRoles.map((role) => (
                <Badge key={`${team.id}-${role}`} color="amber">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Trophy className="h-4 w-4 text-amber-300" />
            Participated Hackathons
          </p>
          <div className="space-y-2">
            {team.hackathons.length ? (
              team.hackathons.map((row) => (
                <div key={`${row.eventId}-${row.teamName}`} className="rounded-lg bg-white/5 p-2 text-sm text-slate-200">
                  {row.eventName} - {row.teamName} ({row.status})
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No hackathon history found for this team yet.</p>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-rose-300">{error}</p>}
        {info && <p className="text-sm text-emerald-300">{info}</p>}

        <Button variant="secondary" disabled={isMyTeam || joinLoading} onClick={onJoin}>
          {joinLoading ? 'Sending...' : isMyTeam ? 'Already Joined' : 'Request to Join'}
        </Button>
      </Card>
    </div>
  );
};
