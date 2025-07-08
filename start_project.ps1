<#
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
./start_project.ps1
#>

# This powershell runs well on my windows 11 machine because I already have the necessary tools installed.

Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "hardhat node"

Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "hardhat run scripts/deploy.js --network localhost"

cd backend
python -m venv venv
.\venv\Scripts\activate
#pip install -r requirements.txt
Start-Process -NoNewWindow -FilePath "python" -ArgumentList "app.py"


cd ..\client
npm install
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "start"
