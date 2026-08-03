import re
import os

files_to_fix = [
    "src/pages/AskCopilot.tsx",
    "src/pages/Roadmap.tsx",
    "src/pages/PRDGenerator.tsx",
    "src/pages/Prioritization.tsx"
]

def replace_in_class(match):
    # Match can be className="..." or className={`...`}
    # Group 1 is the quote type (" or {`)
    # Group 2 is the classes
    # Group 3 is the closing quote (" or `})
    
    quote_open = match.group(1)
    classes = match.group(2)
    quote_close = match.group(3)
    
    # We only want to replace if we find our target classes and they are NOT inside an existing ${} expression
    # A simple way is to tokenize the classes by ${...} and only replace in the literal parts.
    
    parts = re.split(r'(\$\{[^}]+\})', classes)
    
    for i in range(len(parts)):
        if not parts[i].startswith('${'):
            # This is a literal part
            parts[i] = re.sub(r'\btext-white\b', r"${isDark ? 'text-white' : 'text-gray-900'}", parts[i])
            parts[i] = re.sub(r'\btext-\[#CBD5E1\]\b', r"${isDark ? 'text-[#CBD5E1]' : 'text-gray-700'}", parts[i])
            parts[i] = re.sub(r'\btext-\[#94A3B8\]\b', r"${isDark ? 'text-[#94A3B8]' : 'text-gray-500'}", parts[i])
            parts[i] = re.sub(r'\bbg-\[#1E293B\]\b', r"${isDark ? 'bg-[#1E293B]' : 'bg-gray-100'}", parts[i])
            parts[i] = re.sub(r'\bborder-\[#2D3748\]\b', r"${isDark ? 'border-[#2D3748]' : 'border-gray-200'}", parts[i])
    
    new_classes = ''.join(parts)
    
    if new_classes != classes:
        # We made a replacement, we MUST use {`...`}
        return f'className={{`{new_classes}`}}'
    
    return match.group(0)

def fix_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r') as f:
        content = f.read()
        
    # Match className="something" or className={`something`}
    # We use a regex that handles both cases
    content = re.sub(r'className=(?:"([^"]*)"|\{`([^`]*)`\})', lambda m: replace_in_class(
        re.match(r'className=(?:"([^"]*)"|\{`([^`]*)`\})', m.group(0))
        # re.match doesn't return exactly the groups we want in a simple way. Let's do it manually.
    ), content)
    
    with open(filepath, 'w') as f:
        f.write(content)
        
for f in files_to_fix:
    if os.path.exists(f):
        with open(f, 'r') as file:
            content = file.read()
            
        def replacer(m):
            if m.group(1) is not None:
                # className="..."
                classes = m.group(1)
            else:
                # className={`...`}
                classes = m.group(2)
                
            parts = re.split(r'(\$\{[^}]+\})', classes)
            for i in range(len(parts)):
                if not parts[i].startswith('${'):
                    parts[i] = re.sub(r'\btext-white\b', r"${isDark ? 'text-white' : 'text-gray-900'}", parts[i])
                    parts[i] = re.sub(r'\btext-\[#CBD5E1\]\b', r"${isDark ? 'text-[#CBD5E1]' : 'text-gray-700'}", parts[i])
                    parts[i] = re.sub(r'\btext-\[#94A3B8\]\b', r"${isDark ? 'text-[#94A3B8]' : 'text-gray-500'}", parts[i])
                    parts[i] = re.sub(r'\bbg-\[#1E293B\]\b', r"${isDark ? 'bg-[#1E293B]' : 'bg-gray-100'}", parts[i])
                    parts[i] = re.sub(r'\bborder-\[#2D3748\]\b', r"${isDark ? 'border-[#2D3748]' : 'border-gray-200'}", parts[i])
            
            new_classes = ''.join(parts)
            if new_classes != classes:
                return f'className={{`{new_classes}`}}'
            return m.group(0)

        new_content = re.sub(r'className=(?:"([^"]*)"|\{`([^`]*)`\})', replacer, content)
        with open(f, 'w') as file:
            file.write(new_content)

