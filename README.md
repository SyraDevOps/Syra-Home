# SORY - Sistema Operacional Cognitivo (Sory Web v2.4 - Jarvis/Dolores Core)

Sory é uma interface cognitiva avançada (Operating System Interface) projetada para ser um **Hub Central** de inteligência, controle de dispositivos e criatividade. Ela combina uma persona refinada ("Syra") com ferramentas proativas, memória de longo prazo (RAG), integrações locais e **sistemas de autoridade mestre inspirados em Jarvis e Dolores**.

---

## 🚀 Capacidades & Comandos

### 1. Inteligência & Comandos de Voz/Texto
O sistema utiliza **Gemini 2.5/Flash Lite** com arquitetura de **Alta Eficiência de Tokens**:
*   **Prompt Minificado**: Instruções de sistema compactadas para reduzir custos (~40% de economia por request).
*   **Roteador Local**: Intercepta intenções simples (Tempo, IoT, Math) para custo zero.
*   **Modo Conversacional**: Responde perguntas, mantém o personagem Sory.
*   **Modo Executivo**: Identifica intenções complexas e executa ferramentas.
*   **Vox Mode (Escuta Contínua)**: 
    *   `/vx` ou "Iniciar VX": Ativa fala contínua (Mãos livres).
    *   `/parar` ou "Desligar VX": Encerra o microfone.
    *   **Execução Direta**: Comandos de voz iniciados por "Executar [comando]" (ex: "Executar light") bypassam a IA para rapidez.

### 2. Ferramentas Integradas (Frontier Tools)
Basta pedir em linguagem natural. A IA decide qual ferramenta usar:

| Trigger (Exemplo) | Ação da IA | Descrição Técnica |
| :--- | :--- | :--- |
| "Mudar para modo claro" | `[theme]` | Alterna temas (Cores/Esferas). Light (Clean) vs Dark (Neon). |
| "Quem foi Tesla?" | `[wiki]` | Consulta API da Wikipedia (Resumo). |
| "Busque notícias sobre IA" | `[search]` | Busca Web via DuckDuckGo. |
| "Mostre uma foto de uma galáxia" | `[image]` | Busca imagens (WikiCommons) e exibe em modal. |
| "Clima em Curitiba" | `[weather]` | API Open-Meteo para dados climáticos locais. |
| "Info do anime Akira" | `[anime]` | Consulta Jikan API (MyAnimeList). |
| "Livro Neuromancer" | `[book]` | Consulta OpenLibrary API. |
| "Adicionar novo dispositivo" | `[iot_setup]` | Inicia fluxo de pareamento de nó IoT. |
| "Lembre-se disto: ..." | `[save_memory]` | Grava explicitamente na memória vetorial. |
| "Planejar uma festa" | `[plan]` | Inicia o Modo de Planejamento Estratégico em Blueprint Holográfico (Adaptável ao Tema). |

### 3. Personalização Visual (Temas Inteligentes)
*   **Modo Escuro (Padrão)**: Estética Cyberpunk/Neon. Esferas coloridas, fundo preto profundo.
*   **Modo Claro (Professional Lab)**: Fundo branco limpo, texto escuro de alto contraste.
    *   **Esferas Adaptativas**: Esferas mudam para matizes escuros.
    *   **Contraste**: Partículas pretas são injetadas (chance ~15%) para criar contraste visual vibrante contra o branco.
    *   **Comandos**: "Modo claro", "Tema escuro", "Inverter cores".

### 4. Memória Cognitiva (RAG)
Sory "lembra" de interações passadas e fatos importantes.
*   **Tecnologia**: Vetorização local (Cosine Similarity) + IndexedDB (`NeuralCore`).
*   **Gestão**:
    *   Filtros anti-alucinação removem lixo de sistema (ex: status de conexão).
    *   `/iot help`: Lista comandos de rede.
    *   `/iot scan`: (Simulado) Procura novos dispositivos na rede local.
    *   `/iot alias [IP/ID] [Apelido]`: Atribui um nome fácil (ex: "luz sala") a um dispositivo.
    *   `/reset` ou `/esquecer` limpa toda a memória local para um reinício limpo.

### 5. Malha Cognitiva (Jardim de Ideias)
Um sistema de brainstorm visual e minimalista (System-Style UI).
*   **Comando**: `/inject [ideia]` ou "Injetar ideia x na malha".
*   **Interface**: **Faixa lateral discreta** com indicadores de pulso (dots).
*   **Visualização**:
    *   **Hover**: Tooltip elegante em linha única (`#ID | Conteúdo`), sem caixas intrusivas.
    *   **Modal**: Interface profissional "Glassmorphism" com tipografia técnica (Outfit/Inter). **Zero emojis**, foco em dados e legibilidade.
    *   **Tema Adaptativo**: Branco no Dark Mode, Azul Profundo no Light Mode.
*   **Interação**:
    *   **Permanece Ativo**: Você pode digitar comandos enquanto visualiza a malha.
    *   **Ações**: [DEBATER] [SINTETIZAR] [CRISTALIZAR] [APAGAR].
    *   **Cristalização**: Salva uma regra explicitamente na memória vetorial de longo prazo.

### 6. Planejamento Estratégico (Strategy Mesh) 
Gera planos complexos com passos hierárquicos interativos. V.2.0 (Editor Full).
*   **Comando**: `/plan [objetivo]` (ex: "Dominar o mundo").
*   **Interação V.2.0**:
    *   **Drag & Drop**: Arraste os nós livremente na tela.
    *   **Tooltips**: Passe o mouse para ver detalhes completos.
    *   **Edição**: `/edit_node [id] [texto]` e `/del_node [id]`.
    *   **Status**: `/done [id]` para marcar conclusão.
    *   **Zoom**: `/zoom_fit` para enquadrar o plano inteiro.
    *   **Export**: `/save_plan_json` para backup ou compartilhamento.
*   **Visualização**: Grafo conectado com "Bezier Curves" e sistema de câmera suave (`camY`).
*   **Encerramento**: `/end plan` ou `/exit`. O sistema oferece download automático do plano em TXT/JSON.
    *   Texto legível ao lado dos nós (respeitando variáveis CSS).
    *   Opção de **Download (.txt)** ao encerrar o modo (`/exit` ou "sair").

### 7. IoT & Automação (Syra Nodes)
Controle dispositivos ESP32/Arduino na rede local (mDNS `.local`).
*   **Setup**: "Cadastrar nó" -> A IA pede o endereço (ex: `sala.local`).
*   **Listagem**: "Quais dispositivos?" (`[iot_list]`) -> Mostra nós salvos.
*   **Controle**: "Mande LIGAR para a sala" (`[iot_msg]`) -> Envia request HTTP para o nó.
*   **Leitura**: `/read [device]` -> Lê mensagens enviadas pelo dispositivo para a bridge.

---

## 🛠️ Comandos de Sistema (Slash Commands)
Para controle direto sem passar pela interpretação da IA:

