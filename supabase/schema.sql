-- ==============================================================================
-- HEAD SOCCER ONLINE - SUPABASE SQL SCHEMA & RLS POLICIES
-- ==============================================================================

-- 1. TABLA DE PERFILES (profiles)
-- Vinculada 1:1 con la tabla auth.users de Supabase
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(30) UNIQUE NOT NULL,
    avatar_url TEXT DEFAULT 'https://api.dicebear.com/7.x/bottts/svg?seed=cabezon' NOT NULL,
    elo_rating INTEGER DEFAULT 1000 NOT NULL,
    matches_played INTEGER DEFAULT 0 NOT NULL,
    matches_won INTEGER DEFAULT 0 NOT NULL,
    goals_scored INTEGER DEFAULT 0 NOT NULL,
    goals_conceded INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA DE PERSONAJES (characters)
CREATE TABLE IF NOT EXISTS public.characters (
    id VARCHAR(50) PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,
    speed_stat REAL NOT NULL,
    jump_stat REAL NOT NULL,
    kick_stat REAL NOT NULL,
    sprite_key VARCHAR(50) NOT NULL
);

-- Insertar personajes iniciales de muestra
INSERT INTO public.characters (id, display_name, speed_stat, jump_stat, kick_stat, sprite_key)
VALUES 
    ('goku_base', 'Goku Base', 8.5, 9.0, 9.5, 'char_goku_base'),
    ('goku', 'Goku Cabezón', 8.5, 9.0, 9.5, 'char_goku'),
    ('freezer', 'Emperador Freezer', 9.8, 8.5, 8.0, 'char_freezer'),
    ('messi', 'Leo Cabezón', 9.5, 7.5, 9.0, 'char_messi')
ON CONFLICT (id) DO NOTHING;

-- 3. TABLA DE PARTIDAS (matches)
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    duration_seconds INTEGER NOT NULL,
    winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 4. TABLA DE DETALLES DE JUGADORES EN PARTIDAS (match_players)
CREATE TABLE IF NOT EXISTS public.match_players (
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    character_id VARCHAR(50) REFERENCES public.characters(id) ON DELETE RESTRICT,
    score INTEGER DEFAULT 0 NOT NULL,
    elo_change INTEGER NOT NULL,
    is_host BOOLEAN DEFAULT false NOT NULL,
    PRIMARY KEY (match_id, player_id)
);

-- ==============================================================================
-- POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;

-- Políticas de Lectura Pública
CREATE POLICY "Perfiles públicos visibles para todos" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Personajes visibles para todos" ON public.characters FOR SELECT USING (true);
CREATE POLICY "Partidas visibles para todos" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Detalles de partidos visibles para todos" ON public.match_players FOR SELECT USING (true);

-- Políticas de Escritura Autoritativa (Únicamente Service Role del Backend o el propio usuario para creación)
CREATE POLICY "Los usuarios pueden insertar su propio perfil en el registro" 
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio avatar o nombre" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- El servidor con Service Role pasará el chequeo de service_role automáticamente.
-- Pero para restringir al máximo la modificación de estadísticas de partido por parte del usuario web:
-- En Supabase, las solicitudes con Service Role Key ignoran RLS por completo. Por tanto, RLS bloquea a los clientes web no autorizados.

-- ==============================================================================
-- FUNCIÓN / TRIGGER PARA CREAR PERFIL AUTOMÁTICAMENTE AL REGISTRAR EN SUPABASE AUTH
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'username', 'Cabezon_' || substr(new.id::text, 1, 6)),
        COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.id::text)
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sobre auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
