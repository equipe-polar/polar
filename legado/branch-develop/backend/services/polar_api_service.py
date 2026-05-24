import hashlib
import hmac
import json
import os
import secrets
import sys
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4


BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DB_PATH = BASE_DIR / "banco_dados.json"
DB_PATH = Path(os.getenv("POLAR_DB_PATH") or DEFAULT_DB_PATH)

STATUS_VALIDOS = {"REGISTRADA", "EM_ANALISE", "RESOLVIDA", "ENCERRADA"}
ROLES_VALIDOS = {"PROFESSOR", "COORDENADOR", "DIRETOR", "ADM", "SECRETARIO"}


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def new_id():
    return uuid4().hex


def text(value, limit=500):
    if not isinstance(value, str):
        value = "" if value is None else str(value)
    return " ".join(value.replace("\x00", " ").strip().split())[:limit]


def normalize_key(value):
    return text(value).casefold()


def normalize_role(value):
    role = text(value or "PROFESSOR").upper()
    aliases = {
        "ADMIN": "ADM",
        "ADMINISTRADOR": "ADM",
        "SECRETARIO(A)": "SECRETARIO",
    }
    return aliases.get(role, role)


def normalize_status(value):
    status = text(value or "REGISTRADA").upper().replace(" ", "_")
    status = status.replace("Á", "A").replace("Ã", "A")
    return status if status in STATUS_VALIDOS else "REGISTRADA"


def normalize_severity(value):
    severity = text(value or "media").lower()
    replacements = {
        "média": "media",
        "medio": "media",
        "medium": "media",
        "low": "baixa",
        "high": "alta",
    }
    return replacements.get(severity, severity if severity in {"baixa", "media", "alta"} else "media")


def success(message, data=None, **extras):
    payload = {"success": True, "message": message}
    if data is not None:
        payload["data"] = data
    payload.update(extras)
    return payload


def failure(message, status_code=400, data=None, **extras):
    payload = {"success": False, "message": message, "statusCode": status_code}
    if data is not None:
        payload["data"] = data
    payload.update(extras)
    return payload


def load_db():
    if not DB_PATH.exists():
        data = empty_db()
        save_db(data)
        return data

    try:
        with DB_PATH.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, json.JSONDecodeError):
        data = empty_db()

    if not isinstance(data, dict):
        data = empty_db()

    normalize_db(data)
    return data


