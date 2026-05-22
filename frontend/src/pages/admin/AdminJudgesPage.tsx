import { useMemo, useState } from 'react';
import { Avatar, Badge, Button, Card, Drawer, Modal } from '@/components/ui';
import { useEventStore } from '@/store/useEventStore';
import { useJudgeStore } from '@/store/useJudgeStore';
import type { Judge, ScoreCriterion } from '@/types';

const criteria: ScoreCriterion[] = ['technical', 'presentation', 'innovation', 'teamwork'];

export const AdminJudgesPage = () => {
  const { judges, addJudge, updateJudge, removeJudge, scoreEntries } = useJudgeStore();
  const events = useEventStore((state) => state.events);
  const [editing, setEditing] = useState<Judge | null>(null);
  const [drawer, setDrawer] = useState<Judge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const defaultJudge: Judge = {
    id: `j-${Date.now()}`,
    name: '',
    email: '',
    avatarColor: 'bg-cyan-600',
    specialization: 'Industry Expert',
    permissions: ['technical'],
    maxPointsPerCriteria: 25,
    criteriaMaxPoints: { technical: 25 },
    assignedEventIds: [],
    totalReviews: 0,
    bio: ''
  };

  const [draft, setDraft] = useState<Judge>(defaultJudge);

  const setCriterionEnabled = (criterion: ScoreCriterion, enabled: boolean) => {
    setDraft((prev) => {
      const currentPermissions = prev.permissions.includes('all') ? criteria : prev.permissions;
      const nextPermissions = enabled
        ? Array.from(new Set([...currentPermissions, criterion]))
        : currentPermissions.filter((item) => item !== criterion);

      return {
        ...prev,
        permissions: nextPermissions,
        criteriaMaxPoints: {
          ...prev.criteriaMaxPoints,
          [criterion]: enabled ? prev.criteriaMaxPoints?.[criterion] ?? 25 : undefined
        }
      };
    });
  };

  const saveJudge = () => {
    if (!draft.name || !draft.email) return;
    if (editing) {
      updateJudge(editing.id, draft);
    } else {
      addJudge({ ...draft, id: `j-${Date.now()}` });
    }
    setEditing(null);
    setIsModalOpen(false);
    setDraft(defaultJudge);
  };

  const openEdit = (judge: Judge) => {
    setEditing(judge);
    setDraft(judge);
    setIsModalOpen(true);
  };

  const totalMax = useMemo(
    () =>
      criteria.reduce((sum, criterion) => {
        if (!draft.permissions.includes('all') && !draft.permissions.includes(criterion)) return sum;
        return sum + (draft.criteriaMaxPoints?.[criterion] ?? draft.maxPointsPerCriteria);
      }, 0),
    [draft]
  );

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Judges</h3>
          <Button
            onClick={() => {
              setEditing(null);
              setDraft(defaultJudge);
              setIsModalOpen(true);
            }}
          >
            Add Judge
          </Button>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="py-2">Judge</th>
                <th className="py-2">Email</th>
                <th className="py-2">Specialization</th>
                <th className="py-2">Assigned Events</th>
                <th className="py-2">Permissions</th>
                <th className="py-2">Max Points</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {judges.map((judge) => (
                <tr key={judge.id} className="border-t border-white/10">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={judge.name} color={judge.avatarColor} size="sm" />
                      <span className="text-slate-100">{judge.name}</span>
                    </div>
                  </td>
                  <td className="py-2 text-slate-300">{judge.email}</td>
                  <td className="py-2 text-slate-300">{judge.specialization}</td>
                  <td className="py-2 text-slate-300">{judge.assignedEventIds.length}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      {(judge.permissions.includes('all') ? criteria : judge.permissions).map((permission) => (
                        <Badge key={`${judge.id}-${permission}`} color="cyan">{permission}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 text-slate-300">
                    {judge.permissions.includes('all')
                      ? criteria.map((criterion) => `${criterion}: ${judge.criteriaMaxPoints?.[criterion] ?? judge.maxPointsPerCriteria}`).join(' | ')
                      : judge.permissions
                          .map((permission) => {
                            const key = permission as ScoreCriterion;
                            return `${permission}: ${judge.criteriaMaxPoints?.[key] ?? judge.maxPointsPerCriteria}`;
                          })
                          .join(' | ')}
                  </td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setDrawer(judge)}>Detail</Button>
                      <Button variant="ghost" onClick={() => openEdit(judge)}>Edit</Button>
                      <Button variant="danger" onClick={() => removeJudge(judge.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={isModalOpen}
        onClose={() => {
          setEditing(null);
          setDraft(defaultJudge);
          setIsModalOpen(false);
        }}
        title={editing ? 'Edit Judge' : 'Add Judge'}
      >
        <div className="space-y-3">
          <input
            value={draft.name}
            onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Name"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
          />
          <input
            value={draft.email}
            onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Email"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
          />
          <select
            value={draft.specialization}
            onChange={(event) => setDraft((prev) => ({ ...prev, specialization: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
          >
            <option>Industry Expert</option>
            <option>Academic</option>
            <option>Alumni</option>
            <option>Guest</option>
          </select>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-200">Assign to events</p>
            <div className="space-y-2">
              {events.map((event) => (
                <label key={event.id} className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={draft.assignedEventIds.includes(event.id)}
                    onChange={(evt) =>
                      setDraft((prev) => ({
                        ...prev,
                        assignedEventIds: evt.target.checked
                          ? [...prev.assignedEventIds, event.id]
                          : prev.assignedEventIds.filter((id) => id !== event.id)
                      }))
                    }
                  />
                  {event.name}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3">
            <p className="mb-2 text-sm font-semibold text-cyan-100">Permission Configurator</p>
            <div className="space-y-2">
              {criteria.map((criterion) => {
                const enabled = draft.permissions.includes('all') || draft.permissions.includes(criterion);
                return (
                  <div key={criterion} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(evt) => setCriterionEnabled(criterion, evt.target.checked)}
                    />
                    <span className="w-28 capitalize text-slate-200">{criterion}</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={draft.criteriaMaxPoints?.[criterion] ?? draft.maxPointsPerCriteria}
                      disabled={!enabled}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          criteriaMaxPoints: {
                            ...prev.criteriaMaxPoints,
                            [criterion]: Number(event.target.value)
                          }
                        }))
                      }
                      className="w-24 rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-slate-100"
                    />
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-cyan-100">Max total score: {totalMax} pts</p>
            {totalMax !== 100 && <p className="text-xs text-amber-200">Scores will be normalized</p>}
          </div>

          <Button className="w-full" onClick={saveJudge}>Save</Button>
        </div>
      </Modal>

      <Drawer open={drawer !== null} onClose={() => setDrawer(null)} title="Judge Detail">
        {drawer && (
          <div className="space-y-4 text-sm">
            <p className="text-slate-100">{drawer.name}</p>
            <p className="text-slate-400">{drawer.bio || 'No bio provided'}</p>
            <p className="text-slate-300">Assigned events: {drawer.assignedEventIds.join(', ') || 'None'}</p>
            <p className="text-slate-300">Scores submitted: {scoreEntries.filter((entry) => entry.judgeId === drawer.id).length}</p>
          </div>
        )}
      </Drawer>
    </div>
  );
};
