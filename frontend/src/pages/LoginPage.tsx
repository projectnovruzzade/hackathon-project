import { type FormEvent, useMemo, useState } from 'react';
import { Bolt, GraduationCap, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Card } from '@/components/ui';
import { useAuthStore } from '@/store/useAuthStore';

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('12730@holbertonstudents.com');
  const [password, setPassword] = useState('password');
  const [selectedRole, setSelectedRole] = useState<'student' | 'admin'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = useMemo(
    () => [
      {
        id: 'student' as const,
        label: 'Student',
        icon: GraduationCap,
        email: '12730@holbertonstudents.com',
        password: 'password'
      },
      {
        id: 'admin' as const,
        label: 'Admin',
        icon: Settings,
        email: 'admin@teamforge.az',
        password: 'password'
      }
    ],
    []
  );

  const onSelectRole = (roleId: 'student' | 'admin') => {
    const role = roles.find((item) => item.id === roleId);
    if (!role) return;
    setSelectedRole(roleId);
    setEmail(role.email);
    setPassword(role.password);
    setError('');
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const ok = await login(email, password);
    setLoading(false);

    if (!ok) {
      setError('Invalid credentials. Use demo cards to auto-fill.');
      return;
    }

    navigate(selectedRole === 'student' ? '/student/dashboard' : '/admin/dashboard');
  };

  return (
    <div className="grid-pattern flex min-h-screen items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="w-full max-w-lg p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 inline-flex rounded-2xl bg-violet-500/20 p-3">
              <Bolt className="h-7 w-7 text-violet-300" />
            </div>
            <h1 className="text-3xl font-bold text-slate-100">Joint Holbies</h1>
            <p className="mt-1 text-sm text-slate-400">Hackathon Team Management Platform</p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3">
            {roles.map((role) => {
              const Icon = role.icon;
              const active = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => onSelectRole(role.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    active
                      ? role.id === 'student'
                        ? 'border-violet-400/50 bg-violet-500/20'
                        : 'border-cyan-400/50 bg-cyan-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-slate-100">{role.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="block text-sm text-slate-300">
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-100 outline-none focus:border-violet-400/50"
              />
            </label>

            <label className="block text-sm text-slate-300">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-100 outline-none focus:border-violet-400/50"
              />
            </label>

            {error && <p className="text-sm text-rose-300">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">Demo mode - credentials auto-filled</p>
        </Card>
      </motion.div>
    </div>
  );
};
