import { useMemo, useState } from 'react';
import { Avatar, Badge, Button, Card, Drawer, Modal, SkillChip } from '@/components/ui';
import { useParticipantStore } from '@/store/useParticipantStore';
import type { Participant, SkillCategory } from '@/types';

export const AdminParticipantsPage = () => {
  const participants = useParticipantStore((state) => state.participants);
  const updateParticipant = useParticipantStore((state) => state.updateParticipant);
  const removeParticipant = useParticipantStore((state) => state.removeParticipant);

  const [query, setQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState<SkillCategory | 'all'>('all');
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerParticipant, setDrawerParticipant] = useState<Participant | null>(null);
  const [editing, setEditing] = useState<Participant | null>(null);

  const filtered = useMemo(
    () =>
      participants.filter((participant) => {
        const textMatch = `${participant.name} ${participant.email}`.toLowerCase().includes(query.toLowerCase());
        const skillMatch =
          skillFilter === 'all' ? true : participant.skills.some((skill) => skill.category === skillFilter);
        return textMatch && skillMatch;
      }),
    [participants, query, skillFilter]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const bulkRemove = () => {
    selectedIds.forEach((id) => removeParticipant(id));
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name/email"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          />
          <select
            value={skillFilter}
            onChange={(event) => setSkillFilter(event.target.value as SkillCategory | 'all')}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          >
            <option value="all">All skills</option>
            <option value="frontend">frontend</option>
            <option value="backend">backend</option>
            <option value="ml">ml</option>
            <option value="security">security</option>
            <option value="devops">devops</option>
            <option value="design">design</option>
          </select>
          <Button variant="ghost" onClick={() => setView((prev) => (prev === 'table' ? 'cards' : 'table'))}>
            {view === 'table' ? 'Card view' : 'Table view'}
          </Button>
          <Button variant="danger" disabled={!selectedIds.length} onClick={bulkRemove}>Bulk remove</Button>
          <Button>Add Participant</Button>
        </div>
      </Card>

      <Card>
        {view === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2">Select</th>
                  <th className="py-2">Participant</th>
                  <th className="py-2">University</th>
                  <th className="py-2">Experience</th>
                  <th className="py-2">Top Skills</th>
                  <th className="py-2">Team</th>
                  <th className="py-2">CV</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((participant) => (
                  <tr key={participant.id} className="border-t border-white/10">
                    <td className="py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(participant.id)}
                        onChange={() => toggleSelect(participant.id)}
                      />
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={participant.name} color={participant.avatarColor} size="sm" />
                        <div>
                          <p className="text-slate-100">{participant.name}</p>
                          <p className="text-xs text-slate-500">{participant.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 text-slate-300">{participant.university}</td>
                    <td className="py-2 text-slate-300">{participant.experience}y</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {participant.skills.slice(0, 2).map((skill) => (
                          <SkillChip key={`${participant.id}-${skill.name}`} label={skill.name} category={skill.category} />
                        ))}
                      </div>
                    </td>
                    <td className="py-2 text-slate-300">{participant.previousTeams[0] ?? 'Unassigned'}</td>
                    <td className="py-2">
                      <Badge color={participant.cvUrl ? 'emerald' : 'amber'}>{participant.cvUrl ? 'Uploaded' : 'Missing'}</Badge>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setDrawerParticipant(participant)}>View</Button>
                        <Button variant="ghost" onClick={() => setEditing(participant)}>Edit</Button>
                        <Button variant="danger" onClick={() => removeParticipant(participant.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((participant) => (
              <div key={participant.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Avatar name={participant.name} color={participant.avatarColor} />
                  <div>
                    <p className="font-medium text-slate-100">{participant.name}</p>
                    <p className="text-xs text-slate-500">{participant.university}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {participant.skills.slice(0, 3).map((skill) => (
                    <SkillChip key={`${participant.id}-${skill.name}`} label={skill.name} category={skill.category} />
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="ghost" onClick={() => setDrawerParticipant(participant)}>Detail</Button>
                  <Button variant="ghost" onClick={() => setEditing(participant)}>Edit</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Drawer open={drawerParticipant !== null} onClose={() => setDrawerParticipant(null)} title="Participant Detail">
        {drawerParticipant && (
          <div className="space-y-4 text-sm">
            <p className="text-slate-100">{drawerParticipant.name}</p>
            <p className="text-slate-400">{drawerParticipant.bio}</p>
            <div className="space-y-2">
              <p className="text-slate-300">Skills</p>
              <div className="flex flex-wrap gap-1">
                {drawerParticipant.skills.map((skill) => (
                  <SkillChip key={`${drawerParticipant.id}-${skill.name}`} label={`${skill.name} (${skill.level})`} category={skill.category} />
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit Participant">
        {editing && (
          <div className="space-y-3">
            <input
              value={editing.name}
              onChange={(event) => setEditing((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            />
            <textarea
              value={editing.bio ?? ''}
              onChange={(event) => setEditing((prev) => (prev ? { ...prev, bio: event.target.value } : prev))}
              className="h-24 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
            />
            <Button
              className="w-full"
              onClick={() => {
                updateParticipant(editing.id, editing);
                setEditing(null);
              }}
            >
              Save
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
