import time
import tracemalloc

from copy import deepcopy
from datetime import datetime, timezone

from utils.db import carregar_db, salvar_db
from models.ocorrencia import Ocorrencia
from services.aluno_service import buscar_aluno
from utils.db import DB_LOCK, criar_db_vazio
from utils.validators import (
    CATEGORIAS,
    PRIORIDADES,
    exigir_permissao,
    log_info,
    normalizar_texto,
    validar_transicao_status,
    validar_status,
)


def _obter_ocorrencias(db, criar=False):
    if not isinstance(db, dict):
        return None, "Banco de dados invalido"

    ocorrencias = db.get("ocorrencias")
    if ocorrencias is None:
        if criar:
            db["ocorrencias"] = []
            return db["ocorrencias"], None
        return [], None

    if not isinstance(ocorrencias, list):
        return None, "Lista de ocorrencias invalida"

    return ocorrencias, None


def _registro_ocorrencia_valido(registro):
    return isinstance(registro, dict)


def _historico_valido(historico):
    if not isinstance(historico, list):
        return False
    if not historico:
        return False

    for item in historico:
        if not isinstance(item, dict):
            return False
        if not validar_status(item.get("status")):
            return False

    return True


def _copiar_ocorrencias(ocorrencias):
    return deepcopy(ocorrencias)


def listar_ocorrencias(db, usuario):
    permitido, mensagem = exigir_permissao(usuario, "ocorrencia_visualizar")
    if not permitido:
        return False, mensagem, []

    with DB_LOCK:
        ocorrencias, erro = _obter_ocorrencias(db)
        if erro:
            return False, erro, []
        if ocorrencias is None or not all(_registro_ocorrencia_valido(ocorrencia) for ocorrencia in ocorrencias):
            return False, "Registro de ocorrencia invalido", []

        return True, "Ocorrencias listadas", _copiar_ocorrencias(ocorrencias)


def listar_ocorrencias_aluno(db, usuario, aluno):
    permitido, mensagem = exigir_permissao(usuario, "ocorrencia_visualizar")
    if not permitido:
        return False, mensagem, []

    with DB_LOCK:
        ocorrencias_db, erro = _obter_ocorrencias(db)
        if erro:
            return False, erro, []
        if ocorrencias_db is None or not all(_registro_ocorrencia_valido(ocorrencia) for ocorrencia in ocorrencias_db):
            return False, "Registro de ocorrencia invalido", []

        aluno_nome = normalizar_texto(aluno).lower()
        ocorrencias = [
            ocorrencia for ocorrencia in ocorrencias_db
            if (
                normalizar_texto(ocorrencia.get("aluno", "")).lower() == aluno_nome
                or ocorrencia.get("aluno_id") == aluno
            )
        ]
        return True, "Ocorrencias do aluno listadas", _copiar_ocorrencias(ocorrencias)


def criar_ocorrencia(db, usuario, aluno, descricao, categoria, prioridade):
    permitido, mensagem = exigir_permissao(usuario, "ocorrencia_criar")
    if not permitido:
        return False, mensagem

    with DB_LOCK:
        ocorrencias, erro = _obter_ocorrencias(db, criar=True)
        if erro or ocorrencias is None:
            return False, erro or "Erro ao obter ocorrencias"

        _, aluno_db = buscar_aluno(db, aluno)
        if aluno_db is None:
            return False, "Aluno nao cadastrado"

        try:
            ocorrencia = Ocorrencia(
                aluno=aluno_db["nome"],
                descricao=descricao,
                categoria=categoria,
                prioridade=prioridade,
                criado_por=usuario.nome,
                aluno_id=aluno_db.get("id"),
                criado_por_id=getattr(usuario, "id", None),
            ).para_dict()
        except ValueError as erro:
            return False, str(erro)

        ocorrencias.append(ocorrencia)
        return True, "Ocorrencia registrada"


def atualizar_status_ocorrencia(db, usuario, indice, novo_status):
    permitido, mensagem = exigir_permissao(usuario, "ocorrencia_atualizar")
    if not permitido:
        return False, mensagem

    with DB_LOCK:
        ocorrencias, erro = _obter_ocorrencias(db)
        if erro or ocorrencias is None:
            return False, erro or "Erro ao obter ocorrencias"

        if not isinstance(indice, int) or not 0 <= indice < len(ocorrencias):
            return False, "Ocorrencia selecionada invalida"

        registro = ocorrencias[indice]
        if not _registro_ocorrencia_valido(registro):
            return False, "Registro de ocorrencia invalido"

        status_atual = registro.get("status")
        valido, mensagem = validar_transicao_status(usuario.papel, status_atual, novo_status)
        if not valido:
            return False, mensagem

        historico = registro.get("historico")
        if not _historico_valido(historico):
            return False, "Historico da ocorrencia invalido"

        historico.append({
            "acao": f"Alterado por {usuario.nome}",
            "status": novo_status,
            "usuario": usuario.nome,
            "data_hora": datetime.now(timezone.utc).isoformat(),
        })
        registro["status"] = novo_status
        return True, "Status atualizado"


