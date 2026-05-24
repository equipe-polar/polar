from copy import deepcopy
from models.usuario import Usuario
from utils.validators import exigir_permissao, normalizar_papel, normalizar_texto, validar_papel

import sys
import json
from utils.db import carregar_db, salvar_db
from utils.db import DB_LOCK
from utils.security import gerar_senha_hash, validar_senha, verificar_senha
from utils.sessions import (
    atualizar_sessao,
    contexto_autenticado,
    criar_sessao,
    encerrar_sessao,
    invalidar_sessoes_usuario,
)
from utils.validators import exigir_permissao, normalizar_texto


def buscar_usuario(db, nome):
    if not isinstance(db, dict):
        return None, None

    nome = normalizar_texto(nome).lower()
    usuarios = db.get("usuarios", [])
    if not isinstance(usuarios, list):
        return None, None

    for indice, usuario in enumerate(usuarios):
        if not isinstance(usuario, dict):
            continue
        username = usuario.get("nome", usuario.get("username", ""))
        if normalizar_texto(username).lower() == nome:
            return indice, usuario
    return None, None


def buscar_usuario_por_id(db, id):
    if not isinstance(db, dict):
        return None, None

    if not id:
        return None, None
    usuarios = db.get("usuarios", [])
    if not isinstance(usuarios, list):
        return None, None

    for indice, usuario in enumerate(usuarios):
        if not isinstance(usuario, dict):
            continue
        if usuario.get("id") == id:
            return indice, usuario
    return None, None


def autenticar(db, nome, senha):
    nome = normalizar_texto(nome)

    if not nome:
        return None, None, "Usuario invalido"

    try:
        with DB_LOCK:
            _, usuario = buscar_usuario(db, nome)
            if usuario is None:
                return None, None, "Acesso negado: usuario nao cadastrado"

            senha_hash = usuario.get("senha_hash") or usuario.get("password_hash")
            if not verificar_senha(senha, senha_hash):
                return None, None, "Acesso negado: senha invalida"

            contexto = Usuario.de_dict(usuario)
    except (AttributeError, ValueError, TypeError):
        return None, None, "Acesso negado: usuario invalido"

    token = criar_sessao(contexto)
    return contexto, token, "Login autorizado"


def login(db, username, senha):
    usuario, token, mensagem = autenticar(db, username, senha)
    if usuario is None:
        return False, mensagem, None, None
    return True, mensagem, token, usuario


def logout(usuario_ou_token):
    if encerrar_sessao(usuario_ou_token):
        return True, "Sessao encerrada"
    return False, "Sessao nao encontrada"


def listar_usuarios(db, solicitante):
    permitido, mensagem = exigir_permissao(solicitante, "usuario_visualizar")
    if not permitido:
        return False, mensagem, []

    with DB_LOCK:
        usuarios_db = db.get("usuarios", []) if isinstance(db, dict) else []
        if not isinstance(usuarios_db, list):
            return False, "Lista de usuarios invalida", []

        usuarios = []
        for usuario in usuarios_db:
            if not isinstance(usuario, dict):
                return False, "Registro de usuario invalido", []
            item = deepcopy(usuario)
            item.pop("senha_hash", None)
            item.pop("password_hash", None)
            usuarios.append(item)

    return True, "Usuarios listados", usuarios


def criar_usuario(db, solicitante, nome, papel, senha):
    permitido, mensagem = exigir_permissao(solicitante, "usuario_criar")
    if not permitido:
        return False, mensagem

    if not isinstance(db, dict):
        return False, "Banco de dados invalido"

    if not validar_senha(senha):
        return False, "Senha deve ter pelo menos 6 caracteres"

    with DB_LOCK:
        usuarios = db.get("usuarios")
        if usuarios is None:
            db["usuarios"] = []
            usuarios = db["usuarios"]
        if not isinstance(usuarios, list):
            return False, "Lista de usuarios invalida"

        if buscar_usuario(db, nome)[1] is not None:
            return False, "Usuario ja cadastrado"

        try:
            usuario = Usuario(nome, papel, senha_hash=gerar_senha_hash(senha)).para_dict()
        except ValueError as erro:
            return False, str(erro)

        usuarios.append(usuario)
    return True, "Usuario criado"


