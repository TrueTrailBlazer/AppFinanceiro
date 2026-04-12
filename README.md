# 📈 Fluxo - Controle Financeiro Pessoal

**Fluxo** é uma aplicação web progressiva (PWA) de alta performance desenvolvida para oferecer controle total sobre suas finanças pessoais de forma rápida, intuitiva e com estética premium.

![Fluxo Dashboard](/public/fluxo-icon.svg)

## ✨ Principais Funcionalidades

### 🏠 Dashboard Inteligente
- **Visão Geral:** Balanço de receitas, despesas e saldo atual em cards dinâmicos.
- **Gráficos Interativos:** Visualização mensal de Receitas vs Despesas com tooltips detalhados ao toque.
- **KPIs Financeiros:** Cálculo automático de saldo acumulado e taxa de poupança média.

### 📋 Extrato Detalhado
- **Filtros Avançados:** Filtre por entradas, saídas, pagos ou pendentes.
- **Ordenação Estável:** Lista organizada de forma determinística para evitar saltos visuais.
- **Gestão de Status:** Altere o status de pagamento (Pago/Pendente) diretamente na lista.

### 💰 Gestão de Transações
- **Entradas e Saídas:** Cadastro simplificado com categorias personalizadas.
- **Parcelamento Inteligente:** Suporte a compras parceladas com cálculo automático para meses futuros.
- **Máscara de Moeda:** Input de valores com formatação brasileira (BRL) automática.
- **Auto-fill Inteligente:** Sugestões de descrição baseadas na categoria selecionada.

### 📅 Navegação Temporal
- **Month Picker Centralizado:** Modal elegante para alternar entre anos e meses.
- **Swipe Gestures:** Navegação por gestos (deslizar) para trocar de ano.
- **Indicador de Dados:** Visualização rápida de quais meses possuem registros.

## 📱 Experiência Mobile (PWA)
- **Instalável:** Adicione o Fluxo à sua tela inicial como um app nativo.
- **Splash Screen Premium:** Carregamento elegante com fundo dark (sem flash branco).
- **Offline Ready:** Configurado para persistência de sessão e carregamento instantâneo.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend/DB:** [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Estado Global:** Context API para Cache de Transações

## 🚀 Como Executar o Projeto

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/fluxo-app.git
   cd fluxo-app
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto com suas chaves do Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_aqui
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---
Desenvolvido com foco em UX e Performance. 🚀
