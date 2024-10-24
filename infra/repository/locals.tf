locals {
  project = "io-p"

  identity_resource_group_name = "${local.project}-identity-rg"

  kv_common_name                = "io-p-kv-common"
  kv_common_resource_group_name = "io-p-rg-common"
  bot_email_secret_name         = "io-bot-email"
  bot_username_secret_name      = "io-bot-username"

  repo_secrets = {
    "ARM_TENANT_ID"       = data.azurerm_client_config.current.tenant_id,
    "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id,
  }

  app_cd = {
    secrets = {
      "ARM_CLIENT_ID" = data.azurerm_user_assigned_identity.app_prod_cd.client_id,
      "GIT_EMAIL"     = data.azurerm_key_vault_secret.bot_email.value
      "GIT_USERNAME"  = data.azurerm_key_vault_secret.bot_username.value
    },
    reviewers_teams = ["io-auth-n-identity-backend", "engineering-team-cloud-eng"]
  }
}
