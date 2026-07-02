const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..');
const parentDir = path.resolve(srcDir, '..');
const playerDir = path.join(parentDir, 'sportify-player');
const managerDir = path.join(parentDir, 'sportify-manager');

console.log('Beginning tournament framework integration...');

// SQL blueprint addition
const sqlAdditions = `
-- =========================================================================
-- 11. Tournaments Table Setup
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ground_id uuid REFERENCES public.grounds(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  sport_type text NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  entry_fee numeric(10,2) NOT NULL DEFAULT 0.0,
  prize_pool numeric(10,2) NOT NULL DEFAULT 0.0,
  max_teams integer NOT NULL DEFAULT 16,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on Tournaments
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tournaments viewable by everyone" ON public.tournaments;
CREATE POLICY "Tournaments viewable by everyone" ON public.tournaments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage tournaments" ON public.tournaments;
CREATE POLICY "Owners can manage tournaments" ON public.tournaments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.grounds
      WHERE grounds.id = tournaments.ground_id AND grounds.owner_id = auth.uid()
    )
  );

-- =========================================================================
-- 12. Tournament Registrations Table Setup
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  team_name text NOT NULL,
  captain_name text NOT NULL,
  captain_email text NOT NULL,
  captain_phone text NOT NULL,
  payment_status text DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Enable RLS on Registrations
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Registrations viewable by everyone" ON public.tournament_registrations;
CREATE POLICY "Registrations viewable by everyone" ON public.tournament_registrations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Players can insert registrations" ON public.tournament_registrations;
CREATE POLICY "Players can insert registrations" ON public.tournament_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
`;

// Helper to append to SQL and update mocks
function integrateApp(appPath) {
  // Update SQL
  const sqlPath = path.join(appPath, 'src', 'services', 'database.sql');
  if (fs.existsSync(sqlPath)) {
    let sqlContent = fs.readFileSync(sqlPath, 'utf8');
    if (!sqlContent.includes('Tournaments Table Setup')) {
      sqlContent += sqlAdditions;
      fs.writeFileSync(sqlPath, sqlContent, 'utf8');
      console.log(`Updated database.sql inside ${path.basename(appPath)}`);
    }
  }

  // Update mockDb.js
  const mockPath = path.join(appPath, 'src', 'services', 'mockDb.js');
  if (fs.existsSync(mockPath)) {
    let mockContent = fs.readFileSync(mockPath, 'utf8');
    
    // Seed tournaments
    if (!mockContent.includes('sportify_tournaments')) {
      // Add STORAGE_KEYS
      mockContent = mockContent.replace(
        "REVIEWS: 'sportify_reviews',",
        "REVIEWS: 'sportify_reviews',\n  TOURNAMENTS: 'sportify_tournaments',\n  TOURNAMENT_REGISTRATIONS: 'sportify_tournament_registrations',"
      );

      // Add init seeder
      const seederBlock = `  if (!localStorage.getItem(STORAGE_KEYS.TOURNAMENTS)) {
    const defaultTournaments = [
      {
        id: 'tournament-1',
        ground_id: 'ground-1',
        title: 'Sportify Summer Football Cup 2026',
        sport_type: 'Football',
        description: 'Compete against the best local teams in a thrilling 5v5 knockout football tournament. Cash prize for the winner!',
        start_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        entry_fee: 1500,
        prize_pool: 25000,
        max_teams: 16,
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(defaultTournaments));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TOURNAMENT_REGISTRATIONS)) {
    localStorage.setItem(STORAGE_KEYS.TOURNAMENT_REGISTRATIONS, JSON.stringify([]));
  }`;
      
      mockContent = mockContent.replace(
        "localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(defaultReviews));\n  }",
        `localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(defaultReviews));\n  }\n${seederBlock}`
      );

      // Add helper functions before export closing bracket
      const helperMethods = `  getTournaments: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.TOURNAMENTS) || '[]'),
  saveTournaments: (data) => localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(data)),
  addTournament: (groundId, data) => {
    const list = mockDb.getTournaments();
    const newT = {
      id: \`tournament-\${Math.random().toString(36).substring(2, 9)}\`,
      ground_id: groundId,
      created_at: new Date().toISOString(),
      ...data
    };
    list.push(newT);
    mockDb.saveTournaments(list);
    return newT;
  },

  getTournamentRegistrations: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.TOURNAMENT_REGISTRATIONS) || '[]'),
  saveTournamentRegistrations: (data) => localStorage.setItem(STORAGE_KEYS.TOURNAMENT_REGISTRATIONS, JSON.stringify(data)),
  registerForTournament: (userId, tournamentId, regData) => {
    const list = mockDb.getTournamentRegistrations();
    const alreadyRegistered = list.find(r => r.tournament_id === tournamentId && r.user_id === userId);
    if (alreadyRegistered) {
      throw new Error('You have already registered a team for this tournament.');
    }
    const newR = {
      id: \`reg-\${Math.random().toString(36).substring(2, 9)}\`,
      tournament_id: tournamentId,
      user_id: userId,
      payment_status: 'paid',
      created_at: new Date().toISOString(),
      ...regData
    };
    list.push(newR);
    mockDb.saveTournamentRegistrations(list);
    return newR;
  },
};`;

      mockContent = mockContent.replace(/  \},\s*\n\};/g, `  },\n\n${helperMethods}`);
      fs.writeFileSync(mockPath, mockContent, 'utf8');
      console.log(`Updated mockDb.js inside ${path.basename(appPath)}`);
    }
  }

  // Update supabase.js mock router mapping
  const supabasePath = path.join(appPath, 'src', 'services', 'supabase.js');
  if (fs.existsSync(supabasePath)) {
    let subContent = fs.readFileSync(supabasePath, 'utf8');
    if (!subContent.includes('tournaments')) {
      // 1. Add select router
      subContent = subContent.replace(
        "else if (table === 'reviews') list = mockDb.getReviews();",
        "else if (table === 'reviews') list = mockDb.getReviews();\n        else if (table === 'tournaments') list = mockDb.getTournaments();\n        else if (table === 'tournament_registrations') list = mockDb.getTournamentRegistrations();"
      );

      // 2. Add insert router
      const insertRouter = `          } else if (table === 'tournaments') {
            rowsArray.forEach((r) => {
              const res = mockDb.addTournament(r.ground_id, r);
              insertedData.push(res);
            });
          } else if (table === 'tournament_registrations') {
            rowsArray.forEach((r) => {
              const res = mockDb.registerForTournament(r.user_id, r.tournament_id, r);
              insertedData.push(res);
            });
          }`;
      subContent = subContent.replace(
        "insertedData.push(res);\n            });\n          }",
        `insertedData.push(res);\n            });\n          }\n${insertRouter}`
      );

      fs.writeFileSync(supabasePath, subContent, 'utf8');
      console.log(`Updated supabase.js inside ${path.basename(appPath)}`);
    }
  }
}

integrateApp(playerDir);
integrateApp(managerDir);
console.log('Tournament integration complete.');
