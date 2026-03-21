import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return null;
}
```

## 3. Add Environment Variables to Vercel

This is important! Go to your Vercel project:

1. Click **Settings** (top menu)
2. Click **Environment Variables** (left sidebar)
3. Add these 4 variables:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ruhdhbjtdywcpjruhzas.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_2XH_N6Ki_PWocqsXkvyhpA_Krru0tea` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1aGRoYmp0ZHl3Y3BqcnVoemFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA2NDAxMSwiZXhwIjoyMDg5NjQwMDExfQ.qle5HRBPJC8pCjozmNqHh_duZvusQClCTnNjADSQMtE` |
| `JWT_SECRET` | Generate a strong one (or use: `my-gym-tracker-super-secret-key-12345678901234567890`) |

4. Click **Save**

## 4. After fixing these:

Push to GitHub:
```
git add .
git commit -m "Fix Vercel deployment issues"
git push