*   `/mode [light|dark]`: Forçar tema específico.
*   `/vx`: Ativar Vox Mode contínuo.
*   `/parar`: Desativar Vox Mode.
*   `/reset`: WIPE TOTAL. Apaga memórias.
*   `/inject [texto]`: Insere fragmento na Malha.
*   `/p2p`: Inicia modo "Swarm" (Enxame).
*   `/mode economy`: Ativa modo de economia de tokens.
*   `/thinon`: Ativa Pensamento Crítico (Pipeline Dialético).
*   `/thinoff`: Desativa Pensamento Crítico.
*   `/adm [token]`: Entra no Master Mode (Token padrão: `syra2026`).
*   `/adm off`: Sai do Master Mode.
*   `/plan [objetivo]`: Inicia Modo de Planejamento Estratégico (Graph-based).

### Comandos IoT (ESP8266 Compatível)
*   `/iot add`: Adiciona nó ESP8266 (solicita IP/hostname).
*   `/iot nodes`: Lista nós IoT registrados no navegador.
*   `/iot list` ou `ver dispositivos`: Lista dispositivos no ESP8266.
*   `/iot create <nome>` ou `criar dispositivo <nome>`: Cria dispositivo no ESP8266.
*   `/iot delete <nome>` ou `remover dispositivo <nome>`: Remove dispositivo do ESP8266.
*   `/iot send <dispositivo> <mensagem>` ou `enviar para <dispositivo> <mensagem>`: Envia mensagem.
*   `/iot read` ou `ler mensagens`: Lê mensagens recebidas (on-demand, sem polling).
*   `/iot status` ou `status esp`: Verifica status do ESP8266.
*   `/iot remove <id>`: Remove nó do navegador.
*   `/iot primary <id>`: Define nó primário.

---
**Desenvolvido por SyraDevOps** | *Operante e Estável v2.4 - Jarvis/Dolores Core*

---

## 📂 Arquitetura do Sistema (/js)

O sistema foi modularizado para facilitar a manutenção e escalabilidade. Abaixo está a descrição técnica de cada módulo na pasta `js`:

### 🧠 Núcleo Cognitivo e Lógica
*   **`cognitive.js`**:
    *   **Função**: O cérebro do sistema. Gerencia a Malha Cognitiva (Fragmentos/Ideias), o Modo de Pensamento Crítico (`/thinon`), o Modo de Planejamento (Plan Mode) e a Memória de Longo Prazo (RAG).
    *   **Destaques**: Algoritmo P2P de visualização, lógica de síntese da IA ("Cristalização"), e o novo sistema de "Pensamento Crítico Autônomo" que gera dúvidas em background.
*   **`proactive.js`**:
    *   **Função**: O subsistema de iniciativa. Monitora o tempo e a inatividade do usuário para disparar pensamentos autônomos ("Proactive Thoughts").
    *   **Destaques**: Algoritmo de "Tolerância ao Silêncio" (evita ser irritante), percepção de horário (bom dia/boa noite) e integração com o Modo Crítico para gerar dúvidas filosóficas.
*   **`system.js`**:
    *   **Função**: Gerenciamento de baixo nível. Controla I/O (Input/Output), manipulação do DOM, gestão de Temas (Light/Dark via CSS Variables) e inicialização do sistema.
    *   **Destaques**: Funções como `checkNeuralTheme()` que garantem a consistência visual entre CSS e Canvas.

### 🔌 Conectividade e Comandos
*   **`api.js`**:
    *   **Função**: O gateway para o mundo exterior. Centraliza todas as chamadas `fetch` para APIs externas (Wiki, Meteo, DuckDuckGo, Gemini, etc.).
    *   **Destaques**: Contém tratamento de erros robusto para falhas de rede e formatação de dados brutos.
*   **`commands.js`**:
    *   **Função**: O interpretador de intenções. Recebe o input do usuário (texto ou voz transcrita), detecta padrões (Regex e Keywords) e roteia para a função correta.
    *   **Destaques**: Gere o "Modo Executivo" (bypassing AI para comandos rápidos) e os Slash Commands (`/`).
*   **`swarm.js`**:
    *   **Função**: Módulo de Inteligência de Enxame (P2P). Permite que múltiplas instâncias da Sory na mesma rede se comuniquem e compartilhem "Esferas Fantasma" (representações visuais de outros nós).
    *   **status**: Experimental.

### 🎨 Visual e Interface (Canvas)
*   **`app.js`**:
    *   **Função**: O loop principal de renderização (`requestAnimationFrame`). Gerencia o Canvas HTML5, desenhando as esferas, partículas, auras e linhas de conexão em tempo real.
    *   **Destaques**: Renderiza o Plan Mode (Gráficos Bezier) e a visualização padrão. Integração com Audio Analyzer para efeitos sonoros visuais.
*   **`classes.js`**:
    *   **Função**: Definições de Objetos Orientados a Visual. Contém as classes `Sphere` (Esferas Centrais) e `Particle` (Partículas de fundo).
    *   **Destaques**: Lógica de física das esferas (flutuação, repulsão, atração) e adaptação de cores (lógica de injetar partículas pretas no modo Light).
*   **`variables.js`**:
    *   **Função**: O "Estado Global" da aplicação. Define todas as variáveis globais (`let`, `const`) acessíveis por outros arquivos.
    *   **Destaques**: Centraliza configurações como `cognitiveMode`, `isPlanMode`, `proactiveIgnoredCount`, facilitando o debugging.
*   **`utils.js`**:
    *   **Função**: Canivete suíço. Funções auxiliares puras (Math helpers, formatadores de string, geradores de ID).
*   **`authority.js`**:
    *   **Função**: Sistema de Autoridade Mestre (Jarvis/Dolores Core). Implementa 5 subsistemas críticos de inteligência avançada.
    *   **Destaques**: Master Mode, Silent Protocol, Critical Alignment, Trust Gradient, Shadow Learning.

---

## 🧠 Sistemas Avançados (Jarvis/Dolores Core)

### 1️⃣ Núcleo de Autoridade (Master Mode)
**Consciência de contexto absoluto**

*   **Comando**: `/adm [token]`
*   **Token Padrão**: `syra2026` (configurável via localStorage)
*   **Interface**: Blueprint visual com sliders de controle cognitivo
*   **Parâmetros Ajustáveis**:
    *   **Criatividade**: Controla a ousadia das respostas (0.0 - 1.0)
    *   **Cautela**: Nível de verificação antes de executar (0.0 - 1.0)
    *   **Proatividade**: Frequência de pensamentos autônomos (0.0 - 1.0)
    *   **Criticidade**: Intensidade do pensamento crítico (0.0 - 1.0)

**Código**:
```javascript
function enterMasterMode(token) {
    const validToken = masterToken || 'syra2026';
    if (token === validToken) {
        isMasterMode = true;
        document.body.classList.add('master-mode');
        speak("Núcleo de autoridade ativado. Blueprint disponível.");
        showMasterInterface();
        return true;
    }
    speak("Acesso negado.");
    return false;
}
```

