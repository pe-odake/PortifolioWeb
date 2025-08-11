import os
import secrets
from datetime import datetime
from flask import render_template, redirect, url_for, flash, request, jsonify, abort, send_from_directory
from flask_login import login_user, logout_user, login_required, current_user
from flask_mail import Message
from werkzeug.utils import secure_filename
from PIL import Image
from app import app, db, mail
from models import User, Project, Category, Tag, Comment, Like, ProjectMedia, SiteSettings
from forms import (LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm, 
                  ProfileForm, ProjectForm, CategoryForm, CommentForm, MediaUploadForm, SiteSettingsForm)

# Utility functions
def save_picture(form_picture, folder, size=(800, 600)):
    """Save uploaded picture with resizing"""
    random_hex = secrets.token_hex(8)
    _, f_ext = os.path.splitext(form_picture.filename)
    picture_fn = random_hex + f_ext
    picture_path = os.path.join(app.root_path, 'static', folder, picture_fn)
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(picture_path), exist_ok=True)
    
    # Resize image
    img = Image.open(form_picture)
    img.thumbnail(size, Image.Resampling.LANCZOS)
    img.save(picture_path)
    
    return picture_fn

def get_site_settings():
    """Get or create site settings"""
    settings = SiteSettings.query.first()
    if not settings:
        settings = SiteSettings()
        db.session.add(settings)
        db.session.commit()
    return settings

@app.context_processor
def inject_site_settings():
    """Make site settings available in all templates"""
    return {'site_settings': get_site_settings()}

# Main routes
@app.route('/')
def index():
    """Home page with featured projects"""
    featured_projects = Project.query.filter_by(status='published', featured=True).limit(3).all()
    recent_projects = Project.query.filter_by(status='published').order_by(Project.created_at.desc()).limit(6).all()
    return render_template('index.html', featured_projects=featured_projects, recent_projects=recent_projects)

@app.route('/about')
def about():
    """About page"""
    return render_template('portfolio/about.html')

