# Recall — PRD (MVP)

Contrato de produto para quem implementa o MVP. Nomes: `CONTEXT.md`. Em conflito de **comportamento**, este arquivo vence; em conflito de **nome**, `CONTEXT.md` vence.

**Done:** cada item da lista MVP ao final é verdadeiro no sistema, com ownership no backend e testes de domínio no engine e no planner.

Idioma no MVP; outras matérias depois via `Note.type` + payload. Tradução é modo de criação, não coluna universal.

Promessa visível: criar com tradução; **Estudar** decide a fila de devidos.

---

## Fronteiras

Dois componentes de domínio, um job cada:

- **Engine** — dado SchedulingState + Rating + contexto, devolve o próximo SchedulingState (`dueAt`, intervalo, ease, estado).
- **Planner** — dado um Aprendiz, um Deck e um N, devolve a fotografia da Sessão (só devidos).

A autoridade de agendamento, Sessão e ownership é o backend. O cliente mostra Frente/Verso e envia Rating.

Conta individual: toda entidade resolve para o Aprendiz autenticado. O `id` do cliente nunca autentica sozinho.

---

## Modelo

`Aprendiz → Deck → Note → Card → SchedulingState`

`Aprendiz → Sessão → SessionCard → Card`

`ReviewLog` aponta para Aprendiz, Card e, se a Review foi em Estudar, Sessão.

Campos mínimos (conceituais):

| Entidade | Guarda |
| --- | --- |
| Deck | nome, par de idiomas padrão |
| Note | `type`, payload (`languagePair` no MVP), Deck |
| Card | Note, tipo de direção (ida / volta), sem lógica de intervalo |
| SchedulingState | estado, `dueAt`, intervalo, ease, lapses, `algorithm` + versão |
| Sessão | Deck, N alvo, status, `startedAt` / `endedAt`, tempo ativo |
| SessionCard | posição, status, instantes de apresentação |
| ReviewLog | Rating, tempos, snapshot before/after do SchedulingState |

Note de idioma: payload com origem/alvo. Tipos futuros (`qa`, …) não reutilizam colunas de idioma.

Uma Note gera os Cards que o Aprendiz marcou na criação. Default: só **ida** (nativo → idioma do Deck). Volta é opt-in. Cada Card tem SchedulingState próprio. Ida + volta = **2** da cota de Novos.

---

## Estudar

Uma Sessão por vez na conta. Um Deck por Sessão. `GET` da Sessão ativa no singular.

Default: **N = 20**, teto de minutos **desligado**. O Aprendiz pode ligar o teto. A fila para no primeiro limite: N apresentações **ou** minutos de **tempo ativo**. Pausa para o relógio do teto. Se o teto estoura no meio de um Card, a Review daquele Card **completa**.

Status: `active` | `paused` | `completed` | `abandoned`. 12h sem Review em `active`/`paused` ⇒ `abandoned`. Pendentes da fotografia não geram ReviewLog nem mudam SchedulingState.

Again nesta Sessão **reinsere** o Card na fila (fim ou após o gap de learning). Cada apresentação é ReviewLog e conta no N. Again **não** conta na cota diária de Novos.

Sem gesto de pular. Encerrar ou abandonar são os saídas.

Fila = **fotografia** no `POST` da Sessão. Cards introduzidos em Novos durante a Sessão **não** entram nessa fotografia.

Planner (**due-first**):

1. Atrasados, `dueAt` crescente, empate por id estável
2. Devidos de hoje (mesmo critério)
3. Learning devidos (mesmo critério)

Novos **não** completam a Sessão. N é teto: 4 devidos ⇒ Sessão de 4.

Estudar com zero devidos: empty **“Nada a revisar”** e CTA para Novos. Estudar não redireciona para Novos.

Algoritmo v1: **SM-2**, campo `algorithm` + versão. FSRS entra depois no mesmo SchedulingState. Engine plugável; uma implementação no MVP.

---

## Novos

Não é Sessão: outra rota, sem `StudySession`, sem pause/abandon de 12h, sem `GET .../active`.