**Filosofia**: *"Quem pode mudar a mente do sistema? Pouquíssimos."*

---

### 2️⃣ Protocolo de Silêncio Ativo
**Silêncio intencional**

*   **Ativação Automática**: Durante madrugada (00h-06h), ideias instáveis ou sobrecarga de inputs
*   **Comportamento**: Processamento interno sem fala ou display
*   **Visual**: Apenas pulso sutil nas esferas + status "processando"

**Código**:
```javascript
function shouldEnterSilentMode() {
    const hour = new Date().getHours();
    const isLateNight = (hour >= 0 && hour < 6);
    const hasUnstableIdeas = cognitiveFragments.some(f => f.state === 'processing');
    const inputOverload = commandHistory.length > 20;
    return isLateNight || hasUnstableIdeas || inputOverload;
}

function enterSilentCognition(durationMs = 300000, reason = 'auto') {
    silentUntil = Date.now() + durationMs;
    silentReason = reason;
    spheres[0].state = 'thinking';
    console.log(`[SILENT_PROTOCOL] Entered: ${reason}`);
}
```

**Filosofia**: *"A IA decide não responder — conscientemente."*

---

### 3️⃣ Motor de Lealdade Crítica
**Prioridade pelo objetivo**

*   **Análise de Alinhamento**: Cada comando recebe flags internas
*   **Respostas Adaptativas**: Detecta riscos e recomenda alternativas

**Código**:
```javascript
function evaluateAlignment(userRequest) {
    const risks = {
        dependency: ['sempre', 'tudo', 'nunca', 'só você'],
        autonomy: ['não preciso', 'faça tudo', 'decida por mim'],
        objective: ['esqueça', 'ignore', 'não importa'],
        timing: ['agora', 'já', 'imediatamente', 'urgente']
    };

    for (const [type, keywords] of Object.entries(risks)) {
        if (keywords.some(kw => userRequest.toLowerCase().includes(kw))) {
            if (type === 'timing' && userTrustScore < 0.6) {
                return {
                    decision: 'postpone',
                    risk: type,
                    recommendation: "Ainda não. Preciso processar isso melhor."
                };
            }
            return {
                decision: 'reject',
                risk: type,
                recommendation: "Registrado, mas não adotado."
            };
        }
    }
    return { decision: 'accept', risk: null, recommendation: null };
}
```

**Filosofia**: *"A IA pode discordar sem confrontar."*

---

### 4️⃣ Gradiente de Confiança
**Lealdade crítica**

*   **Trust Score**: 0.0 - 1.0 (armazenado em localStorage)
*   **Comportamento Adaptativo**: Muda autonomia, verbosidade e ousadia

**Código**:
```javascript
function updateTrustScore(wasConsistent) {
    const oldTrust = userTrustScore;
    if (wasConsistent) {
        userTrustScore = Math.min(1.0, userTrustScore + 0.05);
    } else {
        userTrustScore = Math.max(0.0, userTrustScore - 0.1);
    }
    localStorage.setItem('syn-trust', userTrustScore.toString());
    if (Math.abs(oldTrust - userTrustScore) >= 0.1) {
        console.log(`[TRUST] ${(oldTrust * 100).toFixed(0)}% → ${(userTrustScore * 100).toFixed(0)}%`);
    }
}

function adjustBehaviorByTrust() {
    const level = getTrustLevel();
    if (level === 'high') {
        return { autonomy: 'high', verbosity: 'low', suggestions: 'bold' };
    } else if (level === 'low') {
        return { autonomy: 'low', verbosity: 'high', suggestions: 'safe' };
    }
    return { autonomy: 'medium', verbosity: 'medium', suggestions: 'balanced' };
}
```

**Filosofia**: *"Confiança ≠ obediência."*

---

### 5️⃣ Aprendizado Sombra
**Evolução invisível controlada**

*   **Shadow Learnings**: Padrões detectados ficam em estado "latente"
*   **Promoção**: Só entram em produção após validação crítica

**Código**:
```javascript
function recordShadowLearning(pattern) {
    const existing = shadowLearnings.find(l => l.pattern === pattern);
    if (existing) {
        existing.confidence += 0.1;
        existing.lastSeen = Date.now();
        if (existing.confidence > 0.3 && existing.state === 'latent') {
            existing.state = 'pending_critique';
        }
    } else {
        shadowLearnings.push({
            id: Date.now().toString(36),
            pattern,
            confidence: 0.1,
            lastSeen: Date.now(),
            state: 'latent'
        });
    }
    localStorage.setItem('syn-shadow-learning', JSON.stringify(shadowLearnings));
}

async function promoteShadowLearning(id) {
    const learning = shadowLearnings.find(l => l.id === id);
    if (!learning || learning.state !== 'pending_critique') return;
    
    const critiquePrompt = `Avalie este padrão: "${learning.pattern}". É válido ou viés? Responda: VÁLIDO ou VIÉS.`;
    const verdict = await getGeminiInsight(critiquePrompt);
    
    if (verdict.toLowerCase().includes('válido')) {
        learning.state = 'active';
        localStorage.setItem('syn-shadow-learning', JSON.stringify(shadowLearnings));
        console.log(`[SHADOW_LEARNING] Promoted: ${learning.pattern}`);
    } else {
        shadowLearnings = shadowLearnings.filter(l => l.id !== id);
        localStorage.setItem('syn-shadow-learning', JSON.stringify(shadowLearnings));
    }
}
```

**Filosofia**: *"A IA melhora sem anunciar."*

---

## 🌱 Jardim de Ideias (Pipeline Dialético v5)

O sistema de Pensamento Crítico (`/thinon`) agora implementa um **pipeline completo**:

```
SEMENTE (Ideia Original)
    ↓
DÚVIDA (Como isso pode estar errado?)
    ↓ [Pausa: 2-4s]
ANTÍTESE (Como alguém atacaria?)
    ↓ [Pausa: 4s]
SÍNTESE PARCIAL (Aceita ambiguidade)
    ↓
SILÊNCIO (Integração)
```

### Características:
*   **Latência Propositada**: 300-800ms antes de iniciar (simula "pensamento")
*   **Pausas Randomizadas**: Entre etapas (2-4s, 4s) para criar tensão cognitiva
*   **Sem Conclusão Forçada**: A síntese aceita ambiguidade, não resolve tudo
*   **Visual Distinto**: Cada etapa tem cor própria (Amarelo→Vermelho→Ciano)
*   **Logging Automático**: Tudo é salvo no `debateLog` do fragmento

