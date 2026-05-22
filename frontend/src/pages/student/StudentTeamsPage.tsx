import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import { Badge, Button, Card } from '@/components/ui';
import * as api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useParticipantStore } from '@/store/useParticipantStore';
import { useTeamStore } from '@/store/useTeamStore';
import type { TeamDirectoryItem } from '@/types';

export const StudentTeamsPage = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const participants = useParticipantStore((state) => state.participants);
  const participant = useMemo(
    () => participants.find((item) => item.email === currentUser?.email) ?? participants[0],
    [currentUser?.email, participants]
  );
  const participantId = participant?.id ?? '';
  const myTeam = useTeamStore((state) => state.getTeamByParticipant(participantId));

  const [query, setQuery] = useState('');
  const [teams, setTeams] = useState<TeamDirectoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [joinLoadingId, setJoinLoadingId] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const loadTeams = async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const rows = await api.fetchTeamsDirectory(search);
      setTeams(rows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load teams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTeams(query);
  }, [query]);

  const joinTeam = async (teamId: string) => {
    setJoinLoadingId(teamId);
    setError('');
    setInfo('');
    try {
      const result = await api.requestJoinTeam(teamId);
      if (result.joined) {
        setInfo('You have joined this team successfully.');
      }
      await loadTeams(query);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Join request failed.');
    } finally {
      setJoinLoadingId('');
    }
  };

  if (!participant) {
    return (
      <Card>
        <p className="text-sm text-slate-300">Loading profile...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-100">Teams</h3>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search team, member, role, hackathon"
            className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
          />
        </div>
        {error && <p className="text-sm text-rose-300">{error}</p>}
        {info && <p className="text-sm text-emerald-300">{info}</p>}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <Card>
            <p className="text-sm text-slate-300">Loading teams...</p>
          </Card>
        ) : (
          teams.map((team) => {
            const isMyTeam = myTeam?.id === team.id;
            return (
              <Card key={team.id} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold text-slate-100">{team.name}</p>
                    <p className="text-xs text-slate-400">{team.event.name}</p>
                  </div>
                  <Badge color={team.status === 'active' ? 'cyan' : 'violet'}>{team.status}</Badge>
                </div>

                <div className="rounded-lg bg-white/5 p-2">
                  <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Members</p>
                  <div className="space-y-1">
                    {team.members.map((member) => (
                      <p key={member.id} className="text-sm text-slate-200">
                        {member.name}
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Looking For</p>
                  <div className="flex flex-wrap gap-1">
                    {team.wantedRoles.map((role) => (
                      <Badge key={`${team.id}-${role}`} color="amber">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => navigate(`/student/teams/${team.id}`)}>
                    View Detail
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={isMyTeam || joinLoadingId === team.id}
                    onClick={() => joinTeam(team.id)}
                    title={isMyTeam ? 'You are already in this team.' : ''}
                  >
                    {joinLoadingId === team.id ? 'Sending...' : isMyTeam ? 'Already Joined' : 'Request to Join'}
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {!loading && !teams.length && (
        <Card className="text-center">
          <Users className="mx-auto mb-2 h-6 w-6 text-slate-400" />
          <p className="text-sm text-slate-300">No teams found for your search.</p>
        </Card>
      )}
    </div>
  );
};
