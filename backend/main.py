from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from database import *
from pydantic import BaseModel
import bcrypt
from typing import Annotated
from datetime import datetime, timedelta, timezone
import jwt
from jwt.exceptions import InvalidTokenError

from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


app = FastAPI()
SECRET_KEY = os.getenv("JWT_SECRET_KEY")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Adjust this to your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


class UserOut(BaseModel):
    username: str
    firstName: str
    middleName: str
    lastName: str
    email: str

def userDBToOut(u: UserInDB):
    return UserOut(username=u.username, firstName=u.firstName, middleName=u.middleName, lastName=u.lastName, email=u.email)


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except InvalidTokenError: # also checks expiration
        raise credentials_exception
    userInDB = getUserByUsername(token_data.username)
    if userInDB is None:
        raise credentials_exception
    return userDBToOut(userInDB)


@app.post("/api/login")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    user = getUserByCredentials(form_data.username, form_data.password)
    # user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")




@app.get("/users/me")
async def read_users_me(current_user: Annotated[UserOut, Depends(get_current_user)]):
    return current_user



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
    print("found")
    print(user)
    # test = User.create(username="test", firstName = "alex", lastName = "Klevans", email = "alex@email.com", password="hi")
    return { user }






# needs to be seperate from the database User object for two reasons:
#      needs to extend Pylance's BaseModel
#      Needs to accept unhashed password before giving hashed password to the database
class UserIn(BaseModel):
    username: str
    firstName: str
    middleName: str
    lastName: str
    email: str
    password: str
    phoneNumber: str
    addressLine1: str
    addressLine2: str
    city: str
    state: str
    zipCode: str
    country: str



@app.post("/api/users/")
async def createUser(newUser: UserIn):
    if(getUserByUsername(newUser.username) != None):
        raise HTTPException(status_code=409, detail="username already exists")
        
    gen_salt =  bcrypt.gensalt()
    hashed_pw = bcrypt.hashpw(newUser.password.encode('utf-8'), gen_salt).decode('utf-8)')

    #saves to database
    user_dict = newUser.model_dump()
    user_dict["pwHashSalt"] = hashed_pw
    user_dict.pop("password", None)

    UserInDB.create(**user_dict)
    
    return {"message": "User successfully added"}
    
# class LoginCredentials(BaseModel):
#     username: str
#     password: str

# @app.post("/api/login/")
# async def login(loginCredentials: LoginCredentials):
#     user = getUserByCredentials(loginCredentials.username, loginCredentials.password)
#     if(user != None):
#         return user.username
#     return {"message": "could not login"}

@app.put("/api/users/{username}/metamask")
async def add_user_metamask(username: str, metamaskID: str):
    user = getUserByUsername(username)
    if(user == None):
        raise HTTPException(status_code=400, detail="Username does not exist")
    user.metamaskID = metamaskID
    user.save()
    return {"message": "User successfully updated"}

if __name__ == "__main__":
    setupDB()
    populateDB()