# Authentication routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember_me.data)
            next_page = request.args.get('next')
            flash('Successfully logged in!', 'success')
            return redirect(next_page) if next_page else redirect(url_for('index'))
        flash('Invalid email or password', 'danger')
    
    return render_template('auth/login.html', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    form = RegisterForm()
    if form.validate_on_submit():
        user = User(
            username=form.username.data,
            email=form.email.data,
            first_name=form.first_name.data,
            last_name=form.last_name.data
        )
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Registration successful! You can now log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('auth/register.html', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    form = ForgotPasswordForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user:
            token = user.generate_reset_token()
            db.session.commit()
            
            # Send reset email
            if app.config.get('MAIL_USERNAME'):
                msg = Message(
                    'Password Reset Request',
                    recipients=[user.email]
                )
                msg.body = f'''To reset your password, visit the following link:
{url_for('reset_password', token=token, _external=True)}

If you did not make this request, please ignore this email.
'''
                try:
                    mail.send(msg)
                    flash('A password reset link has been sent to your email.', 'info')
                except Exception as e:
                    flash('Failed to send email. Please try again later.', 'danger')
                    app.logger.error(f'Mail sending failed: {e}')
            else:
                flash('Email service not configured. Please contact administrator.', 'warning')
        else:
            flash('A password reset link has been sent to your email.', 'info')  # Same message for security
        
        return redirect(url_for('login'))
    
    return render_template('auth/forgot_password.html', form=form)

@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    user = User.query.filter_by(reset_token=token).first()
    if not user or not user.verify_reset_token(token):
        flash('Invalid or expired reset token.', 'danger')
        return redirect(url_for('forgot_password'))
    
    form = ResetPasswordForm()
    if form.validate_on_submit():
        user.set_password(form.password.data)
        user.clear_reset_token()
        db.session.commit()
        flash('Your password has been reset! You can now log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('auth/reset_password.html', form=form)

# Profile routes
@app.route('/profile/edit', methods=['GET', 'POST'])
@login_required
def edit_profile():
    form = ProfileForm(obj=current_user)
    
    if form.validate_on_submit():
        current_user.first_name = form.first_name.data
        current_user.last_name = form.last_name.data
        current_user.bio = form.bio.data
        
        if form.profile_image.data:
            picture_file = save_picture(form.profile_image.data, 'uploads/profiles', (300, 300))
            current_user.profile_image = picture_file
        
        db.session.commit()
        flash('Profile updated successfully!', 'success')
        return redirect(url_for('edit_profile'))
    
    return render_template('profile/edit.html', form=form)

# Portfolio routes
@app.route('/projects')
def projects():
    page = request.args.get('page', 1, type=int)
    category_id = request.args.get('category', type=int)
    tag_name = request.args.get('tag')
    
    query = Project.query.filter_by(status='published')
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    if tag_name:
        tag = Tag.query.filter_by(name=tag_name).first()
        if tag:
            query = query.filter(Project.tags.contains(tag))
    
    projects = query.order_by(Project.created_at.desc()).paginate(
        page=page, per_page=9, error_out=False
    )
    
    categories = Category.query.all()
    tags = Tag.query.all()
    
    return render_template('portfolio/projects.html', 
                         projects=projects, categories=categories, tags=tags)

@app.route('/project/<int:id>')
def project_detail(id):
    project = Project.query.filter_by(id=id, status='published').first_or_404()
    
    # Get comments
    comments = Comment.query.filter_by(project_id=id).order_by(Comment.created_at.desc()).all()
    
    # Comment form for authenticated users
    comment_form = CommentForm() if current_user.is_authenticated else None
    
    # Related projects
    related_projects = Project.query.filter(
        Project.id != id,
        Project.status == 'published',
        Project.category_id == project.category_id
    ).limit(3).all()
    
    return render_template('portfolio/project_detail.html', 
                         project=project, comments=comments, 
                         comment_form=comment_form, related_projects=related_projects)

@app.route('/project/<int:id>/comment', methods=['POST'])
@login_required
def add_comment(id):
    project = Project.query.filter_by(id=id, status='published').first_or_404()
    form = CommentForm()
    
    if form.validate_on_submit():
        comment = Comment(
            content=form.content.data,
            user_id=current_user.id,
            project_id=project.id
        )
        db.session.add(comment)
        db.session.commit()
        flash('Comment added successfully!', 'success')
    
    return redirect(url_for('project_detail', id=id))

@app.route('/project/<int:id>/like', methods=['POST'])
@login_required
def toggle_like(id):
    project = Project.query.filter_by(id=id, status='published').first_or_404()
    
    like = Like.query.filter_by(user_id=current_user.id, project_id=project.id).first()
    
    if like:
        db.session.delete(like)
        liked = False
    else:
        like = Like(user_id=current_user.id, project_id=project.id)
        db.session.add(like)
        liked = True
    
    db.session.commit()
    
    return jsonify({
        'liked': liked,
        'like_count': project.like_count
    })

# Admin routes
@app.route('/admin')
@login_required
def admin_dashboard():
    if not current_user.is_admin:
        abort(403)
    
    # Dashboard stats
    total_projects = Project.query.count()
    published_projects = Project.query.filter_by(status='published').count()
    draft_projects = Project.query.filter_by(status='draft').count()
    total_comments = Comment.query.count()
    total_likes = Like.query.count()
    
    # Recent activity
    recent_comments = Comment.query.order_by(Comment.created_at.desc()).limit(5).all()
    recent_projects = Project.query.order_by(Project.created_at.desc()).limit(5).all()
    
    return render_template('admin/dashboard.html',
                         total_projects=total_projects,
                         published_projects=published_projects,
                         draft_projects=draft_projects,
                         total_comments=total_comments,
                         total_likes=total_likes,
                         recent_comments=recent_comments,
                         recent_projects=recent_projects)

@app.route('/admin/projects')
@login_required
def admin_projects():
    if not current_user.is_admin:
        abort(403)
    
    page = request.args.get('page', 1, type=int)
    projects = Project.query.order_by(Project.created_at.desc()).paginate(
        page=page, per_page=10, error_out=False
    )
    
    return render_template('admin/projects.html', projects=projects)

@app.route('/admin/project/new', methods=['GET', 'POST'])
@login_required
def admin_new_project():
    if not current_user.is_admin:
        abort(403)
    
    form = ProjectForm()
    
    if form.validate_on_submit():
        project = Project(
            title=form.title.data,
            description=form.description.data,
            content=form.content.data,
            category_id=form.category_id.data if form.category_id.data != 0 else None,
            external_url=form.external_url.data,
            github_url=form.github_url.data,
            demo_url=form.demo_url.data,
            status=form.status.data,
            featured=form.featured.data
        )
        
        if form.featured_image.data:
            picture_file = save_picture(form.featured_image.data, 'uploads/projects')
            project.featured_image = picture_file
        
        db.session.add(project)
        db.session.flush()  # Get the project ID
        
        # Handle tags
        if form.tags.data:
            tag_names = [name.strip() for name in form.tags.data.split(',') if name.strip()]
            for tag_name in tag_names:
                tag = Tag.query.filter_by(name=tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    db.session.add(tag)
                project.tags.append(tag)
        
        db.session.commit()
        flash('Project created successfully!', 'success')
        return redirect(url_for('admin_projects'))
    
    return render_template('admin/project_form.html', form=form, title='New Project')

@app.route('/admin/project/<int:id>/edit', methods=['GET', 'POST'])
@login_required
def admin_edit_project(id):
    if not current_user.is_admin:
        abort(403)
    
    project = Project.query.get_or_404(id)
    form = ProjectForm(obj=project)
    
    if request.method == 'GET':
        form.tags.data = ', '.join([tag.name for tag in project.tags])
    
    if form.validate_on_submit():
        project.title = form.title.data
        project.description = form.description.data
        project.content = form.content.data
        project.category_id = form.category_id.data if form.category_id.data != 0 else None
        project.external_url = form.external_url.data
        project.github_url = form.github_url.data
        project.demo_url = form.demo_url.data
        project.status = form.status.data
        project.featured = form.featured.data
        project.updated_at = datetime.utcnow()
        
        if form.featured_image.data:
            picture_file = save_picture(form.featured_image.data, 'uploads/projects')
            project.featured_image = picture_file
        
        # Handle tags
        project.tags.clear()
        if form.tags.data:
            tag_names = [name.strip() for name in form.tags.data.split(',') if name.strip()]
            for tag_name in tag_names:
                tag = Tag.query.filter_by(name=tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    db.session.add(tag)
                project.tags.append(tag)
        
        db.session.commit()
        flash('Project updated successfully!', 'success')
        return redirect(url_for('admin_projects'))
    
    return render_template('admin/project_form.html', form=form, project=project, title='Edit Project')

@app.route('/admin/project/<int:id>/delete', methods=['POST'])
@login_required
def admin_delete_project(id):
    if not current_user.is_admin:
        abort(403)
    
    project = Project.query.get_or_404(id)
    db.session.delete(project)
    db.session.commit()
    flash('Project deleted successfully!', 'success')
    return redirect(url_for('admin_projects'))

# File serving
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(os.path.join(app.root_path, 'static', 'uploads'), filename)

# Error handlers
@app.errorhandler(403)
def forbidden(error):
    return render_template('errors/403.html'), 403

@app.errorhandler(404)
def not_found(error):
    return render_template('errors/404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('errors/500.html'), 500
