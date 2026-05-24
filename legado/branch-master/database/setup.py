from pathlib import Path

from db import conectar

# SUPABASE_DISABLED_FOR_NOW
# Setup legado preservado; nao executar conexao externa nesta fase.

SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"


def aplicar_schema():
    print("SUPABASE_DISABLED_FOR_NOW: schema externo desativado; use JSON local.")
    return False

    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")

    with conectar() as conexao:
        with conexao.cursor() as cursor:
            cursor.execute(schema_sql)

    print("Schema aplicado no Supabase com sucesso.")


if __name__ == "__main__":
    aplicar_schema()
