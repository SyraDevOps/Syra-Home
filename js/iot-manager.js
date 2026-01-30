// IoT NODE MANAGEMENT SYSTEM
// Compatible with ESP8266 Syra-Home firmware
// ON-DEMAND ONLY - No polling

let iotNodes = JSON.parse(localStorage.getItem('syra-nodes') || '[]');
let primaryNode = localStorage.getItem('syra-primary-node') || null;

// Node structure: {id, name, host, port, lastSeen, status, capabilities}

function getIoTNodes() {
    return iotNodes;
}

function getPrimaryNode() {
    if (primaryNode) {
        const node = iotNodes.find(n => n.id === primaryNode);
        if (node) return node;
    }
    return iotNodes.length > 0 ? iotNodes[0] : null;
}

function registerIoTNode(nodeData) {
    const { name, host, port = 80, capabilities = [] } = nodeData;

    const id = `${host}:${port}`;
    const existing = iotNodes.find(n => n.id === id);

    if (existing) {
        existing.lastSeen = Date.now();
        existing.status = 'online';
        existing.name = name || existing.name;
    } else {
        iotNodes.push({
            id,
            name: name || `Syra-Node-${host}`,
            host,
            port,
            lastSeen: Date.now(),
            status: 'pending',
            capabilities,
            aliases: [], // Alias support
            addedAt: Date.now()
        });
    }

    localStorage.setItem('syra-nodes', JSON.stringify(iotNodes));
    console.log(`[IoT] Node registered: ${name} (${id})`);

    if (!primaryNode) {
        setPrimaryNode(id);
    }

    return id;
}

function setPrimaryNode(nodeId) {
    primaryNode = nodeId;
    localStorage.setItem('syra-primary-node', nodeId);
    console.log(`[IoT] Primary node set: ${nodeId}`);
}

function removeIoTNode(nodeId) {
    iotNodes = iotNodes.filter(n => n.id !== nodeId);
    localStorage.setItem('syra-nodes', JSON.stringify(iotNodes));

    if (primaryNode === nodeId) {
        primaryNode = null;
        localStorage.removeItem('syra-primary-node');
        if (iotNodes.length > 0) {
            setPrimaryNode(iotNodes[0].id);
        }
    }

    console.log(`[IoT] Node removed: ${nodeId}`);
    console.log(`[IoT] Node removed: ${nodeId}`);
}

// ALIAS MANAGEMENT
function setNodeAlias(nodeId, alias) {
    const node = iotNodes.find(n => n.id === nodeId);
    if (!node) return false;

    if (!node.aliases) node.aliases = [];
    const cleanAlias = alias.toLowerCase().trim();

    // Avoid duplicates
    if (!node.aliases.includes(cleanAlias)) {
        node.aliases.push(cleanAlias);
        localStorage.setItem('syra-nodes', JSON.stringify(iotNodes));
        console.log(`[IoT] Alias added: "${cleanAlias}" -> ${nodeId}`);
        return true;
    }
    return false;
}

function resolveNodeName(inputName) {
    const search = inputName.toLowerCase().trim();
    return iotNodes.find(n =>
        n.id.toLowerCase() === search ||
        n.name.toLowerCase() === search ||
        (n.aliases && n.aliases.includes(search))
    );
}

// ========== ESP8266 API FUNCTIONS ==========

// GET /info - Check node status
async function getNodeInfo(node = null) {
    const target = node || getPrimaryNode();
    if (!target) return null;

    try {
        const response = await fetch(`http://${target.host}:${target.port}/info`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
        });

        if (response.ok) {
            const data = await response.json();
            // Update node status
            const n = iotNodes.find(x => x.id === target.id);
            if (n) {
                n.status = data.status || 'online';
                n.lastSeen = Date.now();
                localStorage.setItem('syra-nodes', JSON.stringify(iotNodes));
            }
            return data;
        }
    } catch (e) {
        console.log(`[IoT] Error getting info: ${e.message}`);
    }
    return null;
}

