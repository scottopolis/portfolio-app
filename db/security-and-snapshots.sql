-- ============================================================================
-- SECURITY HARDENING & HISTORICAL TRACKING - DATABASE UPDATES
-- Run this in Neon SQL Editor
-- ============================================================================

-- ============================================================================
-- PHASE 1: ADD SECURITY CONSTRAINTS
-- ============================================================================

-- Ensure distribution amounts are non-negative
DO $$ 
BEGIN
    ALTER TABLE distributions 
    ADD CONSTRAINT chk_distributions_amount_nonneg 
    CHECK (amount >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Ensure stock quantities are non-negative
DO $$ 
BEGIN
    ALTER TABLE investments 
    ADD CONSTRAINT chk_investments_qty_nonneg 
    CHECK (stock_quantity IS NULL OR stock_quantity >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Ensure stock prices are non-negative
DO $$ 
BEGIN
    ALTER TABLE investments 
    ADD CONSTRAINT chk_investments_price_nonneg 
    CHECK (current_stock_price IS NULL OR current_stock_price >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PHASE 2: CREATE HISTORICAL SNAPSHOT TABLES
-- ============================================================================

-- Portfolio daily snapshots for tracking portfolio value over time
CREATE TABLE IF NOT EXISTS portfolio_daily_snapshots (
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_value NUMERIC(18,2) NOT NULL,
    total_invested NUMERIC(18,2) NOT NULL,
    total_distributions NUMERIC(18,2) NOT NULL,
    investment_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (portfolio_id, snapshot_date)
);

-- Index for querying snapshots by date
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date 
ON portfolio_daily_snapshots(snapshot_date);

-- Index for querying by portfolio
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_portfolio 
ON portfolio_daily_snapshots(portfolio_id, snapshot_date DESC);

-- User daily snapshots for aggregate portfolio tracking
CREATE TABLE IF NOT EXISTS user_daily_snapshots (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_value NUMERIC(18,2) NOT NULL,
    total_invested NUMERIC(18,2) NOT NULL,
    total_distributions NUMERIC(18,2) NOT NULL,
    portfolio_count INTEGER NOT NULL DEFAULT 0,
    investment_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, snapshot_date)
);

-- Index for querying user snapshots by date
CREATE INDEX IF NOT EXISTS idx_user_snapshots_date 
ON user_daily_snapshots(snapshot_date);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_user_snapshots_user 
ON user_daily_snapshots(user_id, snapshot_date DESC);

-- Optional: Investment value history for detailed tracking
CREATE TABLE IF NOT EXISTS investment_value_history (
    investment_id INTEGER NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    stock_price NUMERIC(18,8),
    stock_quantity NUMERIC(18,8),
    value NUMERIC(18,2) NOT NULL,
    total_distributions NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (investment_id, snapshot_date)
);

-- Index for investment history queries
CREATE INDEX IF NOT EXISTS idx_investment_history_date 
ON investment_value_history(snapshot_date);

CREATE INDEX IF NOT EXISTS idx_investment_history_investment 
ON investment_value_history(investment_id, snapshot_date DESC);

-- ============================================================================
-- PHASE 3: ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on portfolios table
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own portfolios
DROP POLICY IF EXISTS portfolios_rw ON portfolios;
CREATE POLICY portfolios_rw ON portfolios
    USING (user_id = current_setting('app.user_id', true)::int)
    WITH CHECK (user_id = current_setting('app.user_id', true)::int);

-- Enable RLS on investments table
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see investments in their own portfolios
DROP POLICY IF EXISTS investments_rw ON investments;
CREATE POLICY investments_rw ON investments
    USING (
        EXISTS (
            SELECT 1 FROM portfolios p 
            WHERE p.id = investments.portfolio_id 
            AND p.user_id = current_setting('app.user_id', true)::int
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM portfolios p 
            WHERE p.id = investments.portfolio_id 
            AND p.user_id = current_setting('app.user_id', true)::int
        )
    );

-- Enable RLS on distributions table
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see distributions for their investments
DROP POLICY IF EXISTS distributions_rw ON distributions;
CREATE POLICY distributions_rw ON distributions
    USING (
        EXISTS (
            SELECT 1 FROM investments i 
            JOIN portfolios p ON p.id = i.portfolio_id 
            WHERE i.id = distributions.investment_id 
            AND p.user_id = current_setting('app.user_id', true)::int
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM investments i 
            JOIN portfolios p ON p.id = i.portfolio_id 
            WHERE i.id = distributions.investment_id 
            AND p.user_id = current_setting('app.user_id', true)::int
        )
    );

-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS categories_rw ON categories;
CREATE POLICY categories_rw ON categories
    USING (user_id = current_setting('app.user_id', true)::int)
    WITH CHECK (user_id = current_setting('app.user_id', true)::int);

-- Enable RLS on tags table
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tags_rw ON tags;
CREATE POLICY tags_rw ON tags
    USING (user_id = current_setting('app.user_id', true)::int)
    WITH CHECK (user_id = current_setting('app.user_id', true)::int);

-- Enable RLS on investment_types table
ALTER TABLE investment_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS investment_types_rw ON investment_types;
CREATE POLICY investment_types_rw ON investment_types
    USING (user_id = current_setting('app.user_id', true)::int)
    WITH CHECK (user_id = current_setting('app.user_id', true)::int);

-- Enable RLS on investment_categories junction table
ALTER TABLE investment_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS investment_categories_rw ON investment_categories;
CREATE POLICY investment_categories_rw ON investment_categories
    USING (
        EXISTS (
            SELECT 1 
            FROM investments i 
            JOIN portfolios p ON p.id = i.portfolio_id 
            WHERE i.id = investment_categories.investment_id 
            AND p.user_id = current_setting('app.user_id', true)::int
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM investments i
            JOIN portfolios p ON p.id = i.portfolio_id
            JOIN categories c ON c.id = investment_categories.category_id
            WHERE i.id = investment_categories.investment_id
            AND c.user_id = p.user_id
            AND p.user_id = current_setting('app.user_id', true)::int
        )
    );

-- Enable RLS on investment_tags junction table
ALTER TABLE investment_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS investment_tags_rw ON investment_tags;
CREATE POLICY investment_tags_rw ON investment_tags
    USING (
        EXISTS (
            SELECT 1 
            FROM investments i 
            JOIN portfolios p ON p.id = i.portfolio_id 
            WHERE i.id = investment_tags.investment_id 
            AND p.user_id = current_setting('app.user_id', true)::int
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM investments i
            JOIN portfolios p ON p.id = i.portfolio_id
            JOIN tags t ON t.id = investment_tags.tag_id
            WHERE i.id = investment_tags.investment_id
            AND t.user_id = p.user_id
            AND p.user_id = current_setting('app.user_id', true)::int
        )
    );

-- Enable RLS on snapshot tables
ALTER TABLE portfolio_daily_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS portfolio_snapshots_rw ON portfolio_daily_snapshots;
CREATE POLICY portfolio_snapshots_rw ON portfolio_daily_snapshots
    USING (
        EXISTS (
            SELECT 1 FROM portfolios p 
            WHERE p.id = portfolio_daily_snapshots.portfolio_id 
            AND p.user_id = current_setting('app.user_id', true)::int
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM portfolios p 
            WHERE p.id = portfolio_daily_snapshots.portfolio_id 
            AND p.user_id = current_setting('app.user_id', true)::int
        )
    );

ALTER TABLE user_daily_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_snapshots_rw ON user_daily_snapshots;
CREATE POLICY user_snapshots_rw ON user_daily_snapshots
    USING (user_id = current_setting('app.user_id', true)::int)
    WITH CHECK (user_id = current_setting('app.user_id', true)::int);

ALTER TABLE investment_value_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS investment_history_rw ON investment_value_history;
CREATE POLICY investment_history_rw ON investment_value_history
    USING (
        EXISTS (
            SELECT 1 FROM investments i 
            JOIN portfolios p ON p.id = i.portfolio_id 
            WHERE i.id = investment_value_history.investment_id 
            AND p.user_id = current_setting('app.user_id', true)::int
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM investments i 
            JOIN portfolios p ON p.id = i.portfolio_id 
            WHERE i.id = investment_value_history.investment_id 
            AND p.user_id = current_setting('app.user_id', true)::int
        )
    );

-- ============================================================================
-- PHASE 4: JUNCTION TABLE VALIDATION TRIGGERS
-- ============================================================================

-- Function to enforce same-user associations for investment_categories
CREATE OR REPLACE FUNCTION enforce_same_user_inv_cat() 
RETURNS trigger AS $$
DECLARE 
    inv_user INT; 
    cat_user INT;
BEGIN
    SELECT p.user_id INTO inv_user 
    FROM investments i 
    JOIN portfolios p ON p.id = i.portfolio_id 
    WHERE i.id = NEW.investment_id;
    
    SELECT user_id INTO cat_user 
    FROM categories 
    WHERE id = NEW.category_id;
    
    IF inv_user IS NULL OR cat_user IS NULL OR inv_user <> cat_user THEN
        RAISE EXCEPTION 'Cross-tenant association not allowed: investment and category must belong to the same user';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for investment_categories
DROP TRIGGER IF EXISTS trg_inv_cat_user ON investment_categories;
CREATE TRIGGER trg_inv_cat_user 
BEFORE INSERT OR UPDATE ON investment_categories 
FOR EACH ROW EXECUTE PROCEDURE enforce_same_user_inv_cat();

-- Function to enforce same-user associations for investment_tags
CREATE OR REPLACE FUNCTION enforce_same_user_inv_tag() 
RETURNS trigger AS $$
DECLARE 
    inv_user INT; 
    tag_user INT;
BEGIN
    SELECT p.user_id INTO inv_user 
    FROM investments i 
    JOIN portfolios p ON p.id = i.portfolio_id 
    WHERE i.id = NEW.investment_id;
    
    SELECT user_id INTO tag_user 
    FROM tags 
    WHERE id = NEW.tag_id;
    
    IF inv_user IS NULL OR tag_user IS NULL OR inv_user <> tag_user THEN
        RAISE EXCEPTION 'Cross-tenant association not allowed: investment and tag must belong to the same user';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for investment_tags
DROP TRIGGER IF EXISTS trg_inv_tag_user ON investment_tags;
CREATE TRIGGER trg_inv_tag_user 
BEFORE INSERT OR UPDATE ON investment_tags 
FOR EACH ROW EXECUTE PROCEDURE enforce_same_user_inv_tag();

-- ============================================================================
-- PHASE 5: HELPER FUNCTIONS FOR SNAPSHOTS
-- ============================================================================

-- Function to compute portfolio snapshot value
CREATE OR REPLACE FUNCTION compute_portfolio_snapshot(p_portfolio_id INTEGER)
RETURNS TABLE (
    total_value NUMERIC(18,2),
    total_invested NUMERIC(18,2),
    total_distributions NUMERIC(18,2),
    investment_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(
            CASE 
                WHEN i.investment_type = 'stocks' 
                    AND i.current_stock_price IS NOT NULL 
                    AND i.stock_quantity IS NOT NULL
                THEN i.stock_quantity * i.current_stock_price
                ELSE i.amount
            END
        ), 0)::NUMERIC(18,2) as total_value,
        COALESCE(SUM(i.amount), 0)::NUMERIC(18,2) as total_invested,
        COALESCE(SUM(d.total_distributions), 0)::NUMERIC(18,2) as total_distributions,
        COUNT(i.id)::INTEGER as investment_count
    FROM investments i
    LEFT JOIN (
        SELECT investment_id, SUM(amount) as total_distributions
        FROM distributions
        GROUP BY investment_id
    ) d ON i.id = d.investment_id
    WHERE i.portfolio_id = p_portfolio_id;
END;
$$ LANGUAGE plpgsql;

-- Function to compute user aggregate snapshot
CREATE OR REPLACE FUNCTION compute_user_snapshot(p_user_id INTEGER)
RETURNS TABLE (
    total_value NUMERIC(18,2),
    total_invested NUMERIC(18,2),
    total_distributions NUMERIC(18,2),
    portfolio_count INTEGER,
    investment_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(
            CASE 
                WHEN i.investment_type = 'stocks' 
                    AND i.current_stock_price IS NOT NULL 
                    AND i.stock_quantity IS NOT NULL
                THEN i.stock_quantity * i.current_stock_price
                ELSE i.amount
            END
        ), 0)::NUMERIC(18,2) as total_value,
        COALESCE(SUM(i.amount), 0)::NUMERIC(18,2) as total_invested,
        COALESCE(SUM(d.total_distributions), 0)::NUMERIC(18,2) as total_distributions,
        COUNT(DISTINCT p.id)::INTEGER as portfolio_count,
        COUNT(i.id)::INTEGER as investment_count
    FROM portfolios p
    LEFT JOIN investments i ON p.id = i.portfolio_id
    LEFT JOIN (
        SELECT investment_id, SUM(amount) as total_distributions
        FROM distributions
        GROUP BY investment_id
    ) d ON i.id = d.investment_id
    WHERE p.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to save portfolio snapshot
CREATE OR REPLACE FUNCTION save_portfolio_snapshot(
    p_portfolio_id INTEGER,
    p_snapshot_date DATE DEFAULT CURRENT_DATE
)
RETURNS void AS $$
DECLARE
    v_snapshot RECORD;
BEGIN
    -- Compute snapshot values
    SELECT * INTO v_snapshot FROM compute_portfolio_snapshot(p_portfolio_id);
    
    -- Insert or update snapshot
    INSERT INTO portfolio_daily_snapshots (
        portfolio_id,
        snapshot_date,
        total_value,
        total_invested,
        total_distributions,
        investment_count
    ) VALUES (
        p_portfolio_id,
        p_snapshot_date,
        v_snapshot.total_value,
        v_snapshot.total_invested,
        v_snapshot.total_distributions,
        v_snapshot.investment_count
    )
    ON CONFLICT (portfolio_id, snapshot_date) 
    DO UPDATE SET
        total_value = EXCLUDED.total_value,
        total_invested = EXCLUDED.total_invested,
        total_distributions = EXCLUDED.total_distributions,
        investment_count = EXCLUDED.investment_count,
        created_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to save user snapshot
CREATE OR REPLACE FUNCTION save_user_snapshot(
    p_user_id INTEGER,
    p_snapshot_date DATE DEFAULT CURRENT_DATE
)
RETURNS void AS $$
DECLARE
    v_snapshot RECORD;
BEGIN
    -- Compute snapshot values
    SELECT * INTO v_snapshot FROM compute_user_snapshot(p_user_id);
    
    -- Insert or update snapshot
    INSERT INTO user_daily_snapshots (
        user_id,
        snapshot_date,
        total_value,
        total_invested,
        total_distributions,
        portfolio_count,
        investment_count
    ) VALUES (
        p_user_id,
        p_snapshot_date,
        v_snapshot.total_value,
        v_snapshot.total_invested,
        v_snapshot.total_distributions,
        v_snapshot.portfolio_count,
        v_snapshot.investment_count
    )
    ON CONFLICT (user_id, snapshot_date) 
    DO UPDATE SET
        total_value = EXCLUDED.total_value,
        total_invested = EXCLUDED.total_invested,
        total_distributions = EXCLUDED.total_distributions,
        portfolio_count = EXCLUDED.portfolio_count,
        investment_count = EXCLUDED.investment_count,
        created_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to save snapshots for all portfolios and users
CREATE OR REPLACE FUNCTION save_all_snapshots(
    p_snapshot_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    portfolios_saved INTEGER,
    users_saved INTEGER
) AS $$
DECLARE
    v_portfolio_count INTEGER := 0;
    v_user_count INTEGER := 0;
    v_portfolio RECORD;
    v_user RECORD;
BEGIN
    -- Save portfolio snapshots
    FOR v_portfolio IN SELECT id FROM portfolios
    LOOP
        PERFORM save_portfolio_snapshot(v_portfolio.id, p_snapshot_date);
        v_portfolio_count := v_portfolio_count + 1;
    END LOOP;
    
    -- Save user snapshots
    FOR v_user IN SELECT id FROM users
    LOOP
        PERFORM save_user_snapshot(v_user.id, p_snapshot_date);
        v_user_count := v_user_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT v_portfolio_count, v_user_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify constraints were added
-- SELECT conname, contype 
-- FROM pg_constraint 
-- WHERE conrelid IN ('distributions'::regclass, 'investments'::regclass)
-- AND conname LIKE 'chk_%';

-- Verify snapshot tables exist
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_name IN ('portfolio_daily_snapshots', 'user_daily_snapshots', 'investment_value_history');

-- Verify RLS is enabled
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename IN ('portfolios', 'investments', 'distributions', 'categories', 'tags');

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- To save today's snapshot for all portfolios and users:
-- SELECT * FROM save_all_snapshots();

-- To save a specific portfolio snapshot:
-- SELECT save_portfolio_snapshot(1);

-- To save a specific user snapshot:
-- SELECT save_user_snapshot(1);

-- To query portfolio history:
-- SELECT * FROM portfolio_daily_snapshots 
-- WHERE portfolio_id = 1 
-- ORDER BY snapshot_date DESC 
-- LIMIT 30;

-- To query user history:
-- SELECT * FROM user_daily_snapshots 
-- WHERE user_id = 1 
-- ORDER BY snapshot_date DESC 
-- LIMIT 30;
