"""LogiFlow Bootstrap Administrator Provisioning Script.

CLI-only trusted bootstrap tool for claiming the initial default workspace
(ws_default_road_logistics) and creating the root administrator account.

Security Rules:
- Never accessible through public HTTP APIs.
- Locks the default workspace row using SELECT FOR UPDATE within an atomic transaction.
- Strictly verifies bootstrap_claimed_at IS NULL and no owner membership exists.
- Hashes password using Argon2id (never accepts plaintext password on CLI args).
- Supports Python getpass (local dev) and secret-file input (production Docker secrets).
- Never prints passwords or secret contents.
- Atomic commit; complete rollback on any error.
"""

from __future__ import annotations

import argparse
import getpass
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable
from uuid import uuid4

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

# Make sure backend is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from models import User, Workspace, WorkspaceMember  # noqa: E402

DEFAULT_WORKSPACE_ID = "ws_default_road_logistics"
MIN_PASSWORD_LENGTH = 10


class BootstrapError(Exception):
    """Raised when bootstrap administrator provisioning cannot proceed."""
    pass


def get_argon2_hasher() -> Callable[[str], str]:
    """Return the Argon2id password hashing callable."""
    try:
        from argon2 import PasswordHasher
        ph = PasswordHasher()
        return ph.hash
    except ImportError as exc:
        raise BootstrapError(
            "argon2-cffi is not installed in the current environment. "
            "Please install backend dependencies before running bootstrap."
        ) from exc


def validate_password_strength(password: str) -> None:
    """Validate administrator password complexity."""
    if len(password) < MIN_PASSWORD_LENGTH:
        raise BootstrapError(
            f"Password must be at least {MIN_PASSWORD_LENGTH} characters long."
        )
    if not any(char.isdigit() for char in password):
        raise BootstrapError("Password must contain at least one digit.")
    if not any(char.isalpha() for char in password):
        raise BootstrapError("Password must contain at least one letter.")


def read_password_from_file(file_path: str | Path) -> str:
    """Securely read password from a file (e.g. Docker secret)."""
    path = Path(file_path)
    if not path.is_file():
        raise BootstrapError(f"Password secret file not found: {path}")

    try:
        password = path.read_text(encoding="utf-8").strip()
    except Exception as exc:
        raise BootstrapError(f"Could not read password secret file: {exc}") from exc

    if not password:
        raise BootstrapError("Password secret file is empty.")

    return password


def bootstrap_admin(
    session: Session,
    email: str,
    full_name: str,
    password: str,
    workspace_id: str = DEFAULT_WORKSPACE_ID,
    hasher: Callable[[str], str] | None = None,
) -> User:
    """Execute the atomic bootstrap administrator provisioning.

    Runs within a single transaction with row-level locking (SELECT FOR UPDATE)
    to prevent race conditions or duplicate claims.
    """
    clean_email = email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise BootstrapError(f"Invalid email address provided: {email}")

    validate_password_strength(password)

    if hasher is None:
        hasher = get_argon2_hasher()

    # 1. Check if email is already taken
    existing_user = session.scalar(
        select(User).where(User.email == clean_email)
    )
    if existing_user is not None:
        raise BootstrapError(
            f"A user with email '{clean_email}' already exists. Bootstrap aborted."
        )

    # 2. Lock the target workspace row with SELECT ... FOR UPDATE
    # In SQLite (unit tests), with_for_update() is safely ignored or downgraded to table lock.
    workspace = session.scalar(
        select(Workspace)
        .where(Workspace.id == workspace_id)
        .with_for_update()
    )

    if workspace is None:
        raise BootstrapError(
            f"Target workspace '{workspace_id}' was not found in the database. "
            "Ensure initial migrations (including 0003) have run."
        )

    # 3. Verify workspace has not been claimed previously
    if workspace.bootstrap_claimed_at is not None:
        raise BootstrapError(
            f"Workspace '{workspace_id}' has already been claimed on "
            f"{workspace.bootstrap_claimed_at.isoformat()}. Bootstrap rejected."
        )

    # 4. Verify no owner already exists for this workspace
    existing_owner = session.scalar(
        select(WorkspaceMember)
        .where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.role == "owner",
        )
    )
    if existing_owner is not None:
        raise BootstrapError(
            f"Workspace '{workspace_id}' already has an active owner assigned. "
            "Bootstrap rejected."
        )

    # 5. Create the Administrator User
    now = datetime.now(timezone.utc)
    hashed = hasher(password)

    admin_user = User(
        id=f"usr_{uuid4().hex[:12]}",
        email=clean_email,
        hashed_password=hashed,
        full_name=full_name.strip() or "LogiFlow Administrator",
        is_active=True,
        is_superuser=True,
        failed_login_attempts=0,
        locked_until=None,
        created_at=now,
        updated_at=now,
    )
    session.add(admin_user)

    # 6. Assign ownership of default workspace
    membership = WorkspaceMember(
        id=f"mem_{uuid4().hex[:12]}",
        workspace_id=workspace_id,
        user_id=admin_user.id,
        role="owner",
        created_at=now,
    )
    session.add(membership)

    # 7. Permanently mark workspace as claimed
    workspace.bootstrap_claimed_at = now
    workspace.updated_at = now

    # Note: caller is responsible for commit() or rollback()
    return admin_user


