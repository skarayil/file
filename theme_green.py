import os

color_map = {
    '#3b82f6': '#10b981',  # blue-500 -> emerald-500
    '#1d4ed8': '#059669',  # blue-700 -> emerald-600
    '#60a5fa': '#34d399',  # blue-400 -> emerald-400
    '#93c5fd': '#6ee7b7',  # blue-300 -> emerald-300
    '#1e3a5f': '#064e3b',  # blueish dark -> emerald-900
    '#0f172a': '#022c22',  # slate-900 -> emerald-950
    'rgba(59,130,246,': 'rgba(16,185,129,', # blue-500 rgb
    'rgba(99,102,241,': 'rgba(16,185,129,', # indigo-500 -> emerald-500
}

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root: continue
    for file in files:
        if file.endswith('.html') or file.endswith('.js') or file.endswith('.css'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            orig = content
            for blue, green in color_map.items():
                content = content.replace(blue, green)
            if orig != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {filepath}")