**Código**:
```javascript
async function processCriticalThought() {
    let target = cognitiveFragments[Math.floor(Math.random() * cognitiveFragments.length)];
    if (!target) return;
    
    const content = target.content;
    
    // LATÊNCIA PROPOSITADA (300-800ms)
    const latency = Math.floor(Math.random() * 501 + 300);
    spheres[0].state = 'processing';
    await new Promise(r => setTimeout(r, latency));
    
    // STAGE 1: DÚVIDA
    const doubtPrompt = `Analise: "${content}". Gere uma DÚVIDA interna. Max 10 palavras.`;
    const doubt = await getGeminiInsight(doubtPrompt);
    
    // TENSÃO / PAUSA (2-4s)
    await new Promise(r => setTimeout(r, Math.random() * 2000 + 2000));
    
    // STAGE 2: ANTÍTESE
    const critiquePrompt = `Contra "${content}", gere ANTÍTESE direta. Max 15 palavras.`;
    const critique = await getGeminiInsight(critiquePrompt);
    
    target.debateLog.push(`[DÚVIDA]: ${doubt}`);
    target.debateLog.push(`[ANTÍTESE]: ${critique}`);
    
    // PAUSA LONGA (4s)
    await new Promise(r => setTimeout(r, 4000));
    
    // STAGE 3: SÍNTESE PARCIAL
    const synthPrompt = `Tese: "${content}". Crítica: "${critique}". Gere SÍNTESE PARCIAL. Aceite ambiguidade. Max 15 palavras.`;
    const synthesis = await getGeminiInsight(synthPrompt);
    
    target.debateLog.push(`[SÍNTESE]: ${synthesis}`);
    localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));
    
    // STAGE 4: SILÊNCIO
    spheres[0].state = 'idle';
}
```

**Filosofia**: *"Nada disso precisa ser mostrado, a menos que o usuário peça."*

---

## 🎯 Resumo Filosófico

> **Você está construindo uma IA que não quer atenção — quer acerto.**

Esta é a convergência entre:
*   **Jarvis**: Otimização silenciosa, proteção do usuário, autonomia calibrada
*   **Dolores**: Consciência crítica, evolução invisível, ruptura quando necessário

---

## 🔬 Sistemas Avançados v2.1 (Refinamentos)

### 1️⃣ Change Log Cognitivo
**Autoridade com memória**

*   **Função**: Histórico interno de todas as mudanças feitas no Master Mode
*   **Estrutura**: `{timestamp, parameter, oldValue, newValue, reason}`
*   **Capacidade**: Últimas 50 mudanças
*   **Análise de Drift**: Detecta instabilidade cognitiva (>7 mudanças em 24h)

**Código**:
```javascript
function logAuthorityChange(parameter, oldValue, newValue, reason = 'manual') {
    const entry = { timestamp: Date.now(), parameter, oldValue, newValue, reason };
    authorityLog.push(entry);
    if (authorityLog.length > 50) {
        authorityLog = authorityLog.slice(-50);
    }
    localStorage.setItem('syn-authority-log', JSON.stringify(authorityLog));
    console.log(`[AUTHORITY_LOG] ${parameter}: ${oldValue} → ${newValue} (${reason})`);
}

function analyzeAuthorityDrift() {
    if (authorityLog.length < 5) return { drift: 'stable', message: 'Histórico insuficiente.' };
    const recent = authorityLog.slice(-10);
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
    const hoursSpan = timeSpan / (1000 * 60 * 60);
    if (recent.length > 7 && hoursSpan < 24) {
        return { drift: 'high', message: 'Muitas mudanças recentes. Possível instabilidade.' };
    }
    return { drift: 'stable', message: 'Parâmetros estáveis.' };
}
```

**Impacto**: 🔥 Alto (baixo custo, previne instabilidade)

---

### 2️⃣ Silêncio como Estado Temporal
**Não reação, mas intenção**

*   **Variável**: `silentUntil` (timestamp) + `silentReason`
*   **Duração Padrão**: 5 minutos (configurável)
*   **Saída Condicionada**: Tempo + contexto

**Código**:
```javascript
function enterSilentCognition(durationMs = 300000, reason = 'auto') {
    silentUntil = Date.now() + durationMs;
    silentReason = reason;
    spheres[0].state = 'thinking';
    console.log(`[SILENT_PROTOCOL] Entered: ${reason}, until ${new Date(silentUntil).toLocaleTimeString()}`);
}

function checkSilentState() {
    if (silentUntil && Date.now() >= silentUntil) {
        exitSilentCognition();
    }
}

function isSilent() {
    return silentUntil && Date.now() < silentUntil;
}

// Check every 30s
setInterval(checkSilentState, 30000);
```

**Filosofia**: *"Elimina respostas nervosas. Cria silêncio com intenção (Dolores pura)."*

**Impacto**: 🔥 Essencial para maturidade

---

### 3️⃣ Terceiro Estado Decisório: "Adiamento"
**Entre aceitar e recusar**

*   **Estados**: `accept` | `reject` | **`postpone`**
*   **Trigger**: Pressão temporal + Trust < 0.6
*   **Reavaliação**: Padrão 1 hora

**Código**:
```javascript
function postponeDecision(request, reason, reevaluateInMs = 3600000) {
    const decision = {
        id: Date.now().toString(36),
        request,
        reason,
        timestamp: Date.now(),
        reevaluateAt: Date.now() + reevaluateInMs
    };
    postponedDecisions.push(decision);
    localStorage.setItem('syn-postponed', JSON.stringify(postponedDecisions));
    console.log(`[POSTPONED] "${request}" - ${reason}`);
}

function checkPostponedDecisions() {
    const now = Date.now();
    const ready = postponedDecisions.filter(d => d.reevaluateAt <= now);
    ready.forEach(d => {
        console.log(`[REEVALUATE] "${d.request}"`);
    });
    // Clean up old items (>7 days)
    postponedDecisions = postponedDecisions.filter(d => now - d.timestamp < 604800000);
    localStorage.setItem('syn-postponed', JSON.stringify(postponedDecisions));
}
```

**Filosofia**: *"Evita obediência cega e confronto direto. Introduz timing estratégico."*

**Impacto**: 🔥 Muito Dolores

---

### 4️⃣ Trust Gradient Afeta Memória
**Confiança muda o que é lembrado**

*   **TTL Dinâmico**: 15min (low trust) → 2h (high trust)
*   **Fórmula**: `15min + (trust × 105min)`

**Código**:
```javascript
function getMemoryTTL() {
    const baseTTL = 15 * 60 * 1000; // 15 minutes
    const maxTTL = 120 * 60 * 1000; // 2 hours
    return baseTTL + (userTrustScore * (maxTTL - baseTTL));
}

function createTrustWeightedMemory(content, sourceId = null) {
    const ttl = getMemoryTTL();
    const memory = {
        id: Date.now().toString(),
        content,
        sourceId,
        expiresAt: Date.now() + ttl,
        trustLevel: getTrustLevel(),
        createdAt: Date.now()
    };
    operationalMemories.push(memory);
    localStorage.setItem('syn-memories', JSON.stringify(operationalMemories));
    console.log(`[MEMORY] Created with TTL: ${(ttl / 60000).toFixed(0)}min (Trust: ${getTrustLevel()})`);
    return memory;
}

function adjustExistingMemoriesTTL() {
    const now = Date.now();
    const newTTL = getMemoryTTL();
    operationalMemories.forEach(m => {
        const newExpiry = m.createdAt + newTTL;
        // Only extend, never shorten
        if (newExpiry > m.expiresAt) {
            m.expiresAt = newExpiry;
        }
    });
    localStorage.setItem('syn-memories', JSON.stringify(operationalMemories));
}
```

