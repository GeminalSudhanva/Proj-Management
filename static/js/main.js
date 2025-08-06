// Enhanced JavaScript for better user experience

// Show loading spinner on form submit
const forms = document.querySelectorAll('form');
forms.forEach(form => {
  form.addEventListener('submit', function() {
    let spinner = document.createElement('div');
    spinner.className = 'spinner-border text-primary position-fixed top-50 start-50 translate-middle';
    spinner.style.zIndex = 2000;
    spinner.setAttribute('role', 'status');
    spinner.innerHTML = '<span class="visually-hidden">Loading...</span>';
    document.body.appendChild(spinner);
  });
});

// Confirmation dialog for delete buttons
const deleteButtons = document.querySelectorAll('.btn-delete');
deleteButtons.forEach(btn => {
  btn.addEventListener('click', function(event) {
    if (!confirm('Are you sure you want to delete this item?')) {
      event.preventDefault();
    }
  });
});

// Smooth scroll to top functionality
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// Add scroll to top button when user scrolls down
window.addEventListener('scroll', function() {
  const scrollTop = document.querySelector('.scroll-to-top');
  if (window.pageYOffset > 300) {
    if (!scrollTop) {
      const button = document.createElement('button');
      button.className = 'btn btn-primary position-fixed bottom-0 end-0 m-3 rounded-circle';
      button.style.zIndex = 1000;
      button.innerHTML = '<i class="fas fa-arrow-up"></i>';
      button.onclick = scrollToTop;
      document.body.appendChild(button);
    }
  } else {
    if (scrollTop) {
      scrollTop.remove();
    }
  }
});

// Add hover effects to cards
document.addEventListener('DOMContentLoaded', function() {
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-5px)';
    });
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });
});

// Add typing animation to headings
function typeWriter(element, text, speed = 100) {
  let i = 0;
  element.innerHTML = '';
  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  type();
}

// Animate progress bars
function animateProgressBars() {
  const progressBars = document.querySelectorAll('.progress-bar');
  progressBars.forEach(bar => {
    const width = bar.style.width;
    bar.style.width = '0%';
    setTimeout(() => {
      bar.style.width = width;
      bar.style.transition = 'width 1s ease-in-out';
    }, 500);
  });
}

// Add tooltip functionality
function initializeTooltips() {
  const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipElements.forEach(element => {
    new bootstrap.Tooltip(element);
  });
}

// Add notification system
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
  notification.style.zIndex = 2000;
  notification.innerHTML = `
    <i class="fas fa-info-circle me-2"></i>${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Initialize all enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips
  initializeTooltips();
  
  // Animate progress bars
  animateProgressBars();
  
  // Add smooth transitions to all interactive elements
  const interactiveElements = document.querySelectorAll('a, button, .card, .list-group-item');
  interactiveElements.forEach(element => {
    element.style.transition = 'all 0.3s ease';
  });
  
  // Add parallax effect to background
  window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('body');
    const speed = scrolled * 0.5;
    parallax.style.backgroundPosition = `center ${speed}px`;
  });
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
  // Ctrl/Cmd + N for new project
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    const newProjectBtn = document.querySelector('a[href*="create_project"]');
    if (newProjectBtn) newProjectBtn.click();
  }
  
  // Ctrl/Cmd + S for save (if on a form)
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    const form = document.querySelector('form');
    if (form) form.submit();
  }
  
  // Escape to close modals
  if (e.key === 'Escape') {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) modalInstance.hide();
    });
  }
});

// Add auto-save functionality for forms
function setupAutoSave() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('input', function() {
        // Save form data to localStorage
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
          data[key] = value;
        }
        localStorage.setItem('form_autosave', JSON.stringify(data));
      });
    });
  });
}

// Restore auto-saved form data
function restoreAutoSave() {
  const savedData = localStorage.getItem('form_autosave');
  if (savedData) {
    const data = JSON.parse(savedData);
    const form = document.querySelector('form');
    if (form) {
      Object.keys(data).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input && !input.value) {
          input.value = data[key];
        }
      });
    }
  }
}

// Initialize auto-save
document.addEventListener('DOMContentLoaded', function() {
  setupAutoSave();
  restoreAutoSave();
});