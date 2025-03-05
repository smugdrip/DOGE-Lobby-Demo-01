from peewee import *
import os
from dotenv import load_dotenv
import bcrypt


load_dotenv()

# db = SqliteDatabase('people.db')

db = MySQLDatabase('doge_lobby', user='root', password=os.getenv("SQL_PASSWORD"),
                         host='127.0.0.1', port=3306)

class UserInDB(Model):
    username = CharField(primary_key=True)
    firstName = CharField()
    middleName = CharField()
    lastName = CharField()
    email = CharField()
    pwHashSalt = CharField()
    phoneNumber = CharField()
    addressLine1 = CharField()
    addressLine2 = CharField()
    city = CharField()
    state = CharField()
    zipCode = CharField()
    country = CharField()
    metamaskID = CharField()

    class Meta:
        database = db # This model uses the "people.db" database.




class UserHasFriend(Model):
    user1 = ForeignKeyField(UserInDB)
    user2 = ForeignKeyField(UserInDB)

    class Meta:
        database = db
        primary_key=CompositeKey('user1', 'user2')


class Notification(Model):
    title = CharField()
    body = CharField()
    timeCreated = DateTimeField()
    username = ForeignKeyField(UserInDB)

    class Meta:
        database = db



class Idea(Model):
    title = CharField()
    body = CharField()
    creator = ForeignKeyField(UserInDB, backref="ideas")
    tokenCount = IntegerField()
    timeCreated = DateTimeField()
    stakePeriodEnd = DateTimeField()
    isActive = BooleanField()


    class Meta:
        database = db # This model uses the "people.db" database.

class UserSupportsIdea(Model):
    user = ForeignKeyField(UserInDB)
    ideaID = ForeignKeyField(Idea)

    class Meta:
        database = db
        primary_key = CompositeKey('user', 'ideaID')

class UserSavesIdea(Model):
    user = ForeignKeyField(UserInDB)
    ideaID = ForeignKeyField(Idea)

    class Meta:
        database = db
        primary_key = CompositeKey('user', 'ideaID')


class UserQuestionsIdea(Model):
    user = ForeignKeyField(UserInDB)
    ideaID = ForeignKeyField(Idea)

    class Meta:
        database = db
        primary_key = CompositeKey('user', 'ideaID')



class Comment(Model):
    body = CharField()
    hashtag = CharField()
    timeCreated = DateTimeField()
    ideaID = ForeignKeyField(Idea)
    commentor = ForeignKeyField(UserInDB)
    replyingTo = ForeignKeyField('self')

    class Meta:
        database = db

class Category(Model):
    name = CharField(primary_key = True)

    class Meta:
        database = db

class IdeaHasCategory(Model):
    categoryName = ForeignKeyField(Category)
    ideaID = ForeignKeyField(Idea)

    class Meta:
        database = db
        primary_key=CompositeKey('categoryName', 'ideaID')

class Image(Model):
    url = CharField()
    ideaID = ForeignKeyField(Idea)

    class Meta:
        database = db

    




def setupDB():
    db.connect()
    db.create_tables([UserInDB, UserHasFriend, Notification, Idea, UserSupportsIdea, UserSavesIdea, UserQuestionsIdea, 
                Comment, Category, IdeaHasCategory, Image])

setupDB()

def populateDB():
    print("populating db")
    try:
        alex = UserInDB.create(username="aklevans", firstName = "alex", lastName = "Klevans", email = "alex@email.com")
        varun = UserInDB.create(username="vsiyer", firstName = "varun", lastName = "iyer", email = "varun@email.com")
    except:
        print("db already populated")
populateDB()


def getUserByUsername(username):
    try:
        return UserInDB.select().where(UserInDB.username == username).get()
    except DoesNotExist:
        return None




def getUserByCredentials(username, plainTextPW):
    u=getUserByUsername(username)
    if not u:
        return None

    # in bcrypt salt is built into password
    if(bcrypt.checkpw(plainTextPW.encode('utf-8'), u.pwHashSalt.encode('utf-8'))):
        return u
    return None


def getUserFriends(user):
    return

def addUserFriend(user1, user2):
    return