def main() -> None:
    parser = argparse.ArgumentParser(
        description="LogiFlow Trusted Administrator Bootstrap Utility."
    )
    parser.add_argument(
        "--email",
        required=True,
        help="Email address for the initial trusted administrator.",
    )
    parser.add_argument(
        "--name",
        default="LogiFlow Administrator",
        help="Full name of the initial trusted administrator.",
    )
    parser.add_argument(
        "--password-file",
        default=os.getenv("BOOTSTRAP_PASSWORD_FILE"),
        help="Path to secret file containing the password (e.g. Docker secret).",
    )
    parser.add_argument(
        "--workspace-id",
        default=DEFAULT_WORKSPACE_ID,
        help=f"Target default workspace identifier (default: {DEFAULT_WORKSPACE_ID}).",
    )

    args = parser.parse_args()

    # Password Acquisition Strategy (Zero Plaintext CLI Arguments)
    if args.password_file:
        password = read_password_from_file(args.password_file)
    else:
        # Interactive secure prompt
        if not sys.stdin.isatty():
            print(
                "ERROR: Non-interactive environment detected without a --password-file.",
                file=sys.stderr,
            )
            print(
                "In automated or containerized environments, provide --password-file or set BOOTSTRAP_PASSWORD_FILE.",
                file=sys.stderr,
            )
            sys.exit(1)

        password = getpass.getpass("Enter administrator password: ")
        confirm_password = getpass.getpass("Confirm administrator password: ")
        if password != confirm_password:
            print("ERROR: Passwords do not match. Bootstrap aborted.", file=sys.stderr)
            sys.exit(1)

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print(
            "ERROR: DATABASE_URL environment variable is not configured.",
            file=sys.stderr,
        )
        sys.exit(1)

    engine = create_engine(db_url, pool_pre_ping=True)
    SessionFactory = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    with SessionFactory() as session:
        try:
            with session.begin():
                admin = bootstrap_admin(
                    session=session,
                    email=args.email,
                    full_name=args.name,
                    password=password,
                    workspace_id=args.workspace_id,
                )
            print("SUCCESS: Trusted administrator successfully provisioned!")
            print(f"User ID:      {admin.id}")
            print(f"Email:        {admin.email}")
            print(f"Workspace ID: {args.workspace_id}")
            print("Default operational records are now claimed under this owner.")
        except BootstrapError as exc:
            print(f"BOOTSTRAP REJECTED: {exc}", file=sys.stderr)
            sys.exit(1)
        except Exception as exc:
            print(f"UNEXPECTED ERROR: {exc}", file=sys.stderr)
            sys.exit(2)


if __name__ == "__main__":
    main()
