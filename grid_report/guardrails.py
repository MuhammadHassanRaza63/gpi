import re

CUD_INTENT_RE = re.compile(
    r"\b(insert\s+into|update\s+\w+\s+set|delete\s+from|drop\s+table|drop\s+database|"
    r"alter\s+table|truncate\s+table|create\s+table|create\s+database|replace\s+into|"
    r"upsert|merge\s+into|add\s+record|delete\s+record|update\s+record)\b",
    re.IGNORECASE,
)

FORBIDDEN_SQL_RE = re.compile(
    r"\b(insert|update|delete|drop|alter|create|attach|detach|pragma|truncate|"
    r"grant|revoke|vacuum|replace|merge|call|exec)\b",
    re.IGNORECASE,
)

ACRONYM_MAP = {
    "crm": ("CRM", "Customer Resolution Maintenance"),
    "crr": ("CRR", "Customer Resolution Rate"),
    "crs": ("CRS", "Customer Resolution Satisfaction"),
    "tat": ("TAT", "Turn Around Time"),
    "ofc": ("OFC", "Optical Fiber Cut"),
    "ls": ("LS", "Load Shedding"),
    "rca": ("RCA", "Root Cause Analysis"),
}


def is_read_only_sql(sql: str) -> bool:
    """Allows strictly a single read-only SELECT or WITH statement."""
    cleaned = (sql or "").strip().rstrip(";").strip()
    if not cleaned:
        return False
    if not cleaned.upper().startswith(("SELECT", "WITH")):
        return False
    if ";" in cleaned:
        return False
    if FORBIDDEN_SQL_RE.search(cleaned):
        return False
    return True


def normalize_grouping_column(col_name: str, dialect: str = "postgresql") -> str:
    """Returns a case-normalized grouping expression for categorical text columns."""
    quoted = f'"{col_name.replace(chr(34), chr(34) * 2)}"'
    if dialect == "postgresql":
        return f"UPPER(TRIM({quoted}::text))"
    return f"UPPER(TRIM(CAST({quoted} AS TEXT)))"