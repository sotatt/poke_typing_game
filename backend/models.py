
# SQLAlchemyモデル定義

from sqlalchemy import Column, Integer
from .database import Base

class CapturedPokemon(Base):
    __tablename__ = "captured_pokemon"
    id = Column(Integer, primary_key=True, index=True)