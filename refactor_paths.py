import os
import re

core_files = ['cryptoUtils.js', 'checksumUtils.js', 'chunkUpload.js', 'resumableUpload.js', 'keyManager.js', 'vfs.js', 'logger.js']
api_files = ['supabase.js']
component_files = ['upload.js']

def update_js_imports(content, depth):
    prefix = '../' * depth
    for f in core_files:
        content = re.sub(rf"from\s+['\"](?:\.\/)?{f}['\"]", f"from '{prefix}core/{f}'", content)
    for f in api_files:
        content = re.sub(rf"from\s+['\"](?:\.\/)?{f}['\"]", f"from '{prefix}api/{f}'", content)
    for f in component_files:
        content = re.sub(rf"from\s+['\"](?:\.\/)?{f}['\"]", f"from '{prefix}components/{f}'", content)
    return content

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    orig_content = content
    filename = os.path.basename(filepath)
    is_html = filepath.endswith('.html')
    is_js = filepath.endswith('.js')

    if 'src/pages' in filepath:
        if is_js:
            content = update_js_imports(content, 1)
        elif is_html:
            # Fix css
            content = content.replace('href="styles.css"', 'href="../styles/styles.css"')
            # Fix js
            for f in api_files:
                content = content.replace(f'src="{f}"', f'src="../api/{f}"')
            for f in component_files:
                content = content.replace(f'src="{f}"', f'src="../components/{f}"')
            for f in core_files:
                content = content.replace(f'src="{f}"', f'src="../core/{f}"')
            # Fix img
            content = content.replace('href="img/logo.png"', 'href="../../public/img/logo.png"')
            content = content.replace('src="img/logo.png"', 'src="../../public/img/logo.png"')
            
    elif 'src/components' in filepath or 'src/core' in filepath or 'src/api' in filepath:
        if is_js:
            content = update_js_imports(content, 1)

    if content != orig_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.js') or file.endswith('.html'):
            process_file(os.path.join(root, file))

