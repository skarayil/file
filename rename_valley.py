import os

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root: continue
    for file in files:
        if file.endswith('.html') or file.endswith('.js') or file.endswith('.css') or file.endswith('.md'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            orig = content
            content = content.replace('Dosya Vadisi', 'FileValley')
            content = content.replace('dosya vadisi', 'filevalley')
            content = content.replace('dosyavadisi', 'filevalley')
            if orig != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {filepath}")
