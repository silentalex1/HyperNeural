document.addEventListener('mousemove', e => {
    const bg = document.getElementById('glow-bg');
    if (bg) {
        bg.style.transform = `translate(${e.clientX * 0.04}px, ${e.clientY * 0.04}px)`;
    }
});
