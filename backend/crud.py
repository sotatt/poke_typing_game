
# CRUD操作（DB操作関数）

from . import models

def get_all_captured(db):
    return db.query(models.CapturedPokemon).all()

def add_captured(db, pokemon_id):
    # すでに捕獲済みかチェック
    existing = db.query(models.CapturedPokemon).filter(models.CapturedPokemon.id == pokemon_id).first()
    if not existing:
        new_pokemon = models.CapturedPokemon(id=pokemon_id)
        db.add(new_pokemon)
        db.commit()
    return db.query(models.CapturedPokemon).all()