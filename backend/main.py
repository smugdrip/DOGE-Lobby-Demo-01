from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import *

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Adjust this to your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)



@app.get("/")
async def root():
    return { "message": "Hello World" }

@app.get("/api/ideas/{idea_id}")
async def getIdea(idea_id):
    # TODO call to database here
    return { "item_id": idea_id }

@app.get("/api/users/{user_id}")
async def getUser(user_id):
    user = getUserByUsername(user_id)
    return { user }

if __name__ == "__main__":
    setupDB()
    populateDB()
