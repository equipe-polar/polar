import os
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHash


HASH_ALGORITMO = "argon2"
PASSWORD_HASHER = PasswordHasher()
SENHA_INICIAL_PADRAO = "admin123"
SENHA_MINIMA = 8


def senha_inicial_padrao():
    return os.getenv("POLAR_BOOTSTRAP_PASSWORD") or SENHA_INICIAL_PADRAO


def validar_senha(valor):
    return isinstance(valor, str) and len(valor) >= SENHA_MINIMA


def gerar_senha_hash(senha):
    if not validar_senha(senha):
        raise ValueError(f"Senha deve ter pelo menos {SENHA_MINIMA} caracteres")

    return PASSWORD_HASHER.hash(senha)


def verificar_senha(senha, senha_hash):
    if not isinstance(senha, str) or not isinstance(senha_hash, str):
        return False

    try:
        PASSWORD_HASHER.verify(senha_hash, senha)
        return True
    except (VerifyMismatchError, InvalidHash):
        return False
