#!/usr/bin/env python3
"""
Script to set up the admin user for the portfolio system
"""
from app import app, db
from models import User, SiteSettings

def setup_admin():
    with app.app_context():
        # Check if admin user exists
        admin = User.query.filter_by(email='pedroodake@gmail.com').first()
        
        if admin:
            print("Admin user already exists. Updating...")
            admin.is_admin = True
            admin.username = 'pedro'
            admin.first_name = 'Pedro'
            admin.last_name = 'Admin'
        else:
            print("Creating admin user...")
            admin = User()
            admin.email = 'pedroodake@gmail.com'
            admin.username = 'pedro'
            admin.first_name = 'Pedro'
            admin.last_name = 'Admin'
            admin.is_admin = True
            db.session.add(admin)
        
        # Set a temporary password (user should change this)
        admin.set_password('admin123')  # Change this password immediately!
        
        # Create or update site settings
        settings = SiteSettings.query.first()
        if not settings:
            print("Creating site settings...")
            settings = SiteSettings()
            db.session.add(settings)
        
        settings.site_title = 'Meu Portfólio'
        settings.owner_name = 'Pedro'
        settings.owner_title = 'Desenvolvedor Full Stack'
        settings.site_description = 'Desenvolvedor apaixonado por criar soluções digitais inovadoras e experiências únicas.'
        settings.email_contact = 'pedroodake@gmail.com'
        settings.linkedin_url = 'https://linkedin.com/in/pedro'
        settings.github_url = 'https://github.com/pedro'
        
        db.session.commit()
        print("Admin user and site settings configured successfully!")
        print("Admin credentials:")
        print("Email: pedroodake@gmail.com")
        print("Password: admin123")
        print("⚠️  IMPORTANT: Please login and change the password immediately!")

if __name__ == '__main__':
    setup_admin()