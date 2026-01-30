// API CORE - Base Logic and Gallery

function showGallery() {
    if (!currentGallery || !currentGallery.images || currentGallery.images.length === 0) return;

    if (!currentGallery.filter) currentGallery.filter = 'ALL';

    const sources = [...new Set(currentGallery.allImages.map(i => i.source))];

    const filteredImages = currentGallery.filter === 'ALL'
        ? currentGallery.allImages
        : currentGallery.allImages.filter(i => i.source === currentGallery.filter);

    currentGallery.images = filteredImages;

    if (currentGallery.index >= filteredImages.length) currentGallery.index = 0;

    const img = filteredImages[currentGallery.index];

    const filterBadges = ['ALL', ...sources].map(source => {
        const isActive = currentGallery.filter === source;
        const count = source === 'ALL' ? currentGallery.allImages.length : currentGallery.allImages.filter(i => i.source === source).length;

        return `
            <div onclick="filterGalleryBySource('${source}')"
                 style="
                     padding: 6px 12px;
                     border-radius: 20px;
                     font-size: 0.6rem;
                     letter-spacing: 1px;
                     cursor: pointer;
                     transition: all 0.3s;
                     background: ${isActive ? 'var(--accent)' : 'transparent'};
                     color: ${isActive ? '#000' : 'var(--text)'};
                     border: 1px solid ${isActive ? 'var(--accent)' : 'rgba(var(--text-rgb), 0.3)'};
                     font-weight: ${isActive ? '700' : '400'};
                 "
                 onmouseover="if(!${isActive}) this.style.background='rgba(var(--text-rgb), 0.05)'"
                 onmouseout="if(!${isActive}) this.style.background='transparent'">
                ${source} (${count})
            </div>
        `;
    }).join('');

    voxDisplay.innerHTML = `
        <div class="gallery-container" style="position:relative; max-width:90%; margin:0 auto; animation:fadeUp 0.8s ease;">
            <div class="glass-card" style="padding:0; overflow:hidden;">
                <div style="padding:15px; border-bottom:1px solid rgba(var(--text-rgb), 0.1);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <span style="font-size:0.7rem; letter-spacing:2px; color:var(--accent); font-weight:700;">${img.source}</span>
                        <span style="font-size:0.6rem; opacity:0.5;">${currentGallery.index + 1}/${filteredImages.length}</span>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        ${filterBadges}
                    </div>
                </div>
                <img src="${img.url}" style="width:100%; max-height:65vh; object-fit:contain; display:block;" onerror="this.src='${img.fullUrl}';">
                <div style="padding:15px; border-top:1px solid rgba(var(--text-rgb), 0.1);">
                    <div style="font-size:0.85rem; font-weight:500; color:var(--text); margin-bottom:8px;">${img.title}</div>
                    <div style="font-size:0.6rem; opacity:0.4; letter-spacing:1px;">  NAVEGAR | ENTER FECHAR</div>
                </div>
            </div>
        </div>
    `;
}

function filterGalleryBySource(source) {
    if (!currentGallery || !currentGallery.active) return;
    currentGallery.filter = source;
    currentGallery.index = 0;
    showGallery();
}

function navGallery(direction) {
    if (!currentGallery || !currentGallery.active) return;
    currentGallery.index += direction;
    if (currentGallery.index < 0) currentGallery.index = currentGallery.images.length - 1;
    if (currentGallery.index >= currentGallery.images.length) currentGallery.index = 0;
    showGallery();
}

function closeGallery() {
    currentGallery.active = false;
    currentGallery.filter = 'ALL';
    voxDisplay.innerHTML = '';
    spheres[0].state = 'idle';
    isSynchronized = false;
}
