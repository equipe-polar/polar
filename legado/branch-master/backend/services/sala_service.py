from copy import deepcopy

from models.sala import Sala
from utils.db import DB_LOCK
from utils.validators import exigir_permissao, normalizar_texto

import sys
import json
from utils.db import carregar_db, salvar_db


def listar_salas(db, usuario):
    permitido, mensagem = exigir_permissao(usuario, "sala_visualizar")
    if not permitido:
        return False, mensagem, []

    with DB_LOCK:
        salas = db.get("salas", []) if isinstance(db, dict) else []
        if not isinstance(salas, list) or not all(isinstance(sala, dict) for sala in salas):
            return False, "Lista de salas invalida", []
        return True, "Salas listadas", deepcopy(salas)


def buscar_sala(db, nome):
    if not isinstance(db, dict):
        return None, None

    nome = normalizar_texto(nome).lower()
    salas = db.get("salas", [])
    if not isinstance(salas, list):
        return None, None

    for indice, sala in enumerate(salas):
        if not isinstance(sala, dict):
            continue
        if normalizar_texto(sala.get("nome", "")).lower() == nome:
            return indice, sala
    return None, None


def buscar_sala_por_id(db, id):
    if not isinstance(db, dict):
        return None, None

    if not id:
        return None, None
    salas = db.get("salas", [])
    if not isinstance(salas, list):
        return None, None

    for indice, sala in enumerate(salas):
        if not isinstance(sala, dict):
            continue
        if sala.get("id") == id:
            return indice, sala
    return None, None


def criar_sala(db, usuario, nome):
    permitido, mensagem = exigir_permissao(usuario, "sala_criar")
    if not permitido:
        return False, mensagem

    if not isinstance(db, dict):
        return False, "Banco de dados invalido"

    with DB_LOCK:
        salas = db.get("salas")
        if salas is None:
            db["salas"] = []
            salas = db["salas"]
        if not isinstance(salas, list):
            return False, "Lista de salas invalida"

        if buscar_sala(db, nome)[1] is not None:
            return False, "Sala ja cadastrada"

        try:
            sala = Sala(nome).para_dict()
        except ValueError as erro:
            return False, str(erro)

        salas.append(sala)
        return True, "Sala criada"


def editar_sala(db, usuario, indice, novo_nome):
    permitido, mensagem = exigir_permissao(usuario, "sala_editar")
    if not permitido:
        return False, mensagem

    if not isinstance(db, dict):
        return False, "Banco de dados invalido"

    with DB_LOCK:
        salas = db.get("salas", [])
        if not isinstance(salas, list):
            return False, "Lista de salas invalida"
        if not isinstance(indice, int) or not 0 <= indice < len(salas):
            return False, "Sala selecionada invalida"
        if not isinstance(salas[indice], dict):
            return False, "Registro de sala invalido"

        existente_indice, _ = buscar_sala(db, novo_nome)
        if existente_indice is not None and existente_indice != indice:
            return False, "Outra sala ja usa esse nome"

        try:
            nova_sala = Sala(novo_nome, id=salas[indice].get("id")).para_dict()
        except ValueError as erro:
            return False, str(erro)

        nome_antigo = salas[indice]["nome"]
        salas[indice] = nova_sala

        alunos = db.get("alunos", [])
        if isinstance(alunos, list):
            for aluno in alunos:
                if not isinstance(aluno, dict):
                    continue
                if aluno.get("sala_id") == nova_sala["id"] or aluno.get("sala") == nome_antigo:
                    aluno["sala"] = nova_sala["nome"]
                    aluno["sala_id"] = nova_sala["id"]

    return True, "Sala atualizada"

class UsuarioFake:
    nome = "API"
    papel = "ADM"


def resposta(data):
    print(json.dumps(data))


if __name__ == "__main__":
    db = carregar_db()
    usuario = UsuarioFake()

    try:
        comando = sys.argv[1]

        # ===== CRIAR SALA =====
        if comando == "criar":
            body = json.loads(sys.argv[2])

            sucesso, mensagem = criar_sala(
                db,
                usuario,
                body["nome"]
            )

            if sucesso:
                salvar_db(db)

            resposta({
                "sucesso": sucesso,
                "mensagem": mensagem
            })

        # ===== LISTAR SALAS =====
        elif comando == "listar":
            sucesso, mensagem, dados = listar_salas(db, usuario)

            resposta({
                "sucesso": sucesso,
                "dados": dados,
                "mensagem": mensagem
            })

        # ===== EDITAR SALA =====
        elif comando == "editar":
            body = json.loads(sys.argv[2])

            sucesso, mensagem = editar_sala(
                db,
                usuario,
                body["indice"],
                body["nome"]
            )

            if sucesso:
                salvar_db(db)

            resposta({
                "sucesso": sucesso,
                "mensagem": mensagem
            })

        else:
            resposta({
                "sucesso": False,
                "mensagem": "Comando inválido"
            })

    except Exception as e:
        resposta({
            "sucesso": False,
            "mensagem": str(e)
        })