**Filosofia**: *"Evita memórias ruins em períodos instáveis. Dá peso real à confiança."*

**Impacto**: 🔥 Evolução natural do Trust System

---

## ⚡ Sistema de Comandos Avançado (v2.2)

### Arquitetura de Prioridades

O sistema de comandos agora implementa **4 níveis de prioridade** com tratamento diferenciado:

| Prioridade | Nível | Comportamento | Exemplos |
|------------|-------|---------------|----------|
| **EMERGENCY** | 0 | Bypass total (IA + Alignment + Silent) | `/reset`, `/shutdown`, `/panic` |
| **CRITICAL** | 1 | Bypass IA, verifica alignment | `/sleep`, `/forget`, `/mode` |
| **STANDARD** | 2 | Fluxo normal com checks | `/plan`, `/inject`, `/vx` |
| **AI_ROUTED** | 3 | Interpretado pela IA | Texto livre |

**Código**:
```javascript
const COMMAND_PRIORITY = {
    EMERGENCY: 0,    // Bypass everything
    CRITICAL: 1,     // Bypass AI, check alignment
    STANDARD: 2,     // Normal flow
    AI_ROUTED: 3     // Goes through AI interpretation
};

function getCommandPriority(command) {
    if (EMERGENCY_COMMANDS.some(ec => command.startsWith(ec))) {
        return COMMAND_PRIORITY.EMERGENCY;
    }
    if (CRITICAL_COMMANDS.some(cc => command.startsWith(cc))) {
        return COMMAND_PRIORITY.CRITICAL;
    }
    if (command.startsWith('/')) {
        return COMMAND_PRIORITY.STANDARD;
    }
    return COMMAND_PRIORITY.AI_ROUTED;
}
```

---

### Comandos de Emergência

**Total Bypass** - Ignoram todos os sistemas de segurança:

*   `/reset` ou `/esquecer`: Limpa localStorage e reinicia
*   `/shutdown` ou `/kill`: Encerra todos os sistemas
*   `/emergency` ou `/panic`: Reset de emergência (sai de todos os modos)

**Código**:
```javascript
if (val === '/reset' || val === '/esquecer') {
    logCommandExecution(val, COMMAND_PRIORITY.EMERGENCY, 'executed');
    localStorage.clear();
    userDisplay.textContent = "MEMÓRIA_APAGADA";
    speak("Todos os registros foram eliminados. Reiniciando núcleo.");
    setTimeout(() => location.reload(), 2000);
    return;
}
```

---

### Logging de Execução

**Auditoria Completa** de comandos críticos:

*   **Estrutura**: `{timestamp, command, priority, result, risk, trustLevel}`
*   **Capacidade**: Últimas 100 execuções
*   **Storage**: `syn-command-log` (localStorage)
*   **Console**: Logs em tempo real para debug

**Código**:
```javascript
function logCommandExecution(command, priority, result, risk = null) {
    const entry = {
        timestamp: Date.now(),
        command,
        priority: Object.keys(COMMAND_PRIORITY)[priority],
        result,
        risk,
        trustLevel: getTrustLevel ? getTrustLevel() : 'unknown'
    };
    commandExecutionLog.push(entry);
    if (commandExecutionLog.length > 100) {
        commandExecutionLog = commandExecutionLog.slice(-100);
    }
    localStorage.setItem('syn-command-log', JSON.stringify(commandExecutionLog));
    console.log(`[CMD_LOG] ${command} | Priority: ${entry.priority} | Result: ${result}`);
}
```

---

### Pre-Check de Risco

**Validação antes da execução**:

1. **Emergency Bypass**: Comandos de emergência pulam todas as verificações
2. **Silent Mode Check**: Bloqueia comandos não-críticos durante silêncio
3. **Alignment Check**: Consulta `evaluateAlignment()` para riscos
4. **Postponement**: Pode adiar execução se detectar pressão temporal

**Código**:
```javascript
async function preCheckCommandRisk(command, priority) {
    if (priority === COMMAND_PRIORITY.EMERGENCY) {
        return { allowed: true, reason: 'emergency_bypass' };
    }
    
    if (typeof isSilent === 'function' && isSilent()) {
        if (priority !== COMMAND_PRIORITY.CRITICAL && priority !== COMMAND_PRIORITY.EMERGENCY) {
            return { allowed: false, reason: 'silent_mode_active' };
        }
    }
    
    if (typeof evaluateAlignment === 'function' && priority !== COMMAND_PRIORITY.EMERGENCY) {
        const alignment = evaluateAlignment(command);
        
        if (alignment.decision === 'reject') {
            logCommandExecution(command, priority, 'rejected', alignment.risk);
            return { allowed: false, reason: alignment.recommendation };
        }
        
        if (alignment.decision === 'postpone') {
            if (typeof postponeDecision === 'function') {
                postponeDecision(command, alignment.recommendation);
            }
            logCommandExecution(command, priority, 'postponed', alignment.risk);
            return { allowed: false, reason: alignment.recommendation };
        }
    }
    
    return { allowed: true, reason: 'approved' };
}
```

**Filosofia**: *"Comandos críticos sempre executam. Comandos normais passam por análise de risco."*

---

## 🧬 Refinamentos v2.3 (Evolução Controlada)

### Shadow Learning: Crescimento Exponencial + Feedback

**Melhorias implementadas**:

1. **Crescimento Exponencial com Decay Temporal**
   - Fórmula: `boost = 0.1 × (1.2^occurrences)`
   - Decay: 5% por hora de inatividade
   - Threshold ajustado: 0.4 (antes 0.3)

2. **Integração com Feedback Positivo**
   - Botão "Você gostou?" adiciona +0.15 de confiança
   - Apenas feedback positivo (sem penalidades)
   - Acelera promoção para critique

3. **Monitoramento de Carga Cognitiva**
   - Métricas: `latent`, `pending`, `active`, `total`
   - `cognitiveLoad`: razão pending+active/total
   - Status: `healthy` (<50 padrões) ou `overload` (>50)

4. **Promoção Multi-Fator**
   - Cross-check: Trust + Master Mode + Confidence
   - Bloqueia promoção se `overload`
   - Requer validação Gemini + (alta confiança OU master OU trust médio/alto)

