from peewee import *
import os
from dotenv import load_dotenv

load_dotenv()

# db = SqliteDatabase('people.db')

db = MySQLDatabase('doge_lobby', user='root', password=os.getenv("SQL_PASSWORD"),
                         host='127.0.0.1', port=3306)

class User(Model):
    username = CharField(primary_key=True)
    firstName = CharField()
    middleName = CharField()
    lastName = CharField()
    email = CharField()
    pwHash = CharField()
    salt = CharField()
    phoneNumber = CharField()
    addressLine1 = CharField()
    addressLine2 = CharField()
    city = CharField()
    state = CharField()
    zipCode = CharField()
    country = CharField()

    class Meta:
        database = db # This model uses the "people.db" database.




class UserHasFriend(Model):
    user1 = ForeignKeyField(User)
    user2 = ForeignKeyField(User)

    class Meta:
        database = db
        primary_key=CompositeKey('user1', 'user2')


class Notification(Model):
    title = CharField()
    body = CharField()
    timeCreated = DateTimeField()
    username = ForeignKeyField(User)

    class Meta:
        database = db



class Idea(Model):
    title = CharField()
    body = CharField()
    creator = ForeignKeyField(User, backref="ideas")
    tokenCount = IntegerField()
    timeCreated = DateTimeField()
    stakePeriodEnd = DateTimeField()
    isActive = BooleanField()


    class Meta:
        database = db # This model uses the "people.db" database.

class UserSupportsIdea(Model):
    user = ForeignKeyField(User)
    ideaID = ForeignKeyField(Idea)

    class Meta:
        database = db
        primary_key = CompositeKey('user', 'ideaID')

class UserSavesIdea(Model):
    user = ForeignKeyField(User)
    ideaID = ForeignKeyField(Idea)

    class Meta:
        database = db
        primary_key = CompositeKey('user', 'ideaID')


class UserQuestionsIdea(Model):
    user = ForeignKeyField(User)
    ideaID = ForeignKeyField(Idea)

    class Meta:
        database = db
        primary_key = CompositeKey('user', 'ideaID')



class Comment(Model):
    body = CharField()
    hashtag = CharField()
    timeCreated = DateTimeField()
    ideaID = ForeignKeyField(Idea)
    commentor = ForeignKeyField(User)
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

    



db.connect()
db.create_tables([User, UserHasFriend, Notification, Idea, UserSupportsIdea, UserSavesIdea, UserQuestionsIdea, 
                Comment, Category, IdeaHasCategory, Image])




def populateDB():
    alex = User.create(username="aklevans", firstName = "alex", lastName = "Klevans", email = "alex@email.com")
    varun = User.create(username="vsiyer", firstName = "varun", lastName = "iyer", email = "varun@email.com")
    UserHasFriend.create(user1=alex, user2=varun)

# populateDB()



def getUserByUsername(username):
    return User.select().where(User.username == username).get()

def getUserFriends(user):
    return

def addUserFriend(user1, user2):
    return

