"""Backend do P.O.L.A - Configuração de imports."""
import sys
from pathlib import Path

# Adicionar o diretório backend ao sys.path para permitir importações absolutas
backend_dir = Path(__file__).parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