def save_db(data):
    normalize_db(data)
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = DB_PATH.with_suffix(DB_PATH.suffix + ".tmp")
    try:
        with tmp_path.open("w", encoding="utf-8") as handle:
            json.dump(data, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(tmp_path, DB_PATH)
    except OSError:
        if tmp_path.exists():
            try:
                tmp_path.unlink()
            except OSError:
                pass
        with DB_PATH.open("w", encoding="utf-8") as handle:
            json.dump(data, handle, ensure_ascii=False, indent=2)
            handle.write("\n")


def empty_db():
    return {
        "usuarios": [],
        "alunos": [],
        "salas": [],
        "ocorrencias": [],
        "notas": [],
        "faltas": [],
        "notificacoes": [],
    }


def normalize_db(data):
    for key in ("usuarios", "alunos", "salas", "ocorrencias", "notas", "faltas", "notificacoes"):
        if not isinstance(data.get(key), list):
            data[key] = []

    if not data["usuarios"]:
        data["usuarios"].append({
            "id": new_id(),
            "nome": "admin",
            "username": "admin",
            "email": "admin@polar.local",
            "papel": "ADM",
            "role": "ADM",
            "senha_hash": None,
            "password_hash": None,
            "createdAt": now_iso(),
        })

    for user in data["usuarios"]:
        if not isinstance(user, dict):
            continue
        user.setdefault("id", new_id())
        username = text(user.get("username") or user.get("nome") or user.get("name"), 120)
        user["username"] = username
        user["nome"] = username
        role = normalize_role(user.get("role") or user.get("papel"))
        user["role"] = role
        user["papel"] = role
        user.setdefault("email", "")
        user.setdefault("createdAt", user.get("criado_em") or now_iso())
        if "passwordHash" in user and "password_hash" not in user:
            user["password_hash"] = user["passwordHash"]
        if "senha_hash" not in user:
            user["senha_hash"] = user.get("password_hash")
        if "password_hash" not in user:
            user["password_hash"] = user.get("senha_hash")

    for student in data["alunos"]:
        if not isinstance(student, dict):
            continue
        student.setdefault("id", new_id())
        name = text(student.get("name") or student.get("nome"), 120)
        klass = text(student.get("class") or student.get("sala") or student.get("room"), 80)
        student["name"] = name
        student["nome"] = name
        student["class"] = klass
        student["sala"] = klass
        student.setdefault("registration", student.get("matricula", ""))
        student.setdefault("responsibleName", student.get("nomeResponsavel", ""))
        student.setdefault("responsibleContact", student.get("contatoResponsavel", ""))
        student.setdefault("createdAt", student.get("criado_em") or now_iso())

    for occurrence in data["ocorrencias"]:
        if not isinstance(occurrence, dict):
            continue
        occurrence.setdefault("id", new_id())
        occurrence.setdefault("studentId", occurrence.get("aluno_id", ""))
        occurrence.setdefault("aluno_id", occurrence.get("studentId", ""))
        occurrence.setdefault("studentName", occurrence.get("student") or occurrence.get("aluno", ""))
        occurrence.setdefault("aluno", occurrence.get("studentName", ""))
        occurrence.setdefault("type", occurrence.get("category") or occurrence.get("categoria", ""))
        occurrence.setdefault("categoria", occurrence.get("type", ""))
        occurrence.setdefault("description", occurrence.get("descricao", ""))
        occurrence.setdefault("descricao", occurrence.get("description", ""))
        occurrence["severity"] = normalize_severity(occurrence.get("severity") or occurrence.get("prioridade"))
        occurrence["prioridade"] = occurrence["severity"]
        occurrence["status"] = normalize_status(occurrence.get("status"))
        occurrence.setdefault("createdBy", occurrence.get("criado_por", "sistema"))
        occurrence.setdefault("criado_por", occurrence.get("createdBy", "sistema"))
        occurrence.setdefault("createdAt", occurrence.get("criado_em") or now_iso())
        occurrence.setdefault("criado_em", occurrence.get("createdAt"))
        occurrence.setdefault("updatedAt", occurrence.get("atualizado_em") or occurrence.get("createdAt"))
        occurrence.setdefault("atualizado_em", occurrence.get("updatedAt"))
        if not isinstance(occurrence.get("history") or occurrence.get("historico"), list):
            occurrence["history"] = []
            occurrence["historico"] = []


def password_hash(password):
    salt = secrets.token_hex(16)
    rounds = 180000
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), rounds).hex()
    return f"pbkdf2_sha256${rounds}${salt}${digest}"


def verify_password(password, stored):
    if not isinstance(password, str) or not password:
        return False

    if not stored:
        return False

    if isinstance(stored, str) and stored.startswith("pbkdf2_sha256$"):
        try:
            _, rounds, salt, expected = stored.split("$", 3)
            digest = hashlib.pbkdf2_hmac(
                "sha256",
                password.encode("utf-8"),
                salt.encode("utf-8"),
                int(rounds),
            ).hex()
            return hmac.compare_digest(digest, expected)
        except (ValueError, TypeError):
            return False

    return hmac.compare_digest(str(stored), password)


def find_by_id_or_index(items, value):
    if value is None:
        return None, None

    raw = str(value)
    for index, item in enumerate(items):
        if isinstance(item, dict) and item.get("id") == raw:
            return index, item

    try:
        index = int(raw)
    except (TypeError, ValueError):
        return None, None

    if 0 <= index < len(items):
        item = items[index]
        return index, item if isinstance(item, dict) else None

    return None, None


