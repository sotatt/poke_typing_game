import requests

BASE_URL = "https://pokeapi.co/api/v2/"

# 日本語名を取得
def get_japanese_name(species_data):
    for name_info in species_data.get('names', []):
        if name_info['language']['name'] == 'ja-Hrkt':
            return name_info['name']
    return "(日本語名なし)"

# 図鑑順を取得（例: カントー図鑑番号）
def get_pokedex_number(species_data, region="kanto"):
    for entry in species_data.get('pokedex_numbers', []):
        if region in entry['pokedex']['name']:
            return entry['entry_number']
    return None  # 地域図鑑に載っていない場合

# 図鑑順・日本語名で一覧表示
def display_generation_pokedex(generation_id, region="kanto"):
    # 世代取得（例: 第1世代）
    generation_url = BASE_URL + f"generation/{generation_id}"
    response = requests.get(generation_url)
    if not response.ok:
        print("世代情報の取得に失敗しました。")
        return

    species_list = response.json().get("pokemon_species", [])
    
    full_list = []

    for species in species_list:
        name = species['name']
        species_response = requests.get(BASE_URL + f"pokemon-species/{name}")
        if not species_response.ok:
            continue

        species_data = species_response.json()
        jp_name = get_japanese_name(species_data)
        pokedex_num = get_pokedex_number(species_data, region=region)

        if pokedex_num is not None:
            full_list.append({
                "pokedex_num": pokedex_num,
                "english_name": name,
                "japanese_name": jp_name,
                "id": species_data['id'],
            })

    # 地域図鑑番号順に並べ替え
    sorted_list = sorted(full_list, key=lambda x: x['pokedex_num'])

    # 出力
    for p in sorted_list:
        print(f"{p['pokedex_num']:03d}. {p['japanese_name']} - ID: {p['id']}")

# 実行：第1世代（generation=1）の「カントー図鑑」を日本語で表示
display_generation_pokedex(generation_id=1, region="kanto")