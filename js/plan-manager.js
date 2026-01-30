
// --- STRATEGIC PLAN MANAGER ---

function editPlanNode(index, newText) {
    if (!planNodes[index]) return speak("Nó inválido.");
    planNodes[index].raw = newText;
    planNodes[index].short = newText.split(' ').slice(0, 3).join(' ').toUpperCase(); // Simple regen
    speak("Nó atualizado.");
}

function deletePlanNode(index, mode = 'cascade') {
    if (!planNodes[index]) return;

    // Find children (nodes that have this index as parent)
    // Note: This relies on indexes remaining stable or IDs. The current system uses array index as ID? 
    // Checking animate loop: node.parents.forEach(pid => ...)
    // If IDs are indexes, deleting shifts everything! We must check if nodes have IDs.
    // Assuming nodes have stable 'id' property or we need to implement IDs.
    // Looking at previous cognitive.js (line 86 in app.js): const parent = planNodes.find(p => p.id === pid);
    // So nodes DO have IDs.

    const targetId = planNodes[index].id;

    if (mode === 'cascade') {
        // Delete node and all children recursively
        const toDelete = [targetId];
        let changed = true;
        while (changed) {
            changed = false;
            planNodes.forEach(n => {
                if (n.parents && n.parents.some(p => toDelete.includes(p)) && !toDelete.includes(n.id)) {
                    toDelete.push(n.id);
                    changed = true;
                }
            });
        }
        planNodes = planNodes.filter(n => !toDelete.includes(n.id));
    } else {
        // Just delete node, children become orphans or connect to grandparent?
        planNodes = planNodes.filter(n => n.id !== targetId);
    }
    speak("Estrutura reajustada.");
}

function togglePlanNodeStatus(index) {
    if (planNodes[index]) {
        planNodes[index].completed = !planNodes[index].completed;
        speak(planNodes[index].completed ? "Passo concluído." : "Passo reaberto.");
    }
}

function setPlanNodePriority(index, priority) {
    if (planNodes[index]) {
        planNodes[index].priority = priority; // 'high', 'medium', 'low'
        speak(`Prioridade definida como ${priority}.`);
    }
}

function fitPlanView() {
    if (planNodes.length === 0) return;
    // Find bounds
    let minY = Infinity, maxY = -Infinity;
    planNodes.forEach(n => {
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
    });

    // Center logic roughly
    const planHeight = maxY - minY;
    window.planCamY = -minY + (window.innerHeight - planHeight) / 2;
    speak("Visualização ajustada.");
}

// Export functions to global scope for commands.js
window.editPlanNode = editPlanNode;
window.deletePlanNode = deletePlanNode;
window.togglePlanNodeStatus = togglePlanNodeStatus;
window.setPlanNodePriority = setPlanNodePriority;
window.fitPlanView = fitPlanView;

// INTERACTION SYSTEM (Drag & Drop + Tooltips)
let isDraggingNode = false;
let draggedNodeIndex = -1;

// Tooltip Element
const tooltipEl = document.createElement('div');
tooltipEl.id = "plan-tooltip";
tooltipEl.style.cssText = `
        position: fixed; pointer-events: none; z-index: 10000; display: none;
    `;
document.body.appendChild(tooltipEl);

function showPlanTooltip(node, x, y) {
    const pText = node.priority ? `<br><span style="color:#ffcc00; font-size:0.7em;">PRIORIDADE: ${node.priority.toUpperCase()}</span>` : '';
    const status = node.completed ? `<br><span style="color:#00ffea; font-size:0.7em;">CONCLUÍDO</span>` : '';
    tooltipEl.innerHTML = `<strong style="color:var(--accent)">ID: ${node.id}</strong><hr style="border-color:rgba(255,255,255,0.1); margin:4px 0;">${node.raw}${pText}${status}`;
    tooltipEl.style.left = (x + 15) + 'px';
    tooltipEl.style.top = (y + 15) + 'px';
    tooltipEl.style.display = 'block';
}

function hidePlanTooltip() {
    tooltipEl.style.display = 'none';
}

function initPlanInteraction() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    let startX = 0;
    let startY = 0;

    canvas.addEventListener('mousedown', (e) => {
        if (!isPlanMode) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top - (window.planCamY || 0);

        startX = mx;
        startY = my;

        // Reverse loop for Z-index
        for (let i = planNodes.length - 1; i >= 0; i--) {
            const n = planNodes[i];
            const dist = Math.sqrt((mx - n.x) ** 2 + (my - n.y) ** 2);
            if (dist < 25) {
                isDraggingNode = true;
                draggedNodeIndex = i;
                return;
            }
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isPlanMode) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top - (window.planCamY || 0);

        // Dragging check
        if (isDraggingNode && planNodes[draggedNodeIndex]) {
            // Apply move only
            planNodes[draggedNodeIndex].x = mx;
            planNodes[draggedNodeIndex].y = my;
            return;
        }

        // Hover Tooltip
        let hit = false;
        for (const n of planNodes) {
            const dist = Math.sqrt((mx - n.x) ** 2 + (my - n.y) ** 2);
            if (dist < 25) {
                showPlanTooltip(n, e.clientX, e.clientY);
                canvas.style.cursor = 'grab';
                hit = true;
                break;
            }
        }
        if (!hit) {
            hidePlanTooltip();
            canvas.style.cursor = 'default';
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (!isPlanMode) return;

        // Handle CLICK Logic (if not dragged significantly)
        if (isDraggingNode && planNodes[draggedNodeIndex]) {
            const n = planNodes[draggedNodeIndex];
            // Check if moved < 5px
            if (Math.abs(n.x - startX) < 5 && Math.abs(n.y - startY) < 5) {
                // It was a click!
                handleNodeClick(n);
            }
        }

        isDraggingNode = false;
        draggedNodeIndex = -1;
    });

    function handleNodeClick(node) {
        if (node.selected) {
            // Deselect
            node.selected = false;
        } else {
            // Select (Max 2 for merge logic, or strict 1 overrides)
            // User requested "choose THE node", implying singular.
            // But code supports merge. Let's allowing adding to selection if CTRL pressed? 
            // No, simple UI: Click selects ONLY this one (clears others), unless Shift/Ctrl used?
            // Actually, best UX for Strategy: Click selects this one as THE active parent.
            // If user wants merge, maybe they click both fast? Or we stick to 2 max.

            // Let's implement: Click = Select THIS, Deselect OTHERS. (Singular focus)
            // This fixes "leave the last one by default" confusion -> now we explicitly pick one.

            planNodes.forEach(n => n.selected = false);
            node.selected = true;
        }
        hapticFeedback(30);
    }
}
window.addEventListener('load', initPlanInteraction);
