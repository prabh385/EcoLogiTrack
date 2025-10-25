@echo off
echo Starting Dairy Supply Chain Development Environment...

echo Starting Flask Backend...
cd backend
call venv\Scripts\activate
start python app.py
cd ..

echo Starting React Frontend...
cd frontend
start npm start
cd ..

echo All services started!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5000
pause