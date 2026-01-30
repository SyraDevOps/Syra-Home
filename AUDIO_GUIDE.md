#  SISTEMA DE ÁUDIO APRIMORADO - SORY

##  Implementado

### 1. INICIALIZAÇÃO LAZY DO MICROFONE
-  App inicia SEM pedir permissão de microfone
-  Microfone só ativa quando necessário (/vox ou /vx)
-  Microfone é liberado automaticamente após uso

### 2. VOX MODE - Transcrição com Timestamps
**Comando:** \/vox\

**Funcionalidades:**
- Transcrição contínua em tempo real
- Timestamps para cada segmento
- Confidence score (% de confiança)
- Interface elegante com glass-card
- Botão para baixar ATA em .txt
- Auto-restart em caso de silêncio

**Como usar:**
1. Digite: \/vox\
2. Permita acesso ao microfone (só na primeira vez)
3. Fale normalmente
4. Clique em "BAIXAR ATA" para salvar
5. Digite \/stop\ ou clique em "PARAR"

**Arquivo gerado:**
\\\
ATA DE REUNIÃO - SORY VOX
Data: 30/01/2026
Duração: 5min 32s
Segmentos: 12

============================================================

[11:45:32] Bom dia a todos, vamos começar a reunião.

[11:45:45] O primeiro ponto da pauta é discutir o projeto X.

...
\\\

### 3. VX MODE - Conversação Contínua
**Comando:** \/vx\

**Funcionalidades:**
- Reconhecimento contínuo de voz
- Envia automaticamente para a IA
- Mostra resultados intermediários (...)
- Ideal para conversas longas

**Como usar:**
1. Digite: \/vx\
2. Fale sua pergunta/comando
3. IA responde automaticamente
4. Continue falando para nova interação
5. Digite \/stop\ para encerrar

### 4. OTIMIZAÇÕES WEB SPEECH API
-  Português BR otimizado
-  Echo cancellation ativado
-  Noise suppression ativado
-  Auto gain control ativado
-  Sample rate: 48kHz
-  Máximo de 3 alternativas
-  Resultados intermediários

##  Comandos

| Comando | Função |
|---------|--------|
| \/vox\ | Inicia modo transcrição (ata) |
| \/vx\ | Inicia modo conversação |
| \/stop\ ou \/parar\ | Para qualquer modo de áudio |

##  Privacidade

-  Processamento 100% local (Web Speech API nativa)
-  Nenhum áudio enviado para servidores externos
-  Microfone liberado automaticamente
-  Sem gravação permanente (apenas transcrição)

##  Teste Agora

1. Abra: http://localhost:8000
2. Digite: \/vox\
3. Permita microfone
4. Fale: "Testando o sistema Sory"
5. Veja a transcrição aparecer em tempo real!

---

**Nota:** A qualidade da transcrição depende do navegador. Chrome/Edge têm melhor suporte.
