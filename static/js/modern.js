// Modern Digital Portfolio JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all features
    initTheme();
    initLikeButtons();
    initCommentForms();
    initMediaUploads();
    initSocialSharing();
    initTooltips();
    initAnimations();
    initScrollEffects();
});

// Theme Management
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
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
            
            // Smooth transition effect
            document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
            setTimeout(() => {
                document.body.style.transition = '';
            }, 300);
        });
    }
    
    function setTheme(theme) {
        htmlElement.setAttribute('data-bs-theme', theme);
        if (themeIcon && themeText) {
            if (theme === 'dark') {
                themeIcon.className = 'fas fa-sun me-1';
                themeText.textContent = 'Claro';
            } else {
                themeIcon.className = 'fas fa-moon me-1';
                themeText.textContent = 'Escuro';
            }
        }
        
        // Update navbar classes
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (theme === 'dark') {
                navbar.classList.remove('navbar-light', 'bg-white');
                navbar.classList.add('navbar-dark', 'bg-dark');
            } else {
                navbar.classList.remove('navbar-dark', 'bg-dark');
                navbar.classList.add('navbar-light', 'bg-white');
            }
        }
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
            
            // Optimistic UI update
            const wasLiked = this.classList.contains('liked');
            this.classList.toggle('liked');
            
            if (wasLiked) {
                icon.classList.remove('fas');
                icon.classList.add('far');
                count.textContent = parseInt(count.textContent) - 1;
            } else {
                icon.classList.remove('far');
                icon.classList.add('fas');
                count.textContent = parseInt(count.textContent) + 1;
                
                // Heart animation
                createHeartAnimation(this);
            }
            
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
                    // Update with actual count from server
                    count.textContent = data.like_count;
                } else {
                    // Revert optimistic update
                    this.classList.toggle('liked');
                    if (wasLiked) {
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                        count.textContent = parseInt(count.textContent) + 1;
                    } else {
                        icon.classList.remove('fas');
                        icon.classList.add('far');
                        count.textContent = parseInt(count.textContent) - 1;
                    }
                    showToast('Erro ao curtir projeto', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                // Revert optimistic update
                this.classList.toggle('liked');
                showToast('Erro ao curtir projeto', 'error');
            })
            .finally(() => {
                this.disabled = false;
            });
        });
    });
}

