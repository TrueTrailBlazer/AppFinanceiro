# Contexto do Projeto: Fluxo - App Financeiro

## 1. Stack Tecnológico
- **Frontend:** React (Vite)
- **Estilização:** Tailwind CSS v4 (via `@tailwindcss/postcss`) + Lucide React para ícones.
- **Backend/BaaS:** Supabase (Autenticação de Email/Senha + Banco de Dados).
- **Infraestrutura:** Automação diária no GitHub Actions usando `SUPABASE_SERVICE_ROLE_KEY` para evitar a pausa do projeto por inatividade.

## 2. Regras de Arquitetura e Estilo
- **Tailwind v4:** Não sugira a criação de `tailwind.config.js`. O projeto utiliza a nova sintaxe do v4 com `@import "tailwindcss";` no arquivo CSS principal.
- **Design System:** O app possui um tema escuro customizado. Fundo (`#050505`), Cards (`#121212`) e destaques em Azul Neon (`#3B82F6`). 
- **Responsividade:** A interface é "Mobile-First", mas deve utilizar classes como `md:max-w-4xl` para se adaptar elegantemente a telas de PC sem perder as proporções.

## 3. Regras de Banco de Dados (Supabase)
- A tabela principal é `transactions` (`id`, `user_id`, `name`, `amount`, `type`, `created_at`).
- **Row Level Security (RLS)** está ATIVADO de forma estrita. Todas as operações de leitura, inserção, atualização e deleção devem ser filtradas por `auth.uid() = user_id`.
- **Segurança:** Nunca exponha a `service_role_key` no frontend. O `App.jsx` deve importar e utilizar exclusivamente a `anon_key` contida nas variáveis de ambiente do Vite (`import.meta.env`).

## 4. Diretrizes de Comportamento da IA
- **Análise antes de Código:** Nunca reescreva arquivos inteiros sem necessidade. Concentre-se em alterações cirúrgicas.
- **Clean Code:** Mantenha os componentes limpos. Se um arquivo estiver muito grande, sugira a separação lógica antes de adicionar novas funcionalidades.
- **Preservação:** Não remova lógicas de navegação de estado (como o `screenStack`) ou cálculos de totais sem permissão explícita.