O ato é Review: Frente, Verso, Rating, ReviewLog, Engine. Depois do primeiro Rating o Card deixa `new` e só volta por **Estudar**, quando Devido.

Teto: **30** primeiros Ratings da vida do Card **por dia civil do Aprendiz, por Deck**. Lote = **20% do teto = 6**; se restam menos de 6 no dia, o lote é o resto. Cards só vistos (ainda sem Rating) não gastam cota.

Estudar ativo **não** bloqueia Novos (mesmo Deck ou outro). Independentes. A fotografia da Sessão permanece intacta.

Fechar no meio do lote: avaliados ficam agendados; o próximo lote completa de novo até 6 (ou o resto do dia).

---

## Conteúdo e tradução

Par de idiomas no Deck; a Note herda e pode sobrescrever. Detecção de idioma do provider é ajuda, não autoridade.

Fluxo: texto → traduzir → aceitar / editar / cancelar → persistir Note → gerar Cards.

Provider atrás de `TranslationProvider`. Escolha por configuração. Sem LLM no MVP para o que uma API de tradução resolve.

Editar texto da Note depois de Reviews: o texto muda; SchedulingState e ReviewLogs **permanecem**.

Remover da UI de estudo: soft delete / arquivo. ReviewLogs permanecem. Cards somem do Planner e de Novos.

---

## Tempo e calendário

Timezone do Aprendiz define “hoje” (Atrasado vs Devido de hoje) e o dia civil da cota de Novos.

Tempo ativo ≠ tempo de parede da Sessão. Fonte de verdade: instantes no backend, não elapsed enviado pelo cliente.

---

## API (forma)

Adaptável à stack; o contrato de produto acima manda.

- Decks: CRUD
- Notes: criar/listar no Deck (tradução: `POST /translations`)
- Estudar: `POST /study/sessions` `{ deckId, targetCards, timeCapMinutes? }` → planner → SessionCards
- `GET /study/sessions/active`
- `POST .../reviews` `{ cardId, rating, ... }` — Engine + ReviewLog + SessionCard; Again pode reinserir
- pause / resume / finish / abandon
- Novos: rotas **fora** de `/study/sessions` (lote do Deck, restante da cota). Review de Card `new` atualiza SchedulingState sem SessionCard de Sessão de Estudar

Índices quando as queries existirem: `(aprendizId, dueAt)`, `(deckId, dueAt)`, `(sessionId, position)`, `(cardId, reviewedAt)`.

---

## MVP

**In**

- Auth, ownership em toda leitura/escrita
- Deck CRUD + par de idiomas
- Note `languagePair` + tradução + edição antes de salvar + edição posterior de texto
- Cards ida (default) e volta (opt-in)
- SchedulingState + SM-2 + ratings Again/Hard/Good/Easy
- Estudar: fotografia, due-first, N=20, teto de tempo opcional, pause, finish, abandon, retomar, Again na fila, auto-abandon 12h
- Novos: lote 6 / teto 30 dia/Deck, paralelo a Estudar, sem Sessão
- ReviewLog imutável; histórico por Card e por Sessão
- Timer de Sessão alinhado a tempo ativo

**Out** (a forma do modelo não impede; o MVP não os constrói)

- IA gerando exercícios, speaking, pronúncia, gamificação, social, share/marketplace de Decks
- Scoring “hard/at-risk” como fila paralela; FSRS; vários algoritmos ao mesmo tempo
- Árvore de Decks, Estudar vários Decks numa Sessão, tenant de escola
- Estatísticas além de agregações sobre ReviewLog

---

## Implementação

1. Regras de domínio (Engine, Planner, cota de Novos, ownership) testáveis sem HTTP.
2. UI consome resultados; Rating viaja para o backend; Engine responde o próximo estado.
3. Cada Review efetiva ⇒ um ReviewLog. Card só na fotografia ≠ revisado.
4. `algorithm` versionado no SchedulingState.
5. Provider de tradução e algoritmo atrás de interfaces; o domínio fala com as interfaces.

Fase seguinte (depois do MVP): FSRS no mesmo estado; Note types além de idioma; Estudar multi-Deck; scoring só como desempate **entre devidos**.
