import sys

with open('app.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

data_lines = lines[333:403]
with open('data.js', 'w', encoding='utf-8') as f:
    f.writelines(data_lines)

comp_lines = lines[2:332] + lines[404:498]
with open('components.jsx', 'w', encoding='utf-8') as f:
    f.writelines(comp_lines)

app_lines = [lines[0]] + lines[499:]
with open('app.jsx', 'w', encoding='utf-8') as f:
    f.writelines(app_lines)

print("Splitting completed successfully.")
