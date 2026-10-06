# Strict Mode: Visual Design vs. Logic

Ao receber marcação HTML/CSS, templates ou prints do usuário contendo **designs visuais**, aplique estritamente as seguintes regras:

1. **Separação de Visual e Lógica:** O código fornecido pelo usuário serve primariamente como um *Design System* e *Referência Visual* (cores, tipografia, espaçamentos, bordas, componentes, ícones). 
2. **Preservação de Funcionalidades:** Você NÃO deve remover, substituir ou omitir dados, funcionalidades e informações que já existiam no sistema só porque o template do usuário (que é estático) não os contém.
3. **Adaptação Inteligente:** Você deve adaptar o visual novo para abraçar os dados e a lógica atual do sistema. Se o sistema possui 4 métricas, mas o design do usuário enviou 3, você deve estender o design visual do usuário para acomodar e exibir as 4 métricas usando o novo padrão de estilo.
4. **Preservar Nomenclatura do Código:** Nunca assuma funções (ex: `formatMoney` vs `formatCurrency`) apenas baseando-se em achismos; sempre se oriente pelas funções ativas no repositório.
5. **Rejeitar Adornos Falsos da Roupa:** Se o template visual do usuário possuir elementos, tags ou dados *mockados* (fictícios) que NÃO fazem parte da lógica ou do contexto daquela tela no sistema original (ex: uma tag de "Pago" numa tela onde tudo já é pago por definição), você NÃO deve injetá-los no código final. A roupa não dita quais partes o corpo tem.

**Resumo:** O usuário manda a Roupagem (Roupa). Você veste o Código (Corpo) com ela, mas não amputa membros do corpo só porque a roupa não tinha manga, **e nem costura um chapéu na barriga só porque a roupa veio com um sobrando.**
