document.addEventListener('DOMContentLoaded', function() {
  const flyerCard = document.getElementById('flyerCard');
  const flyerModal = document.getElementById('flyerModal');
  const modalContent = document.querySelector('#flyerModal .modal-content');

  flyerCard.addEventListener('click', function() {
    flyerModal.classList.add('visible');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
  });

  flyerModal.addEventListener('click', function(e) {
    if (e.target === flyerModal) {
      flyerModal.classList.remove('visible');
      document.body.style.overflow = ''; // Restore scroll
    }
  });

  modalContent.addEventListener('click', function(e) {
    e.stopPropagation();
  });

  // Optional: Close modal with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      flyerModal.classList.remove('visible');
      document.body.style.overflow = '';
    }
  });
}); 