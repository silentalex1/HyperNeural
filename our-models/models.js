document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('model-search');
    const modelCards = document.querySelectorAll('.model-card');
    const noResults = document.getElementById('no-results');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            let visibleCount = 0;

            modelCards.forEach(card => {
                const modelName = card.getAttribute('data-name').toLowerCase();
                if (modelName.includes(query)) {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            if (noResults) {
                if (visibleCount === 0) {
                    noResults.classList.remove('hidden');
                } else {
                    noResults.classList.add('hidden');
                }
            }
        });
    }
});