def find_by_name(items, name, *keys):
    wanted = normalize_key(name)
    if not wanted:
        return None, None

    for index, item in enumerate(items):
        if not isinstance(item, dict):
            continue
        for key in keys:
            if normalize_key(item.get(key)) == wanted:
                return index, item
    return None, None


def public_user(user):
    return {
        "id": user.get("id"),
        "username": user.get("username") or user.get("nome"),
        "name": user.get("nome") or user.get("username"),
        "email": user.get("email", ""),
        "role": user.get("role") or user.get("papel"),
        "createdAt": user.get("createdAt") or user.get("criado_em"),
    }


def api_student(student):
    return {
        "id": student.get("id"),
        "name": student.get("name") or student.get("nome"),
        "class": student.get("class") or student.get("sala"),
        "registration": student.get("registration") or student.get("matricula", ""),
        "responsibleName": student.get("responsibleName") or student.get("nomeResponsavel", ""),
        "responsibleContact": student.get("responsibleContact") or student.get("contatoResponsavel", ""),
        "createdAt": student.get("createdAt") or student.get("criado_em"),
    }


def api_occurrence(occurrence):
    return {
        "id": occurrence.get("id"),
        "studentId": occurrence.get("studentId") or occurrence.get("aluno_id"),
        "studentName": occurrence.get("studentName") or occurrence.get("aluno"),
        "type": occurrence.get("type") or occurrence.get("categoria"),
        "description": occurrence.get("description") or occurrence.get("descricao"),
        "severity": normalize_severity(occurrence.get("severity") or occurrence.get("prioridade")),
        "status": normalize_status(occurrence.get("status")),
        "createdBy": occurrence.get("createdBy") or occurrence.get("criado_por"),
        "createdAt": occurrence.get("createdAt") or occurrence.get("criado_em"),
        "updatedAt": occurrence.get("updatedAt") or occurrence.get("atualizado_em"),
        "history": deepcopy(occurrence.get("history") or occurrence.get("historico") or []),
    }


def api_notification(notification):
    return {
        "id": notification.get("id"),
        "title": notification.get("title") or notification.get("titulo"),
        "message": notification.get("message") or notification.get("mensagem"),
        "type": notification.get("type") or notification.get("tipo"),
        "recipient": notification.get("recipient") or notification.get("destinatario"),
        "occurrenceId": notification.get("occurrenceId") or notification.get("ocorrencia_id"),
        "createdAt": notification.get("createdAt") or notification.get("criado_em"),
        "status": notification.get("status", "NOVA"),
    }


def require_auth(payload):
    auth = payload.get("auth") if isinstance(payload, dict) else None
    if not isinstance(auth, dict):
        return None, failure("Autenticacao ausente.", 401)

    role = normalize_role(auth.get("role"))
    username = text(auth.get("username") or auth.get("name"), 120)
    if not username or role not in ROLES_VALIDOS:
        return None, failure("Autenticacao invalida.", 401)

    return {"id": auth.get("id"), "username": username, "role": role, "email": auth.get("email")}, None


def require_role(auth, *roles):
    if auth["role"] == "ADM" or auth["role"] in roles:
        return None
    return failure("Perfil sem permissao para esta operacao.", 403)


def auth_login(data, payload):
    username = text(payload.get("username") or payload.get("email") or payload.get("nome"), 120)
    password = payload.get("password") or payload.get("senha")

    _, user = find_by_name(data["usuarios"], username, "username", "nome", "email")
    if user is None:
        return failure("Usuario ou senha invalidos.", 401)

    stored = user.get("password_hash") or user.get("senha_hash")
    legacy_admin = normalize_key(username) == "admin" and password == "admin123" and not stored

    if not legacy_admin and not verify_password(password, stored):
        return failure("Usuario ou senha invalidos.", 401)

    if legacy_admin:
        hashed = password_hash(password)
        user["password_hash"] = hashed
        user["senha_hash"] = hashed

    user["lastLoginAt"] = now_iso()
    save_db(data)
    return success("Login autorizado.", {"user": public_user(user)})


