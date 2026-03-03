import sys
import re

html_path = r'c:\HanBuild\AG\상담\index.html'

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'<script type="text/babel">\s*(.*?)\s*</script>', content, re.DOTALL)
if not match:
    sys.exit(0)

script_body = match.group(1)

# We will split script_body into parts and write them to separate files.
# But simply, let's just dump it to App.jsx first for safety!

with open(r'c:\HanBuild\AG\상담\app.jsx', 'w', encoding='utf-8') as f:
    f.write(script_body)

new_content = content.replace(match.group(0), '<script src="data.js"></script>\n    <script type="text/babel" src="components.jsx"></script>\n    <script type="text/babel" src="app.jsx"></script>')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Extracted to app.jsx and updated index.html")
