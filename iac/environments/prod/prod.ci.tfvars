aws_region   = "us-east-2"
project_name = "polaris"
environment  = "prod"

tags = {}

vpc_cidr = "10.0.0.0/16"

azs = ["us-east-2a", "us-east-2b", "us-east-2c"]

public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
data_subnet_cidrs    = ["10.0.20.0/24", "10.0.21.0/24", "10.0.22.0/24"]

enable_nat_gateway   = true
single_nat_gateway   = false
enable_vpc_endpoints = true

alb_logs_prefix = "api-service"

api_service_desired_count             = 2
admin_service_desired_count           = 2
reservation_service_desired_count     = 2
event_processor_service_desired_count = 2

rds_capacity_mode           = "provisioned"
rds_engine_version          = "18.3"
rds_reader_count            = 2
rds_writer_instance_class   = "db.r6g.xlarge"
rds_backup_retention_period = 30

# Production CI must preserve data-plane deletion protections. Teardown, when
# explicitly approved, uses a separate one-time var file and runbook.
rds_deletion_protection              = true
ecs_enable_deletion_protection       = true
cognito_deletion_protection          = true
dynamodb_deletion_protection_enabled = true
s3_force_destroy                     = false

redis_capacity_mode              = "provisioned"
redis_engine_version             = "7.1"
redis_num_shards                 = 3
redis_replicas_per_shard         = 1
redis_node_type                  = "cache.r7g.xlarge"
redis_transit_encryption_enabled = true
redis_major_engine_version       = "7"

kafka_version                    = "3.9.x.kraft"
kafka_broker_count               = 3
kafka_broker_instance_type       = "kafka.m5.xlarge"
kafka_broker_volume_size_gb      = 500
kafka_log_retention_hours        = 336
kafka_default_replication_factor = 3
kafka_min_insync_replicas        = 2
kafka_default_num_partitions     = 3

cognito_mfa_configuration           = "OPTIONAL"
cognito_create_user_pool_domain     = false
cognito_admin_create_user_only      = true
cognito_password_minimum_length     = 12
cognito_access_token_validity_hours = 1
cognito_id_token_validity_hours     = 1
cognito_refresh_token_validity_days = 30

dynamodb_billing_mode                      = "PROVISIONED"
dynamodb_sensor_readings_ttl_enabled       = true
dynamodb_websocket_connections_ttl_enabled = true

s3_lifecycle_glacier_transition_days = 90

secrets_manager_rds_rotation_days = 30

base_domain    = "nevadolg.com"
hosted_zone_id = "Z05508811M0ZDY4TTSR4A"

github_repository = "jeancdevx/polaris"

terraform_state_bucket = "polaris-bootstrap-tfstate-737710549633-us-east-2"

enable_atlantis = false

observability_alarm_email_endpoints = ["jcode2006@gmail.com"]
