"""Kafka topic bootstrap Lambda.

Creates all required topics in MSK idempotently.
Invoked synchronously via aws_lambda_invocation from Terraform
after the MSK cluster is provisioned.

Returns JSON: {"status": "ok", "created": [...], "already_existed": [...]}
"""

from __future__ import annotations

import json
import os
import ssl
import time

from aws_msk_iam_sasl_signer import MSKAuthTokenProvider
from kafka import KafkaAdminClient
from kafka.admin import NewTopic
from kafka.errors import TopicAlreadyExistsError

BOOTSTRAP_SERVERS: str = os.environ["KAFKA_BOOTSTRAP_SERVERS"]
REGION: str = os.environ.get("AWS_REGION", "us-east-2")

_PARTITIONS: int = int(os.environ.get("TOPIC_PARTITIONS", "3"))
_REPLICATION: int = int(os.environ.get("TOPIC_REPLICATION_FACTOR", "3"))

_TOPICS_CONFIG: list[dict[str, str]] = [
    {
        "name": "vehicle.entry",
        "retention_ms": "604800000",  # 7 days
    },
    {
        "name": "vehicle.exit",
        "retention_ms": "604800000",  # 7 days
    },
    {
        "name": "sensor.occupancy",
        "retention_ms": "259200000",  # 3 days
    },
    {
        "name": "sensor.proximity",
        "retention_ms": "86400000",  # 1 day
    },
    {
        "name": "reservation.created",
        "retention_ms": "604800000",  # 7 days
    },
    {
        "name": "reservation.cancelled",
        "retention_ms": "604800000",  # 7 days
    },
    {
        "name": "rfid.validation",
        "retention_ms": "259200000",  # 3 days
    },
    {
        "name": "audit.events",
        "retention_ms": "2592000000",  # 30 days
    },
]


class _MSKTokenProvider:
    """Token provider for MSK IAM SASL/OAUTHBEARER (kafka-python-ng interface)."""

    def token(self) -> str:
        auth_token, _ = MSKAuthTokenProvider.generate_auth_token(REGION)
        return auth_token


def _create_admin_client(retries: int = 5, delay: float = 5.0) -> KafkaAdminClient:
    """Create KafkaAdminClient with MSK IAM auth; retries on connection failure."""
    last_exc: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            return KafkaAdminClient(
                bootstrap_servers=BOOTSTRAP_SERVERS.split(","),
                security_protocol="SASL_SSL",
                sasl_mechanism="OAUTHBEARER",
                sasl_oauth_token_provider=_MSKTokenProvider(),
                ssl_context=ssl.create_default_context(),
                client_id="polaris-kafka-setup",
                request_timeout_ms=20000,
            )
        except Exception as exc:
            last_exc = exc
            print(json.dumps({"event": "connect_retry", "attempt": attempt, "error": str(exc)}))
            if attempt < retries:
                time.sleep(delay)

    raise RuntimeError(f"Failed to connect to MSK after {retries} attempts") from last_exc


def handler(event: dict, context: object) -> dict:
    admin = _create_admin_client()
    created: list[str] = []
    already_existed: list[str] = []

    try:
        for topic_cfg in _TOPICS_CONFIG:
            new_topic = NewTopic(
                name=topic_cfg["name"],
                num_partitions=_PARTITIONS,
                replication_factor=_REPLICATION,
                topic_configs={"retention.ms": topic_cfg["retention_ms"]},
            )
            try:
                admin.create_topics([new_topic], validate_only=False)
                created.append(topic_cfg["name"])
                print(json.dumps({"event": "topic_created", "topic": topic_cfg["name"]}))
            except TopicAlreadyExistsError:
                already_existed.append(topic_cfg["name"])
                print(json.dumps({"event": "topic_exists", "topic": topic_cfg["name"]}))
    finally:
        try:
            admin.close()
        except Exception:
            pass

    result = {"status": "ok", "created": created, "already_existed": already_existed}
    print(json.dumps({"event": "setup_complete", **result}))
    return result
