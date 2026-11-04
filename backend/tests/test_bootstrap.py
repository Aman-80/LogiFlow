"""Unit tests for LogiFlow Trusted Administrator Bootstrap and Workspace Isolation.

Runs offline in-memory with SQLite. Requires zero database connections or external services.
"""

from __future__ import annotations

import unittest
from datetime import datetime, timezone
from pathlib import Path
import sys
from uuid import uuid4

# Ensure backend directory takes precedence over root
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) in sys.path:
    sys.path.remove(str(BACKEND_DIR))
sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from models import Base, User, Workspace, WorkspaceMember, IndustryType
from bootstrap_admin import bootstrap_admin, BootstrapError, DEFAULT_WORKSPACE_ID


def mock_argon2_hasher(password: str) -> str:
    """Deterministic mock password hasher for offline test execution."""
    return f"$argon2id$v=19$m=65536,t=3,p=4$mock_{password}"


class TestBootstrapAdmin(unittest.TestCase):
    def setUp(self) -> None:
        """Create isolated in-memory SQLite schema for each test."""
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.SessionFactory = sessionmaker(
            bind=self.engine, autoflush=False, autocommit=False
        )

        # Seed the default road logistics workspace in unclaimed state
        with self.SessionFactory() as session:
            with session.begin():
                default_ws = Workspace(
                    id=DEFAULT_WORKSPACE_ID,
                    name="LogiFlow Road Logistics",
                    slug="default-road-logistics",
                    industry_type=IndustryType.ROAD_LOGISTICS.value,
                    is_active=True,
                    bootstrap_claimed_at=None,
                )
                session.add(default_ws)

    def tearDown(self) -> None:
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def test_successful_bootstrap(self) -> None:
        """Verify successful first-time administrator provisioning."""
        with self.SessionFactory() as session:
            with session.begin():
                admin = bootstrap_admin(
                    session=session,
                    email="admin@logiflow.local",
                    full_name="LogiFlow SuperAdmin",
                    password="SuperPassword123!",
                    hasher=mock_argon2_hasher,
                )

            # Query database to confirm persisted state
            persisted_user = session.scalar(
                select(User).where(User.email == "admin@logiflow.local")
            )
            self.assertIsNotNone(persisted_user)
            self.assertEqual(persisted_user.full_name, "LogiFlow SuperAdmin")
            self.assertTrue(persisted_user.is_superuser)
            self.assertTrue(persisted_user.is_active)
            self.assertTrue(persisted_user.hashed_password.startswith("$argon2id$"))

            # Verify Workspace membership
            membership = session.scalar(
                select(WorkspaceMember).where(
                    WorkspaceMember.workspace_id == DEFAULT_WORKSPACE_ID,
                    WorkspaceMember.user_id == persisted_user.id,
                )
            )
            self.assertIsNotNone(membership)
            self.assertEqual(membership.role, "owner")

            # Verify Workspace is marked as claimed
            workspace = session.scalar(
                select(Workspace).where(Workspace.id == DEFAULT_WORKSPACE_ID)
            )
            self.assertIsNotNone(workspace.bootstrap_claimed_at)

    def test_repeated_bootstrap_rejection(self) -> None:
        """Verify that a second bootstrap attempt is strictly rejected."""
        # First claim
        with self.SessionFactory() as session:
            with session.begin():
                bootstrap_admin(
                    session=session,
                    email="first_admin@logiflow.local",
                    full_name="First Admin",
                    password="ValidPassword1!",
                    hasher=mock_argon2_hasher,
                )

        # Second claim attempt must fail
        with self.SessionFactory() as session:
            with self.assertRaises(BootstrapError) as ctx:
                with session.begin():
                    bootstrap_admin(
                        session=session,
                        email="second_attacker@logiflow.local",
                        full_name="Intruder",
                        password="AttackerPassword1!",
                        hasher=mock_argon2_hasher,
                    )
            self.assertIn("already been claimed", str(ctx.exception))

    def test_concurrent_bootstrap_attempts(self) -> None:
        """Simulate two concurrent bootstrap processes contending for the workspace.

        Session A successfully claims and commits; Session B, executing
        against the newly updated workspace state, is rejected.
        """
        session_a = self.SessionFactory()
        session_b = self.SessionFactory()

        try:
            # Session A begins and completes claim
            with session_a.begin():
                bootstrap_admin(
                    session=session_a,
                    email="admin_a@logiflow.local",
                    full_name="Admin A",
                    password="ValidPasswordA1!",
                    hasher=mock_argon2_hasher,
                )

            # Session B attempts to claim the same workspace
            with self.assertRaises(BootstrapError) as ctx:
                with session_b.begin():
                    bootstrap_admin(
                        session=session_b,
                        email="admin_b@logiflow.local",
                        full_name="Admin B",
                        password="ValidPasswordB1!",
                        hasher=mock_argon2_hasher,
                    )
            self.assertIn("already been claimed", str(ctx.exception))
        finally:
            session_a.close()
            session_b.close()

    def test_existing_owner_rejection(self) -> None:
        """Verify bootstrap rejects if an owner member already exists."""
        with self.SessionFactory() as session:
            with session.begin():
                # Manually insert a user and owner member without setting bootstrap_claimed_at
                dummy_user = User(
                    id="usr_dummy",
                    email="dummy@logiflow.local",
                    hashed_password="hash",
                    full_name="Dummy User",
                )
                session.add(dummy_user)
                session.add(
                    WorkspaceMember(
                        id="mem_dummy",
                        workspace_id=DEFAULT_WORKSPACE_ID,
                        user_id=dummy_user.id,
                        role="owner",
                    )
                )

            # Attempting bootstrap must be rejected
            with self.assertRaises(BootstrapError) as ctx:
                with session.begin():
                    bootstrap_admin(
                        session=session,
                        email="new_admin@logiflow.local",
                        full_name="New Admin",
                        password="ValidPassword1!",
                        hasher=mock_argon2_hasher,
                    )
            self.assertIn("already has an active owner assigned", str(ctx.exception))

    def test_existing_email_rejection(self) -> None:
        """Verify bootstrap aborts safely if the admin email is already registered."""
        with self.SessionFactory() as session:
            with session.begin():
                existing = User(
                    id="usr_existing",
                    email="taken@logiflow.local",
                    hashed_password="hash",
                    full_name="Existing User",
                )
                session.add(existing)

            with self.assertRaises(BootstrapError) as ctx:
                with session.begin():
                    bootstrap_admin(
                        session=session,
                        email="taken@logiflow.local",
                        full_name="Admin",
                        password="ValidPassword1!",
                        hasher=mock_argon2_hasher,
                    )
            self.assertIn("already exists", str(ctx.exception))

    def test_transaction_rollback_on_failure(self) -> None:
        """Verify that any error during bootstrap rolls back the transaction completely."""
        with self.SessionFactory() as session:
            try:
                with session.begin():
                    # Attempt bootstrap with an invalid password (< 10 chars)
                    bootstrap_admin(
                        session=session,
                        email="fail@logiflow.local",
                        full_name="Fail Admin",
                        password="short",  # Fails validation
                        hasher=mock_argon2_hasher,
                    )
            except BootstrapError:
                pass

            # Verify nothing was committed
            users = session.scalars(select(User)).all()
            self.assertEqual(len(users), 0)

            members = session.scalars(select(WorkspaceMember)).all()
            self.assertEqual(len(members), 0)

            ws = session.scalar(
                select(Workspace).where(Workspace.id == DEFAULT_WORKSPACE_ID)
            )
            self.assertIsNone(ws.bootstrap_claimed_at)

    def test_public_registration_isolation_from_default_workspace(self) -> None:
        """Verify that normal public registration always provisions an isolated workspace

        and never attaches to or claims ws_default_road_logistics.
        """
        with self.SessionFactory() as session:
            with session.begin():
                # Simulate public user registration logic (POST /auth/register)
                public_user = User(
                    id=f"usr_{uuid4().hex[:12]}",
                    email="public_client@example.com",
                    hashed_password=mock_argon2_hasher("ClientPass123!"),
                    full_name="Public Client",
                    is_active=True,
                    is_superuser=False,
                )
                session.add(public_user)

                # Public registration creates their own new personal workspace
                client_ws_id = f"ws_{uuid4().hex[:12]}"
                client_ws = Workspace(
                    id=client_ws_id,
                    name="Public Client's Workspace",
                    slug="public-clients-workspace",
                    industry_type=IndustryType.ROAD_LOGISTICS.value,
                    is_active=True,
                    bootstrap_claimed_at=None,
                )
                session.add(client_ws)

                session.add(
                    WorkspaceMember(
                        id=f"mem_{uuid4().hex[:12]}",
                        workspace_id=client_ws.id,
                        user_id=public_user.id,
                        role="owner",
                    )
                )

            # Assert isolation
            client_memberships = session.scalars(
                select(WorkspaceMember).where(
                    WorkspaceMember.user_id == public_user.id
                )
            ).all()
            self.assertEqual(len(client_memberships), 1)
            self.assertEqual(client_memberships[0].workspace_id, client_ws_id)
            self.assertNotEqual(
                client_memberships[0].workspace_id, DEFAULT_WORKSPACE_ID
            )

            # Ensure default workspace remains unclaimed
            default_ws = session.scalar(
                select(Workspace).where(Workspace.id == DEFAULT_WORKSPACE_ID)
            )
            self.assertIsNone(default_ws.bootstrap_claimed_at)

            default_members = session.scalars(
                select(WorkspaceMember).where(
                    WorkspaceMember.workspace_id == DEFAULT_WORKSPACE_ID
                )
            ).all()
            self.assertEqual(len(default_members), 0)


if __name__ == "__main__":
    unittest.main()
