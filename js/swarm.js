
// Swarm Intelligence (P2P Mesh) - Sory System

function initSwarm() {
    if (peer) {
        userDisplay.textContent = `SWARM_ID: ${myPeerId}`;
        speak("Protocolo de enxame já ativo.");
        return;
    }

    // Generate readable ID
    const randomId = Math.floor(Math.random() * 9000) + 1000;
    const id = `NODE-${randomId}`;

    userDisplay.textContent = "INICIANDO SWARM...";

    peer = new Peer(id, {
        debug: 1
    });

    peer.on('open', (id) => {
        myPeerId = id;
        console.log('Swarm Identity:', id);

        // Visual Feedback: All spheres pulse Cyan
        spheres.forEach(s => s.scheme = { r: 0, g: 255, b: 255 });

        voxDisplay.innerHTML = `<span style="color:cyan">SWARM NODE ACTIVE</span><br><span style="font-size:2rem">${id}</span>`;
        speak(`Nó de enxame ativo. Identificador: ${id}.`);

        // Revert colors after 3s
        setTimeout(() => {
            spheres.forEach((s, i) => s.scheme = schemes[i % schemes.length]);
        }, 3000);
    });

    peer.on('connection', (conn) => {
        handlePeerConnection(conn);
    });

    peer.on('error', (err) => {
        console.error(err);
        userDisplay.textContent = "ERRO SWARM";
        speak("Falha na conexão de enxame.");
    });
}

function connectToSwarm(remoteId) {
    if (!peer) initSwarm();

    // Allow time for init if just started
    setTimeout(() => {
        userDisplay.textContent = `BUSCANDO ${remoteId}...`;
        const conn = peer.connect(remoteId);

        conn.on('open', () => {
            handlePeerConnection(conn);
        });

        conn.on('error', (err) => {
            userDisplay.textContent = "NÓ NÃO ENCONTRADO";
        });
    }, peer ? 0 : 1500);
}

function handlePeerConnection(conn) {
    peerConn = conn;
    userDisplay.textContent = "SWARM LINKED";
    speak("Sincronização neural estabelecida.");
    isSynchronized = true; // Updates UI state

    // Receive Data
    conn.on('data', (data) => {
        if (data.type === 'sync') {
            // Update targets for lerp instead of replacing the whole array
            data.spheres.forEach(incoming => {
                let existing = remoteSpheres.find(rs => rs.id === incoming.id);
                if (existing) {
                    existing.targetX = incoming.xOffset;
                    existing.targetY = incoming.yOffset;
                    existing.state = incoming.state;
                    existing.role = incoming.role;
                } else {
                    // Initialize new remote node with targets
                    incoming.targetX = incoming.xOffset;
                    incoming.targetY = incoming.yOffset;
                    remoteSpheres.push(incoming);
                }
            });
        }

        // Semantic Query Cache Integration
        if (data.type === 'query_cache') {
            if (typeof neuralSemantics !== 'undefined') {
                neuralSemantics.search(data.query).then(results => {
                    if (results.length > 0) conn.send({ type: 'answer', result: results[0].text });
                });
            }
        }
    });

    // Send Data Loop
    setInterval(() => {
        if (conn.open) {
            const syncData = spheres.map(s => ({
                id: s.id,
                xOffset: s.xOffset,
                yOffset: s.yOffset,
                state: s.state,
                role: s.role
            }));

            conn.send({
                type: 'sync',
                spheres: syncData
            });
        }
    }, 100); // 100ms sync with lerp interpolation
}
