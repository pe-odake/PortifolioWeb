// Main JavaScript for Digital Portfolio System

document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initTheme();
    
    // Initialize like buttons
    initLikeButtons();
    
    // Initialize comment forms
    initCommentForms();
    
    // Initialize media uploads
    initMediaUploads();
    
    // Initialize social sharing
    initSocialSharing();
    
    // Initialize tooltips
    initTooltips();
    
    // Initialize animations
    initAnimations();
});

// Theme Management
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    // Get saved theme or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = htmlElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Like Button Functionality
function initLikeButtons() {
    const likeButtons = document.querySelectorAll('.like-btn');
    
    likeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const projectId = this.dataset.projectId;
            const icon = this.querySelector('i');
            const count = this.querySelector('.like-count');
            
            // Disable button temporarily
            this.disabled = true;
            
            // Send AJAX request
            fetch(`/toggle_like/${projectId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update UI
                    if (data.liked) {
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                        this.classList.add('liked');
                    } else {
                        icon.classList.remove('fas');
                        icon.classList.add('far');
                        this.classList.remove('liked');
                    }
                    count.textContent = data.like_count;
                    
                    // Animation
                    this.style.transform = 'scale(1.2)';
                    setTimeout(() => {
                        this.style.transform = 'scale(1)';
                    }, 200);
                } else {
                    showToast('Erro ao curtir projeto', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('Erro ao curtir projeto', 'error');
            })
            .finally(() => {
                this.disabled = false;
            });
        });
    });
}

// Comment Form Handling
function initCommentForms() {
    const commentForms = document.querySelectorAll('.comment-form');
    
    commentForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';
            
            fetch(this.action, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Add new comment to the list
                    addCommentToList(data.comment);
                    
                    // Clear form
                    this.reset();
                    
                    showToast('Comentário adicionado com sucesso!', 'success');
                } else {
                    showToast(data.message || 'Erro ao adicionar comentário', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('Erro ao adicionar comentário', 'error');
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
        });
    });
}

function addCommentToList(comment) {
    const commentsList = document.getElementById('comments-list');
    if (commentsList) {
        const commentHtml = `
            <div class="comment-item fade-in">
                <div class="d-flex">
                    <img src="${comment.user.profile_image_url || '/static/img/default-avatar.png'}" 
                         alt="${comment.user.name}" class="profile-image-sm rounded-circle me-3">
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between">
                            <h6 class="mb-1">${comment.user.name}</h6>
                            <small class="text-muted">${comment.created_at}</small>
                        </div>
                        <p class="mb-1">${comment.content}</p>
                    </div>
                </div>
            </div>
        `;
        commentsList.insertAdjacentHTML('afterbegin', commentHtml);
    }
}

// Media Upload Handling
function initMediaUploads() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            const files = Array.from(this.files);
            const previewContainer = document.getElementById(`${this.id}-preview`);
            
            if (previewContainer) {
                previewContainer.innerHTML = '';
                
                files.forEach(file => {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const img = document.createElement('img');
                            img.src = e.target.result;
                            img.classList.add('media-preview');
                            previewContainer.appendChild(img);
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }
        });
    });
}

// Social Sharing
function initSocialSharing() {
    const shareButtons = document.querySelectorAll('.social-share-btn');
    
    shareButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const platform = this.dataset.platform;
            const url = this.dataset.url || window.location.href;
            const title = this.dataset.title || document.title;
            const description = this.dataset.description || '';
            
            let shareUrl = '';
            
            switch (platform) {
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                    break;
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
                    break;
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                    break;
                case 'whatsapp':
                    shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
                    break;
            }
            
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
            }
        });
    });
}

// Initialize Bootstrap Tooltips
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Initialize Animations
function initAnimations() {
    // Fade in animations on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements with animation class
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// Utility Functions
function getCSRFToken() {
    const token = document.querySelector('meta[name="csrf-token"]');
    return token ? token.getAttribute('content') : '';
}

function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;
    
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <i class="fas fa-${getToastIcon(type)} me-2 text-${getToastColor(type)}"></i>
                <strong class="me-auto">Notificação</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Remove toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
}

function getToastIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || icons['info'];
}

function getToastColor(type) {
    const colors = {
        'success': 'success',
        'error': 'danger',
        'warning': 'warning',
        'info': 'info'
    };
    return colors[type] || colors['info'];
}

// Admin Dashboard Specific Functions
if (window.location.pathname.includes('/admin')) {
    document.addEventListener('DOMContentLoaded', function() {
        initAdminFeatures();
    });
}

function initAdminFeatures() {
    // Initialize rich text editors if available
    const textareas = document.querySelectorAll('.rich-editor');
    textareas.forEach(textarea => {
        // Simple rich text functionality could be added here
        // For now, just add some basic formatting buttons
        addFormattingButtons(textarea);
    });
    
    // Initialize drag and drop for image uploads
    initDragAndDrop();
    
    // Initialize admin charts if needed
    initAdminCharts();
}

function addFormattingButtons(textarea) {
    const toolbar = document.createElement('div');
    toolbar.className = 'btn-toolbar mb-2';
    toolbar.innerHTML = `
        <div class="btn-group btn-group-sm me-2">
            <button type="button" class="btn btn-outline-secondary" data-format="bold">
                <i class="fas fa-bold"></i>
            </button>
            <button type="button" class="btn btn-outline-secondary" data-format="italic">
                <i class="fas fa-italic"></i>
            </button>
        </div>
    `;
    
    textarea.parentNode.insertBefore(toolbar, textarea);
    
    // Add event listeners for formatting buttons
    toolbar.addEventListener('click', function(e) {
        if (e.target.matches('[data-format]')) {
            const format = e.target.dataset.format;
            insertTextAtCursor(textarea, format === 'bold' ? '**' : '*');
        }
    });
}

function insertTextAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    
    textarea.value = value.substring(0, start) + text + value.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
}

function initDragAndDrop() {
    const dropZones = document.querySelectorAll('.drop-zone');
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        zone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });
        
        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            const fileInput = this.querySelector('input[type="file"]');
            
            if (fileInput && files.length > 0) {
                const dt = new DataTransfer();
                files.forEach(file => dt.items.add(file));
                fileInput.files = dt.files;
                
                // Trigger change event
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    });
}

function initAdminCharts() {
    // Initialize charts for admin dashboard
    const ctx = document.getElementById('projectsChart');
    if (ctx && typeof Chart !== 'undefined') {
        // Chart implementation would go here
        // For now, this is a placeholder
    }
}