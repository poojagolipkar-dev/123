#!/bin/bash

# 1. Create README.md
echo "# shreeselfdriving" >> README.md

# 2. Initialize Git
git init

# 3. Add README.md
git add README.md

# 4. Commit
git commit -m "first commit"

# 5. Rename branch to main
git branch -M main

# 6. Add the remote repository
git remote add origin https://github.com/poojagolipkar-dev/shreeselfdriving.git

# 7. Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main
