import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, School } from 'lucide-react';
import { Avatar, Badge, Button, Card, SkillChip } from '@/components/ui';
import * as api from '@/lib/api';
import { resolvePrimaryRole } from '@/lib/student';
import { useAuthStore } from '@/store/useAuthStore';
import { useParticipantStore } from '@/store/useParticipantStore';
import { useTeamStore } from '@/store/useTeamStore';
import type { Participant } from '@/types';

export const StudentCandidateProfilePage = () => {
  const navigate = useNavigate();
  const { participantId } = useParams<{ participantId: string }>();
  const currentUser = useAuthStore((state) => state.currentUser);
  const participants = useParticipantStore((state) => state.participants);
  const currentParticipant = useMemo(
    () => participants.find((item) => item.email === currentUser?.email) ?? participants[0],
    [currentUser?.email, participants]
  );
  const currentParticipantId = currentParticipant?.id ?? '';
  const teamStore = useTeamStore();
  const myTeam = teamStore.getTeamByParticipant(currentParticipantId);
  const [candidate, setCandidate] = useState<Participant | null>(participants.find((item) => item.id === participantId) ?? null);
  const [loading, setLoading] = useState(false);
  const loadAvailableParticipants = useParticipantStore((state) => state.loadAvailableParticipants);
  const candidateTeam = candidate ? teamStore.getTeamByParticipant(candidate.id) : undefined;
  const canInvite = Boolean(myTeam && candidate && myTeam.captainId === currentParticipant.id && !candidateTeam);
  const invited = myTeam && candidate ? teamStore.hasInvitation(myTeam.id, candidate.id) : false;

  useEffect(() => {
    if (!participantId) return;
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const fromApi = await api.fetchStudentParticipantDetail(participantId);
        if (active && fromApi) setCandidate(fromApi);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [participantId]);

  if (!currentParticipant) {
    return (
      <Card>
        <p className="text-sm text-slate-300">Loading profile...</p>
      </Card>
    );
  }

  if (!candidate) {
    return (
      <Card className="space-y-3">
        <p className="text-slate-200">{loading ? 'Loading participant...' : 'Participant not found.'}</p>
        <Button variant="ghost" onClick={() => navigate('/student/team')}>Back to Team</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/student/team')} className="w-fit">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Team
      </Button>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={candidate.name} color={candidate.avatarColor} size="lg" />
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-slate-100">{candidate.name}</h2>
            <p className="flex items-center gap-2 text-sm text-slate-300">
              <Mail className="h-4 w-4" /> {candidate.email}
            </p>
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <School className="h-4 w-4" /> {candidate.university || 'University not specified'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge color="cyan">{resolvePrimaryRole(candidate)}</Badge>
              <Badge color={candidate.cvUrl ? 'emerald' : 'amber'}>{candidate.cvUrl ? 'CV uploaded' : 'CV missing'}</Badge>
              <Badge color="slate">{candidate.experience} years experience</Badge>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
          {candidate.bio?.trim() || 'No bio added yet.'}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-200">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.length ? (
              candidate.skills.map((skill) => (
                <SkillChip key={`${candidate.id}-${skill.name}-${skill.category}`} label={`${skill.name} (${skill.level})`} category={skill.category} />
              ))
            ) : (
              <p className="text-sm text-slate-400">No manual skills added yet.</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-200">AI Extracted Skills</h3>
          <div className="flex flex-wrap gap-2">
            {candidate.cvExtractedSkills?.length ? (
              candidate.cvExtractedSkills.map((skill) => (
                <SkillChip key={`${candidate.id}-${skill.name}-${skill.category}-ai`} label={skill.name} category={skill.category} />
              ))
            ) : (
              <p className="text-sm text-slate-400">No CV extracted skills yet.</p>
            )}
          </div>
        </div>

        {canInvite && myTeam && (
          <div className="flex items-center gap-2">
            <Button
              variant={invited ? 'ghost' : 'secondary'}
              disabled={invited}
              onClick={async () => {
                await teamStore.sendInvitation(myTeam.id, candidate.id);
                await loadAvailableParticipants();
              }}
            >
              {invited ? 'Invitation Sent' : 'Send Invitation'}
            </Button>
            {invited && <Badge color="emerald">Pending</Badge>}
          </div>
        )}
      </Card>
    </div>
  );
};
