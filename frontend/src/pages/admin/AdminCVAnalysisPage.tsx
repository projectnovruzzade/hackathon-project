import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge, Button, Card, ProgressBar, SkillChip } from '@/components/ui';

type QueueItem = {
  id: string;
  fileName: string;
  status: 'queued' | 'processing' | 'done' | 'error';
  progress: number;
};

const initialQueue: QueueItem[] = [];

export const AdminCVAnalysisPage = () => {
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);

  const dropzone = useDropzone({
    onDrop: (files) => {
      const incoming = files.map((file) => ({
        id: `${file.name}-${Date.now()}`,
        fileName: file.name,
        status: 'queued' as const,
        progress: 0
      }));
      setQueue((prev) => [...incoming, ...prev]);
    }
  });

  const processAll = () => {
    queue.forEach((item, index) => {
      setTimeout(() => {
        setQueue((prev) =>
          prev.map((queueItem) =>
            queueItem.id === item.id ? { ...queueItem, status: 'processing', progress: 55 } : queueItem
          )
        );
      }, index * 300);

      setTimeout(() => {
        setQueue((prev) =>
          prev.map((queueItem) =>
            queueItem.id === item.id ? { ...queueItem, status: 'done', progress: 100 } : queueItem
          )
        );
      }, index * 300 + 700);
    });
  };

  const results = queue.filter((item) => item.status === 'done');

  return (
    <div className="space-y-6">
      <Card>
        <div {...dropzone.getRootProps()} className="cursor-pointer rounded-xl border border-dashed border-cyan-400/40 bg-cyan-500/5 p-8 text-center">
          <input {...dropzone.getInputProps()} />
          <p className="text-sm text-slate-200">Drop CV files here for bulk processing (PDF/DOCX)</p>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Processing Queue</h3>
          <Button onClick={processAll}>Process All</Button>
        </div>
        <div className="space-y-3">
          {queue.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm text-slate-200">{item.fileName}</p>
                <Badge color={item.status === 'done' ? 'emerald' : item.status === 'processing' ? 'cyan' : item.status === 'error' ? 'rose' : 'amber'}>
                  {item.status}
                </Badge>
              </div>
              <ProgressBar value={item.progress} color={item.status === 'done' ? 'emerald' : 'cyan'} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold text-slate-100">Results</h3>
        <div className="space-y-3">
          {results.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-slate-100">Participant: {item.fileName.replace(/\.[^.]+$/, '')}</p>
                <Badge color="cyan">Confidence 0.88</Badge>
              </div>
              <div className="mb-2 flex flex-wrap gap-1">
                <SkillChip label="TypeScript" category="frontend" />
                <SkillChip label="Node.js" category="backend" />
                <SkillChip label="PyTorch" category="ml" />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost">Approve</Button>
                <Button variant="ghost">Edit</Button>
                <Button>Create Participant</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold text-slate-100">Campus Skill Gap Analysis</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { category: 'frontend', count: 18 },
                { category: 'backend', count: 16 },
                { category: 'ml', count: 9 },
                { category: 'security', count: 6 },
                { category: 'devops', count: 7 },
                { category: 'design', count: 10 }
              ]}
            >
              <CartesianGrid stroke="rgba(148,163,184,0.2)" strokeDasharray="4 4" />
              <XAxis dataKey="category" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)' }} />
              <Bar dataKey="count" fill="#06B6D4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-3 rounded-xl border border-amber-300/40 bg-amber-500/10 p-3 text-sm text-amber-100">
          Recommendation: Recruit 3 more ML engineers for AI Innovation Sprint.
        </p>
      </Card>
    </div>
  );
};
