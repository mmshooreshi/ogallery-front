#!/bin/bash

# Get the appropriate comment for the file type
get_correct_comment() {
  local file="$1"
  local rel_path="$2"
  case "$file" in
    *.vue) echo "<!-- ${rel_path} -->" ;;
    *.ts) echo "// ${rel_path}" ;;
    *) echo "" ;;
  esac
}

# Determine if the first line is the correct comment
is_correct_comment() {
  local first_line="$1"
  local correct_comment="$2"
  [[ "$first_line" == "$correct_comment" ]]
}

# Fix or insert comment
process_file() {
  local file="$1"
  local rel_path="${file#./}"
  local correct_comment
  correct_comment=$(get_correct_comment "$file" "$rel_path")

  # Read the first line
  first_line=$(head -n 1 "$file")

  if is_correct_comment "$first_line" "$correct_comment"; then
    echo "✔️  Correct comment exists: $rel_path"
  else
    tmp_file=$(mktemp)
    {
      echo "$correct_comment"
      # If first line is any kind of existing comment (// or <!--), remove it
      if [[ "$first_line" =~ ^(//|<!--) ]]; then
        tail -n +2 "$file"
      else
        cat "$file"
      fi
    } > "$tmp_file"
    mv "$tmp_file" "$file"
    echo "🔧 Fixed or added comment in: $rel_path"
  fi
}

# Find all relevant files, excluding common directories
find . \
  -type d \( -name "node_modules" -o -name ".nuxt" -o -name ".pnpm" -o -name ".git" -o -name "dist" -o -name "build" -o -name "out" \) -prune -false \
  -o -type f \( -name "*.ts" -o -name "*.vue" \) -print |
while read -r file; do
  process_file "$file"
done
