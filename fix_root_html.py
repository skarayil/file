import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html')]

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    orig_content = content
    
    # Revert the old src/pages paths back
    content = content.replace('href="../styles/styles.css"', 'href="src/styles/styles.css"')
    content = content.replace('href="dashboard.css"', 'href="src/pages/dashboard.css"')
    content = content.replace('href="sftp.css"', 'href="src/pages/sftp.css"')
    
    content = content.replace('src="../api/supabase.js"', 'src="src/api/supabase.js"')
    content = content.replace('src="../components/upload.js"', 'src="src/components/upload.js"')
    
    # Fix js paths in pages
    js_pages = ['dashboard.js', 'login.js', 'register.js', 'sftp.js', 'files.js', 'shared.js']
    for js in js_pages:
        content = content.replace(f'src="{js}"', f'src="src/pages/{js}"')
        
    content = content.replace('href="../../public/img/logo.png"', 'href="public/img/logo.png"')
    content = content.replace('src="../../public/img/logo.png"', 'src="public/img/logo.png"')

    if content != orig_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")

