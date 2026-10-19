import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Security & Correctness Verification (P0 Requirements)', () => {
  const migrations = [
    path.resolve(process.cwd(), 'supabase/migrations/20261007200000_analysis_rpc.sql'),
    path.resolve(process.cwd(), 'supabase/migrations/20261007200001_analysis_rpc.sql'),
    path.resolve(process.cwd(), 'supabase/migrations/20261019120000_fix_analysis_cofrinho_and_cleanup.sql'),
  ];

  migrations.forEach((migrationPath) => {
    const filename = path.basename(migrationPath);

    describe(`Migration: ${filename}`, () => {
      const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

      it('deve conter a cláusula SET search_path = public para evitar search path hijacking', () => {
        expect(sqlContent).toMatch(/SET search_path\s*=\s*public/i);
      });

      it('deve conter validação anti-IDOR garantindo que auth.uid() corresponda a p_user_id', () => {
        expect(sqlContent).toMatch(/auth\.uid\(\)\s*!=\s*p_user_id/i);
        expect(sqlContent).toMatch(/RAISE EXCEPTION/i);
        expect(sqlContent).toMatch(/42501/);
      });

      it('deve revogar permissões de execução do público e conceder apenas a autenticados e service_role', () => {
        expect(sqlContent).toMatch(/REVOKE EXECUTE ON FUNCTION get_analysis_data_v4.*FROM PUBLIC;/i);
        expect(sqlContent).toMatch(/GRANT EXECUTE ON FUNCTION get_analysis_data_v4.*TO authenticated,\s*service_role;/i);
      });

      it('deve utilizar v_prev_has_bank_data = FALSE no cálculo do mês anterior para evitar zerar histórico', () => {
        // Garante que a linha com bug v_has_bank_data = FALSE (sem o prefixo _pre) foi eliminada no bloco de p_prev
        expect(sqlContent).not.toMatch(/(?<!_pre)v_has_bank_data\s*=\s*FALSE\s+AND\s+pluggy_transaction_id\s+IS\s+NULL\s*\)\s*\)\s*;/i);
        // Garante que a linha corrigida com v_prev_has_bank_data = FALSE está presente
        expect(sqlContent).toMatch(/v_prev_has_bank_data\s*=\s*FALSE\s+AND\s+pluggy_transaction_id\s+IS\s+NULL\s*\)\s*\)\s*;/i);
      });
    });
  });

  describe('Webhook Pluggy: supabase/functions/pluggy-webhook/index.ts', () => {
    const webhookPath = path.resolve(process.cwd(), 'supabase/functions/pluggy-webhook/index.ts');
    const webhookContent = fs.readFileSync(webhookPath, 'utf-8');

    it('não deve permitir fail-open se PLUGGY_WEBHOOK_SECRET não estiver configurado', () => {
      // Não pode haver if (webhookSecret && req.headers...) que pule a validação quando webhookSecret for falsy
      expect(webhookContent).not.toMatch(/if\s*\(\s*webhookSecret\s*&&\s*req\.headers/);
      // Deve checar explicitamente a ausência do secret ou do header
      expect(webhookContent).toMatch(/!webhookSecret\s*\|\|\s*!headerSecret/);
    });

    it('deve retornar 401 Unauthorized quando o segredo for inválido ou ausente', () => {
      expect(webhookContent).toMatch(/status:\s*401/);
      expect(webhookContent).toMatch(/error:\s*['"]Unauthorized['"]/);
    });

    it('deve utilizar dateFrom e não o parâmetro obsoleto from ao consultar a API v2 da Pluggy', () => {
      expect(webhookContent).toMatch(/dateFrom=\$\{fromDateIso\}/);
      expect(webhookContent).not.toMatch(/\?accountId=\$\{acc\.id\}&from=/);
    });

    it('deve filtrar movimentações de cofrinho e dinheiro reservado', () => {
      expect(webhookContent).toMatch(/desc\.includes\(['"]dinheiro reservado['"]\)/);
      expect(webhookContent).toMatch(/desc\.includes\(['"]reserva programada['"]\)/);
    });
  });
});
