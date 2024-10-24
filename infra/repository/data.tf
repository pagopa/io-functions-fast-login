data "github_organization_teams" "all" {
  root_teams_only = true
  summary_only    = true
}

data "azurerm_user_assigned_identity" "app_prod_cd" {
  name                = "${local.project}-auth-session-manager-github-cd-identity"
  resource_group_name = local.identity_resource_group_name
}

data "azurerm_key_vault" "kv_common" {
  name                = local.kv_common_name
  resource_group_name = local.kv_common_resource_group_name
}

data "azurerm_key_vault_secret" "bot_email" {
  key_vault_id = data.azurerm_key_vault.kv_common.id
  name         = local.bot_email_secret_name
}

data "azurerm_key_vault_secret" "bot_username" {
  key_vault_id = data.azurerm_key_vault.kv_common.id
  name         = local.bot_username_secret_name
}