function createHeartAnimation(button) {
    const heart = document.createElement('i');
    heart.className = 'fas fa-heart';
    heart.style.cssText = `
        position: absolute;
        color: #dc3545;
        font-size: 1.2rem;
        pointer-events: none;
        animation: heartFloat 1s ease-out forwards;
        z-index: 1000;
    `;
    
    const rect = button.getBoundingClientRect();
    heart.style.left = rect.left + rect.width / 2 + 'px';
    heart.style.top = rect.top + rect.height / 2 + 'px';
    
    document.body.appendChild(heart);
    
    // Add CSS animation if not already present
    if (!document.getElementById('heart-animation-style')) {
        const style = document.createElement('style');
        style.id = 'heart-animation-style';
        style.textContent = `
            @keyframes heartFloat {
                0% { transform: translateY(0) scale(1); opacity: 1; }
                100% { transform: translateY(-30px) scale(1.5); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        heart.remove();
    }, 1000);
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
            const textarea = this.querySelector('textarea');
            
            // Validation
            if (!textarea.value.trim()) {
                showToast('Por favor, escreva um comentário', 'warning');
                return;
            }
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';
            
            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCSRFToken()
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Add new comment to the list
                    addCommentToList(data.comment);
                    
                    // Clear form
                    this.reset();
                    textarea.style.height = 'auto';
                    
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
        
        // Auto-resize textarea
        const textarea = form.querySelector('textarea');
        if (textarea) {
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = this.scrollHeight + 'px';
            });
        }
    });
}

function addCommentToList(comment) {
    const commentsList = document.getElementById('comments-list');
    if (commentsList) {
        const commentHtml = `
            <div class="comment-item animate-on-scroll">
                <div class="d-flex">
                    <img src="${comment.user.profile_image || '/static/img/default-avatar.svg'}" 
                         alt="${comment.user.name}" class="profile-image-sm rounded-circle me-3">
                    <div class="flex-grow-1">
                        <div class="comment-author">${comment.user.name}</div>
                        <div class="comment-date">${comment.created_at}</div>
                        <div class="comment-content">${comment.content}</div>
                    </div>
                </div>
            </div>
        `;
        
        commentsList.insertAdjacentHTML('afterbegin', commentHtml);
        
        // Animate new comment
        const newComment = commentsList.firstElementChild;
        setTimeout(() => {
            newComment.classList.add('fade-in');
        }, 100);
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
                
                files.forEach((file, index) => {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const preview = document.createElement('div');
                            preview.className = 'media-preview-wrapper position-relative d-inline-block m-2';
                            preview.innerHTML = `
                                <img src="${e.target.result}" class="media-preview rounded shadow-sm" alt="Preview">
                                <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle" 
                                        onclick="removePreview(this, ${index})" style="transform: translate(50%, -50%);">
                                    <i class="fas fa-times"></i>
                                </button>
                                <div class="text-center mt-1">
                                    <small class="text-muted">${file.name}</small>
                                </div>
                            `;
                            previewContainer.appendChild(preview);
                        };
                        reader.readAsDataURL(file);
                    } else {
                        // For non-image files, show file info
                        const preview = document.createElement('div');
                        preview.className = 'file-preview d-inline-block m-2 p-3 border rounded text-center';
                        preview.innerHTML = `
                            <i class="fas fa-file fa-2x mb-2 text-muted"></i>
                            <div><small class="text-muted">${file.name}</small></div>
                            <div><small class="text-muted">${formatFileSize(file.size)}</small></div>
                        `;
                        previewContainer.appendChild(preview);
                    }
                });
            }
        });
        
        // Drag and drop
        const dropZone = input.closest('.drop-zone');
        if (dropZone) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, preventDefaults, false);
            });
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
            });
            
            dropZone.addEventListener('drop', function(e) {
                const dt = e.dataTransfer;
                const files = dt.files;
                input.files = files;
                input.dispatchEvent(new Event('change'));
            });
        }
    });
}

function removePreview(button, index) {
    button.closest('.media-preview-wrapper').remove();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
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
            const image = this.dataset.image || '';
            
            let shareUrl = '';
            let windowFeatures = 'width=600,height=400,scrollbars=yes,resizable=yes,left=' + 
                               (window.screen.width / 2 - 300) + ',top=' + (window.screen.height / 2 - 200);
            
            switch (platform) {
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`;
                    break;
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
                    break;
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                    break;
                case 'whatsapp':
                    shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
                    windowFeatures = 'width=400,height=600,scrollbars=yes,resizable=yes';
                    break;
                case 'copy':
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(url).then(() => {
                            showToast('Link copiado para a área de transferência!', 'success');
                        }).catch(() => {
                            showToast('Erro ao copiar link', 'error');
                        });
                    } else {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = url;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        showToast('Link copiado para a área de transferência!', 'success');
                    }
                    return;
            }
            
            if (shareUrl) {
                window.open(shareUrl, 'share-window', windowFeatures);
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
    
    // Hero text animation
    const heroElements = document.querySelectorAll('.fade-in-up');
    heroElements.forEach((el, index) => {
        el.style.animationDelay = (index * 0.2) + 's';
    });
}

// Scroll Effects
function initScrollEffects() {
    let ticking = false;
    
    function updateScrollEffects() {
        const scrolled = window.pageYOffset;
        const navbar = document.querySelector('.navbar');
        
        if (navbar) {
            if (scrolled > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
        
        ticking = false;
    }
    
    function requestScrollUpdate() {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestScrollUpdate);
    
    // Back to top button
    const backToTop = document.createElement('button');
    backToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTop.className = 'btn btn-primary position-fixed rounded-circle back-to-top';
    backToTop.style.cssText = `
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        z-index: 1000;
        display: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(backToTop);
    
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.style.display = 'block';
        } else {
            backToTop.style.display = 'none';
        }
    });
}

// Utility Functions
function getCSRFToken() {
    const token = document.querySelector('meta[name="csrf-token"]');
    return token ? token.getAttribute('content') : '';
}

function showToast(message, type = 'info', duration = 5000) {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;
    
    const toastId = 'toast-' + Date.now();
    const iconClass = getToastIcon(type);
    const colorClass = getToastColor(type);
    
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${colorClass} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center">
                    <i class="fas fa-${iconClass} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: duration });
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
        'info': 'primary'
    };
    return colors[type] || colors['info'];
}

// Form validation
function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

// Search functionality
function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(this.value);
            }, 500);
        });
    }
}

function performSearch(query) {
    if (query.length < 2) return;
    
    fetch(`/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            displaySearchResults(data.results);
        })
        .catch(error => {
            console.error('Search error:', error);
        });
}

function displaySearchResults(results) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="text-muted">Nenhum resultado encontrado.</p>';
        return;
    }
    
    const html = results.map(result => `
        <div class="search-result-item p-3 border-bottom">
            <h6><a href="${result.url}" class="text-decoration-none">${result.title}</a></h6>
            <p class="text-muted small mb-1">${result.description}</p>
            <small class="text-muted">${result.type}</small>
        </div>
    `).join('');
    
    resultsContainer.innerHTML = html;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
} else {
    initSearch();
}