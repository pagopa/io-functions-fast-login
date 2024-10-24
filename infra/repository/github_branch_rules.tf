resource "github_branch_default" "default_main" {
  repository = github_repository.this.name
  branch     = "main"
}