def obter_historico(db, usuario, indice):
    permitido, mensagem = exigir_permissao(usuario, "ocorrencia_visualizar")
    if not permitido:
        return False, mensagem, []

    with DB_LOCK:
        ocorrencias, erro = _obter_ocorrencias(db)
        if erro or ocorrencias is None:
            return False, erro or "Erro ao obter ocorrencias", []

        if not isinstance(indice, int) or not 0 <= indice < len(ocorrencias):
            return False, "Ocorrencia selecionada invalida", []

        registro = ocorrencias[indice]
        if not _registro_ocorrencia_valido(registro):
            return False, "Registro de ocorrencia invalido", []

        historico = registro.get("historico", [])
        if not _historico_valido(historico):
            return False, "Historico da ocorrencia invalido", []

        return True, "Historico carregado", deepcopy(historico)


def executar_teste_estresse():
    from models.aluno import Aluno
    from models.usuario import Usuario
    from services.auth_service import autenticar
    from services.sala_service import criar_sala
    from utils.security import gerar_senha_hash

    quantidade = 50_000
    db = criar_db_vazio(incluir_admin=False)
    adm = Usuario("stress_adm", "ADM", senha_hash=gerar_senha_hash("stress_adm123"))
    professor = Usuario(
        "stress_professor",
        "PROFESSOR",
        senha_hash=gerar_senha_hash("stress_professor123"),
    )
    coordenador = Usuario(
        "stress_coordenador",
        "COORDENADOR",
        senha_hash=gerar_senha_hash("stress_coordenador123"),
    )
    diretor = Usuario("stress_diretor", "DIRETOR", senha_hash=gerar_senha_hash("stress_diretor123"))

    db["usuarios"].extend([
        adm.para_dict(),
        professor.para_dict(),
        coordenador.para_dict(),
        diretor.para_dict(),
    ])
    adm, _ = autenticar(db, "stress_adm", "stress_adm123")
    professor, _ = autenticar(db, "stress_professor", "stress_professor123")
    coordenador, _ = autenticar(db, "stress_coordenador", "stress_coordenador123")
    diretor, _ = autenticar(db, "stress_diretor", "stress_diretor123")

    assert adm is not None, "Falha na autenticacao do ADM"
    assert professor is not None, "Falha na autenticacao do PROFESSOR"
    assert coordenador is not None, "Falha na autenticacao do COORDENADOR"
    assert diretor is not None, "Falha na autenticacao do DIRETOR"

    tracemalloc.start()
    inicio_total = time.perf_counter()

    criar_sala(db, adm, "1A")

    inicio_alunos = time.perf_counter()
    for indice in range(quantidade):
        db["alunos"].append(Aluno(f"Aluno {indice}", "1A").para_dict())
    tempo_alunos = time.perf_counter() - inicio_alunos

    inicio_ocorrencias = time.perf_counter()
    for indice in range(quantidade):
        db["ocorrencias"].append(Ocorrencia(
            aluno=f"Aluno {indice}",
            descricao=f"Ocorrencia de teste {indice}",
            categoria=CATEGORIAS[indice % len(CATEGORIAS)],
            prioridade=PRIORIDADES[indice % len(PRIORIDADES)],
            criado_por=professor.nome,
        ).para_dict())
    tempo_ocorrencias = time.perf_counter() - inicio_ocorrencias

    inicio_transicoes = time.perf_counter()
    for indice in range(quantidade):
        for status, usuario in (
            ("EM_ANALISE", coordenador),
            ("RESOLVIDA", coordenador),
            ("ENCERRADA", diretor),
        ):
            sucesso, mensagem = atualizar_status_ocorrencia(db, usuario, indice, status)
            if not sucesso:
                raise RuntimeError(mensagem)
    tempo_transicoes = time.perf_counter() - inicio_transicoes

    tempo_total = time.perf_counter() - inicio_total
    memoria_atual, pico_memoria = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    resultado = {
        "alunos": quantidade,
        "ocorrencias": quantidade,
        "transicoes": quantidade * 3,
        "tempo_alunos_seg": round(tempo_alunos, 3),
        "tempo_ocorrencias_seg": round(tempo_ocorrencias, 3),
        "tempo_transicoes_seg": round(tempo_transicoes, 3),
        "tempo_total_seg": round(tempo_total, 3),
        "memoria_atual_mb": round(memoria_atual / 1024 / 1024, 2),
        "pico_memoria_mb": round(pico_memoria / 1024 / 1024, 2),
    }

    log_info("Teste de estresse concluido")
    for chave, valor in resultado.items():
        print(f"{chave}: {valor}")

    return resultado
