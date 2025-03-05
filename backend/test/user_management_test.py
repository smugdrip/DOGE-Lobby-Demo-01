import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from peewee import *
from datetime import datetime, timedelta
from dotenv import load_dotenv
import re
import pymysql

from database import db, User, UserHasFriend, Notification, Idea, UserSupportsIdea, UserSavesIdea, UserQuestionsIdea, Comment, Category, IdeaHasCategory, Image



def is_valid_password(password):
    if len(password) < 16:
        return False
    if not re.search(r"\d", password):
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False
    return True


@pytest.fixture(scope="function")
def setup_test_db():
    if db.is_closed():
        db.connect()
    db.execute_sql("SET FOREIGN_KEY_CHECKS=0;")
    for model in [User]:
        model.delete().execute()
    db.execute_sql("SET FOREIGN_KEY_CHECKS=1;")
    
    yield db

    if db.is_closed():
        db.connect()
    db.execute_sql("SET FOREIGN_KEY_CHECKS=0;")
    for model in [User]:
        model.delete().execute()
    db.execute_sql("SET FOREIGN_KEY_CHECKS=1;")
    db.close()

    
def test_create_user(setup_test_db):
    user_data = {
        "username": "newuser",
        "firstName": "New",
        "middleName": "N",
        "lastName": "User",
        "email": "new@example.com",
        "pwHash": "P@ssword123456789",
        "salt": "salt",
        "phoneNumber": "1234567890",
        "addressLine1": "123 User Street",
        "addressLine2": "Apartment 5B",
        "city": "Raleigh",
        "state": "NC",
        "zipCode": "27519",
        "country": "USA"
    }
    
    user = User.create(**user_data)
    assert user.username == user_data["username"]
    assert user.email == user_data["email"]

def test_short_password(): 
    assert not is_valid_password("short")

def test_non_uppercase_password():
    assert not is_valid_password("nouppercase123!@#")

def test_non_special_password():
    assert not is_valid_password("NoSpecialChar123")

def test_non_numeric_password():
    assert not is_valid_password("NoNumber!@#abcDEF")    

def test_duplicate_username(setup_test_db):
    user_data = {
        "username": "newuser",
        "firstName": "New",
        "middleName": "N",
        "lastName": "User",
        "email": "new@example.com",
        "pwHash": "P@ssword123456789",
        "salt": "salt",
        "phoneNumber": "1234567890",
        "addressLine1": "123 User Street",
        "addressLine2": "Apartment 5B",
        "city": "Raleigh",
        "state": "NC",
        "zipCode": "27519",
        "country": "USA"
    }
    
    User.create(**user_data)


    duplicate_user_data = {
        "username": "newuser",
        "firstName": "New",
        "middleName": "N",
        "lastName": "User",
        "email": "duplicate@example.com",
        "pwHash": "P@ssword123456789",
        "salt": "salt",
        "phoneNumber": "1234567890",
        "addressLine1": "123 User Street",
        "addressLine2": "Apartment 5B",
        "city": "Raleigh",
        "state": "NC",
        "zipCode": "27519",
        "country": "USA"
    }
    
    with pytest.raises(IntegrityError):
        User.create(**duplicate_user_data)

def test_duplicate_email(setup_test_db):
    user_data_1 = {
        "username": "newuser1",
        "firstName": "New",
        "middleName": "N",
        "lastName": "User",
        "email": "new@example.com",
        "pwHash": "P@ssword123456789",
        "salt": "salt",
        "phoneNumber": "1234567890",
        "addressLine1": "123 User Street",
        "addressLine2": "Apartment 5B",
        "city": "Raleigh",
        "state": "NC",
        "zipCode": "27519",
        "country": "USA"
    }
    
    user_data_2 = {
        "username": "newuser2",
        "firstName": "New",
        "middleName": "N",
        "lastName": "User",
        "email": "new@example.com",
        "pwHash": "P@ssword123456789",
        "salt": "salt",
        "phoneNumber": "1234567890",
        "addressLine1": "123 User Street",
        "addressLine2": "Apartment 5B",
        "city": "Raleigh",
        "state": "NC",
        "zipCode": "27519",
        "country": "USA"
    }
    
    User.create(**user_data_1)
    
    with pytest.raises(IntegrityError):
        User.create(**user_data_2)

def test_user_without_phone_number(setup_test_db):
    user_data = {
        "username": "newUser2",
        "firstName": "New",
        "middleName": "N",
        "lastName": "User",
        "email": "new2@example.com",
        "pwHash": "P@ssword123456789",
        "salt": "salt",
        "phoneNumber": None,
        "addressLine1": "123 User Street",
        "addressLine2": "Apartment 5B",
        "city": "Raleigh",
        "state": "NC",
        "zipCode": "27519",
        "country": "USA"
    }
    
    with pytest.raises(IntegrityError):
        User.create(**user_data)

def test_delete_user(setup_test_db):
    test_user = {
        "username": "newUser3",
        "firstName": "New",
        "middleName": "N",
        "lastName": "User",
        "email": "new3@example.com",
        "pwHash": "P@ssword123456789",
        "salt": "salt",
        "phoneNumber": "1234567890",
        "addressLine1": "123 User Street",
        "addressLine2": "Apartment 5B",
        "city": "Raleigh",
        "state": "NC",
        "zipCode": "27519",
        "country": "USA"
    }
    
    user = User.create(**test_user)
    
    user.delete_instance()
    
    with pytest.raises(User.DoesNotExist):
        User.get(User.username == 'newUser3')