// GET /dispositivos - List devices on ESP8266
async function listESPDevices() {
    const node = getPrimaryNode();
    if (!node) {
        console.log('[IoT] No primary node configured');
        return null;
    }

    try {
        const response = await fetch(`http://${node.host}:${node.port}/dispositivos`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
        });

        if (response.ok) {
            const data = await response.json();
            return data; // {count: N, items: [...]}
        }
    } catch (e) {
        console.log(`[IoT] Error listing devices: ${e.message}`);
    }
    return null;
}

// POST /dispositivos - Create device on ESP8266
async function createESPDevice(deviceName) {
    const node = getPrimaryNode();
    if (!node) return false;

    try {
        const response = await fetch(`http://${node.host}:${node.port}/dispositivos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `name=${encodeURIComponent(deviceName)}`,
            signal: AbortSignal.timeout(3000)
        });

        const result = await response.json();
        return result.ok === true;
    } catch (e) {
        console.log(`[IoT] Error creating device: ${e.message}`);
    }
    return false;
}

// DELETE /dispositivos - Remove device from ESP8266
async function deleteESPDevice(deviceName) {
    const node = getPrimaryNode();
    if (!node) return false;

    try {
        const response = await fetch(`http://${node.host}:${node.port}/dispositivos?name=${encodeURIComponent(deviceName)}`, {
            method: 'DELETE',
            signal: AbortSignal.timeout(3000)
        });

        const result = await response.json();
        return result.ok === true;
    } catch (e) {
        console.log(`[IoT] Error deleting device: ${e.message}`);
    }
    return false;
}

// POST /bridge - Send message to device
async function sendESPMessage(toDevice, message, fromDevice = 'Sory') {
    const node = getPrimaryNode();
    if (!node) return false;

    try {
        const response = await fetch(`http://${node.host}:${node.port}/bridge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `to=${encodeURIComponent(toDevice)}&from=${encodeURIComponent(fromDevice)}&data=${encodeURIComponent(message)}`,
            signal: AbortSignal.timeout(3000)
        });

        const result = await response.json();
        return result.ok === true;
    } catch (e) {
        console.log(`[IoT] Error sending message: ${e.message}`);
    }
    return false;
}

// GET /bridge - Read messages for device (ON-DEMAND)
async function readESPMessages(deviceName = 'Sory') {
    const node = getPrimaryNode();
    if (!node) return null;

    try {
        const response = await fetch(`http://${node.host}:${node.port}/bridge?device=${encodeURIComponent(deviceName)}`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000)
        });

        if (response.ok) {
            const result = await response.json();
            return result.messages || [];
        }
    } catch (e) {
        console.log(`[IoT] Error reading messages: ${e.message}`);
    }
    return null;
}

// Prompt user to add node manually
function promptAddNode() {
    const host = prompt("Digite o endereço do dispositivo IoT:\n(Exemplo: 192.168.1.100 ou Syra-Home-SYRA0156326.local)");
    if (!host) return null;

    const port = prompt("Digite a porta (padrão: 80):", "80");
    const name = prompt("Digite um nome para o dispositivo:", `Syra-Node`);

    const id = registerIoTNode({
        name: name || `Syra-Node`,
        host: host.trim(),
        port: parseInt(port) || 80,
        capabilities: ['devices', 'bridge', 'info']
    });

    return id;
}

// Export for use in other modules
window.iotNodeManager = {
    getNodes: getIoTNodes,
    getPrimary: getPrimaryNode,
    register: registerIoTNode,
    setPrimary: setPrimaryNode,
    remove: removeIoTNode,
    promptAdd: promptAddNode,
    // ESP8266 API
    getInfo: getNodeInfo,
    listDevices: listESPDevices,
    createDevice: createESPDevice,
    deleteDevice: deleteESPDevice,
    sendMessage: sendESPMessage,
    readMessages: readESPMessages,
    // Alias API
    setAlias: setNodeAlias,
    resolve: resolveNodeName
};
