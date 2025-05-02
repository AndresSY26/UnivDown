// public/js/faq.public.js
function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');

    if (!faqItems.length) {
        // console.log("No FAQ items found on this page.");
        return;
    }

    faqItems.forEach(item => {
        const button = item.querySelector('.faq-question-button');
        const answer = item.querySelector('.faq-answer');

        if (!button || !answer) {
            console.warn("Skipping FAQ item due to missing button or answer.", item);
            return;
        }

        button.addEventListener('click', () => {
            const isExpanded = button.getAttribute('aria-expanded') === 'true';

            // Cierra todos los demás items (opcional, si quieres solo uno abierto)
            // comment this out if you want multiple open at once
             if (!isExpanded) { // Solo cierra los demás si vas a abrir este
                 faqItems.forEach(otherItem => {
                     if (otherItem !== item) {
                         const otherButton = otherItem.querySelector('.faq-question-button');
                         otherItem.classList.remove('active');
                         if(otherButton) otherButton.setAttribute('aria-expanded', 'false');
                         const otherAnswer = otherItem.querySelector('.faq-answer');
                         if(otherAnswer) otherAnswer.setAttribute('aria-hidden', 'true');
                     }
                 });
             }

            // Alterna el estado del item clickeado
            item.classList.toggle('active');
            button.setAttribute('aria-expanded', !isExpanded);
            answer.setAttribute('aria-hidden', isExpanded); // aria-hidden al contrario de expanded
        });
    });
}


// --- Inicialización ---
// --- Fallback para Carga Directa ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFaqAccordion);
} else {
    // --- Disponibilidad Global ---
    window.pageInitializers = window.pageInitializers || {};
    window.pageInitializers.faq = initFaqAccordion;
}