def users_list(data, payload):
    auth, error = require_auth(payload)
    if error:
        return error
    error = require_role(auth, "DIRETOR", "COORDENADOR")
    if error:
        return error
    return success("Usuarios listados.", [public_user(user) for user in data["usuarios"] if isinstance(user, dict)])


def users_create(data, payload):
    auth, error = require_auth(payload)
    if error:
        return error
    error = require_role(auth)
    if error:
        return error

    user_payload = payload.get("user") or {}
    username = text(user_payload.get("username") or user_payload.get("name"), 120)
    email = text(user_payload.get("email"), 160)
    role = normalize_role(user_payload.get("role"))
    password = user_payload.get("password") or user_payload.get("senha")

    if not username:
        return failure("Nome de usuario e obrigatorio.")
    if role not in ROLES_VALIDOS:
        return failure("Perfil invalido.")
    if not isinstance(password, str) or len(password) < 8:
        return failure("Senha deve ter pelo menos 8 caracteres.")
    if find_by_name(data["usuarios"], username, "username", "nome")[1] is not None:
        return failure("Usuario ja cadastrado.", 409)
    if email and find_by_name(data["usuarios"], email, "email")[1] is not None:
        return failure("E-mail ja cadastrado.", 409)

    hashed = password_hash(password)
    user = {
        "id": new_id(),
        "username": username,
        "nome": username,
        "email": email,
        "role": role,
        "papel": role,
        "password_hash": hashed,
        "senha_hash": hashed,
        "createdAt": now_iso(),
    }
    data["usuarios"].append(user)
    save_db(data)
    return success("Usuario criado.", public_user(user))


def students_list(data, payload):
    auth, error = require_auth(payload)
    if error:
        return error
    query = payload.get("query") or {}
    name_filter = normalize_key(query.get("name") or query.get("q") or query.get("search"))
    students = [item for item in data["alunos"] if isinstance(item, dict)]
    if name_filter:
        students = [
            item for item in students
            if name_filter in normalize_key(item.get("name") or item.get("nome"))
        ]
    return success("Alunos listados.", [api_student(student) for student in students])


def students_get(data, payload):
    auth, error = require_auth(payload)
    if error:
        return error
    _, student = find_by_id_or_index(data["alunos"], payload.get("id"))
    if student is None:
        return failure("Aluno nao encontrado.", 404)
    return success("Aluno carregado.", api_student(student))


def students_create(data, payload):
    auth, error = require_auth(payload)
    if error:
        return error
    student_payload = payload.get("student") or {}
    name = text(student_payload.get("name"), 120)
    klass = text(student_payload.get("class"), 80)

    if not name or not klass:
        return failure("Nome e turma do aluno sao obrigatorios.")
    if find_by_name(data["alunos"], name, "name", "nome")[1] is not None:
        return failure("Aluno ja cadastrado.", 409)

    student = {
        "id": new_id(),
        "name": name,
        "nome": name,
        "class": klass,
        "sala": klass,
        "registration": text(student_payload.get("registration"), 80),
        "responsibleName": text(student_payload.get("responsibleName"), 120),
        "responsibleContact": text(student_payload.get("responsibleContact"), 120),
        "createdAt": now_iso(),
    }
    data["alunos"].append(student)
    save_db(data)
    return success("Aluno criado.", api_student(student))


