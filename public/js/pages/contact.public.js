// public/js/pages/contact.public.js

function initContactForm() {
  
    const contactForm = document.getElementById("contact-form");
    const statusDiv = document.getElementById("contact-form-status");
    const submitButton = contactForm ? contactForm.querySelector("button[type='submit']") : null;
  
    if (!contactForm) {
      // Si no estamos en la página de contacto o el form no existe, no hacer nada
      // console.log("Contact form not found on this page.");
      return;
    }
    if (!statusDiv) {
      console.error("Element #contact-form-status not found!");
    }
    if (!submitButton) {
        console.error("Submit button for contact form not found!");
    }
  
    const nameInput = document.getElementById('contact-name');
    const emailInput = document.getElementById('contact-email');
    const subjectInput = document.getElementById('contact-subject');
    const messageInput = document.getElementById('contact-message');
  
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault(); // Prevenir envío tradicional del formulario
      console.log("Contact form submitted.");
  
      if (!statusDiv || !submitButton) return; // Salir si falta algo esencial
  
      // Limpiar estado anterior
      statusDiv.textContent = "";
      statusDiv.className = "form-status"; // Reset classes
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = "Sending..."; // O usa i18next: _t('sending', 'Sending...');
  
      // Recoger datos del formulario
      const formData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        subject: subjectInput.value.trim(),
        message: messageInput.value.trim(),
      };
  
      // Validación simple en frontend (puedes mejorarla)
      if (!formData.name || !formData.email || !formData.subject || !formData.message) {
          statusDiv.textContent = "Please fill in all required fields."; //_t('error_all_fields_required', 'Please fill in all required fields.')
          statusDiv.classList.add("error");
          statusDiv.style.display = 'block';
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
          return;
      }
  
  
      try {
        const response = await fetch("/api/contact", { // Llama a tu ruta de backend
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
  
        const result = await response.json();
  
        if (response.ok && result.success) {
          statusDiv.textContent = result.message;
          statusDiv.classList.add("success");
          statusDiv.style.display = 'block';
          contactForm.reset(); // Limpia el formulario
          // Resetea los labels flotantes si es necesario (forzar reflow o añadir/quitar clase)
          document.querySelectorAll('.input-container .input-label').forEach(label => {
               // Una forma simple es forzar un re-check del placeholder (puede variar)
              const input = document.getElementById(label.getAttribute('for'));
              if(input) input.dispatchEvent(new Event('input', { bubbles: true }));
               // O, si controlas el estado con clases, quita la clase 'active' o 'float'
          });
          submitButton.textContent = originalButtonText; // No lo deshabilites en éxito
           submitButton.disabled = false; // Mantener habilitado
  
  
        } else {
          // Error del servidor o validación fallida en backend
          statusDiv.textContent = result.message || "An unknown error occurred."; // _t('error_unknown_server', 'An unknown error occurred.');
          statusDiv.classList.add("error");
          statusDiv.style.display = 'block';
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      } catch (error) {
        console.error("Error sending contact form data:", error);
        statusDiv.textContent = "Failed to connect to the server. Please check your connection."; // _t('error_network_connection', 'Failed to connect to the server. Please check your connection.');
        statusDiv.classList.add("error");
        statusDiv.style.display = 'block';
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    });
  }
  
  // --- Inicialización ---

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForm);
} else {
    // --- Disponibilidad Global ---
    window.pageInitializers = window.pageInitializers || {};
    window.pageInitializers.contact = initContactForm;
}