-- ============================================================================
-- R3Play SaaS Multi-tenant: PostgreSQL Production Schema
-- Optimized for PostgreSQL on Linux VPS (Easypanel) with Row-Level Security (RLS)
-- ============================================================================

-- 1. Extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Tenants (Empresas Parceiras / Clientes White Label)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    subdomain VARCHAR(63) NOT NULL UNIQUE,
    custom_domain VARCHAR(255) UNIQUE,
    logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(7) NOT NULL DEFAULT '#f59e0b',
    secondary_color VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
    accent_color VARCHAR(7) NOT NULL DEFAULT '#10b981',
    description VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    -- Gestão de Licença e Planos Comerciais (Pós-Venda)
    plan_mode VARCHAR(20) NOT NULL DEFAULT 'pro',
    has_stream_addon BOOLEAN NOT NULL DEFAULT FALSE,
    license_status VARCHAR(20) NOT NULL DEFAULT 'active',
    license_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Índices otimizados para busca instantânea pelo subdomínio ou domínio customizado
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active);

-- 2.1 Tabela de Administradores da Plataforma (Superadmin Central)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'superadmin',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_admin_email ON admin_users(email);

-- 3. Tabela de Partidas (Matches) isolada por tenant
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50),
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Índice composto obrigatório para garantir performance e isolamento de tenant
CREATE INDEX IF NOT EXISTS idx_matches_tenant_id ON matches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_matches_tenant_created ON matches(tenant_id, created_at DESC);

-- 4. Tabela de Participantes/Atletas com isolamento estrito
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(30),
    position VARCHAR(40),
    attendance VARCHAR(20) DEFAULT 'pending',
    payment_status VARCHAR(20) DEFAULT 'pending',
    paid_amount NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_participants_tenant ON participants(tenant_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Opcional para defesa em profundidade no Postgres
-- ============================================================================
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Política de RLS onde o app define: SET LOCAL app.current_tenant_id = 'uuid-da-empresa'
CREATE POLICY tenant_isolation_matches ON matches
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_participants ON participants
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- 5. Seeds Iniciais de Demonstração
INSERT INTO tenants (id, name, subdomain, logo_url, primary_color, secondary_color, accent_color, description)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'R3Play Oficial', 'r3play', NULL, '#2563eb', '#4f46e5', '#f59e0b', 'Plataforma oficial R3team'),
  ('00000000-0000-0000-0000-000000000002', 'Arena Vôlei Brasil', 'arena1', NULL, '#10b981', '#059669', '#3b82f6', 'Complexo de Areia & Quadras'),
  ('00000000-0000-0000-0000-000000000003', 'Clube Pinheiros Vôlei', 'voleiclube', NULL, '#f43f5e', '#be123c', '#fbbf24', 'Liga Metropolitana de Voleibol')
ON CONFLICT (subdomain) DO NOTHING;
