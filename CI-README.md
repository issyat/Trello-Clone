# Backend CI/CD Setup

## Overview
This repository now has automated CI/CD for the backend that runs on every pull request to the `dev` branch.

## What Gets Tested
✅ **Authentication Tests** - User model and API endpoint tests  
✅ **Projects Tests** - Project model and API endpoint tests  
✅ **Django System Checks** - Configuration validation  
✅ **Database Migrations** - Schema updates  
✅ **Docker Build** - Container build verification

## CI Workflow File
- `.github/workflows/backend-ci.yml` - Complete CI/CD with PostgreSQL service, testing, and Docker build

## How It Works

### When CI Runs
- **Trigger**: Pull requests to `dev` branch with changes in `backend/` folder
- **Platform**: Ubuntu latest with Python 3.11
- **Database**: SQLite for testing (fast and reliable)

### CI Steps
1. **Setup**: Checkout code and install Python dependencies
2. **Checks**: Run Django system checks
3. **Migration**: Apply database migrations
4. **Tests**: Run authentication and projects tests
5. **Build**: Build and test Docker image

### Test Files
- `backend/apps/authentication/tests.py` - 2 simple authentication tests
- `backend/apps/projects/tests.py` - 2 simple project tests

## Local Testing
Before making a PR, you can run the same tests locally:

```bash
cd backend

# Run all tests
python manage.py test apps.authentication apps.projects --settings=trello_backend.test_settings

# Run specific app tests
python manage.py test apps.authentication --settings=trello_backend.test_settings
python manage.py test apps.projects --settings=trello_backend.test_settings

# Build Docker image
docker build -t trello-backend-test .
```

## What's Next

### 1. Using the CI/CD

#### Creating a Pull Request
1. **Push to GitHub**: Make sure your repository is on GitHub
2. **Create Feature Branch**: 
   ```bash
   git checkout -b feature/your-feature-name
   # Make your changes
   git add .
   git commit -m "Add new feature"
   git push origin feature/your-feature-name
   ```
3. **Create PR**: Open a pull request targeting the `dev` branch
4. **Watch CI**: The backend CI will automatically run
5. **Manual Review**: Review and manually merge the PR after CI passes

#### Monitoring CI Status
- **GitHub Actions Tab**: See detailed logs of each CI run
- **PR Checks**: Status checks appear directly on the pull request
- **Slack/Email**: Configure notifications in GitHub settings

## Success Criteria
✅ All 4 tests pass (2 auth + 2 projects)  
✅ Django system checks pass  
✅ Migrations apply successfully  
✅ Docker image builds without errors  

The tests are simple but effective - they verify:
- User creation and authentication
- Project creation and relationships
- API endpoints exist and respond
- Basic model functionality

## Troubleshooting

### Common Issues and Solutions

#### 1. Auto-merge Not Working
This section is no longer applicable as auto-merge has been removed from the workflow.

#### 1. CI Not Triggering
**Problem**: GitHub Actions doesn't run on PR
**Solutions**:
- Check that changes are in the `backend/` folder
- Ensure the PR targets the `dev` branch
- Verify `.github/workflows/backend-ci.yml` exists in the repository

#### 2. Test Failures
**Problem**: Tests fail in CI but pass locally
**Solutions**:
- Check the Actions tab for detailed error logs
- Ensure all dependencies are in `requirements.txt`
- Run tests locally with the same settings: `--settings=trello_backend.test_settings`
- Check for environment-specific issues (file paths, permissions)

#### 3. Docker Build Fails
**Problem**: Docker image build step fails
**Solutions**:
- Test Docker build locally: `docker build -t test .`
- Check `Dockerfile` for syntax errors
- Ensure all required files are present and not in `.dockerignore`

#### Debugging Steps
1. **Check Actions Tab**: Go to GitHub → Your Repository → Actions
2. **Review Logs**: Click on failed job to see detailed output
3. **Run Locally**: Test the same commands locally first
4. **Check Settings**: Verify repository and workflow permissions

#### Getting Help
If CI issues persist:
1. Check the Actions logs for specific error messages
2. Test each CI step locally in the same order
3. Ensure your GitHub repository settings match the requirements above

**CI is now ready to use! 🚀**