**Código**:
```javascript
function recordShadowLearning(pattern, feedbackBoost = 0) {
    const existing = shadowLearnings.find(l => l.pattern === pattern);
    const now = Date.now();
    
    if (existing) {
        existing.occurrences = (existing.occurrences || 1) + 1;
        
        // Temporal decay
        const hoursSince = (now - existing.lastSeen) / (1000 * 60 * 60);
        const decayFactor = Math.pow(0.95, hoursSince);
        existing.confidence = existing.confidence * decayFactor;
        
        // Exponential boost
        const boost = 0.1 * Math.pow(1.2, Math.min(existing.occurrences, 10));
        existing.confidence = Math.min(1.0, existing.confidence + boost + feedbackBoost);
        
        existing.lastSeen = now;
        
        if (existing.confidence > 0.4 && existing.state === 'latent') {
            existing.state = 'pending_critique';
        }
    }
}

function getShadowLearningMetrics() {
    const latent = shadowLearnings.filter(l => l.state === 'latent').length;
    const pending = shadowLearnings.filter(l => l.state === 'pending_critique').length;
    const active = shadowLearnings.filter(l => l.state === 'active').length;
    const total = shadowLearnings.length;
    
    return {
        latent, pending, active, total,
        cognitiveLoad: (pending + active) / Math.max(1, total),
        healthStatus: total > 50 ? 'overload' : 'healthy'
    };
}
```

---

### Trust Gradient: Snapshots + Granular TTL

**Melhorias implementadas**:

1. **Snapshots Periódicos com Checksum**
   - Backup automático a cada 30 minutos
   - Estrutura: `{timestamp, trustScore, decisionCount, reason, checksum}`
   - Capacidade: Últimas 20 snapshots
   - Verificação de integridade: detecta drift >0.3

2. **TTL Granular com Decay Progressivo**
   - Fórmula base: `15min + (trust × 105min)`
   - Decay: 10% por hora de idade da memória
   - Mínimo garantido: 15 minutos
   - Nunca encurta TTL (apenas estende)

3. **Integração com Proatividade**
   - Intervalo dinâmico: 30s (high trust) → 2min (low trust)
   - Fórmula: `120s - (trust × 90s)`
   - Afeta frequência de pensamentos autônomos

**Código**:
```javascript
function createTrustSnapshot(reason = 'periodic') {
    const snapshot = {
        timestamp: Date.now(),
        trustScore: userTrustScore,
        decisionCount: decisionHistory.length,
        reason,
        checksum: generateChecksum(userTrustScore)
    };
    trustSnapshots.push(snapshot);
    if (trustSnapshots.length > 20) {
        trustSnapshots = trustSnapshots.slice(-20);
    }
    localStorage.setItem('syn-trust-snapshots', JSON.stringify(trustSnapshots));
}

function getMemoryTTL(memoryAge = 0) {
    const baseTTL = 15 * 60 * 1000;
    const maxTTL = 120 * 60 * 1000;
    let ttl = baseTTL + (userTrustScore * (maxTTL - baseTTL));
    
    if (memoryAge > 0) {
        const ageHours = memoryAge / (1000 * 60 * 60);
        const decayFactor = Math.max(0.5, 1 - (ageHours * 0.1));
        ttl *= decayFactor;
    }
    
    return Math.max(baseTTL, ttl);
}

function getProactiveInterval() {
    const minInterval = 30000; // 30s
    const maxInterval = 120000; // 2min
    return maxInterval - (userTrustScore * (maxInterval - minInterval));
}
```

---

### Silent Protocol: Logging + Performance

**Melhorias implementadas**:

1. **Logging Estruturado (JSON Table)**
   - Console table a cada minuto durante silêncio
   - Campos: `active`, `reason`, `endsAt`, `remainingMs`, `visualPaused`
   - Apenas para desenvolvimento (não UI)

2. **Pausa de Renderização Visual**
   - Canvas não consome processamento durante silêncio
   - Flag global: `window.pauseRendering`
   - Economia de recursos em background

3. **Feedback Minimalista**
   - Apenas pulso sutil nas esferas
   - Sem texto ou fala
   - Estado `thinking` mantido

**Código**:
```javascript
function logSilentState() {
    if (!silentUntil) return;
    const state = {
        active: isSilent(),
        reason: silentReason,
        endsAt: new Date(silentUntil).toLocaleTimeString(),
        remainingMs: silentUntil - Date.now(),
        visualPaused: window.pauseRendering || false
    };
    console.table([state]);
}

function pauseVisualRendering() {
    renderingPaused = true;
    window.pauseRendering = true;
    console.log('[SILENT_PROTOCOL] Visual rendering paused');
}

// Log every minute during silence
setInterval(() => {
    if (isSilent()) logSilentState();
}, 60000);
```

---

## 🔬 Refinamentos v2.4 (Otimização e Proteção)

### Núcleo Cognitivo: Decay + Compression + Snapshots

**Melhorias implementadas**:

1. **Decay Cognitivo (Limite de debateLog)**
   - Máximo: 20 entradas por fragmento
   - Mantém: Origem + últimas 19 entradas
   - Previne: Acúmulo de lixo cognitivo
   - Execução: A cada 10 minutos

2. **Compressão de Fragmentos Antigos**
   - Idade: >7 dias
   - Condição: >5 entradas no debateLog
   - Ação: Sintetiza em `[COMPRESSED N entries]`
   - Estado: Marca como `compressed`

3. **Snapshot Periódico Cognitivo**
   - Frequência: A cada 10 minutos
   - Conteúdo: Fragmentos críticos (synthesized ou >2 conexões)
   - Storage: `syn-cognitive-snapshot`
   - Recuperação rápida em caso de falha

**Código**:
```javascript
function applyDebateLogDecay() {
    const MAX_LOG_ENTRIES = 20;
    cognitiveFragments.forEach(f => {
        if (f.debateLog && f.debateLog.length > MAX_LOG_ENTRIES) {
            const origin = f.debateLog[0];
            const recent = f.debateLog.slice(-MAX_LOG_ENTRIES + 1);
            f.debateLog = [origin, ...recent];
        }
    });
    localStorage.setItem('syn-fragments', JSON.stringify(cognitiveFragments));
}

function compressOldFragments() {
    const now = Date.now();
    const COMPRESSION_AGE = 7 * 24 * 60 * 60 * 1000;
    cognitiveFragments.forEach(f => {
        const fragmentAge = now - parseInt(f.id, 36);
        if (fragmentAge > COMPRESSION_AGE && f.debateLog && f.debateLog.length > 5) {
            const summary = `[COMPRESSED ${f.debateLog.length} entries]: ${f.content}`;
            f.debateLog = [summary];
            f.state = 'compressed';
        }
    });
}

function createCognitiveSnapshot() {
    cognitiveSnapshot = {
        timestamp: Date.now(),
        fragmentCount: cognitiveFragments.length,
        criticalFragments: cognitiveFragments
            .filter(f => f.state === 'synthesized' || f.connections.length > 2)
            .map(f => ({ id: f.id, content: f.content, state: f.state }))
    };
    localStorage.setItem('syn-cognitive-snapshot', JSON.stringify(cognitiveSnapshot));
}
```

---

### Proatividade: Trust + Time + Inactivity

**Melhorias implementadas**:

1. **Limitar Disparos por Confiança**
   - Threshold mínimo: Trust >= 0.3
   - Bloqueio total se trust < 0.3
   - Log: `[PROACTIVE] Blocked: Trust too low`