def students_update(data, payload):
    auth, error = require_auth(payload)
    if error:
        return error
    index, student = find_by_id_or_index(data["alunos"], payload.get("id"))
    if student is None:
        return failure("Aluno nao encontrado.", 404)

    student_payload = payload.get("student") or {}
    old_name = student.get("name") or student.get("nome")
    new_name = text(student_payload.get("name") or old_name, 120)
    new_class = text(student_payload.get("class") or student.get("class") or student.get("sala"), 80)
    other_index, _ = find_by_name(data["alunos"], new_name, "name", "nome")
    if other_index is not None and other_index != index:
        return failure("Outro aluno ja usa esse nome.", 409)

    student.update({
        "name": new_name,
        "nome": new_name,
        "class": new_class,
        "sala": new_class,
        "registration": text(student_payload.get("registration") or student.get("registration"), 80),
        "responsibleName": text(student_payload.get("responsibleName") or student.get("responsibleName"), 120),
        "responsibleContact": text(student_payload.get("responsibleContact") or student.get("responsibleContact"), 120),
    })

    for occurrence in data["ocorrencias"]:
        if isinstance(occurrence, dict) and (
            occurrence.get("studentId") == student.get("id")
            or occurrence.get("aluno_id") == student.get("id")
            or occurrence.get("studentName") == old_name
            or occurrence.get("aluno") == old_name
        ):
            occurrence["studentName"] = new_name
            occurrence["aluno"] = new_name
            occurrence["studentId"] = student.get("id")
            occurrence["aluno_id"] = student.get("id")

    save_db(data)
    return success("Aluno atualizado.", api_student(student))


def students_delete(data, payload):
    auth, error = require_auth(payload)
    if error:
        return error
    index, student = find_by_id_or_index(data["alunos"], payload.get("id"))
    if student is None:
        return failure("Aluno nao encontrado.", 404)

    student_id = student.get("id")
    student_name = student.get("name") or student.get("nome")
    for occurrence in data["ocorrencias"]:
        if not isinstance(occurrence, dict):
            continue
        if occurrence.get("studentId") == student_id or occurrence.get("aluno_id") == student_id:
            return failure("Nao e permitido remover aluno com ocorrencias vinculadas.", 409)
        if occurrence.get("studentName") == student_name or occurrence.get("aluno") == student_name:
            return failure("Nao e permitido remover aluno com ocorrencias vinculadas.", 409)

    data["alunos"].pop(index)
    save_db(data)
    return success("Aluno removido.")


def occurrences_list(data, payload):
    auth, error = require_auth(payload)
    if error:
        return error
    query = payload.get("query") or {}
    student_id = text(query.get("studentId") or query.get("aluno_id"), 80)
    status = text(query.get("status"), 40)
    occurrences = [item for item in data["ocorrencias"] if isinstance(item, dict)]

    if student_id:
        occurrences = [
            item for item in occurrences
            if item.get("studentId") == student_id or item.get("aluno_id") == student_id
        ]
    if status:
        wanted = normalize_status(status)
        occurrences = [item for item in occurrences if normalize_status(item.get("status")) == wanted]

    return success("Ocorrencias listadas.", [api_occurrence(item) for item in occurrences])


def occurrences_get(data, payload):
    auth, error = require_auth(payload)
    if error:
        return error
    _, occurrence = find_by_id_or_index(data["ocorrencias"], payload.get("id"))
    if occurrence is None:
        return failure("Ocorrencia nao encontrada.", 404)
    return success("Ocorrencia carregada.", api_occurrence(occurrence))


