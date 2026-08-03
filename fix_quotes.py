import re
import os

files_to_fix = [
    "src/pages/AskCopilot.tsx",
    "src/pages/Roadmap.tsx",
    "src/pages/PRDGenerator.tsx",
    "src/pages/Prioritization.tsx"
]

def revert_broken(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r') as f:
        content = f.read()
    
    # We replaced text-white with ${isDark ? 'text-white' : 'text-gray-900'}
    content = content.replace("${isDark ? 'text-white' : 'text-gray-900'}", "text-white")
    content = content.replace("${isDark ? 'text-[#CBD5E1]' : 'text-gray-600'}", "text-[#CBD5E1]")
    content = content.replace("${isDark ? 'text-[#94A3B8]' : 'text-gray-500'}", "text-[#94A3B8]")
    content = content.replace("${isDark ? 'bg-[#1E293B]' : 'bg-gray-100'}", "bg-[#1E293B]")
    content = content.replace("${isDark ? 'border-[#2D3748]' : 'border-gray-200'}", "border-[#2D3748]")
    
    with open(filepath, 'w') as f:
        f.write(content)
        
for f in files_to_fix:
    revert_broken(f)

