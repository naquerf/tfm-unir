import fastapi
from fastapi.middleware.cors import CORSMiddleware
import pymongo
import logging
import pymongo.collection
import simplejson as json
import asyncio
from typing import Optional

logger = logging.getLogger('uvicorn.error')


app = fastapi.FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

top_songs = {}
monthly_songs = {}
world_songs = {}

def get_database():
    CONNECTION_STRING = 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.6.2'
    client = pymongo.MongoClient(CONNECTION_STRING)
    return client['tfm']


TFM_DATABASE = get_database()
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)


class UsersHandler:
    collection: pymongo.collection.Collection

    TABLE_FIELDS_EQUIVALENCE = {
        'username': 'user.username',
        'track': 'track.name',
        'artist': 'artist.name',
        'genre': 'artist.genre',
    }

    def __init__(self, collection):
        self.collection = collection

    def find_user(self, user):
        result = list(self.collection.find({'id': user}))
        display_name = result[0].get('display_name')
        image = None
        for result_image in result[0].get('images'):
            if image == None or image.get('height') * image.get(
                'width'
            ) < result_image.get('height') * result_image.get('width'):
                image = result_image
        response = {'username': user, 'display_name': display_name, 'image': image}
        return response


class WrapVizHandler:
    collection: pymongo.collection.Collection
    country_collection: pymongo.collection.Collection       

    TABLE_FIELDS_EQUIVALENCE = {
        'username': 'user.username',
        'track': 'track.name',
        'artist': 'artist.name',
        'genre': 'artist.genre',
        'month': 'stream_month',
        'country':'country'
    }

    def __init__(self, collection, country_collection):
        self.collection = collection
        self.country_collection = country_collection

    def get_minutes_by_user(
        self,
        username: str,
        top: int = 5,
        by_track: bool = False,
        by_artist: bool = False,
        by_genre: bool = False,
    ):
        group_fields = ['username']
        if by_artist:
            group_fields.append('artist')
        if by_track:
            group_fields.append('track')
        if by_genre:
            group_fields.append('genre')
        match_filter = {self.TABLE_FIELDS_EQUIVALENCE['username']: username}
        group_id = [
            '$' + self.TABLE_FIELDS_EQUIVALENCE[field] for field in group_fields
        ]
        pipeline = [
            {'$match': match_filter},
            {
                '$group': {
                    '_id': group_id,
                    'minutes_listened': {'$sum': '$minutes_listened'},
                }
            },
            {'$sort': {'minutes_listened': -1}},
            {'$limit': top},
        ]
        result = list(self.collection.aggregate(pipeline))
        response = {'items':[
            {
                **{group_fields[i]: id for i, id in enumerate(item.get('_id'))},
                'minutes_listened': item.get('minutes_listened'),   
                'top': id+1 
            }
            for id, item in enumerate(result)
        ]}
        return response
    
    def get_monthly_minutes_by_user(
        self,
        username: str,
        track: Optional[str]=None,
        artist: Optional[str]=None,
        genre: Optional[str]=None):
        match_filter = {self.TABLE_FIELDS_EQUIVALENCE['username']: username}
        group_fields = ['username','month']
        if track is not None:
            match_filter[self.TABLE_FIELDS_EQUIVALENCE['track']]= track
            group_fields.append("track")
        if artist is not None:
            match_filter[self.TABLE_FIELDS_EQUIVALENCE['artist']]= artist
            group_fields.append("artist")
        if genre is not None:
            match_filter[self.TABLE_FIELDS_EQUIVALENCE['genre']]= track
            group_fields.append("genre")

        group_id = [
            '$' + self.TABLE_FIELDS_EQUIVALENCE[field] for field in group_fields
        ]
        pipeline = [
            {'$match': match_filter},
            {
                '$group': {
                    '_id': group_id,
                    'minutes_listened': {'$sum': '$minutes_listened'},
                }
            },
            {'$sort': {'minutes_listened': -1}},
            {'$limit': 12},
        ]
        result = list(self.collection.aggregate(pipeline))
        response = [
            {
                **{group_fields[i]: id for i, id in enumerate(item.get('_id'))},
                'minutes_listened': item.get('minutes_listened'),   
                'top': id+1 
            }
            for id, item in enumerate(result)
        ]
        return response
        
    def get_minutes_by_country(self):
        group_fields = ['country']
        group_id = [
                '$' + self.TABLE_FIELDS_EQUIVALENCE[field] for field in group_fields
            ]

        pipeline =[{"$group":{"_id":group_id, "streams":{"$sum":"$streams"}, "minutes_listened":{"$sum":"$minutes_listened"}}}]

        result = list(self.country_collection.aggregate(pipeline))
        print(result)
        response = {'items':[
                {
                    **{group_fields[i]: id for i, id in enumerate(item.get('_id'))},
                    'minutes_listened': item.get('minutes_listened'),   
                    'top': id+1 
                }
                for id, item in enumerate(result)
            ]}
        return response

WRAPVIZ_HANDLER = WrapVizHandler(collection=TFM_DATABASE['wrapviz'], country_collection=TFM_DATABASE["wrapviz_country"])
USER_HANDLER = UsersHandler(collection=TFM_DATABASE['users'])


def prepare_song_plot_data(username):
    if username in top_songs:
        return
    minutes_by_user = WRAPVIZ_HANDLER.get_minutes_by_user(
            username=username, by_track=True, by_artist=True, by_genre=False, top=5
        )
    
    top_songs[username] = minutes_by_user

    top_songs_monthly = []
    for song in minutes_by_user["items"]:
        result = WRAPVIZ_HANDLER.get_monthly_minutes_by_user(username=username,track=song["track"], artist=song["artist"])
        result = [{**item, "top":song["top"]} for item in result]
        top_songs_monthly+=result
    monthly_songs[username] = {"items":top_songs_monthly}


@app.get('/users/{username}')
async def get_user(
    username: str, background_tasks: fastapi.BackgroundTasks
):
    background_tasks.add_task(prepare_song_plot_data, username)
    return USER_HANDLER.find_user(user=username)

@app.get('/{username}/top-songs')
def get_user_minutes(
    username: str
):
    songs = top_songs.get(username)
    if songs  is None:
        prepare_song_plot_data(username=username)
    return json.dumps(top_songs[username])

@app.get('/{username}/top-songs/monthly')
def get_user_minutes_monthly(
    username: str
):
    songs = monthly_songs.get(username)
    if songs  is None:
        prepare_song_plot_data(username=username)
    return monthly_songs[username]

@app.get('/by-country')
def get_minutes_by_country():

    return WRAPVIZ_HANDLER.get_minutes_by_country()