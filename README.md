# ProjectMngmt - Professional Project Management Platform

A modern, collaborative project management platform built with Flask, MongoDB, and Bootstrap. Perfect for teams to manage projects, assign tasks, and track progress.

## 🌟 Features

- **Team Collaboration**: Invite team members and work together seamlessly
- **Task Management**: Create, assign, and track tasks with status updates
- **Progress Tracking**: Real-time progress visualization and analytics
- **User Authentication**: Secure login and registration system
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Modern UI**: Beautiful soft modern pastel theme

## 🚀 Quick Deployment Options

### Option 1: Render (Recommended - Free)
1. **Fork/Clone** this repository to your GitHub
2. **Sign up** at [render.com](https://render.com)
3. **Create New Web Service**
4. **Connect your GitHub repository**
5. **Configure settings**:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python run.py`
   - **Environment Variables**:
     ```
     SECRET_KEY=your-secret-key-here
     MONGO_URI=your-mongodb-connection-string
     ```
6. **Deploy** and share the URL with friends!

### Option 2: Railway (Free Tier Available)
1. **Sign up** at [railway.app](https://railway.app)
2. **Connect your GitHub repository**
3. **Add environment variables**:
   ```
   SECRET_KEY=your-secret-key-here
   MONGO_URI=your-mongodb-connection-string
   ```
4. **Deploy** and get your public URL

### Option 3: PythonAnywhere (Free)
1. **Sign up** at [pythonanywhere.com](https://pythonanywhere.com)
2. **Upload your code** or clone from GitHub
3. **Install requirements**: `pip install -r requirements.txt`
4. **Configure WSGI file** for Flask
5. **Set environment variables** in the web app settings
6. **Deploy** and share your URL

### Option 4: Heroku (Paid)
1. **Install Heroku CLI**
2. **Create Heroku app**: `heroku create your-app-name`
3. **Add MongoDB addon**: `heroku addons:create mongolab`
4. **Set environment variables**:
   ```
   heroku config:set SECRET_KEY=your-secret-key
   ```
5. **Deploy**: `git push heroku main`

## 📋 Setup Instructions

### Prerequisites
- Python 3.8+
- MongoDB database (local or cloud)
- Git

### Local Development
```bash
# Clone the repository
git clone <your-repo-url>
cd projectMngmt

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
# Create a .env file with:
SECRET_KEY=your-secret-key-here
MONGO_URI=your-mongodb-connection-string

# Run the application
python run.py
```

## 🔧 Environment Variables

Create a `.env` file in your project root:

```env
SECRET_KEY=your-super-secret-key-here
MONGO_URI=mongodb://localhost:27017/projectMngmt
```

For cloud deployment, use MongoDB Atlas:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/projectMngmt
```

## 📱 How to Use

### For Project Leaders:
1. **Register** and create an account
2. **Create a project** with name and description
3. **Invite team members** by email
4. **Create and assign tasks** to team members
5. **Monitor progress** through the dashboard

### For Team Members:
1. **Register** or login to your account
2. **Accept invitations** from project leaders
3. **View assigned tasks** in your project
4. **Update task status** (To-do → In Progress → Done)
5. **Track your progress** and contribution

## 🌐 Sharing with Friends

After deployment, share your application URL:
- **Example**: `https://your-app-name.onrender.com`
- **Friends can register** and start using immediately
- **No installation required** - works in any web browser
- **Mobile-friendly** - works on phones and tablets

## 🔒 Security Features

- **User authentication** with secure password hashing
- **Role-based access** (project creators vs team members)
- **Session management** with Flask-Login
- **Input validation** and sanitization
- **CSRF protection** for forms

## 🎨 UI/UX Features

- **Modern pastel theme** with soft colors
- **Responsive design** for all devices
- **Interactive elements** with hover effects
- **Progress visualization** with charts and badges
- **Real-time updates** and notifications

## 📊 Project Analytics

- **Overall project progress** percentage
- **Individual team member** progress tracking
- **Task completion** statistics
- **Deadline management** and tracking
- **Team performance** insights

## 🛠️ Technical Stack

- **Backend**: Flask (Python)
- **Database**: MongoDB
- **Frontend**: Bootstrap 5, HTML5, CSS3, JavaScript
- **Authentication**: Flask-Login
- **Icons**: Font Awesome
- **Styling**: Custom CSS with modern gradients

## 📞 Support

If you encounter any issues:
1. Check the deployment platform's logs
2. Verify environment variables are set correctly
3. Ensure MongoDB connection is working
4. Check that all dependencies are installed

## 🎯 Quick Start for Friends

1. **Share your deployed URL** with friends
2. **They register** with email and password
3. **You invite them** to your projects
4. **Start collaborating** immediately!

Your friends can now use your professional project management platform from anywhere in the world! 🌍