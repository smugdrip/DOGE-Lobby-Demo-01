from peewee import *
import os
from dotenv import load_dotenv

load_dotenv()

# db = SqliteDatabase('people.db')

db = MySQLDatabase('my_app', user='root', password=os.getenv("SQL_PASSWORD"),
                         host='127.0.0.1', port=3306)

class User(Model):
    username = CharField(primary_key=True)
    firstName = CharField()
    middleName = CharField()
    lastName = CharField()
    email = CharField()
    password = CharField()
    phoneNumber = CharField()

    class Meta:
        database = db # This model uses the "people.db" database.

class Idea(Model):
    title = CharField()
    body = CharField()
    creator = ForeignKeyField(User, backref="ideas")

    class Meta:
        database = db # This model uses the "people.db" database.


db.connect()
db.create_tables([User, Idea])


from datetime import date

alex = User.create(username="aklevans", firstName = "alex", lastName = "Klevans", email = "alex@email.com")
alex.save()

stupid = Idea.create(creator=alex, title="my idea", body="idea body")
stupid.save()