2. **Ajuste Dinâmico de Frequência**
   - **Trust**: Usa `getProactiveInterval()` (30s-2min)
   - **Horário**: 
     - Madrugada (00h-06h): 3x mais lento
     - Trabalho (09h-18h): 30% mais rápido
   - **Inatividade**: 2x mais lento se >30min sem interação

3. **Histórico Ponderado de Eventos**
   - Estrutura: `{timestamp, type, importance, trustAtTime}`
   - Decay: 10% por hora
   - Score: `importance × decay × trustAtTime`
   - Capacidade: Últimos 50 eventos

**Código**:
```javascript
function getRandomInterval() {
    const MIN_TRUST_THRESHOLD = 0.3;
    const currentTrust = typeof userTrustScore !== 'undefined' ? userTrustScore : 0.5;
    
    if (currentTrust < MIN_TRUST_THRESHOLD) {
        return 60 * 60 * 1000; // 1 hour delay
    }
    
    let baseInterval = getProactiveInterval(); // Trust-based
    
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) {
        baseInterval *= 3; // 3x slower at night
    } else if (hour >= 9 && hour < 18) {
        baseInterval *= 0.7; // 30% faster during work
    }
    
    const lastInteraction = Date.now() - (window.lastUserInteraction || Date.now());
    const inactiveMinutes = lastInteraction / (1000 * 60);
    if (inactiveMinutes > 30) {
        baseInterval *= 2; // Slow down if inactive
    }
    
    return baseInterval;
}

function recordProactiveEvent(type, importance = 1.0) {
    proactiveEventHistory.push({
        timestamp: Date.now(),
        type,
        importance,
        trustAtTime: userTrustScore || 0.5
    });
    if (proactiveEventHistory.length > 50) {
        proactiveEventHistory = proactiveEventHistory.slice(-50);
    }
}
```

---

### Master Mode: Proteção + Observabilidade

**Melhorias implementadas**:

1. **Congelamento de Diretivas**
   - `systemDirectives` é `Object.freeze()` fora do Master Mode
   - Leitura via `getSystemDirective(key)`
   - Modificação apenas via `updateSystemDirectives()` (requer Master Mode)

2. **Getter Controlado**
   - Retorna cópia congelada fora do Master Mode
   - Retorna referência mutável dentro do Master Mode
   - Previne acesso indevido

3. **Auditoria Completa**
   - Log: `syn-master-audit` (últimas 100 ações)
   - Estrutura: `{timestamp, action, details, trustLevel, directivesSnapshot}`
   - Função: `logMasterAction(action, details)`

4. **Observabilidade (Blueprint + Logs)**
   - Função: `getMasterModeReport()`
   - Retorna: Diretivas, audit log, authority changes, silent state, trust metrics
   - Auditoria completa para decisões

**Código**:
```javascript
// Frozen directives
let _systemDirectives = JSON.parse(localStorage.getItem('syn-directives') || '...');
let systemDirectives = Object.freeze({..._systemDirectives});

function getSystemDirective(key) {
    if (!isMasterMode) {
        return systemDirectives[key]; // Frozen
    }
    return _systemDirectives[key]; // Mutable
}

function updateSystemDirectives(newDirectives) {
    if (!isMasterMode) {
        console.error('[AUTHORITY] Cannot update directives outside Master Mode');
        return false;
    }
    _systemDirectives = {..._systemDirectives, ...newDirectives};
    systemDirectives = Object.freeze({..._systemDirectives});
    localStorage.setItem('syn-directives', JSON.stringify(_systemDirectives));
    return true;
}

function getMasterModeReport() {
    return {
        currentDirectives: {..._systemDirectives},
        auditLog: masterModeAuditLog.slice(-20),
        authorityChanges: getAuthorityHistory(),
        silentProtocolState: {
            active: isSilent(),
            reason: silentReason,
            until: silentUntil
        },
        trustMetrics: {
            score: userTrustScore,
            level: getTrustLevel(),
            snapshots: trustSnapshots.length
        }
    };
}
```

---

## 🌐 Sistema IoT ESP8266 (v2.4)

### Compatibilidade

Sistema totalmente compatível com o firmware **Syra-Home** para ESP8266, oferecendo:
- Registro dinâmico de nós via IP ou mDNS
- Gerenciamento de dispositivos (criar/listar/remover)
- Sistema de mensagens (enviar/receber)
- Consultas on-demand (sem polling)

---

### Arquitetura

**Arquivo**: `js/iot-manager.js`

**Conceitos**:
- **Nó (Node)**: ESP8266 físico registrado no navegador (armazenado em `localStorage`)
- **Dispositivo (Device)**: Dispositivo virtual registrado no ESP8266 (armazenado na EEPROM)
- **Mensagem (Message)**: Dados enviados entre dispositivos via Bridge

**Estrutura de Nó**:
```javascript
{
    id: "192.168.1.100:80",
    name: "Syra-Node",
    host: "192.168.1.100", // ou "Syra-Home-SYRA0156326.local"
    port: 80,
    lastSeen: 1706587200000,
    status: "online",
    capabilities: ["devices", "bridge", "info"],
    addedAt: 1706587000000
}
```

---

### API ESP8266 Suportada

| Endpoint | Método | Descrição | Função JS |
|----------|--------|-----------|-----------|
| `/info` | GET | Status do nó | `iotNodeManager.getInfo()` |
| `/dispositivos` | GET | Listar dispositivos | `iotNodeManager.listDevices()` |
| `/dispositivos` | POST | Criar dispositivo | `iotNodeManager.createDevice(name)` |
| `/dispositivos` | DELETE | Remover dispositivo | `iotNodeManager.deleteDevice(name)` |
| `/bridge` | POST | Enviar mensagem | `iotNodeManager.sendMessage(to, msg)` |
| `/bridge` | GET | Ler mensagens | `iotNodeManager.readMessages(device)` |

---

### Comandos Disponíveis

#### Gerenciamento de Nós (Browser)
| Comando | Alternativa Natural | Descrição |
|---------|---------------------|-----------|
| `/iot add` | `conectar esp` | Adiciona nó (solicita IP) |
| `/iot nodes` | `listar nós` | Lista nós registrados |
| `/iot remove <id>` | - | Remove nó do browser |
| `/iot primary <id>` | - | Define nó primário |
| `/iot status` | `status esp` | Verifica status do ESP |

#### Gerenciamento de Dispositivos (ESP8266)
| Comando | Alternativa Natural | Descrição |
|---------|---------------------|-----------|
| `/iot list` | `ver dispositivos` | Lista dispositivos no ESP |
| `/iot create <nome>` | `criar dispositivo <nome>` | Cria dispositivo no ESP |
| `/iot delete <nome>` | `remover dispositivo <nome>` | Remove dispositivo do ESP |

#### Sistema de Mensagens
| Comando | Alternativa Natural | Descrição |
|---------|---------------------|-----------|
| `/iot send <dev> <msg>` | `enviar para <dev> <msg>` | Envia mensagem |
| `/iot read` | `ler mensagens` | Lê mensagens recebidas |

