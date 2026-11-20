"""Pas het uitgavenummer toe op de distributie, bovenop de ongewijzigde Master."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
VERSION = (ROOT / "release" / "VERSION").read_text(encoding="ascii").strip()
if not re.fullmatch(r"\d+\.\d+\.\d+", VERSION):
    raise ValueError("release/VERSION moet een nummer als 0.36.20 bevatten.")

VERSION_FIELDS = {
    "Begin hier.html": rb'(?<=<span data-i18n="Versie )\d+\.\d+\.\d+|(?<=">Versie )\d+\.\d+\.\d+(?=</span)',
    "taal-woordenboek.js": rb'(?<="Versie )\d+\.\d+\.\d+(?=":"Version )|(?<=":"Version )\d+\.\d+\.\d+(?=")',
}


def release_bytes(name, content):
    """Laat elk Masterbestand ongemoeid behalve de twee bekende versievelden."""
    pattern = VERSION_FIELDS.get(name)
    if pattern is None:
        return content
    rendered, count = re.subn(pattern, VERSION.encode("ascii"), content)
    if count != 2:
        raise ValueError(f"Verwacht twee versievelden in {name}, gevonden: {count}")
    return rendered
