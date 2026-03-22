'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[0-9]/, 'Include a number'),
  workspaceName: z.string().min(2, 'Workspace name must be at least 2 characters'),
});

type FormData = z.infer<typeof schema>;

const passwordRules = [
  { label: '8+ characters', test: (v: string) => v.length >= 8 },
  { label: 'Uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Number', test: (v: string) => /[0-9]/.test(v) },
];

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data);
      toast.success('Account created! Welcome to Barmagly.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Registration failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Start your 14-day free trial — no credit card required
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Smith"
              className="input w-full"
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="workspaceName">Workspace name</label>
            <input
              id="workspaceName"
              type="text"
              placeholder="My Company"
              className="input w-full"
              {...register('workspaceName')}
            />
            {errors.workspaceName && (
              <p className="text-xs text-destructive">{errors.workspaceName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="email">Work email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="input w-full"
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a strong password"
              className="input w-full pr-10"
              {...register('password', {
                onChange: (e) => setPasswordValue(e.target.value),
              })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {passwordValue && (
            <div className="flex gap-3 pt-1">
              {passwordRules.map((rule) => (
                <span
                  key={rule.label}
                  className={`flex items-center gap-1 text-xs ${
                    rule.test(passwordValue) ? 'text-green-600' : 'text-muted-foreground'
                  }`}
                >
                  {rule.test(passwordValue) && <Check className="w-3 h-3" />}
                  {rule.label}
                </span>
              ))}
            </div>
          )}
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Create free account
        </button>
      </form>

      <p className="text-xs text-center text-muted-foreground">
        By signing up you agree to our{' '}
        <Link href="/terms" className="underline hover:text-foreground">Terms</Link>
        {' '}and{' '}
        <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
      </p>

      <p className="text-sm text-center text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
