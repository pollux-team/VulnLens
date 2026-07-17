use zed_extension_api::{self as zed, Extension, SlashCommand, SlashCommandOutput, SlashCommandOutputSection, Worktree};
use serde::Deserialize;

#[derive(Deserialize)]
struct Finding {
    package: String,
    version: Option<String>,
    severity: String,
    cvss: Option<f64>,
    title: String,
    fix: Option<String>,
    line: Option<u32>,
    manifest_path: Option<String>,
}

#[derive(Deserialize)]
struct ScanResult {
    status: String,
    findings: Vec<Finding>,
}

#[derive(Deserialize)]
struct HealthResult {
    name: String,
    current_version: String,
    latest: Option<String>,
    cvss_score: Option<f64>,
    deprecated: bool,
}

struct VulnLensExtension;

impl Extension for VulnLensExtension {
    fn new() -> Self {
        VulnLensExtension
    }

    fn run_slash_command(
        &self,
        command: SlashCommand,
        args: Vec<String>,
        worktree: Option<&Worktree>,
    ) -> std::result::Result<SlashCommandOutput, String> {
        if command.name == "vulnens-scan" {
            let worktree = worktree.ok_or("No worktree found")?;
            let project_path = worktree.root_path();

            let min_severity = args.first().cloned().unwrap_or_else(|| "low".to_string());

            let output = std::process::Command::new("vulnens-cli")
                .args(["scan", &project_path, "--min-severity", &min_severity])
                .output()
                .map_err(|e| format!("Failed to run vulnens-cli: {}. Install with: npm install -g @vulnlens/zed-cli", e))?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(format!("Scan failed: {}", stderr));
            }

            let result: ScanResult = serde_json::from_slice(&output.stdout)
                .map_err(|e| format!("Failed to parse results: {}", e))?;

            let mut markdown = String::new();
            markdown.push_str(&format!("## VulnLens Scan Results\n\n"));
            markdown.push_str(&format!("**Status:** {}\n", result.status));
            markdown.push_str(&format!("**Findings:** {}\n\n", result.findings.len()));

            if result.findings.is_empty() {
                markdown.push_str("No vulnerabilities found. Dependencies look good!\n");
            } else {
                for f in &result.findings {
                    let score = f.cvss.map(|s| format!(" CVSS {}", s)).unwrap_or_default();
                    let fix = f.fix.as_deref().map(|s| format!(" → fix: {}", s)).unwrap_or_default();
                    markdown.push_str(&format!(
                        "- **{}** {} ({}){}{}\n",
                        f.package,
                        f.version.as_deref().unwrap_or("?"),
                        f.severity,
                        score,
                        fix,
                    ));
                }
            }

            Ok(SlashCommandOutput {
                sections: vec![SlashCommandOutputSection {
                    range: (0..markdown.len()).into(),
                    label: "VulnLens Scan".to_string(),
                }],
                text: markdown,
            })
        } else {
            Err(format!("Unknown slash command: {}", command.name))
        }
    }
}

zed::register_extension!(VulnLensExtension);
