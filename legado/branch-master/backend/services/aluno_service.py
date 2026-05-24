from copy import deepcopy

from models.aluno import Aluno
from services.sala_service import buscar_sala
from utils.db import DB_LOCK
from utils.validators import exigir_permissao, normalizar_texto

import sys
import json
from utils.db import carregar_db, salvar_db


def buscar_aluno(db, nome):
    if not isinstance(db, dict):
        return None, None

    nome = normalizar_texto(nome).lower()
    alunos = db.get("alunos", [])
    if not isinstance(alunos, list):
        return None, None

    for indice, aluno in enumerate(alunos):
        if not isinstance(aluno, dict):
            continue
        if normalizar_texto(aluno.get("nome", "")).lower() == nome:
            return indice, aluno
    return None, None


def buscar_aluno_por_id(db, id):
    if not isinstance(db, dict):
        return None, None

    if not id:
        return None, None
    alunos = db.get("alunos", [])
    if not isinstance(alunos, list):
        return None, None

    for indice, aluno in enumerate(alunos):
        if not isinstance(aluno, dict):
            continue
        if aluno.get("id") == id:
            return indice, aluno
    return None, None


def buscar_aluno_por_id_ou_nome(db, id=None, nome=None):
    indice, aluno = buscar_aluno_por_id(db, id)
    if aluno is not None:
        return indice, aluno
    return buscar_aluno(db, nome)


def _listar_relacionados_por_aluno(db, chave, nome_aluno):
    itens = db.get(chave, []) if isinstance(db, dict) else []
    if not isinstance(itens, list):
        return []

    return [
        deepcopy(item) for item in itens
        if isinstance(item, dict) and item.get("aluno") == nome_aluno
    ]


def listar_alunos(db, usuario):
    permitido, mensagem = exigir_permissao(usuario, "aluno_visualizar")
    if not permitido:
        return False, mensagem, []

    with DB_LOCK:
        alunos = db.get("alunos", []) if isinstance(db, dict) else []
        if not isinstance(alunos, list) or not all(isinstance(aluno, dict) for aluno in alunos):
            return False, "Lista de alunos invalida", []
        return True, "Alunos listados", deepcopy(alunos)


def listar_alunos_por_sala(db, usuario, sala):
    permitido, mensagem = exigir_permissao(usuario, "aluno_visualizar")
    if not permitido:
        return False, mensagem, []

    with DB_LOCK:
        alunos_db = db.get("alunos", []) if isinstance(db, dict) else []
        if not isinstance(alunos_db, list) or not all(isinstance(aluno, dict) for aluno in alunos_db):
            return False, "Lista de alunos invalida", []

        sala = normalizar_texto(sala)
        alunos = [
            aluno for aluno in alunos_db
            if aluno.get("sala") == sala or aluno.get("sala_id") == sala
        ]
        return True, "Alunos da sala listados", deepcopy(alunos)


def criar_aluno(db, usuario, nome, sala):
    permitido, mensagem = exigir_permissao(usuario, "aluno_criar")
    if not permitido:
        return False, mensagem

    if not isinstance(db, dict):
        return False, "Banco de dados invalido"

    with DB_LOCK:
        alunos = db.get("alunos")
        if alunos is None:
            db["alunos"] = []
            alunos = db["alunos"]
        if not isinstance(alunos, list):
            return False, "Lista de alunos invalida"

        if buscar_aluno(db, nome)[1] is not None:
            return False, "Aluno ja cadastrado"

        _, sala_db = buscar_sala(db, sala)
        if sala_db is None:
            return False, "Sala nao cadastrada"

        try:
            aluno = Aluno(nome, sala_db["nome"], sala_id=sala_db.get("id")).para_dict()
        except ValueError as erro:
            return False, str(erro)

        alunos.append(aluno)
        return True, "Aluno criado"


def editar_aluno(db, usuario, indice, novo_nome, nova_sala):
    permitido, mensagem = exigir_permissao(usuario, "aluno_editar")
    if not permitido:
        return False, mensagem

    if not isinstance(db, dict):
        return False, "Banco de dados invalido"

    with DB_LOCK:
        alunos = db.get("alunos", [])
        if not isinstance(alunos, list):
            return False, "Lista de alunos invalida"
        if not isinstance(indice, int) or not 0 <= indice < len(alunos):
            return False, "Aluno selecionado invalido"
        if not isinstance(alunos[indice], dict):
            return False, "Registro de aluno invalido"

        _, sala_db = buscar_sala(db, nova_sala)
        if sala_db is None:
            return False, "Sala nao cadastrada"

        existente_indice, _ = buscar_aluno(db, novo_nome)
        if existente_indice is not None and existente_indice != indice:
            return False, "Outro aluno ja usa esse nome"

        nome_antigo = alunos[indice]["nome"]
        id_aluno = alunos[indice].get("id")

        try:
            aluno = Aluno(
                novo_nome,
                sala_db["nome"],
                id=id_aluno,
                sala_id=sala_db.get("id"),
            ).para_dict()
        except ValueError as erro:
            return False, str(erro)

        alunos[indice] = aluno

        if nome_antigo != aluno["nome"]:
            for chave in ("ocorrencias", "notas", "faltas"):
                itens = db.get(chave, [])
                if not isinstance(itens, list):
                    continue
                for item in itens:
                    if not isinstance(item, dict):
                        continue
                    if item.get("aluno_id") == id_aluno or item.get("aluno") == nome_antigo:
                        item["aluno"] = aluno["nome"]
                        item["aluno_id"] = id_aluno

        return True, "Aluno atualizado"


def visualizar_aluno(db, usuario, nome):
    permitido, mensagem = exigir_permissao(usuario, "aluno_visualizar")
    if not permitido:
        return False, mensagem, None

    with DB_LOCK:
        _, aluno = buscar_aluno(db, nome)
        if aluno is None:
            return False, "Aluno nao encontrado", None

        nome_aluno = aluno["nome"]
        dados = {
            "aluno": deepcopy(aluno),
            "ocorrencias": _listar_relacionados_por_aluno(db, "ocorrencias", nome_aluno),
            "notas": _listar_relacionados_por_aluno(db, "notas", nome_aluno),
            "faltas": _listar_relacionados_por_aluno(db, "faltas", nome_aluno),
        }

    return True, "Aluno carregado", dados

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

        # ===== CRIAR =====
        if comando == "criar":
            body = json.loads(sys.argv[2])

            sucesso, mensagem = criar_aluno(
                db,
                usuario,
                body["nome"],
                body["sala"]
            )

            if sucesso:
                salvar_db(db)

            resposta({
                "sucesso": sucesso,
                "mensagem": mensagem
            })

        # ===== LISTAR =====
        elif comando == "listar":
            sucesso, mensagem, dados = listar_alunos(db, usuario)

            resposta({
                "sucesso": sucesso,
                "dados": dados,
                "mensagem": mensagem
            })

        # ===== EDITAR =====
        elif comando == "editar":
            body = json.loads(sys.argv[2])

            sucesso, mensagem = editar_aluno(
                db,
                usuario,
                body["indice"],
                body["nome"],
                body["sala"]
            )

            if sucesso:
                salvar_db(db)

            resposta({
                "sucesso": sucesso,
                "mensagem": mensagem
            })

        # ===== VISUALIZAR =====
        elif comando == "visualizar":
            body = json.loads(sys.argv[2])

            sucesso, mensagem, dados = visualizar_aluno(
                db,
                usuario,
                body["nome"]
            )

            resposta({
                "sucesso": sucesso,
                "dados": dados,
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
