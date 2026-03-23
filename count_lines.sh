#!/bin/bash

# Promps - Source Code Line Counter
# Counts lines of code (excluding blank lines)

echo "=========================================="
echo "  Promps - Source Code Line Counter"
echo "=========================================="
echo ""

# Count Rust source files
rust_count=$(find src -type f -name "*.rs" \
    ! -path "*/target/*" \
    -exec cat {} + | sed '/^\s*$/d' | wc -l)

# Count JavaScript files (excluding tests)
js_count=$(find res/js -type f -name "*.js" \
    ! -path "*/node_modules/*" \
    -exec cat {} + | sed '/^\s*$/d' | wc -l)

# Count CSS files
css_count=$(find res/css -type f -name "*.css" \
    -exec cat {} + | sed '/^\s*$/d' | wc -l)

# Count HTML files
html_count=$(find res -type f -name "*.html" \
    -exec cat {} + | sed '/^\s*$/d' | wc -l)

# Count JavaScript test files
js_test_count=$(find res/tests -type f -name "*.test.js" \
    -exec cat {} + | sed '/^\s*$/d' | wc -l)

# Count Cargo.toml
toml_count=$(cat Cargo.toml 2>/dev/null | sed '/^\s*$/d' | wc -l)

# Count JSON config files (exclude auto-generated files)
json_count=$(find . -maxdepth 2 -type f -name "*.json" \
    ! -path "*/node_modules/*" \
    ! -path "*/target/*" \
    ! -path "*/.claude/*" \
    ! -name "package-lock.json" \
    ! -name "stats_data.json" \
    -exec cat {} + | sed '/^\s*$/d' | wc -l)

# Count Markdown files
md_count=$(find . -type f -name "*.md" \
    ! -path "*/node_modules/*" \
    ! -path "*/target/*" \
    ! -path "*/.git/*" \
    -exec cat {} + | sed '/^\s*$/d' | wc -l)

# Display results
echo "Source Code:"
echo "----------------------------------------"
printf "%-30s %6d lines\n" "Rust (src/)" "$rust_count"
printf "%-30s %6d lines\n" "JavaScript (res/js/)" "$js_count"
printf "%-30s %6d lines\n" "CSS" "$css_count"
printf "%-30s %6d lines\n" "HTML" "$html_count"
echo ""

total_source=$((rust_count + js_count + css_count + html_count))
printf "%-30s %6d lines\n" "Total Source Code" "$total_source"
echo ""

echo "Tests:"
echo "----------------------------------------"
printf "%-30s %6d lines\n" "JavaScript Tests" "$js_test_count"
printf "%-30s %6d lines\n" "Rust (included in src/)" "0"
echo "  (Rust tests are inline in source files)"
total_test=$js_test_count
printf "%-30s %6d lines\n" "Total Test Code" "$total_test"
echo ""

echo "Configuration:"
echo "----------------------------------------"
printf "%-30s %6d lines\n" "Cargo.toml" "$toml_count"
printf "%-30s %6d lines\n" "JSON configs" "$json_count"
total_config=$((toml_count + json_count))
printf "%-30s %6d lines\n" "Total Config" "$total_config"
echo ""

echo "Documentation:"
echo "----------------------------------------"
printf "%-30s %6d lines\n" "Markdown (.md)" "$md_count"
echo ""

# Grand Total
echo "=========================================="
grand_total=$((total_source + total_test + total_config))
printf "%-30s %6d lines\n" "TOTAL (excl. docs)" "$grand_total"
echo ""

# Progress indicator (target: 2000 lines)
target=2000
echo "Progress to 2,000 line target:"
echo "----------------------------------------"
percentage=$(awk "BEGIN {printf \"%.1f\", $grand_total * 100 / $target}")
printf "Current: %d lines (%s%%)\n" "$grand_total" "$percentage"
remaining=$((target - grand_total))
if [ $remaining -gt 0 ]; then
    printf "Remaining: %d lines\n" "$remaining"
else
    printf "EXCEEDED target by: %d lines\n" $((-remaining))
fi
echo ""

# Breakdown by category (percentage)
echo "Code Distribution:"
echo "----------------------------------------"
src_pct=$(awk "BEGIN {printf \"%.1f\", $total_source * 100 / $grand_total}")
test_pct=$(awk "BEGIN {printf \"%.1f\", $total_test * 100 / $grand_total}")
config_pct=$(awk "BEGIN {printf \"%.1f\", $total_config * 100 / $grand_total}")
printf "Source Code:        %s%%\n" "$src_pct"
printf "Tests:              %s%%\n" "$test_pct"
printf "Configuration:      %s%%\n" "$config_pct"
echo ""
echo "=========================================="
echo ""
echo "Documentation (not counted in target):"
printf "Markdown: %d lines\n" "$md_count"
echo "=========================================="
