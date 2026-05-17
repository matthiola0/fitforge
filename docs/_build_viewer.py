"""Inject all markdown files into viewer.html placeholders."""
import re
import sys
from pathlib import Path

docs_dir = Path(__file__).parent
template_path = docs_dir / "viewer.html"

mapping = {
    "__MD_SDD__": "SDD.md",
    "__MD_01__": "01-product-overview.md",
    "__MD_02__": "02-system-architecture.md",
    "__MD_03__": "03-tech-stack.md",
    "__MD_04__": "04-data-model.md",
    "__MD_05__": "05-domain-logic.md",
    "__MD_06__": "06-state-management.md",
    "__MD_07__": "07-screen-flow.md",
    "__MD_08__": "08-pwa-offline.md",
    "__MD_09__": "09-monorepo-structure.md",
    "__MD_10__": "10-ai-extension-points.md",
    "__MD_11__": "11-testing-deployment.md",
    "__MD_12__": "12-roadmap-v2.md",
    "__MD_13__": "13-exercise-tagging.md",
    "__MD_20__": "20-claude-design-prompts.md",
}

template = template_path.read_text(encoding="utf-8")

for placeholder, filename in mapping.items():
    md_path = docs_dir / filename
    if not md_path.exists():
        print(f"WARN: {filename} not found, skipping", file=sys.stderr)
        continue
    content = md_path.read_text(encoding="utf-8")
    # Defend against accidental </script> in content
    content = content.replace("</script>", "<\\/script>")
    # Replace placeholder
    if placeholder not in template:
        print(f"WARN: {placeholder} not in template", file=sys.stderr)
        continue
    template = template.replace(placeholder, content)
    print(f"  injected {filename} ({len(content)} chars) -> {placeholder}")

# Sanity: warn if any placeholders remain
remaining = re.findall(r"__MD_\w+__", template)
if remaining:
    print(f"WARN: unreplaced placeholders: {set(remaining)}", file=sys.stderr)

template_path.write_text(template, encoding="utf-8")
size_kb = len(template.encode("utf-8")) / 1024
print(f"\nDone. viewer.html now {size_kb:.1f} KB")
