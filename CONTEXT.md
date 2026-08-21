# Recall

Recall é o contexto de estudo por repetição espaçada: o Aprendiz organiza Notes em Decks, introduz Cards novos e os revisa em Sessões até o conteúdo voltar no Vencimento certo.

## Pessoas

**Aprendiz**:
A pessoa que possui Decks, cria Notes e atribui Ratings em Reviews.
_Avoid_: usuário, user, aluno, student

## Organização

**Deck**:
Um agrupamento nomeado de Notes que pertence a um Aprendiz e carrega o par de idiomas padrão do MVP.
_Avoid_: biblioteca, pasta, folder, coleção, baralho

## Conteúdo

**Note**:
O conhecimento persistido (no MVP, um payload de par de idiomas). Não guarda agendamento.
_Avoid_: cartão (para este registro), flashcard, card (para este registro)

**Card**:
Uma unidade de estudo gerada a partir de uma Note, com SchedulingState próprio.
_Avoid_: note, nota (para esta unidade)

**Frente**:
O lado mostrado primeiro na Review; o prompt que o Aprendiz tenta lembrar.
_Avoid_: pergunta, question, front copy

**Verso**:
O lado oculto até o Aprendiz tentar lembrar; o conteúdo esperado da memória.
_Avoid_: resposta, answer, back copy

## Gestos

**Estudar**:
O gesto que abre uma Sessão só com Cards já devidos.
_Avoid_: praticar, quiz, revisar novos

**Novos**:
O gesto que introduz Cards ainda nunca avaliados, em lotes, fora de uma Sessão.
_Avoid_: sessão de novos, study session (para este gesto)

**Sessão**:
Uma fila fotografada de Cards devidos, com ciclo de vida próprio (ativa, pausada, concluída, abandonada).
_Avoid_: fila global, quiz, review session (como sinônimo de Novos)

## Estudo

**Review**:
Um encontro do Aprendiz com um Card: Frente, tentativa, Verso, Rating. Gera ReviewLog e atualiza SchedulingState.
_Avoid_: tentativa, quiz, practice

**Rating**:
O julgamento da Review, em exatamente um de quatro valores: Again, Hard, Good, Easy.
_Avoid_: Nota, dificuldade, sabe/não sabe, Fácil/Médio/Difícil (tríade antiga)

**Again**:
Recall falhou; o Card deve voltar em breve (na Sessão atual, se a Review foi em Estudar).

**Hard**:
Recall muito custoso; intervalo curto.

**Good**:
Recall com esforço aceitável; intervalo padrão do algoritmo.

**Easy**:
Recall confortável; intervalo mais longo.

**Vencimento**:
O instante (`dueAt`) a partir do qual o Card volta a ser elegível para Estudar.
_Avoid_: prazo, deadline, due date

**Devido**:
Card com Vencimento já alcançado no relógio do Aprendiz (`dueAt <= agora`).

**Atrasado**:
Devido cujo Vencimento caiu em um dia civil anterior ao de hoje, no timezone do Aprendiz.

**SchedulingState**:
O estado atual da memória daquele Card (new, learning, review, relearning, intervalos, algoritmo).

**ReviewLog**:
Evento imutável de uma Review; sobrevive a edição de texto e a exclusão da UI de estudo.
