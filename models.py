from datetime import datetime
from app import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import secrets

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    bio = db.Column(db.Text)
    profile_image = db.Column(db.String(200))
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    reset_token = db.Column(db.String(100), unique=True)
    reset_token_expires = db.Column(db.DateTime)
    
    # Relationships
    comments = db.relationship('Comment', backref='author', lazy=True, cascade='all, delete-orphan')
    likes = db.relationship('Like', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def generate_reset_token(self):
        self.reset_token = secrets.token_urlsafe(32)
        self.reset_token_expires = datetime.utcnow() + datetime.timedelta(hours=1)
        return self.reset_token
    
    def verify_reset_token(self, token):
        return (self.reset_token == token and 
                self.reset_token_expires and 
                self.reset_token_expires > datetime.utcnow())
    
    def clear_reset_token(self):
        self.reset_token = None
        self.reset_token_expires = None
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f'<User {self.username}>'

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    projects = db.relationship('Project', backref='category', lazy=True)
    
    def __repr__(self):
        return f'<Category {self.name}>'

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Tag {self.name}>'

# Association table for many-to-many relationship between projects and tags
project_tags = db.Table('project_tags',
    db.Column('project_id', db.Integer, db.ForeignKey('project.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    content = db.Column(db.Text)  # Rich text content
    featured_image = db.Column(db.String(200))
    external_url = db.Column(db.String(500))
    github_url = db.Column(db.String(500))
    demo_url = db.Column(db.String(500))
    status = db.Column(db.String(20), default='draft')  # draft, published
    featured = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))
    
    # Relationships
    tags = db.relationship('Tag', secondary=project_tags, backref=db.backref('projects', lazy=True))
    media = db.relationship('ProjectMedia', backref='project', lazy=True, cascade='all, delete-orphan')
    comments = db.relationship('Comment', backref='project', lazy=True, cascade='all, delete-orphan')
    likes = db.relationship('Like', backref='project', lazy=True, cascade='all, delete-orphan')
    
    @property
    def like_count(self):
        return len(self.likes)
    
    @property
    def comment_count(self):
        return len(self.comments)
    
    def is_liked_by(self, user):
        if not user.is_authenticated:
            return False
        return Like.query.filter_by(user_id=user.id, project_id=self.id).first() is not None
    
    def __repr__(self):
        return f'<Project {self.title}>'

class ProjectMedia(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(200), nullable=False)
    original_filename = db.Column(db.String(200), nullable=False)
    media_type = db.Column(db.String(50), nullable=False)  # image, video, document
    file_size = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Foreign Keys
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    
    def __repr__(self):
        return f'<ProjectMedia {self.original_filename}>'

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign Keys
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    
    def __repr__(self):
        return f'<Comment {self.id}>'

class Like(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Foreign Keys
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    
    # Unique constraint to prevent duplicate likes
    __table_args__ = (db.UniqueConstraint('user_id', 'project_id'),)
    
    def __repr__(self):
        return f'<Like {self.user_id}-{self.project_id}>'

class SiteSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    site_title = db.Column(db.String(200), default='Digital Portfolio')
    site_description = db.Column(db.Text, default='A showcase of my work and achievements')
    owner_name = db.Column(db.String(100), default='Portfolio Owner')
    owner_title = db.Column(db.String(200), default='Creative Professional')
    owner_bio = db.Column(db.Text)
    owner_image = db.Column(db.String(200))
    linkedin_url = db.Column(db.String(500))
    github_url = db.Column(db.String(500))
    twitter_url = db.Column(db.String(500))
    email_contact = db.Column(db.String(120))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<SiteSettings {self.site_title}>'