def occurrences_create(data, payload):
    auth, error = require_auth(payload)
    if error:
        return error

    occurrence_payload = payload.get("occurrence") or {}
    student_id = text(occurrence_payload.get("studentId"), 80)
    student_name = text(occurrence_payload.get("studentName"), 120)
    type_value = text(occurrence_payload.get("type"), 120)
    description = text(occurrence_payload.get("description"), 2000)
    severity = normalize_severity(occurrence_payload.get("severity"))
    created_by = text(occurrence_payload.get("createdBy") or auth["username"], 120)

    if student_id:
        _, student = find_by_id_or_index(data["alunos"], student_id)
    else:
        _, student = find_by_name(data["alunos"], student_name, "name", "nome")

    if student is None:
        return failure("Aluno nao encontrado. Cadastre o aluno antes da ocorrencia.", 404)
    if not type_value:
        return failure("Tipo da ocorrencia e obrigatorio.")
    if len(description) < 10:
        return failure("Descricao deve ter pelo menos 10 caracteres.")

    student_id = student.get("id")
    student_name = student.get("name") or student.get("nome")
    timestamp = now_iso()
    history = [{
        "id": new_id(),
        "action": "Criada",
        "status": "REGISTRADA",
        "user": created_by,
        "createdAt": timestamp,
    }]
    occurrence = {
        "id": new_id(),
        "studentId": student_id,
        "aluno_id": student_id,
        "studentName": student_name,
        "aluno": student_name,
        "type": type_value,
        "categoria": type_value,
        "description": description,
        "descricao": description,
        "severity": severity,
        "prioridade": severity,
        "status": "REGISTRADA",
        "createdBy": created_by,
        "criado_por": created_by,
        "createdAt": timestamp,
        "criado_em": timestamp,
        "updatedAt": timestamp,
        "atualizado_em": timestamp,
        "history": history,
        "historico": history,
    }
    data["ocorrencias"].append(occurrence)
    save_db(data)
    return success("Ocorrencia criada.", api_occurrence(occurrence))


def occurrences_update(data, payload):
    auth, error = require_auth(payload)
    if error:
        return error
    _, occurrence = find_by_id_or_index(data["ocorrencias"], payload.get("id"))
    if occurrence is None:
        return failure("Ocorrencia nao encontrada.", 404)

    occurrence_payload = payload.get("occurrence") or {}
    changed = False

    for source, target in (
        ("type", ("type", "categoria")),
        ("description", ("description", "descricao")),
    ):
        value = text(occurrence_payload.get(source), 2000 if source == "description" else 120)
        if value:
            for key in target:
                occurrence[key] = value
            changed = True

    if occurrence_payload.get("severity"):
        severity = normalize_severity(occurrence_payload.get("severity"))
        occurrence["severity"] = severity
        occurrence["prioridade"] = severity
        changed = True

    if occurrence_payload.get("status"):
        new_status = normalize_status(occurrence_payload.get("status"))
        old_status = normalize_status(occurrence.get("status"))
        if new_status != old_status:
            occurrence["status"] = new_status
            event = {
                "id": new_id(),
                "action": f"Status alterado por {auth['username']}",
                "status": new_status,
                "user": auth["username"],
                "createdAt": now_iso(),
            }
            occurrence.setdefault("history", []).append(event)
            occurrence.setdefault("historico", occurrence["history"])
            changed = True

    if changed:
        timestamp = now_iso()
        occurrence["updatedAt"] = timestamp
        occurrence["atualizado_em"] = timestamp
        save_db(data)

    return success("Ocorrencia atualizada.", api_occurrence(occurrence))


def occurrences_delete(data, payload):
    auth, error = require_auth(payload)
    if error:
        return error
    index, occurrence = find_by_id_or_index(data["ocorrencias"], payload.get("id"))
    if occurrence is None:
        return failure("Ocorrencia nao encontrada.", 404)
    data["ocorrencias"].pop(index)
    save_db(data)
    return success("Ocorrencia removida.")


def reports_occurrences(data, payload):
    auth, error = require_auth(payload)
    if error:
        return error

    occurrences = [api_occurrence(item) for item in data["ocorrencias"] if isinstance(item, dict)]
    by_status = {}
    by_severity = {}
    by_type = {}
    for occurrence in occurrences:
        by_status[occurrence["status"]] = by_status.get(occurrence["status"], 0) + 1
        by_severity[occurrence["severity"]] = by_severity.get(occurrence["severity"], 0) + 1
        by_type[occurrence["type"]] = by_type.get(occurrence["type"], 0) + 1

    return success("Relatorio de ocorrencias.", {
        "total": len(occurrences),
        "byStatus": by_status,
        "bySeverity": by_severity,
        "byType": by_type,
        "recent": occurrences[-5:][::-1],
    })


