from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed, FileRequired
from wtforms import StringField, TextAreaField, PasswordField, SelectField, BooleanField, URLField, HiddenField, SubmitField
from wtforms.validators import DataRequired, Email, Length, EqualTo, Optional, URL, ValidationError
from wtforms.widgets import TextArea
from models import Category, Tag, User

class LoginForm(FlaskForm):
    email = StringField('E-mail', validators=[DataRequired(), Email()])
    password = PasswordField('Senha', validators=[DataRequired()])
    remember_me = BooleanField('Lembrar de mim')
    submit = SubmitField('Entrar')

class RegisterForm(FlaskForm):
    username = StringField('Nome de usuário', validators=[DataRequired(), Length(min=3, max=80)])
    email = StringField('E-mail', validators=[DataRequired(), Email()])
    first_name = StringField('Nome', validators=[DataRequired(), Length(max=80)])
    last_name = StringField('Sobrenome', validators=[DataRequired(), Length(max=80)])
    password = PasswordField('Senha', validators=[DataRequired(), Length(min=6)])
    password2 = PasswordField('Confirmar senha', 
                             validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Cadastrar')
    
    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('Nome de usuário já existe. Escolha outro.')
    
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('E-mail já cadastrado. Use outro e-mail.')

class ForgotPasswordForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])

class ResetPasswordForm(FlaskForm):
    password = PasswordField('New Password', validators=[DataRequired(), Length(min=6)])
    password_confirm = PasswordField('Confirm New Password', 
                                   validators=[DataRequired(), EqualTo('password')])

class ProfileForm(FlaskForm):
    first_name = StringField('First Name', validators=[DataRequired(), Length(max=80)])
    last_name = StringField('Last Name', validators=[DataRequired(), Length(max=80)])
    bio = TextAreaField('Bio', validators=[Optional(), Length(max=500)])
    profile_image = FileField('Profile Image', 
                            validators=[Optional(), FileAllowed(['jpg', 'png', 'jpeg'], 'Images only!')])

class ProjectForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired(), Length(max=200)])
    description = TextAreaField('Description', validators=[DataRequired()])
    content = TextAreaField('Content', widget=TextArea(), validators=[Optional()])
    category_id = SelectField('Category', coerce=int, validators=[Optional()])
    tags = StringField('Tags (comma-separated)', validators=[Optional()])
    external_url = URLField('External URL', validators=[Optional(), URL()])
    github_url = URLField('GitHub URL', validators=[Optional(), URL()])
    demo_url = URLField('Demo URL', validators=[Optional(), URL()])
    status = SelectField('Status', choices=[('draft', 'Draft'), ('published', 'Published')], 
                        default='draft')
    featured = BooleanField('Featured Project')
    featured_image = FileField('Featured Image', 
                             validators=[Optional(), FileAllowed(['jpg', 'png', 'jpeg'], 'Images only!')])
    
    def __init__(self, *args, **kwargs):
        super(ProjectForm, self).__init__(*args, **kwargs)
        categories = [(0, 'Sem categoria')] + [(c.id, c.name) for c in Category.query.all()]
        self.category_id.choices = categories

class CategoryForm(FlaskForm):
    name = StringField('Name', validators=[DataRequired(), Length(max=80)])
    description = TextAreaField('Description', validators=[Optional()])

class CommentForm(FlaskForm):
    content = TextAreaField('Comment', validators=[DataRequired(), Length(max=1000)],
                          render_kw={"placeholder": "Share your thoughts..."})

class MediaUploadForm(FlaskForm):
    media_files = FileField('Upload Files', 
                          validators=[FileRequired(), 
                                    FileAllowed(['jpg', 'png', 'jpeg', 'gif', 'pdf', 'mp4', 'mov'], 
                                              'Images, PDFs, and videos only!')], 
                          render_kw={"multiple": True})
    project_id = HiddenField()

class SiteSettingsForm(FlaskForm):
    site_title = StringField('Site Title', validators=[DataRequired(), Length(max=200)])
    site_description = TextAreaField('Site Description', validators=[Optional()])
    owner_name = StringField('Owner Name', validators=[DataRequired(), Length(max=100)])
    owner_title = StringField('Owner Title', validators=[Optional(), Length(max=200)])
    owner_bio = TextAreaField('Owner Bio', validators=[Optional()])
    owner_image = FileField('Owner Image', 
                          validators=[Optional(), FileAllowed(['jpg', 'png', 'jpeg'], 'Images only!')])
    linkedin_url = URLField('LinkedIn URL', validators=[Optional(), URL()])
    github_url = URLField('GitHub URL', validators=[Optional(), URL()])
    twitter_url = URLField('Twitter URL', validators=[Optional(), URL()])
    email_contact = StringField('Contact Email', validators=[Optional(), Email()])
