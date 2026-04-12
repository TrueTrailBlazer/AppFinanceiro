# Fluxo - Gestão Financeira Profissional

Fluxo é uma aplicação web progressiva (PWA) de alta performance desenvolvida para oferecer controle total sobre finanças pessoais com foco em usabilidade, segurança e design de alta fidelidade.

<p align="center">
  <img src="public/fluxo-icon.svg" width="160" alt="Fluxo Logo">
</p>

## Funcionalidades Principais

### Dashboard de Controle
- **Monitoramento de Balanço:** Visualização em tempo real de receitas, despesas e saldo remanescente.
- **Gráficos Dinâmicos:** Comparativos mensais de Receitas vs Despesas com interação via tooltips.
- **Indicadores de Performance:** Cálculo automático de saldo acumulado e taxa média de poupança.

### Gestão de Transações e Extrato
- **Filtragem Avançada:** Segmentação por tipo de transação (Entrada/Saída) e status de pagamento.
- **Estabilidade Visual:** Ordenação composta e determinística para preservar o posicionamento dos itens durante atualizações.
- **Controle de Pagamentos:** Gestão intuitiva de status Pago/Pendente.

### Lançamentos Inteligentes
- **Operações Parceladas:** Suporte nativo para compras parceladas com propagação automática em períodos futuros.
- **Máscara de Valores:** Formatação automática de moeda seguindo o padrão BRL.
- **Nomenclatura Automatizada:** Sugestão de descrição baseada em categorias pré-definidas para acelerar o processo de entrada.

### Navegação Temporal Avançada
- **Interface Centrada:** Seletor de meses e anos em modal centralizado para foco total.
- **Navegação de Gestos:** Suporte completo a eventos de toque (swipe) para alternância de anos.
- **Mapeamento de Dados:** Indicadores visuais que destacam meses com atividade financeira existente.

## Experiência Mobile (PWA)
- **Instalação Nativa:** Disponível para adição à tela inicial como aplicação independente.
- **Otimização de Carregamento:** Splash screen configurada em fundo escuro para eliminar flashes de brilho durante o boot inicial.
- **Recursos Offline:** Persistência de sessão e cache global de dados para carregamento instantâneo.

## Especificações Técnicas

- **Core:** React 19, Vite
- **Estilização:** Tailwind CSS v4
- **Persistência e Autenticação:** Supabase (Auth, PostgreSQL, Realtime)
- **Interface de Ícones:** Lucide React
- **Arquitetura:** Gerenciamento de estado global via Context API para otimização de cache.

## Procedimentos de Instalação

1. **Clonagem do Repositório:**
   ```bash
   git clone https://github.com/usuario/fluxo-app.git
   cd fluxo-app
   ```

2. **Instalação de Dependências:**
   ```bash
   npm install
   ```

3. **Configuração de Ambiente:**
   Configure as credenciais do Supabase no arquivo `.env`:
   ```env
   VITE_SUPABASE_URL=SUA_URL
   VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
   ```

4. **Execução em Desenvolvimento:**
   ```bash
   npm run dev
   ```

---
Desenvolvido com foco em engenharia de software e experiência do usuário.
