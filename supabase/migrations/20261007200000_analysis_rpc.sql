CREATE OR REPLACE FUNCTION get_analysis_data_v4(
    p_user_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_prev_start_date TIMESTAMPTZ DEFAULT NULL,
    p_prev_end_date TIMESTAMPTZ DEFAULT NULL
) RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_has_bank_data BOOLEAN;
    v_prev_has_bank_data BOOLEAN;
    
    v_total_expense_cents BIGINT := 0;
    v_total_items INT := 0;
    
    v_category_ranking JSON := '[]'::JSON;
    v_top_expenses JSON := '[]'::JSON;
    
    v_prev_total_expense_cents BIGINT := 0;
    v_comparison JSON := NULL;
BEGIN
    -- Defesa em profundidade contra IDOR:
    -- O usuário autenticado só pode consultar seus próprios dados analíticos,
    -- a menos que seja chamado pela service_role do sistema.
    IF (auth.uid() IS NULL OR auth.uid() != p_user_id) AND (auth.role() IS NULL OR auth.role() != 'service_role') THEN
        RAISE EXCEPTION 'Acesso não autorizado: usuário inválido' USING ERRCODE = '42501';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM transactions 
        WHERE user_id = p_user_id 
          AND created_at >= p_start_date 
          AND created_at <= p_end_date
          AND pluggy_transaction_id IS NOT NULL
    ) INTO v_has_bank_data;

    WITH filtered_tx AS (
        SELECT * FROM transactions
        WHERE user_id = p_user_id
          AND created_at >= p_start_date
          AND created_at <= p_end_date
          AND type != 'income'
          AND name NOT ILIKE '%dinheiro retirado%'
          AND name NOT ILIKE '%saldo reservado%'
          AND (
              (v_has_bank_data = TRUE AND pluggy_transaction_id IS NOT NULL)
              OR
              (v_has_bank_data = FALSE AND pluggy_transaction_id IS NULL)
          )
    )
    SELECT 
        COALESCE(SUM(amount), 0),
        COUNT(id)
    INTO v_total_expense_cents, v_total_items
    FROM filtered_tx;

    IF v_total_items > 0 THEN
        SELECT COALESCE(json_agg(cat_row), '[]'::JSON) INTO v_category_ranking
        FROM (
            SELECT category as cat, SUM(amount) as amount
            FROM transactions
            WHERE user_id = p_user_id
              AND created_at >= p_start_date
              AND created_at <= p_end_date
              AND type != 'income'
              AND name NOT ILIKE '%dinheiro retirado%'
              AND name NOT ILIKE '%saldo reservado%'
              AND (
                  (v_has_bank_data = TRUE AND pluggy_transaction_id IS NOT NULL)
                  OR
                  (v_has_bank_data = FALSE AND pluggy_transaction_id IS NULL)
              )
            GROUP BY category
            ORDER BY SUM(amount) DESC
        ) cat_row;

        SELECT COALESCE(json_agg(top_row), '[]'::JSON) INTO v_top_expenses
        FROM (
            SELECT * FROM (
                SELECT DISTINCT ON (regexp_replace(name, '\s*\(\d+\/\d+\)\s*$', '')) 
                    id, user_id, name, amount, type, category, is_paid, created_at, pluggy_transaction_id, bank_name, bank_logo_url
                FROM transactions
                WHERE user_id = p_user_id
                  AND created_at >= p_start_date
                  AND created_at <= p_end_date
                  AND type != 'income'
                  AND name NOT ILIKE '%dinheiro retirado%'
                  AND name NOT ILIKE '%saldo reservado%'
                  AND (
                      (v_has_bank_data = TRUE AND pluggy_transaction_id IS NOT NULL)
                      OR
                      (v_has_bank_data = FALSE AND pluggy_transaction_id IS NULL)
                  )
                ORDER BY regexp_replace(name, '\s*\(\d+\/\d+\)\s*$', ''), amount DESC
            ) AS distinct_tx
            ORDER BY amount DESC
            LIMIT 5
        ) top_row;
    END IF;

    IF p_prev_start_date IS NOT NULL AND p_prev_end_date IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM transactions 
            WHERE user_id = p_user_id 
              AND created_at >= p_prev_start_date 
              AND created_at <= p_prev_end_date
              AND pluggy_transaction_id IS NOT NULL
        ) INTO v_prev_has_bank_data;

        SELECT COALESCE(SUM(amount), 0)
        INTO v_prev_total_expense_cents
        FROM transactions
        WHERE user_id = p_user_id
          AND created_at >= p_prev_start_date
          AND created_at <= p_prev_end_date
          AND type != 'income'
          AND name NOT ILIKE '%dinheiro retirado%'
          AND name NOT ILIKE '%saldo reservado%'
          AND (
              (v_prev_has_bank_data = TRUE AND pluggy_transaction_id IS NOT NULL)
              OR
              (v_prev_has_bank_data = FALSE AND pluggy_transaction_id IS NULL)
          );

        IF v_prev_total_expense_cents > 0 THEN
            v_comparison := json_build_object(
                'isSavings', v_prev_total_expense_cents >= v_total_expense_cents,
                'value', ABS(v_prev_total_expense_cents - v_total_expense_cents),
                'percent', ROUND((ABS(v_prev_total_expense_cents - v_total_expense_cents)::NUMERIC / v_prev_total_expense_cents::NUMERIC) * 100)
            );
        END IF;
    END IF;

    RETURN json_build_object(
        'totalExpenseCents', v_total_expense_cents,
        'categoryRanking', v_category_ranking,
        'topExpensesList', v_top_expenses,
        'comparison', v_comparison,
        'totalItems', v_total_items,
        'isBankSource', COALESCE(v_has_bank_data, FALSE)
    );
END;
$$;

-- Restringe permissões de execução: anônimo não tem acesso
REVOKE EXECUTE ON FUNCTION get_analysis_data_v4(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_analysis_data_v4(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated, service_role;

