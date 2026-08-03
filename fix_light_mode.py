import os
import re

files_to_fix = [
    "src/pages/AskCopilot.tsx",
    "src/pages/Roadmap.tsx",
    "src/pages/PRDGenerator.tsx",
    "src/pages/Prioritization.tsx"
]

replacements = [
    # Replace plain text-white inside quotes with a dynamic class
    (r'className="([^"]*)text-white([^"]*)"', r'className={`\1${isDark ? \'text-white\' : \'text-gray-900\'}\2`}'),
    
    # Replace text-white inside template literals
    (r'text-white', r'${isDark ? \'text-white\' : \'text-gray-900\'}'),
    
    # We have to be careful with text-white replacement so it doesn't double replace
    # Let's use a simpler approach.
]

def fix_file(filepath):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath} - not found")
        return
        
    with open(filepath, 'r') as f:
        content = f.read()
    
    # We need to make sure we don't mess up existing dynamic classes.
    # Instead of regexes which might break JSX, let's just do targeted replacements on known strings.
    # Actually, a better way is to define a few common constants at the top of the component
    # and use them.
    # But since they are all using `isDark`, we can replace common colors.
    
    # text-white -> ${isDark ? 'text-white' : 'text-gray-900'}
    # Only if it's inside a className="...text-white..." it needs to be converted to {`...`}
    
    # Step 1: Convert className="..." to className={`...`} if it contains color classes we want to change
    color_classes = ['text-white', 'text-[#CBD5E1]', 'bg-[#1E293B]', 'text-[#94A3B8]', 'border-[#2D3748]']
    
    def convert_to_template(match):
        classes = match.group(1)
        if any(c in classes for c in color_classes):
            return f'className={{`{classes}`}}'
        return match.group(0)
        
    content = re.sub(r'className="([^"]+)"', convert_to_template, content)
    
    # Step 2: Replace the colors inside template literals
    # text-white
    content = re.sub(r'(?<!\')text-white(?!\')', r"${isDark ? 'text-white' : 'text-gray-900'}", content)
    # text-[#CBD5E1]
    content = re.sub(r'(?<!\')text-\[#CBD5E1\](?!\')', r"${isDark ? 'text-[#CBD5E1]' : 'text-gray-600'}", content)
    # text-[#94A3B8] (sometimes used for subtitles)
    content = re.sub(r'(?<!\')text-\[#94A3B8\](?!\')', r"${isDark ? 'text-[#94A3B8]' : 'text-gray-500'}", content)
    # bg-[#1E293B]
    content = re.sub(r'(?<!\')bg-\[#1E293B\](?!\')', r"${isDark ? 'bg-[#1E293B]' : 'bg-gray-100'}", content)
    # border-[#2D3748]
    content = re.sub(r'(?<!\')border-\[#2D3748\](?!\')', r"${isDark ? 'border-[#2D3748]' : 'border-gray-200'}", content)
    
    # Clean up any potential nested `${isDark ? ... }` if we accidentally replaced something that was already a dynamic string.
    # Since we did `(?<!\')` we shouldn't have matched inside existing ternary strings.
    
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Fixed {filepath}")

for f in files_to_fix:
    fix_file(f)