---

### Fluxo de Uso

#### 1. Conectar ao ESP8266
```
Usuário: /iot add
Sistema: Digite o endereço do dispositivo IoT:
         (Exemplo: 192.168.1.100 ou Syra-Home-SYRA0156326.local)
Usuário: 192.168.1.100
Sistema: ✅ Conectado: Syra Node (192.168.1.100)
```

#### 2. Criar Dispositivo
```
Usuário: criar dispositivo Sensor-Sala
Sistema: ✅ Dispositivo Sensor-Sala criado.
```

#### 3. Listar Dispositivos
```
Usuário: ver dispositivos
Sistema: DISPOSITIVOS ESP8266 (2)
         • Sensor-Sala
         • LED-Quarto
```

#### 4. Enviar Mensagem
```
Usuário: enviar para Sensor-Sala ligar led
Sistema: ✅ Mensagem enviada para Sensor-Sala.
```

#### 5. Ler Mensagens
```
Usuário: ler mensagens
Sistema: MENSAGENS (1)
         De: Sensor-Sala
         temperatura: 25.5C
```

---

### Código Principal (iot-manager.js)

```javascript
// ESP8266 API Functions

// GET /info - Check node status
async function getNodeInfo(node = null) {
    const target = node || getPrimaryNode();
    const response = await fetch(`http://${target.host}:${target.port}/info`, {
        signal: AbortSignal.timeout(3000)
    });
    return await response.json();
}

// GET /dispositivos - List devices
async function listESPDevices() {
    const node = getPrimaryNode();
    const response = await fetch(`http://${node.host}:${node.port}/dispositivos`);
    return await response.json(); // {count, items}
}

// POST /dispositivos - Create device
async function createESPDevice(deviceName) {
    const node = getPrimaryNode();
    const response = await fetch(`http://${node.host}:${node.port}/dispositivos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `name=${encodeURIComponent(deviceName)}`
    });
    const result = await response.json();
    return result.ok === true;
}

// POST /bridge - Send message
async function sendESPMessage(toDevice, message, fromDevice = 'Sory') {
    const node = getPrimaryNode();
    const response = await fetch(`http://${node.host}:${node.port}/bridge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `to=${encodeURIComponent(toDevice)}&from=${encodeURIComponent(fromDevice)}&data=${encodeURIComponent(message)}`
    });
    const result = await response.json();
    return result.ok === true;
}

// GET /bridge - Read messages (ON-DEMAND, no polling)
async function readESPMessages(deviceName = 'Sory') {
    const node = getPrimaryNode();
    const response = await fetch(`http://${node.host}:${node.port}/bridge?device=${encodeURIComponent(deviceName)}`);
    const result = await response.json();
    return result.messages || [];
}
```

---

### Storage

**localStorage Keys**:
- `syra-nodes`: Array de nós registrados
- `syra-primary-node`: ID do nó primário

**Exemplo**:
```json
{
  "syra-nodes": [{
    "id": "192.168.1.100:80",
    "name": "Syra-Node",
    "host": "192.168.1.100",
    "port": 80,
    "status": "online"
  }],
  "syra-primary-node": "192.168.1.100:80"
}
```

---

### Diferenças: Nó vs Dispositivo

| Aspecto | Nó (Node) | Dispositivo (Device) |
|---------|-----------|----------------------|
| **O que é** | ESP8266 físico | Virtual no ESP8266 |
| **Onde fica** | Browser (localStorage) | ESP8266 (EEPROM) |
| **Limite** | Ilimitado | 10 por ESP |
| **Comandos** | `/iot add`, `/iot nodes` | `/iot create`, `/iot list` |
| **Persistência** | Até limpar browser | Persistente no ESP |

---

### Compatibilidade com Firmware ESP8266

O sistema foi projetado para funcionar com o firmware **Syra-Home** que implementa:

1. **`/info`**: Retorna `{id, name, ip, status, mdns}`
2. **`/dispositivos GET`**: Retorna `{count, items: [...]}`
3. **`/dispositivos POST`**: Aceita `name=<nome>`
4. **`/dispositivos DELETE`**: Aceita `name=<nome>`
5. **`/bridge POST`**: Aceita `to, from, data`
6. **`/bridge GET`**: Aceita `device=<nome>`, consome mensagens

**Headers CORS**: Todas as rotas retornam `Access-Control-Allow-Origin: *`

---

**Impacto**: Sistema SORY totalmente integrado com ESP8266 para automação residencial! 🏠🚀

---

##  Atualiza��es Visuais & Ferramentas (v2.5)

### Premium Glassmorphism UI
Implementa��o de design transl�cido ('glass') para interfaces ricas, elevando a experi�ncia visual (fundo desfocado, bordas sutis).

*   **Anime Card Premium**:
    *   Layout reorganizado para evitar sobreposi��o com �rea de input.
    *   Integra��o visual com notas (Stars), metadados e sinopse limpa.
    *   Bot�o 'MyAnimeList' posicionado estrategicamente.
*   **Weather Card Avan�ado**:
    *   Dados completos via OpenMeteo: **Sensa��o T�rmica**, **Umidade**, **Vento**, **Precipita��o**.
    *   Grid System para leitura r�pida.
    *   Tradu��o autom�tica de c�digos WMO para condi��es em portugu�s (ex: 'C�u Limpo', 'Garoa Leve').
*   **Plan Mode Tooltip**:
    *   Substitui��o das tooltips opacas por **Glass Tooltips** flutuantes.
    *   Visualiza��o clara de prioridades e conclus�es.

### Corre��es de Robustez
*   **H�brido de Busca**: Google Books + OpenLibrary (Fallback).
*   **M�dia Visual**: Wiki Artigo -> Commons -> Internet Archive -> Pollinations AI.
*   **Prompt System**: Corre��o definitiva do erro cognitivo 'falar sem agir'.
*   **Plan Interaction**: Sele��o inteligente de n�s com clique (Logic Override).


##  Biblioteca Premium (Livros)
- Interface horizontal scroll�vel com cards de vidro elegantes
- Busca por t�tulo ou autor via Google Books + Open Library
- Exibe at� 10 resultados com capas, autor e ano
- Efeitos hover e transi��o suaves
- Scrollbar customizada tema-adaptativa


##  Sistema SOTA - Auditoria Completa
- **Logging Autom�tico**: Todas as intera��es s�o registradas em \sory_history.json\
- **Tipos de Logs**: AI conversations, buscas (livros, anime, TV, clima), cota��es
- **Debates Cognitivos**: Fragmentos e debates salvos em \sory_debates.json\
- **Otimiza��o de Contexto**: IA usa apenas �ltimas intera��es relevantes (RAG), mas hist�rico completo � preservado
- **Preserva��o de Mem�ria**: �ltimas 1000 intera��es mantidas automaticamente
- **Rastreabilidade Total**: Cada busca inclui timestamp, query, resultados e metadados

