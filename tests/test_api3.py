from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import random

app = FastAPI()

# CORS（他ドメインからのアクセス許可：開発用には * を許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_URL = "https://pokeapi.co/api/v2/"

# 指定された世代（範囲）のポケモン一覧を取得
def get_pokemon_species_from_generations(start_gen, end_gen):
    all_species = []
    for gen_id in range(start_gen, end_gen + 1):
        response = requests.get(BASE_URL + f'generation/{gen_id}')
        if response.ok:
            data = response.json()
            all_species.extend(data['pokemon_species'])
    return all_species

# 日本語名の取得
def get_japanese_name(english_name):
    response = requests.get(BASE_URL + f'pokemon-species/{english_name}')
    if not response.ok:
        return "（日本語名取得失敗）"
    data = response.json()
    for name_info in data['names']:
        if name_info['language']['name'] == 'ja-Hrkt':
            return name_info['name']
    return "（日本語名なし）"

# 英語名・日本語名・ID・画像URLを取得
def get_random_pokemon_full_info(start_gen, end_gen):
    species_list = get_pokemon_species_from_generations(start_gen, end_gen)
    if not species_list:
        return None
    random_species = random.choice(species_list)
    english_name = random_species['name']

    pokemon_response = requests.get(BASE_URL + f'pokemon/{english_name}')
    if not pokemon_response.ok:
        return None

    pokemon_data = pokemon_response.json()
    pokemon_id = pokemon_data['id']
    image_url = pokemon_data['sprites']['other']['official-artwork']['front_default']
    japanese_name = get_japanese_name(english_name)

    return {
        'romaji_name': english_name.upper(),
        'japanese_name': japanese_name,
        'id': pokemon_id,
        'image_url': image_url
    }

# APIエンドポイント：第1世代からランダムに1体取得
@app.get("/random-pokemon")
def get_random_pokemon():
    result = get_random_pokemon_full_info(1, 1)  # ←第1世代だけにするなら (1, 1)
    if result:
        return result
    return {"error": "ポケモン情報の取得に失敗しました"}