# Fluxo - App de Gestão Financeira Pessoal

O **Fluxo** é um aplicativo de gestão financeira moderna, focado em simplicidade, agilidade e uma experiência de usuário impecável. Projetado especificamente para ser **Mobile-First**, o app utiliza o padrão **Thumb Zone**, garantindo que todas as ações importantes estejam ao alcance do polegar para uso com uma única mão.

![Banner](https://img.shields.io/badge/UX-Thumb%20Zone-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-v4-blue) ![Supabase](https://img.shields.io/badge/Backend-Supabase-green)

---

## 🚀 Principais Funcionalidades (Functions)

### 1. Gestão de Lançamentos
*   **Fluxo de Caixa:** Adicione e edite receitas (entradas) e despesas (saídas) com facilidade.
*   **Categorização:** Organize seus gastos por categorias (Alimentação, Transporte, Lazer, etc).
*   **Controle de Status:** Marque despesas como "Pagas" ou "Pendentes" para visualizar o saldo real vs. saldo previsto.

### 2. Visão Mensal e Extrato
*   **Troca de Mês:** Navegue facilmente entre meses usando um seletor global sincronizado.
*   **Histórico Detalhado:** visualize todos os seus gastos do período em uma lista clara e colunada (Grid) para melhor visualização em telas de desktop.

### 3. Análise Financeira (Dashboard)
*   **Gráficos Inteligentes:** Compare Receitas vs. Despesas nos últimos meses.
*   **Ranking de Gastos:** Identifique rapidamente seus maiores ralos de dinheiro com a barra de progresso de maiores gastos.
*   **KPIs de Performance:** Veja seu saldo acumulado e sua taxa média de poupança.

### 4. Despesas Fixas (Recorrência)
*   **Automação:** Cadastre suas contas fixas (Netflix, Aluguel, Luz) uma única vez.
*   **Lançar Contador:** Com um clique, gere automaticamente todas as transações do mês vigente com base nas suas despesas fixas cadastradas.

### 5. Segurança e Perfil
*   **Autenticação Robusta:** Login seguro via email e senha usando Supabase Auth.
*   **Privacidade Total:** RLS (Row Level Security) ativado no banco de dados, garantindo que ninguém, exceto você, veja seus dados financeiros.

---

## 🎨 Design System e UX

O app foi construído com uma estética **Premium Dark Mode**:
- **Cores Oficiais:** Fundo `#050505`, Cards `#121212`, Destaques em `#3B82F6` (Azul Neon).
- **Thumb Zone Compliance:** Botões de "Salvar", "Cancelar" e "Voltar" estão localizados na base da tela para facilidade de uso em dispositivos móveis modernos.
- **Desktop Ready:** Em computadores, o app se adapta para layouts centralizados e grids eficientes, evitando que a interface fique esticada.

---

## 🛠️ Stack Tecnológico

*   **Frontend:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
*   **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **Banco de Dados & Auth:** [Supabase](https://supabase.com/)
*   **Ícones:** [Lucide React](https://lucide.dev/)

---

## 💻 Como Executar o Projeto

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/app-financeiro.git
    cd app-financeiro
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto com suas credenciais do Supabase:
    ```env
    VITE_SUPABASE_URL=sua_url_do_supabase
    VITE_SUPABASE_ANON_KEY=sua_chave_anon_key
    ```

4.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

---

## 📄 Licença
Este projeto está sob a licença [MIT](LICENSE).

---
*Feito com foco em simplicidade e performance.*
