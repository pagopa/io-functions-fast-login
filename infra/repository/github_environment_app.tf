resource "github_repository_environment" "app_prod_cd" {
  environment = "app-prod-cd"
  repository  = github_repository.this.name

  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }

  reviewers {
    teams = matchkeys(
      data.github_organization_teams.all.teams[*].id,
      data.github_organization_teams.all.teams[*].slug,
      local.app_cd.reviewers_teams
    )
  }
}

resource "github_actions_environment_secret" "app_prod_cd" {
  for_each = local.app_cd.secrets

  repository      = github_repository.this.name
  environment     = github_repository_environment.app_prod_cd.environment
  secret_name     = each.key
  plaintext_value = each.value
}
