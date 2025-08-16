from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI app
app = FastAPI()

# Enable CORS so frontend can talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base route (not used at the moment)
@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}

# Example route (for demo of how this works)
@app.get("/api/hello")
def say_hello():
    return {"message": "Hello from /api/hello"}