def reports_student(data, payload):
    auth, error = require_auth(payload)
    if error:
        return error
    _, student = find_by_id_or_index(data["alunos"], payload.get("id"))
    if student is None:
        return failure("Aluno nao encontrado.", 404)

    student_id = student.get("id")
    student_name = student.get("name") or student.get("nome")
    occurrences = [
        api_occurrence(item)
        for item in data["ocorrencias"]
        if isinstance(item, dict)
        and (
            item.get("studentId") == student_id
            or item.get("aluno_id") == student_id
            or item.get("studentName") == student_name
            or item.get("aluno") == student_name
        )
    ]
    by_status = {}
    for occurrence in occurrences:
        by_status[occurrence["status"]] = by_status.get(occurrence["status"], 0) + 1

    return success("Relatorio do aluno.", {
        "student": api_student(student),
        "totalOccurrences": len(occurrences),
        "byStatus": by_status,
        "occurrences": occurrences,
    })


def notifications_create(data, payload):
    auth, error = require_auth(payload)
    if error:
        return error
    notification_payload = payload.get("notification") or {}
    title = text(notification_payload.get("title"), 160)
    message = text(notification_payload.get("message"), 1000)
    if not title or not message:
        return failure("Titulo e mensagem da notificacao sao obrigatorios.")

    notification = {
        "id": new_id(),
        "title": title,
        "titulo": title,
        "message": message,
        "mensagem": message,
        "type": text(notification_payload.get("type") or "sistema", 80),
        "tipo": text(notification_payload.get("type") or "sistema", 80),
        "recipient": text(notification_payload.get("recipient"), 160),
        "destinatario": text(notification_payload.get("recipient"), 160),
        "occurrenceId": text(notification_payload.get("occurrenceId"), 80),
        "ocorrencia_id": text(notification_payload.get("occurrenceId"), 80),
        "createdAt": now_iso(),
        "criado_em": now_iso(),
        "status": "NOVA",
        "createdBy": auth["username"],
    }
    data["notificacoes"].append(notification)
    save_db(data)
    return success("Notificacao criada.", api_notification(notification))


HANDLERS = {
    "auth.login": auth_login,
    "users.list": users_list,
    "users.create": users_create,
    "students.list": students_list,
    "students.get": students_get,
    "students.create": students_create,
    "students.update": students_update,
    "students.delete": students_delete,
    "occurrences.list": occurrences_list,
    "occurrences.get": occurrences_get,
    "occurrences.create": occurrences_create,
    "occurrences.update": occurrences_update,
    "occurrences.delete": occurrences_delete,
    "reports.occurrences": reports_occurrences,
    "reports.student": reports_student,
    "notifications.create": notifications_create,
}


def parse_payload(argv):
    if len(argv) < 3:
        return {}
    try:
        payload = json.loads(argv[2])
    except json.JSONDecodeError:
        raise ValueError("JSON de entrada invalido.")
    if not isinstance(payload, dict):
        raise ValueError("JSON de entrada deve ser um objeto.")
    return payload


def main(argv):
    if len(argv) < 2:
        return failure("Comando ausente.", 400)

    command = text(argv[1], 80)
    handler = HANDLERS.get(command)
    if handler is None:
        return failure("Comando invalido.", 404)

    # Contrato da ponte Node -> Python: comando no argv[1] e payload JSON no argv[2].
    payload = parse_payload(argv)
    data = load_db()
    return handler(data, payload)


if __name__ == "__main__":
    try:
        result = main(sys.argv)
    except ValueError as error:
        result = failure(str(error), 400)
    except Exception as error:
        result = failure(f"Erro interno no backend Python: {error}", 500)

    print(json.dumps(result, ensure_ascii=False))