def editar_usuario(db, solicitante, indice, novo_nome, novo_papel, nova_senha=None):
    permitido, mensagem = exigir_permissao(solicitante, "usuario_editar")
    if not permitido:
        return False, mensagem

    if not isinstance(db, dict):
        return False, "Banco de dados invalido"

    with DB_LOCK:
        usuarios = db.get("usuarios", [])
        if not isinstance(usuarios, list):
            return False, "Lista de usuarios invalida"
        if not isinstance(indice, int) or not 0 <= indice < len(usuarios):
            return False, "Usuario selecionado invalido"
        if not isinstance(usuarios[indice], dict):
            return False, "Registro de usuario invalido"

        usuario_atual = usuarios[indice]
        nome_atual = usuario_atual.get("nome", usuario_atual.get("username", ""))

        existente_indice, _ = buscar_usuario(db, novo_nome)
        if existente_indice is not None and existente_indice != indice:
            return False, "Outro usuario ja usa esse nome"

        try:
            senha_hash = usuario_atual.get("senha_hash") or usuario_atual.get("password_hash")
            precisa_trocar_senha = usuario_atual.get("precisa_trocar_senha", False)
            if nova_senha:
                if not validar_senha(nova_senha):
                    return False, "Senha deve ter pelo menos 6 caracteres"
                senha_hash = gerar_senha_hash(nova_senha)
                precisa_trocar_senha = False

            atualizado = Usuario(
                novo_nome,
                novo_papel,
                senha_hash=senha_hash,
                id=usuario_atual.get("id"),
                precisa_trocar_senha=precisa_trocar_senha,
            ).para_dict()
        except ValueError as erro:
            return False, str(erro)

        era_adm = usuario_atual.get("papel", usuario_atual.get("role")) == "ADM"
        deixara_de_ser_adm = atualizado["papel"] != "ADM"
        total_adms = sum(
            1 for usuario in usuarios
            if isinstance(usuario, dict) and usuario.get("papel", usuario.get("role")) == "ADM"
        )
        if era_adm and deixara_de_ser_adm and total_adms <= 1:
            return False, "Nao e permitido remover o ultimo ADM"

        usuarios[indice] = atualizado

    if solicitante.nome == nome_atual:
        solicitante.nome = atualizado["nome"]
        solicitante.nome_usuario = atualizado["nome"]
        solicitante.papel = atualizado["papel"]
        solicitante.id = atualizado["id"]
        solicitante.senha_hash = atualizado.get("senha_hash")
        atualizar_sessao(solicitante)
    else:
        invalidar_sessoes_usuario(atualizado["id"])

    return True, "Usuario atualizado"


class UsuarioFake:
    nome = "API"
    papel = "ADM"


def resposta(data):
    print(json.dumps(data))


if __name__ == "__main__":
    db = carregar_db()
    solicitante = UsuarioFake()

    try:
        comando = sys.argv[1]

        # ===== LOGIN =====
        if comando == "login":
            body = json.loads(sys.argv[2])

            usuario, mensagem = autenticar(
                db,
                body["nome"],
                body["papel"]
            )

            resposta({
                "sucesso": usuario is not None,
                "usuario": usuario.__dict__ if usuario else None,
                "mensagem": mensagem
            })

        # ===== LISTAR USUARIOS =====
        elif comando == "listar":
            sucesso, mensagem, dados = listar_usuarios(db, solicitante)

            resposta({
                "sucesso": sucesso,
                "dados": dados,
                "mensagem": mensagem
            })

        # ===== CRIAR USUARIO =====
        elif comando == "criar":
            body = json.loads(sys.argv[2])

            sucesso, mensagem = criar_usuario(
                db,
                solicitante,
                body["nome"],
                body["papel"]
            )

            if sucesso:
                salvar_db(db)

            resposta({
                "sucesso": sucesso,
                "mensagem": mensagem
            })

        # ===== EDITAR USUARIO =====
        elif comando == "editar":
            body = json.loads(sys.argv[2])

            sucesso, mensagem = editar_usuario(
                db,
                solicitante,
                body["indice"],
                body["nome"],
                body["papel"]
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


def alterar_senha(db, usuario, senha_atual, nova_senha):
    if not contexto_autenticado(usuario):
        return False, "Acesso negado: usuario nao autenticado"

    with DB_LOCK:
        indice, registro = buscar_usuario_por_id(db, getattr(usuario, "id", None))
        if registro is None:
            indice, registro = buscar_usuario(db, getattr(usuario, "nome", ""))

        if registro is None:
            return False, "Usuario nao encontrado"

        senha_hash = registro.get("senha_hash") or registro.get("password_hash")
        if not verificar_senha(senha_atual, senha_hash):
            return False, "Senha atual invalida"

        if not validar_senha(nova_senha):
            return False, "Senha deve ter pelo menos 6 caracteres"

        registro["senha_hash"] = gerar_senha_hash(nova_senha)
        registro["password_hash"] = registro["senha_hash"]
        registro.pop("precisa_trocar_senha", None)
        usuario.senha_hash = registro["senha_hash"]

    usuario.precisa_trocar_senha = False
    return True, "Senha atualizada"
