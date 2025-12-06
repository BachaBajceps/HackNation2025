import json
import re
import os

input_path = "../../funkcje" # Relative to frontend/scripts/ where I'll run it, or absolute
input_abs_path = "/home/kapee/Documents/GitHub/HackNation2025/funkcje"
output_path = "../src/data/generated/taskBudget.json"

print(f"Reading from {input_abs_path}")

try:
    with open(input_abs_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to capture "1.1.1.1. Name" or "1.1.1.1 Name"
    # Handling potential leading/trailing whitespace
    # Structure: Code (digits.digits...) + Dot(optional) + Whitespace + Name
    
    entries = []
    
    lines = content.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Match pattern: Start with digits/dots, then space, then text
        # Example: "1.1.1.1. Name" -> code="1.1.1.1", name="Name"
        match = re.match(r'^([\d\.]+)\.?\s+(.+)$', line)
        if match:
            code_raw = match.group(1).rstrip('.') # Remove trailing dot from code if present
            name = match.group(2).strip()
            
            # Count dots to determine level? 
            # User wants these to be the options.
            # Assuming level 4 for X.X.X.X
            parts = code_raw.split('.')
            level = len(parts)
            
            if level == 4: # User previously requested "only 4 digits" (parts)
                 # Derive parent
                parent = '.'.join(parts[:-1])
                
                entry = {
                    "code": code_raw,
                    "name": name,
                    "level": level,
                    "parent": parent
                }
                entries.append(entry)
            else:
                 # Should we include headers like "1. Bezpieczeństwo..."? 
                 # User said "zastąp tym: (bez wierszy ktore nie mają czterech liczb i kropek)"
                 # So strict filtering for 4 parts.
                 pass

    print(f"Found {len(entries)} valid entries.")
    
    # Save to JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully wrote to {output_path}")

except Exception as e:
    print(f"Error: {e}")
