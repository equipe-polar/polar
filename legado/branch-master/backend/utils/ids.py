from uuid import uuid4
from uuid import UUID


def gerar_id():
    return uuid4().hex


def id_valido(valor):
    try:
        UUID(valor)
        return True
    except:
        return False


def garantir_id(valor=None):
    if valor and id_valido(valor):
        return valor.strip()
    return gerar_id()
