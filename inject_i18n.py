import os

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root: continue
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            if 'i18n.js' not in content:
                content = content.replace('</head>', '    <script type="module" src="src/core/i18n.js"></script>\n</head>')
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Injected i18n into {filepath}")
