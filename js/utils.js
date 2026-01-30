function hapticFeedback(time = 30) {
    if (navigator.vibrate) navigator.vibrate(time);
}

const hexToRgb = hex => {
    if (hex.startsWith('rgb')) {
        const parts = hex.match(/\d+/g);
        return { r: parseInt(parts[0]), g: parseInt(parts[1]), b: parseInt(parts[2]) };
    }
    const bigint = parseInt(hex.replace('#', ''), 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

function synOpinion(type) {
    const opinions = {
        news: "Contexto global apresenta instabilidade moderada nos tópicos indexados.",
        price: "Ativo sob flutuação algorítmica normal. Volatilidade monitorada.",
        iss: "Trajetória orbital nominal. Sem anomalias de telemetria.",
        clima: "Variações atmosféricas dentro da curva estatística local.",
        default: "Dados processados com integridade de 99.8%."
    };
    return opinions[type] || opinions.default;
}

function createNewSphere() {
    if (spheres.length < maxSpheres) spheres.push(new Sphere(spheres.length, schemes[spheres.length]));
}

function triggerSendEffect() {
    if (isSending) return;
    isSending = true;
    setTimeout(() => isSending = false, 3000);
}
