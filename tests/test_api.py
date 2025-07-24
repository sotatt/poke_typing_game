# # ランダム取得
# import requests
# import random

# BASE_URL = "https://pokeapi.co/api/v2/"

# def get_random_pokemon_name():
#     max_pokemon_id = 151  # ポケモン総数（必要に応じて調整）
#     random_id = random.randint(1, max_pokemon_id)

#     # ランダムで選ばれたポケモンIDに対応する「ポケモンの種別情報」をAPIにリクエスト
#     response = requests.get(BASE_URL + f'pokemon-species/{random_id}')
#     if response.ok: # APIリクエスト成功確認(HTTPステータス200台)
#         data = response.json() # JSONデータをPythonの字良型に変換しdataに格納
#         english_name = data['name'] # 英語名取得

#         # 日本語名の取得（オプション）
#         japanese_name = None
#         for name_info in data['names']:
#             if name_info['language']['name'] == 'ja-Hrkt': # language が ja-Hrkt（日本語のカタカナ・ひらがな表記）だったら…
#                 japanese_name = name_info['name']
#                 break
#         # capitalize() を使って英語名の先頭文字を大文字にします（例: “pikachu” → “Pikachu”）。
#         return english_name.capitalize(), japanese_name or "（日本語名なし）"
#     else:
#         return "取得失敗", "取得失敗"

# # 実行例
# english, japanese = get_random_pokemon_name()
# print(f"ランダムポケモン: {english} / 日本語名: {japanese}")
import requests
import random

BASE_URL = "https://pokeapi.co/api/v2/"

# 指定された世代（範囲）のポケモン一覧を取得
def get_pokemon_species_from_generations(start_gen, end_gen):
    all_species = []

    for gen_id in range(start_gen, end_gen + 1):
        response = requests.get(BASE_URL + f'generation/{gen_id}')
        if response.ok:
            data = response.json()
            all_species.extend(data['pokemon_species'])
        else:
            print(f"世代{gen_id}のデータ取得に失敗しました。")

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
    # 指定した世代のポケモン一覧（species）を取得   --------------------------------------
    species_list = get_pokemon_species_from_generations(start_gen, end_gen)
    if not species_list:
        return None
    # 一覧の中からランダムに１匹を選び、その英語名を取得   --------------------------------------
    random_species = random.choice(species_list)
    english_name = random_species['name']

    # 詳細データ取得（/pokemon/ にアクセス）
    # 選ばれたポケモンの詳細データを取得（公式API/pokemon/〇〇を利用）   --------------------------------------
    pokemon_response = requests.get(BASE_URL + f'pokemon/{english_name}')
    if not pokemon_response.ok:
        return None

    pokemon_data = pokemon_response.json()
    pokemon_id = pokemon_data['id']
    image_url = pokemon_data['sprites']['other']['official-artwork']['front_default']
    japanese_name = get_japanese_name(english_name)

    return {
        'english_name': english_name.capitalize(),
        'japanese_name': japanese_name,
        'id': pokemon_id,
        'image_url': image_url
    }

# 実行：第1〜第3世代からランダム取得
# 第1世代だけ → get_random_pokemon_from_generations(1, 1)
pokemon_info = get_random_pokemon_full_info(1, 3)

# 結果表示
if pokemon_info:
    print(f"英語名: {pokemon_info['english_name']}")
    print(f"日本語名: {pokemon_info['japanese_name']}")
    print(f"ID: {pokemon_info['id']}")
    print(f"画像URL: {pokemon_info['image_url']}")
else:
    print("ポケモン情報の取得に失敗しました。")