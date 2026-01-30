// COMMANDS LIST - Implementation

async function executeCommand(cmd, args) {
    switch (cmd) {
        case 'help':
        case '?':
            showHelp();
            return "Comandos disponíveis exibidos.";

        case 'settings':
        case 'config':
            if (typeof openSettings === 'function') openSettings();
            return "Abrindo configurações.";

        case 'mesh':
        case 'malha':
            toggleMeshView();
            return null; // Handled internally

        case 'plan':
        case 'plano':
            startPlanMode(args || "Novo Plano");
            return null;

        case 'vox':
            startVoxMode();
            return null;

        case 'ata':
        case 'transcript':
            startTranscript();
            return "Iniciando ata.";

        case 'vx':
            startVxMode();
            return null;

        case 'wiki':
            handleQuery(args);
            return null;

        case 'image':
        case 'img':
            searchImages(args);
            return null;

        case 'book':
        case 'livro':
            searchBooks(args);
            return null;

        case 'weather':
        case 'clima':
            const info = await getWeather(args || "São Paulo");
            if (info) speak(info);
            return null;

        case 'market':
        case 'crypto':
            getMarketData();
            return null;

        case 'reddit':
            searchReddit(args);
            return null;

        case 'anime':
            searchAnime(args);
            return null;

        case 'trace':
        case 'ip':
            handleTrace();
            return "Rastreando conexão.";

        case 'iot':
            if (args === 'scan' || args === 'list') {
                syncIoTNodes();
                return "Buscando dispositivos.";
            }
            if (args.startsWith('add')) {
                window.awaitingNodeToken = true;
                return "Digite o identificador do nó.";
            }
            return "Comando IoT inválido.";

        case 'theme':
        case 'tema':
            if (args === 'light' || args === 'claro') {
                document.body.classList.add('light-mode');
                document.body.dataset.themeSet = 'true';
                if (typeof spheres !== 'undefined') spheres.forEach(s => s.scheme = { r: 20, g: 20, b: 40 });
                return "Tema claro ativado.";
            } else {
                document.body.classList.remove('light-mode');
                document.body.dataset.themeSet = 'true';
                if (typeof spheres !== 'undefined' && typeof schemes !== 'undefined') spheres.forEach((s, idx) => s.scheme = schemes[idx % schemes.length]);
                return "Tema escuro ativado.";
            }

        case 'reset':
        case 'reload':
            location.reload();
            return "Reiniciando sistema.";

        case 'clear':
        case 'cls':
            if (typeof ConversationManager !== 'undefined') ConversationManager.clear();
            userDisplay.textContent = "";
            voxDisplay.innerHTML = "";
            return "Memória de curto prazo limpa.";

        case 'dream':
        case 'sonhar':
            startDreamCycle();
            return null;

        case 'download':
            // Manual download of transcript
            if (isTranscriptMode) endTranscript();
            else promptVoxDownload();
            return null;

        default:
            // Custom Macros or Fail
            if (macros[cmd]) {
                speak(macros[cmd]);
                return macros[cmd];
            }
            spheres[0].state = 'error';
            setTimeout(() => spheres[0].state = 'idle', 2000);
            return "Comando desconhecido.";
    }
}
